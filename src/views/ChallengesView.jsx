import { useEffect, useMemo, useState } from 'react'
import Quiz from '../components/Quiz.jsx'
import { Button, Card, Container, Tabs } from '../components/ui.jsx'
import { simulateAPI } from '../services/apiMock.js'
import { trackEvent } from '../services/analytics.js'
import { loadAllProgress, recordQuizAttempt } from '../services/progressStore.js'
import { ALL_QUESTIONS as BASICS_QUESTIONS } from '../labs/basics/questions.js'
import { ALL_QUESTIONS as ADV_QUESTIONS } from '../labs/advanced/questions.js'
import { ALL_QUESTIONS as EXP_QUESTIONS } from '../labs/expert/questions.js'

const TAB_ITEMS = [
  { value: 'debug', icon: '🧩', label: 'Debug' },
  { value: 'builder', icon: '🧪', label: 'Requests' },
  { value: 'daily', icon: '🗓️', label: 'Daily' },
  { value: 'speed', icon: '⚡', label: 'Speed' },
]

function safeJson(value) {
  if (!value || !String(value).trim()) return null
  try {
    return JSON.parse(String(value))
  } catch {
    return '__invalid__'
  }
}

function uniqByQ(list) {
  const seen = new Set()
  const out = []
  for (const q of list) {
    const key = q?.q
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(q)
  }
  return out
}

