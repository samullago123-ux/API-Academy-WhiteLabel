import { useEffect, useMemo, useState } from 'react'
import Quiz from '../components/Quiz.jsx'
import { Badge, BrandMark, Button, Card, Container, Modal, Tabs } from '../components/ui.jsx'
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
  const [pendingAction, setPendingAction] = useState(null)

  function loadSettings() {
    if (typeof window === 'undefined') return { confirmLeaveQuiz: true, dailyMode: 'wrong', speedTimeLimitSec: 60, speedQuestionCount: 10 }
    try {
      const raw = window.localStorage.getItem('api-academy-settings:v1')
      const parsed = raw ? JSON.parse(raw) : null
      return {
        confirmLeaveQuiz: (parsed?.confirmLeaveQuiz ?? true) === true,
        dailyMode: parsed?.dailyMode === 'mixed' ? 'mixed' : 'wrong',
        speedTimeLimitSec: Number(parsed?.speedTimeLimitSec ?? 60),
        speedQuestionCount: Number(parsed?.speedQuestionCount ?? 10),
      }
    } catch {
      return { confirmLeaveQuiz: true, dailyMode: 'wrong', speedTimeLimitSec: 60, speedQuestionCount: 10 }
    }
  }

  const settings = loadSettings()

  function confirmLoseQuizProgress() {
    if (typeof window === 'undefined') return true
    if (!settings.confirmLeaveQuiz) return true
    if (!window.__aaQuizInProgress) return true
    return false
  }

  function guardedBack() {
    if (!confirmLoseQuizProgress()) {
      setPendingAction({ type: 'back' })
      return
    }
    onBack?.()
  }

  function guardedSetTab(nextTab) {
    if (!confirmLoseQuizProgress()) {
      setPendingAction({ type: 'tab', value: nextTab })
      return
    }
    setTab(nextTab)
  }

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
    if (settings.dailyMode === 'mixed') return allQuestions
    return pool.length ? pool : allQuestions
  }, [allQuestions, settings.dailyMode])

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
    { id: 'debug-200', kind: 'debug', label: 'Debug: lograr status 200', setup: { method: 'GET', endpoint: 'usuarios', authMode: 'bearer', bodyText: '' }, check: (res) => res?.status === 200, damage: 2 },
    { id: 'json-body', kind: 'json', label: 'Armar JSON válido con nombre y email', setup: { method: 'POST', endpoint: 'usuarios', authMode: 'bearer', bodyText: '{\n  "nombre": "",\n  "email": ""\n}' }, damage: 2 },
    { id: 'quiz', kind: 'quiz', label: 'Responder una pregunta del programa', damage: 2 },
    { id: 'detect', kind: 'detect', label: 'Identificar valor en respuesta JSON', setup: { method: 'GET', endpoint: 'usuarios/1', authMode: 'bearer', bodyText: '' }, damage: 2 },
    { id: 'debug-201', kind: 'debug', label: 'Debug: crear usuario (status 201)', setup: { method: 'POST', endpoint: 'usuarios', authMode: 'bearer', bodyText: '{\n  "nombre": "Boss Slayer"\n}' }, check: (res) => res?.status === 201, damage: 2 },
  ]), [])
  const [bossIdx, setBossIdx] = useState(0)
  const bossTarget = bossTargets[Math.max(0, Math.min(bossTargets.length - 1, bossIdx))]
  const [bossHp, setBossHp] = useState(10)
  const [bossRunResult, setBossRunResult] = useState(null)
  const [bossMessage, setBossMessage] = useState('')
  const [bossDamageFx, setBossDamageFx] = useState(false)
  const [bossDetectAnswer, setBossDetectAnswer] = useState('')
  const [bossQuizIdx, setBossQuizIdx] = useState(0)
  const [bossQuizChoice, setBossQuizChoice] = useState(null)
  const [bossSolvedCurrent, setBossSolvedCurrent] = useState(false)

  const bossQuizPool = useMemo(() => {
    const pool = allQuestions.slice(0, 12)
    return pool.length ? pool : [{ q: '¿Qué status representa éxito?', opts: ['500', '200', '404'], correct: '200', explain: '200 OK es éxito.' }]
  }, [allQuestions])
  const bossQuiz = bossQuizPool[bossQuizIdx % bossQuizPool.length]

  const bossDetectTask = useMemo(() => ({
    payload: {
      status: 'ok',
      service: 'api-academy',
      level: 'boss',
      retries: 3,
      token: 'WL-42',
    },
    key: 'token',
    expected: 'WL-42',
  }), [])

  useEffect(() => {
    if (tab !== 'boss') return
    setMethod(bossTarget?.setup?.method ?? 'GET')
    setEndpoint(bossTarget?.setup?.endpoint ?? 'usuarios')
    setAuthMode(bossTarget?.setup?.authMode ?? 'none')
    setBodyText(bossTarget?.setup?.bodyText ?? '')
    setBossRunResult(null)
    setBossDetectAnswer('')
    setBossQuizChoice(null)
    setBossSolvedCurrent(false)
  }, [tab, bossIdx, bossTarget, setMethod, setEndpoint, setAuthMode, setBodyText])

  function applyBossDamage(amount, reason) {
    setBossDamageFx(true)
    window.setTimeout(() => setBossDamageFx(false), 280)
    setBossHp((prev) => {
      const nextHp = Math.max(0, prev - amount)
      if (nextHp === 0 && prev > 0) {
        setStats((prevStats) => {
          const next = { ...prevStats, xp: prevStats.xp + 120, bossSolved: prevStats.bossSolved + 1 }
          saveStats(next)
          return next
        })
        trackEvent('boss_solved', { reason })
      }
      return nextHp
    })
  }

  async function runBossDebug() {
    setLoading(true)
    setBossRunResult(null)
    const headers = {}
    if (authMode === 'bearer') headers.Authorization = 'Bearer demo_token'
    if (authMode === 'apikey') headers['X-API-Key'] = 'demo_key'
    const parsedBody = safeJson(bodyText)
    const body = parsedBody === '__invalid__' ? '__invalid__' : parsedBody
    try {
      if (body === '__invalid__') {
        const res = { status: 0, statusText: 'Invalid JSON', time: 0, body: { error: 'JSON inválido' } }
        setBossRunResult(res)
        setBossMessage('JSON inválido.')
        return
      }
      const res = await simulateAPI(method, endpoint, body, headers)
      setBossRunResult(res)
      if (bossTarget.check?.(res)) {
        if (!bossSolvedCurrent) {
          setBossSolvedCurrent(true)
          applyBossDamage(bossTarget.damage ?? 2, bossTarget.id)
        }
        setBossMessage('✅ Golpe crítico al jefe.')
      } else {
        setBossMessage('❌ El jefe bloqueó tu ataque.')
      }
    } finally {
      setLoading(false)
    }
  }

  function runBossJson() {
    const parsed = safeJson(bodyText)
    if (parsed === '__invalid__' || !parsed || typeof parsed !== 'object') {
      setBossMessage('❌ JSON inválido.')
      return
    }
    const ok = String(parsed?.nombre ?? '').trim().length >= 2 && String(parsed?.email ?? '').includes('@')
    if (ok) {
      if (!bossSolvedCurrent) {
        setBossSolvedCurrent(true)
        applyBossDamage(bossTarget.damage ?? 2, bossTarget.id)
      }
      setBossMessage('✅ JSON correcto. Daño aplicado.')
    } else {
      setBossMessage('❌ Faltan campos válidos: nombre y email.')
    }
  }

  function runBossQuiz() {
    if (!bossQuizChoice) return
    if (bossQuizChoice === bossQuiz.correct) {
      if (!bossSolvedCurrent) {
        setBossSolvedCurrent(true)
        applyBossDamage(bossTarget.damage ?? 2, bossTarget.id)
      }
      setBossMessage('✅ Respuesta correcta. El jefe recibió daño.')
    } else {
      setBossMessage('❌ Respuesta incorrecta.')
    }
  }

  function runBossDetect() {
    const answer = String(bossDetectAnswer ?? '').trim()
    if (!answer) return
    if (answer === bossDetectTask.expected) {
      if (!bossSolvedCurrent) {
        setBossSolvedCurrent(true)
        applyBossDamage(bossTarget.damage ?? 2, bossTarget.id)
      }
      setBossMessage('✅ Valor identificado correctamente.')
    } else {
      setBossMessage('❌ Valor incorrecto.')
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Container className="py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <BrandMark />
          <Button variant="secondary" onClick={guardedBack}>← Volver</Button>
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

        <Tabs value={tab} onValueChange={guardedSetTab} items={TAB_ITEMS} className="mb-5" />

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
                Tenés {settings.speedTimeLimitSec} segundos. Respondé rápido y sin perder calidad.
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
                <Badge color="amber">{settings.speedTimeLimitSec}s · {settings.speedQuestionCount} preguntas</Badge>
              </div>
              <Quiz
                questionsBank={allQuestions}
                questionCount={settings.speedQuestionCount}
                timeLimitSec={settings.speedTimeLimitSec}
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
              <div className="mt-2 text-xl font-black text-zinc-100">Mini jefe multi-actividad</div>
              <div className="mt-2 text-sm leading-relaxed text-zinc-400">
                Combiná debug, JSON, preguntas y detección de valores para derrotarlo.
              </div>
              <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold tracking-widest text-zinc-500">VIDA DEL JEFE</div>
                  <div className="text-sm font-black text-red-300">{bossHp}/10 HP</div>
                </div>
                <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, (bossHp / 10) * 100))}%` }}
                  />
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="text-xs font-bold tracking-widest text-zinc-500">OBJETIVO</div>
                <div className="mt-2 text-sm font-bold text-zinc-200">
                  {bossIdx + 1}/{bossTargets.length} · {bossTarget.label}
                </div>
                <div className="mt-2 text-xs text-zinc-500">Completados: {stats.bossSolved}</div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setBossIdx(0)
                    setBossHp(10)
                    setBossRunResult(null)
                    setBossMessage('')
                    setBossSolvedCurrent(false)
                    setBossQuizIdx((v) => v + 1)
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
                  Pista: completá la acción actual para hacer daño. Cada acierto resta 2 HP.
                </div>
              )}
            </Card>
            <Card className="p-6">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-extrabold text-zinc-100">Arena</div>
                <Badge color="red">Boss</Badge>
              </div>
              <div className="mb-4 flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
                <div
                  className={[
                    'boss-sprite',
                    bossHp <= 0 ? 'is-dead' : '',
                    bossDamageFx ? 'is-hit' : 'is-idle',
                  ].filter(Boolean).join(' ')}
                >
                  <div className="boss-fist" aria-hidden="true" />
                  <div className="boss-hit-spark" aria-hidden="true">💥</div>
                  <div className="boss-face" aria-hidden="true">
                    <div className="boss-eyes">
                      <div className="boss-eye" />
                      <div className="boss-eye" />
                    </div>
                    <div className="boss-mouth" />
                    <div className="boss-cheek boss-cheek-left" />
                    <div className="boss-cheek boss-cheek-right" />
                  </div>
                  <div className="boss-tomb" aria-hidden="true">🪦</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold tracking-widest text-zinc-500">ESTADO</div>
                  <div className={`mt-1 text-sm font-bold ${bossHp > 0 ? 'text-zinc-200' : 'text-emerald-300'}`}>
                    {bossHp > 0 ? 'En combate' : 'Derrotado'}
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                {bossTarget.kind === 'debug' && (
                  <>
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
                    <Button onClick={runBossDebug} disabled={loading || bossHp <= 0}>
                      {loading ? '⏳ Ejecutando...' : '▶ Ejecutar ataque debug'}
                    </Button>
                    {bossRunResult && (
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="font-mono text-sm font-bold text-zinc-200">{bossRunResult.status} {bossRunResult.statusText}</div>
                          <div className="text-xs text-zinc-600">{Math.round(bossRunResult.time ?? 0)}ms</div>
                        </div>
                        <pre className="m-0 whitespace-pre-wrap font-mono text-xs leading-relaxed text-zinc-400">
                          {JSON.stringify(bossRunResult.body, null, 2)}
                        </pre>
                      </div>
                    )}
                  </>
                )}

                {bossTarget.kind === 'json' && (
                  <>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-400">
                      Crea un JSON con <span className="font-mono text-zinc-200">nombre</span> y <span className="font-mono text-zinc-200">email</span>.
                    </div>
                    <textarea
                      value={bodyText}
                      onChange={(e) => setBodyText(e.target.value)}
                      className="min-h-32 w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs leading-relaxed text-zinc-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                      spellCheck={false}
                    />
                    <Button onClick={runBossJson} disabled={bossHp <= 0}>⚔️ Validar JSON</Button>
                  </>
                )}

                {bossTarget.kind === 'quiz' && bossQuiz && (
                  <>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-bold text-zinc-100">{bossQuiz.q}</div>
                    <div className="grid gap-2">
                      {bossQuiz.opts.map((opt, idx) => (
                        <button
                          key={`${bossQuiz.q}-${idx}`}
                          onClick={() => setBossQuizChoice(opt)}
                          className={`rounded-xl border px-4 py-3 text-left text-sm ${
                            bossQuizChoice === opt
                              ? 'border-indigo-400 bg-indigo-500/10 text-indigo-200'
                              : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-900'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    <Button onClick={runBossQuiz} disabled={!bossQuizChoice || bossHp <= 0}>⚔️ Responder</Button>
                  </>
                )}

                {bossTarget.kind === 'detect' && (
                  <>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-400">
                      Identifica el valor de <span className="font-mono text-zinc-200">{bossDetectTask.key}</span>.
                    </div>
                    <pre className="m-0 whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-xs leading-relaxed text-zinc-300">
                      {JSON.stringify(bossDetectTask.payload, null, 2)}
                    </pre>
                    <input
                      value={bossDetectAnswer}
                      onChange={(e) => setBossDetectAnswer(e.target.value)}
                      className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                      placeholder={`Valor de ${bossDetectTask.key}`}
                    />
                    <Button onClick={runBossDetect} disabled={!bossDetectAnswer.trim() || bossHp <= 0}>⚔️ Validar valor</Button>
                  </>
                )}

                {bossMessage && (
                  <div className={`rounded-xl border px-4 py-3 text-sm font-bold ${
                    bossMessage.startsWith('✅')
                      ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-red-400/30 bg-red-500/10 text-red-300'
                  }`}>
                    {bossMessage}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    disabled={!bossSolvedCurrent || bossHp <= 0}
                    onClick={() => {
                      setBossSolvedCurrent(false)
                      setBossMessage('')
                      setBossRunResult(null)
                      setBossDetectAnswer('')
                      setBossQuizChoice(null)
                      setBossQuizIdx((v) => v + 1)
                      setBossIdx((idx) => (idx + 1 >= bossTargets.length ? 0 : idx + 1))
                    }}
                  >
                    Siguiente fase →
                  </Button>
                </div>
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

      <Modal
        open={pendingAction !== null}
        title="Salir del quiz"
        description="Si continuas, se perderá el progreso actual del quiz."
        onClose={() => setPendingAction(null)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setPendingAction(null)}>Cancelar</Button>
            <Button
              onClick={() => {
                const action = pendingAction
                setPendingAction(null)
                if (!action) return
                if (action.type === 'back') onBack?.()
                if (action.type === 'tab' && typeof action.value === 'string') setTab(action.value)
              }}
            >
              Continuar
            </Button>
          </>
        }
      >
        <div className="text-sm text-zinc-400">
          Te recomendamos terminar el quiz antes de cambiar de sección.
        </div>
      </Modal>
    </div>
  )
}
