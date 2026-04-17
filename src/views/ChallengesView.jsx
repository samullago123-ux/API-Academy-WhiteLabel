import { useEffect, useMemo, useState } from 'react'
import Quiz from '../components/Quiz.jsx'
import { Badge, BrandMark, Button, Card, Container, Tabs } from '../components/ui.jsx'
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
  { value: 'boss', icon: '👑', label: 'Boss' },
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

const STATS_KEY = 'api-academy-challenges:v1'

function loadStats() {
  if (typeof window === 'undefined') return { xp: 0, debugSolved: [], bestSpeed: 0, bestDaily: 0, bossSolved: 0 }
  try {
    const raw = window.localStorage.getItem(STATS_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (!parsed || typeof parsed !== 'object') return { xp: 0, debugSolved: [], bestSpeed: 0, bestDaily: 0, bossSolved: 0 }
    return {
      xp: Number(parsed.xp ?? 0),
      debugSolved: Array.isArray(parsed.debugSolved) ? parsed.debugSolved : [],
      bestSpeed: Number(parsed.bestSpeed ?? 0),
      bestDaily: Number(parsed.bestDaily ?? 0),
      bossSolved: Number(parsed.bossSolved ?? 0),
    }
  } catch {
    return { xp: 0, debugSolved: [], bestSpeed: 0, bestDaily: 0, bossSolved: 0 }
  }
}

function saveStats(stats) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STATS_KEY, JSON.stringify(stats))
}

