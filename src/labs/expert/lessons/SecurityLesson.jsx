import { useState } from 'react'
import { cn } from '../../../utils/cn.js'
import { toneFromHex } from '../../../utils/tone.js'

export default function SecurityLesson() {
  const [activeThreat, setActiveThreat] = useState(null)
  const [corsStep, setCorsStep] = useState(0)

  const owaspTop = [
    { id: 'bola', name: 'BOLA', fullName: 'Broken Object-Level Authorization', risk: 'CRÍTICO', color: '#ef4444',
      desc: 'El atacante cambia el ID en la URL y accede a datos de otro usuario. GET /users/1 → GET /users/2. El 95% de las APIs son vulnerables a esto.',
      fix: 'Siempre verificar que el usuario autenticado TIENE permiso sobre el recurso solicitado. No confiar solo en el ID de la URL.',
      code: `// ❌ MALO — cualquiera accede a cualquier usuario
app.get('/users/:id', (req, res) => {
  const user = db.findById(req.params.id);
  return res.json(user);
});

// ✅ BUENO — verifica ownership
app.get('/users/:id', auth, (req, res) => {
  if (req.params.id !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const user = db.findById(req.params.id);
  return res.json(user);
});` },
    { id: 'auth', name: 'Broken Auth', fullName: 'Broken Authentication', risk: 'CRÍTICO', color: '#ef4444',
      desc: 'Tokens sin expiración, passwords en texto plano, no rate-limit en login, API keys expuestas en el frontend.',
      fix: 'JWT con expiración corta + refresh tokens, bcrypt para passwords, rate limit en login, API keys solo en backend.',
      code: `// ❌ Token que nunca expira
const token = jwt.sign({ userId: 1 }); // sin expiresIn

// ✅ Token con expiración + refresh
const accessToken = jwt.sign(
  { userId: 1, role: 'admin' },
  SECRET,
  { expiresIn: '15m' }
);
const refreshToken = generateRefreshToken(); // en DB` },
    { id: 'injection', name: 'Injection', fullName: 'Injection (SQL, NoSQL, LDAP)', risk: 'ALTO', color: '#f59e0b',
      desc: 'El input del usuario se ejecuta como código. Si concatenás strings en queries, sos vulnerable.',
      fix: 'SIEMPRE usar parameterized queries / prepared statements. Nunca concatenar input del usuario en queries.',
      code: `// ❌ SQL Injection vulnerable
const query = \`SELECT * FROM users 
  WHERE email = '\${req.body.email}'\`;
// Input: ' OR '1'='1 → devuelve TODOS los usuarios

// ✅ Parameterized query
const query = 'SELECT * FROM users WHERE email = $1';
db.query(query, [req.body.email]);` },
    { id: 'mass', name: 'Mass Assignment', fullName: 'Mass Assignment / Excessive Data Exposure', risk: 'ALTO', color: '#f59e0b',
      desc: "El cliente envía campos que no debería poder modificar (ej: { role: 'admin' }) y el server los acepta ciegamente.",
      fix: 'Whitelist explícita de campos permitidos. Nunca hacer spread directo del body a la DB.',
      code: `// ❌ Mass assignment — el user se hace admin
app.put('/users/:id', (req, res) => {
  db.update(req.params.id, req.body);
  // Si envían { role: "admin" } → se vuelven admin
});

// ✅ Whitelist de campos permitidos
app.put('/users/:id', (req, res) => {
  const { name, email, avatar } = req.body;
  db.update(req.params.id, { name, email, avatar });
});` },
  ]

  const corsSteps = [
    { label: 'Browser', action: "Quiere hacer fetch('https://api.otro.com') desde tuapp.com", color: '#3b82f6' },
    { label: 'Browser', action: 'Envía preflight: OPTIONS /api con Origin: https://tuapp.com', color: '#a78bfa' },
    { label: 'Server', action: 'Responde: Access-Control-Allow-Origin: https://tuapp.com ✅', color: '#10b981' },
    { label: 'Browser', action: 'Ahora sí envía el GET/POST real al server', color: '#3b82f6' },
    { label: 'Server', action: 'Responde con datos + headers CORS', color: '#10b981' },
  ]

  return (
    <div>
      <p className="mb-5 text-sm leading-relaxed text-zinc-400">
        Las APIs son el vector de ataque #1 en aplicaciones modernas. OWASP tiene un{' '}
        <strong className="text-zinc-100">Top 10 específico para APIs</strong>. Si no conocés estas vulnerabilidades, tu API es un colador.
      </p>

      <div className="mb-2 text-xs font-bold tracking-widest text-zinc-500">OWASP API SECURITY TOP 10 (PRINCIPALES)</div>
      <div className="mb-6 grid gap-2">
        {owaspTop.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveThreat(activeThreat === t.id ? null : t.id)}
            className={cn(
              'rounded-xl border px-4 py-4 text-left transition-colors',
              activeThreat === t.id ? cn(toneFromHex(t.color).bg, toneFromHex(t.color).border) : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800',
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className={cn('font-mono text-sm font-black', toneFromHex(t.color).text)}>{t.name}</span>
                <span className="text-sm text-zinc-500">{t.fullName}</span>
              </div>
              <span
                className={cn(
                  'rounded-md px-2 py-1 text-[10px] font-extrabold tracking-widest',
                  toneFromHex(t.color).bg,
                  toneFromHex(t.color).text,
                )}
              >
                {t.risk}
              </span>
            </div>
            {activeThreat === t.id && (
              <div className="mt-3">
                <div className="mb-3 text-sm leading-relaxed text-zinc-300">{t.desc}</div>
                <div className="mb-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3">
                  <div className="mb-1 text-xs font-bold text-emerald-300">🔧 SOLUCIÓN</div>
                  <div className="text-sm leading-relaxed text-zinc-300">{t.fix}</div>
                </div>
                <pre className="m-0 whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-xs leading-relaxed text-zinc-400">
                  {t.code}
                </pre>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="mb-2 text-xs font-bold tracking-widest text-zinc-500">🌐 CORS — POR QUÉ TU API DA ERROR EN EL BROWSER</div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
        <p className="mb-4 text-sm leading-relaxed text-zinc-400">
          CORS (Cross-Origin Resource Sharing) es el mecanismo del browser para preguntar: "¿Este server permite que ESTA página le hable?". No aplica en backend (n8n, curl, Postman).
        </p>
        <div className="mb-3 grid gap-2">
          {corsSteps.map((s, i) => (
            <div
              key={i}
              onClick={() => setCorsStep(i)}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 transition-opacity',
                i <= corsStep ? cn(toneFromHex(s.color).bg, 'opacity-100') : 'opacity-40',
              )}
            >
              <span
                className={cn(
                  'min-w-16 rounded-md px-2 py-1 text-center font-mono text-[10px] font-extrabold tracking-wider',
                  toneFromHex(s.color).bg,
                  toneFromHex(s.color).text,
                )}
              >
                {s.label}
              </span>
              <span className={cn('text-sm', i <= corsStep ? 'text-zinc-300' : 'text-zinc-600')}>{s.action}</span>
            </div>
          ))}
        </div>
        {corsStep < corsSteps.length - 1 && (
          <button
            onClick={() => setCorsStep(corsStep + 1)}
            className="inline-flex h-9 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-4 text-sm font-bold text-indigo-300"
          >
            Siguiente paso →
          </button>
        )}
      </div>
    </div>
  )
}