export default function ChallengesView({ onBack }) {
  const [tab, setTab] = useState('debug')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const [method, setMethod] = useState('GET')
  const [endpoint, setEndpoint] = useState('usuarios')
  const [authMode, setAuthMode] = useState('bearer')
  const [bodyText, setBodyText] = useState('')

  const [debugStep, setDebugStep] = useState(0)
  const debugScenarios = useMemo(() => ([
    {
      title: '401 Unauthorized',
      goal: 'Hacé que responda 200 agregando autenticación.',
      setup: { method: 'GET', endpoint: 'usuarios', authMode: 'none', bodyText: '' },
      success: (res) => res?.status === 200,
    },
    {
      title: '404 Not Found',
      goal: 'Corregí el endpoint para obtener datos.',
      setup: { method: 'GET', endpoint: 'inexistente', authMode: 'bearer', bodyText: '' },
      success: (res) => res?.status === 200,
    },
    {
      title: '400 Bad Request',
      goal: 'Creá un usuario válido (requiere nombre).',
      setup: { method: 'POST', endpoint: 'usuarios', authMode: 'bearer', bodyText: `{\n  "email": "test@x.com"\n}` },
      success: (res) => res?.status === 201 || res?.status === 200,
    },
  ]), [])

  const debugActive = debugScenarios[Math.max(0, Math.min(debugScenarios.length - 1, debugStep))]

  useEffect(() => {
    trackEvent('challenges_open')
  }, [])

  useEffect(() => {
    trackEvent('challenges_tab', { tab })
    setResult(null)
  }, [tab])

  useEffect(() => {
    if (tab !== 'debug') return
    setMethod(debugActive.setup.method)
    setEndpoint(debugActive.setup.endpoint)
    setAuthMode(debugActive.setup.authMode)
    setBodyText(debugActive.setup.bodyText)
    setResult(null)
  }, [tab, debugActive])

  const allQuestions = useMemo(() => uniqByQ([...BASICS_QUESTIONS, ...ADV_QUESTIONS, ...EXP_QUESTIONS]), [])
  const dailyQuestions = useMemo(() => {
    const progress = loadAllProgress()
    const wrong = []
    for (const labId of ['basics', 'advanced', 'expert']) {
      const history = progress?.[labId]?.quiz?.history
      if (!Array.isArray(history)) continue
      for (const attempt of history) {
        if (!Array.isArray(attempt?.wrongQuestions)) continue
        for (const q of attempt.wrongQuestions) wrong.push(String(q))
      }
    }
    const wrongSet = new Set(wrong)
    const pool = allQuestions.filter((q) => wrongSet.has(q.q))
    return pool.length ? pool : allQuestions
  }, [allQuestions])

  async function run() {
    setLoading(true)
    setResult(null)
    const headers = {}
    if (authMode === 'bearer') headers.Authorization = 'Bearer demo_token'
    if (authMode === 'apikey') headers['X-API-Key'] = 'demo_key'

    const parsedBody = safeJson(bodyText)
    const body = parsedBody === '__invalid__' ? '__invalid__' : parsedBody

    try {
      if (body === '__invalid__') {
        setResult({ status: 0, statusText: 'Invalid JSON', time: 0, body: { error: 'JSON inválido' } })
        return
      }
      const res = await simulateAPI(method, endpoint, body, headers)
      setResult(res)
      trackEvent('request_run', { tab, method, endpoint, status: res?.status })
      if (tab === 'debug' && debugActive.success(res)) {
        trackEvent('debug_solved', { step: debugStep, title: debugActive.title })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Container className="py-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold tracking-widest text-zinc-500">RETOS</div>
            <div className="mt-1 text-2xl font-black text-zinc-100">Modo interactivo</div>
          </div>
          <Button variant="secondary" onClick={onBack}>← Volver</Button>
        </div>

        <Tabs value={tab} onValueChange={setTab} items={TAB_ITEMS} className="mb-5" />

        {tab === 'daily' && (
          <Card className="p-6">
            <div className="mb-4 text-sm font-extrabold text-zinc-100">Daily Quiz (basado en tus fallos)</div>
            <Quiz
              questionsBank={dailyQuestions}
              questionCount={8}
              messages={{
                high: 'Excelente. Subiste el promedio.',
                medium: 'Bien. Repetí mañana para consolidar.',
                low: 'Volvé a intentar. Tu cerebro aprende por repetición.',
              }}
              finalButtonText="Ver resultado →"
              restartButtonText="🔄 Nuevo daily"
              gradientClassName="accent-emerald-500"
              primaryClassName="bg-emerald-500 hover:bg-emerald-400"
              onComplete={({ score, total, pct, wrongQuestions }) => {
                recordQuizAttempt('daily', { score, total, pct, wrongQuestions, at: Date.now() })
                trackEvent('daily_complete', { score, total, pct })
              }}
            />
          </Card>
        )}

        {tab === 'speed' && (
          <Card className="p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-extrabold text-zinc-100">Speed Quiz</div>
              <div className="text-xs text-zinc-500">60 segundos · 10 preguntas</div>
            </div>
            <Quiz
              questionsBank={allQuestions}
              questionCount={10}
              timeLimitSec={60}
              messages={{
                high: 'Rápido y preciso.',
                medium: 'Buen ritmo. Ajustá los errores.',
                low: 'Entrená velocidad + precisión.',
              }}
              finalButtonText="Resultado →"
              restartButtonText="🔄 Reintentar"
              gradientClassName="accent-amber-500"
              primaryClassName="bg-amber-500 hover:bg-amber-400"
              onComplete={({ score, total, pct, wrongQuestions }) => {
                recordQuizAttempt('speed', { score, total, pct, wrongQuestions, at: Date.now() })
                trackEvent('speed_complete', { score, total, pct })
              }}
            />
          </Card>
        )}

        {(tab === 'builder' || tab === 'debug') && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-6">
              {tab === 'debug' ? (
                <div className="mb-4">
                  <div className="text-sm font-extrabold text-zinc-100">Debug Challenge</div>
                  <div className="mt-1 text-xs text-zinc-500">{debugActive.title} · {debugActive.goal}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => setDebugStep((s) => Math.max(0, s - 1))}
                      disabled={debugStep <= 0}
                    >
                      ←
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setDebugStep((s) => Math.min(debugScenarios.length - 1, s + 1))}
                      disabled={debugStep >= debugScenarios.length - 1}
                    >
                      →
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mb-4 text-sm font-extrabold text-zinc-100">Request Builder</div>
              )}

              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="mb-2 text-xs font-bold tracking-widest text-zinc-500">MÉTODO</div>
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value)}
                      className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                    >
                      {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-bold tracking-widest text-zinc-500">AUTH</div>
                    <select
                      value={authMode}
                      onChange={(e) => setAuthMode(e.target.value)}
                      className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                    >
                      <option value="none">None</option>
                      <option value="bearer">Bearer</option>
                      <option value="apikey">API Key</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-xs font-bold tracking-widest text-zinc-500">ENDPOINT</div>
                  <input
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                    placeholder="usuarios o usuarios/1"
                  />
                </div>

                <div>
                  <div className="mb-2 text-xs font-bold tracking-widest text-zinc-500">BODY (JSON)</div>
                  <textarea
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    className="min-h-32 w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs leading-relaxed text-zinc-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                    spellCheck={false}
                  />
                </div>

                <Button onClick={run} disabled={loading}>
                  {loading ? '⏳ Ejecutando...' : '▶ Ejecutar'}
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-3 text-sm font-extrabold text-zinc-100">Respuesta</div>
              {!result ? (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-500">
                  Ejecutá una request para ver el resultado.
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="font-mono text-sm font-bold text-zinc-200">
                      {result.status} {result.statusText}
                    </div>
                    <div className="text-xs text-zinc-600">{Math.round(result.time ?? 0)}ms</div>
                  </div>
                  {tab === 'debug' && debugActive.success(result) && (
                    <div className="mb-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300">
                      ✅ Reto completado
                    </div>
                  )}
                  <pre className="m-0 whitespace-pre-wrap font-mono text-xs leading-relaxed text-zinc-400">
                    {JSON.stringify(result.body, null, 2)}
                  </pre>
                </div>
              )}
            </Card>
          </div>
        )}
      </Container>
    </div>
  )
}