export default function ChallengesView({ onBack }) {
  const [tab, setTab] = useState('debug')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState(() => loadStats())
  const [showHint, setShowHint] = useState(false)

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
      hint: 'Pista: agregá un header Authorization o cambiá Auth a Bearer.',
    },
    {
      title: '404 Not Found',
      goal: 'Corregí el endpoint para obtener datos.',
      setup: { method: 'GET', endpoint: 'inexistente', authMode: 'bearer', bodyText: '' },
      success: (res) => res?.status === 200,
      hint: 'Pista: usá endpoints conocidos como "usuarios" o "usuarios/1".',
    },
    {
      title: '400 Bad Request',
      goal: 'Creá un usuario válido (requiere nombre).',
      setup: { method: 'POST', endpoint: 'usuarios', authMode: 'bearer', bodyText: `{\n  "email": "test@x.com"\n}` },
      success: (res) => res?.status === 201 || res?.status === 200,
      hint: 'Pista: enviá un body con "nombre".',
    },
  ]), [])

  const debugActive = debugScenarios[Math.max(0, Math.min(debugScenarios.length - 1, debugStep))]

  useEffect(() => {
    trackEvent('challenges_open')
  }, [])

  useEffect(() => {
    trackEvent('challenges_tab', { tab })
    setResult(null)
    setShowHint(false)
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
        const res = { status: 0, statusText: 'Invalid JSON', time: 0, body: { error: 'JSON inválido' } }
        setResult(res)
        return res
      }
      const res = await simulateAPI(method, endpoint, body, headers)
      setResult(res)
      trackEvent('request_run', { tab, method, endpoint, status: res?.status })
      if (tab === 'debug' && debugActive.success(res)) {
        trackEvent('debug_solved', { step: debugStep, title: debugActive.title })
        setStats((prev) => {
          const key = String(debugStep)
          if (prev.debugSolved.includes(key)) return prev
          const next = { ...prev, xp: prev.xp + 25, debugSolved: [...prev.debugSolved, key] }
          saveStats(next)
          return next
        })
      }
      return res
    } finally {
      setLoading(false)
    }
  }

  const bossTargets = useMemo(() => ([
    { label: 'Status 200', check: (res) => res?.status === 200 },
    { label: 'Status 201', check: (res) => res?.status === 201 },
    { label: 'Status 401→200', check: (res) => res?.status === 200 },
  ]), [])
  const [bossIdx, setBossIdx] = useState(0)
  const bossTarget = bossTargets[Math.max(0, Math.min(bossTargets.length - 1, bossIdx))]

  return (
    <div className="min-h-screen bg-zinc-950">
      <Container className="py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <BrandMark />
          <Button variant="secondary" onClick={onBack}>← Volver</Button>
        </div>

        <Card className="mb-6 overflow-hidden">
          <div className="relative px-6 py-7">
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl" />
            <div className="relative">
              <div className="text-xs font-bold tracking-widest text-zinc-500">RETOS</div>
              <div className="mt-2 text-3xl font-black tracking-tight text-zinc-100">Entrenamiento interactivo</div>
              <div className="mt-2 text-sm leading-relaxed text-zinc-400">
                Debug real, request builder, daily basado en fallos y speed mode con timer.
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge color="emerald">XP {stats.xp}</Badge>
                <Badge color="indigo">Debug {stats.debugSolved.length}/{debugScenarios.length}</Badge>
                <Badge color="amber">Best Speed {stats.bestSpeed}%</Badge>
                <Badge color="emerald">Best Daily {stats.bestDaily}%</Badge>
                <Badge color="red">Boss {stats.bossSolved}</Badge>
              </div>
            </div>
          </div>
        </Card>

        <Tabs value={tab} onValueChange={setTab} items={TAB_ITEMS} className="mb-5" />

        {tab === 'daily' && (
          <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
            <Card className="p-6">
              <div className="text-xs font-bold tracking-widest text-emerald-300">DAILY</div>
              <div className="mt-2 text-xl font-black text-zinc-100">Repetición inteligente</div>
              <div className="mt-2 text-sm leading-relaxed text-zinc-400">
                Prioriza las preguntas que fallaste antes para acelerar el aprendizaje.
              </div>
              <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="text-xs font-bold tracking-widest text-zinc-500">RECOMPENSA</div>
                <div className="mt-2 text-sm text-zinc-300">+35 XP si mejorás tu mejor marca.</div>
                <div className="mt-2 text-xs text-zinc-500">Tu mejor daily actual: {stats.bestDaily}%</div>
              </div>
              <div className="mt-4 text-xs text-zinc-500">
                Tip: hacelo una vez al día. Constancia &gt; intensidad.
              </div>
            </Card>
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-extrabold text-zinc-100">Daily Quiz</div>
                <Badge color="emerald">8 preguntas</Badge>
              </div>
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
                  setStats((prev) => {
                    const improved = pct > prev.bestDaily
                    const next = { ...prev, bestDaily: Math.max(prev.bestDaily, pct), xp: prev.xp + (improved ? 35 : 15) }
                    saveStats(next)
                    return next
                  })
                }}
              />
            </Card>
          </div>
        )}

        {tab === 'speed' && (
          <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
            <Card className="p-6">
              <div className="text-xs font-bold tracking-widest text-amber-300">SPEED</div>
              <div className="mt-2 text-xl font-black text-zinc-100">Velocidad + precisión</div>
              <div className="mt-2 text-sm leading-relaxed text-zinc-400">
                Tenés 60 segundos. Respondé rápido y sin perder calidad.
              </div>
              <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="text-xs font-bold tracking-widest text-zinc-500">RECOMPENSA</div>
                <div className="mt-2 text-sm text-zinc-300">+40 XP si superás tu mejor speed.</div>
                <div className="mt-2 text-xs text-zinc-500">Tu mejor speed actual: {stats.bestSpeed}%</div>
              </div>
              <div className="mt-4 text-xs text-zinc-500">
                Tip: si dudás, elegí la opción más segura y seguí.
              </div>
            </Card>
            <Card className="p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-extrabold text-zinc-100">Speed Quiz</div>
                <Badge color="amber">60s · 10 preguntas</Badge>
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
                  setStats((prev) => {
                    const improved = pct > prev.bestSpeed
                    const next = { ...prev, bestSpeed: Math.max(prev.bestSpeed, pct), xp: prev.xp + (improved ? 40 : 20) }
                    saveStats(next)
                    return next
                  })
                }}
              />
            </Card>
          </div>
        )}

        {tab === 'boss' && (
          <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
            <Card className="p-6">
              <div className="text-xs font-bold tracking-widest text-red-300">BOSS</div>
              <div className="mt-2 text-xl font-black text-zinc-100">Reto final de requests</div>
              <div className="mt-2 text-sm leading-relaxed text-zinc-400">
                Cumplí objetivos consecutivos ajustando método, endpoint, auth y body.
              </div>
              <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="text-xs font-bold tracking-widest text-zinc-500">OBJETIVO</div>
                <div className="mt-2 text-sm font-bold text-zinc-200">{bossTarget.label}</div>
                <div className="mt-2 text-xs text-zinc-500">Completados: {stats.bossSolved}</div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setBossIdx(0)
                    setResult(null)
                    setShowHint(false)
                    setMethod('GET')
                    setEndpoint('usuarios')
                    setAuthMode('none')
                    setBodyText('')
                  }}
                >
                  Reset
                </Button>
                <Button
                  onClick={() => setShowHint((v) => !v)}
                  variant="ghost"
                >
                  {showHint ? 'Ocultar pista' : 'Ver pista'}
                </Button>
              </div>
              {showHint && (
                <div className="mt-3 rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-200">
                  Pista: probá <span className="font-mono">GET usuarios</span> para 200, y <span className="font-mono">POST usuarios</span> con body válido para 201.
                </div>
              )}
            </Card>
            <Card className="p-6">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-extrabold text-zinc-100">Arena</div>
                <Badge color="red">Boss</Badge>
              </div>
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
                    className="min-h-28 w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs leading-relaxed text-zinc-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                    spellCheck={false}
                  />
                </div>
                <Button
                  onClick={async () => {
                    const res = await run()
                    if (bossTarget.check(res)) trackEvent('boss_target_ok', { target: bossTarget.label })
                  }}
                  disabled={loading}
                >
                  {loading ? '⏳ Ejecutando...' : '▶ Ejecutar'}
                </Button>
                {result && (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="font-mono text-sm font-bold text-zinc-200">
                        {result.status} {result.statusText}
                      </div>
                      <div className="text-xs text-zinc-600">{Math.round(result.time ?? 0)}ms</div>
                    </div>
                    {bossTarget.check(result) ? (
                      <div className="mb-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300">
                        ✅ Objetivo completado
                      </div>
                    ) : (
                      <div className="mb-3 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">
                        ❌ No cumple el objetivo
                      </div>
                    )}
                    <pre className="m-0 whitespace-pre-wrap font-mono text-xs leading-relaxed text-zinc-400">
                      {JSON.stringify(result.body, null, 2)}
                    </pre>
                    {bossTarget.check(result) && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          onClick={() => {
                            const nextIdx = Math.min(bossTargets.length - 1, bossIdx + 1)
                            if (nextIdx === bossIdx) {
                              setStats((prev) => {
                                const next = { ...prev, xp: prev.xp + 60, bossSolved: prev.bossSolved + 1 }
                                saveStats(next)
                                return next
                              })
                              trackEvent('boss_solved')
                              setBossIdx(0)
                            } else {
                              setBossIdx(nextIdx)
                            }
                            setResult(null)
                          }}
                        >
                          Siguiente objetivo →
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {(tab === 'builder' || tab === 'debug') && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-6">
              {tab === 'debug' ? (
                <div className="mb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold tracking-widest text-indigo-300">DEBUG</div>
                      <div className="mt-2 text-xl font-black text-zinc-100">{debugActive.title}</div>
                      <div className="mt-1 text-sm text-zinc-400">{debugActive.goal}</div>
                    </div>
                    <Badge color={stats.debugSolved.includes(String(debugStep)) ? 'emerald' : 'zinc'}>
                      {stats.debugSolved.includes(String(debugStep)) ? 'RESUELTO' : 'PENDIENTE'}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => setShowHint((v) => !v)}>
                      {showHint ? 'Ocultar pista' : 'Ver pista'}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setMethod(debugActive.setup.method)
                        setEndpoint(debugActive.setup.endpoint)
                        setAuthMode(debugActive.setup.authMode)
                        setBodyText(debugActive.setup.bodyText)
                        setResult(null)
                      }}
                    >
                      Restablecer inputs
                    </Button>
                  </div>
                  {showHint && (
                    <div className="mt-3 rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-200">
                      {debugActive.hint}
                    </div>
                  )}
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
