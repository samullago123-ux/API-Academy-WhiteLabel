import cors from 'cors'
import express from 'express'
import pg from 'pg'

const { Pool } = pg

const PORT = Number(process.env.PORT || 8787)
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required')
}

const pool = new Pool({ connectionString: DATABASE_URL })

async function ensureSchema() {
  await pool.query(`
    create table if not exists progress (
      user_id text not null,
      lab_id text not null,
      active_lesson text,
      visited jsonb not null default '[]'::jsonb,
      quiz jsonb not null default '{}'::jsonb,
      updated_at timestamptz not null default now(),
      primary key (user_id, lab_id)
    );
  `)

  await pool.query(`
    create table if not exists events (
      id text primary key,
      user_id text not null,
      session_id text,
      name text not null,
      at timestamptz not null,
      props jsonb not null default '{}'::jsonb
    );
  `)

  await pool.query(`create index if not exists events_user_at_idx on events(user_id, at desc);`)
}

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', async (_req, res) => {
  try {
    const r = await pool.query('select 1 as ok')
    res.json({ ok: r.rows?.[0]?.ok === 1 })
  } catch {
    res.status(500).json({ ok: false })
  }
})

app.get('/api/progress/:userId', async (req, res) => {
  const userId = String(req.params.userId || '').trim()
  if (!userId) return res.status(400).json({ error: 'userId required' })

  const r = await pool.query(
    'select lab_id, active_lesson, visited, quiz from progress where user_id = $1',
    [userId],
  )
  const out = {}
  for (const row of r.rows) {
    out[row.lab_id] = {
      activeLesson: row.active_lesson ?? null,
      visited: row.visited ?? [],
      quiz: row.quiz ?? {},
    }
  }
  res.json(out)
})

app.put('/api/progress/:userId/:labId', async (req, res) => {
  const userId = String(req.params.userId || '').trim()
  const labId = String(req.params.labId || '').trim()
  if (!userId || !labId) return res.status(400).json({ error: 'userId/labId required' })

  const patch = req.body && typeof req.body === 'object' ? req.body : {}
  const activeLesson = patch.activeLesson ?? null
  const visited = Array.isArray(patch.visited) ? patch.visited : null
  const quiz = patch.quiz && typeof patch.quiz === 'object' ? patch.quiz : null

  const r = await pool.query(
    `
    insert into progress(user_id, lab_id, active_lesson, visited, quiz)
    values ($1, $2, $3, coalesce($4::jsonb, '[]'::jsonb), coalesce($5::jsonb, '{}'::jsonb))
    on conflict (user_id, lab_id) do update set
      active_lesson = coalesce(excluded.active_lesson, progress.active_lesson),
      visited = coalesce(excluded.visited, progress.visited),
      quiz = coalesce(excluded.quiz, progress.quiz),
      updated_at = now()
    returning user_id, lab_id
    `,
    [userId, labId, activeLesson, visited ? JSON.stringify(visited) : null, quiz ? JSON.stringify(quiz) : null],
  )

  res.json({ ok: true, row: r.rows?.[0] ?? null })
})

app.post('/api/events/:userId/bulk', async (req, res) => {
  const userId = String(req.params.userId || '').trim()
  if (!userId) return res.status(400).json({ error: 'userId required' })

  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const events = Array.isArray(body.events) ? body.events : []

  if (events.length === 0) return res.json({ ok: true, inserted: 0 })

  const values = []
  const params = []
  let i = 1
  for (const e of events) {
    const id = String(e?.id ?? '').trim()
    const name = String(e?.name ?? '').trim()
    const at = Number(e?.at ?? 0)
    if (!id || !name || !at) continue
    const sessionId = e?.sessionId ? String(e.sessionId) : null
    const props = e?.props && typeof e.props === 'object' ? e.props : {}
    values.push(`($${i++}, $${i++}, $${i++}, $${i++}, to_timestamp($${i++} / 1000.0), $${i++}::jsonb)`)
    params.push(id, userId, sessionId, name, at, JSON.stringify(props))
  }

  if (values.length === 0) return res.json({ ok: true, inserted: 0 })

  const q = `
    insert into events(id, user_id, session_id, name, at, props)
    values ${values.join(',')}
    on conflict (id) do nothing;
  `
  await pool.query(q, params)
  res.json({ ok: true, inserted: values.length })
})

await ensureSchema()
app.listen(PORT, () => {
  process.stdout.write(`api listening on http://localhost:${PORT}\n`)
})
