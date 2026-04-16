import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Badge, Card, Container } from './components/ui'
import { loadAllProgress, saveLabProgress } from './services/progressStore.js'
import { aggregateMetrics, clearEvents, loadEvents, trackEvent } from './services/analytics.js'
import { initTheme } from './theme/theme.js'
import { supabase } from './services/supabaseClient.js'
import { getSession, pullAllFromSupabase, pullEventsFromSupabase, pushAllToSupabase, signInWithEmailOtp, signOut } from './services/supabaseSync.js'

initTheme()

const APILearningLab = lazy(() => import('./api-learning-lab.jsx'))
const AdvancedAPILab = lazy(() => import('./advanced-api-lab.jsx'))
const ExpertAPILab = lazy(() => import('./expert-api-lab.jsx'))
const CertificateView = lazy(() => import('./views/CertificateView.jsx'))
const ChallengesView = lazy(() => import('./views/ChallengesView.jsx'))

const LEVELS = [
  {
    hash: 'basics',
    icon: '⚡',
    badge: 'NIVEL 1',
    badgeColor: 'indigo',
    lessonCount: 7,
    title: 'API Basics',
    desc: 'HTTP, métodos, status codes, headers, JSON y un playground interactivo',
    lessons: [
      { id: 'anatomy', title: 'Anatomía de un Request', desc: 'Partes de una petición HTTP' },
      { id: 'methods', title: 'Métodos HTTP (CRUD)', desc: 'GET, POST, PUT, DELETE en acción' },
      { id: 'status', title: 'Códigos de Estado', desc: '200, 404, 500 y más' },
      { id: 'headers', title: 'Headers & Auth', desc: 'Autenticación y metadatos' },
      { id: 'json', title: 'JSON: El Idioma', desc: 'Estructura de datos en APIs' },
      { id: 'playground', title: 'API Playground', desc: 'Requests interactivos' },
      { id: 'quiz', title: 'Quiz Final', desc: 'Evaluación de fundamentos' },
    ],
  },
  {
    hash: 'advanced',
    icon: '🔥',
    badge: 'NIVEL 2',
    badgeColor: 'amber',
    lessonCount: 9,
    title: 'Advanced APIs',
    desc: 'OAuth, Rate Limiting, Idempotencia, Webhooks, Circuit Breakers y más',
    lessons: [
      { id: 'oauth', title: 'OAuth 2.0', desc: 'Flujos avanzados de autenticación' },
      { id: 'ratelimit', title: 'Rate Limiting', desc: 'Throttling y exponential backoff' },
      { id: 'idempotency', title: 'Idempotencia', desc: 'Operaciones seguras y repetibles' },
      { id: 'pagination', title: 'Paginación', desc: 'Offset, cursor y streaming' },
      { id: 'webhooks', title: 'Webhooks', desc: 'Eventos de servidor a servidor' },
      { id: 'versioning', title: 'Versionamiento', desc: 'Backward compatibility' },
      { id: 'errors', title: 'Errores & Resiliencia', desc: 'Retries y circuit breaker' },
      { id: 'gateway', title: 'API Gateway', desc: 'Patrones de orquestación' },
      { id: 'quiz', title: 'Quiz Avanzado', desc: 'Evaluación avanzada' },
    ],
  },
  {
    hash: 'expert',
    icon: '👑',
    badge: 'NIVEL 3',
    badgeColor: 'red',
    lessonCount: 9,
    title: 'Expert Design',
    desc: 'API Design Patterns, GraphQL, Event-Driven, Security, Sistemas Distribuidos',
    lessons: [
      { id: 'design', title: 'API Design Patterns', desc: 'Diseño de APIs senior' },
      { id: 'graphql', title: 'GraphQL vs REST', desc: 'Tradeoffs reales' },
      { id: 'eventdriven', title: 'Event-Driven', desc: 'Arquitecturas asíncronas' },
      { id: 'security', title: 'Seguridad Avanzada', desc: 'OWASP API Top 10' },
      { id: 'performance', title: 'Performance & Cache', desc: 'Optimización y caching' },
      { id: 'openapi', title: 'OpenAPI & Docs', desc: 'Contrato y tooling' },
      { id: 'distributed', title: 'Sistemas Distribuidos', desc: 'CAP y Sagas' },
      { id: 'realworld', title: 'Caso Real: Sistema', desc: 'Arquitectura de producción' },
      { id: 'quiz', title: 'Quiz Experto', desc: 'Evaluación senior' },
    ],
  },
]

function firstLessonId(labId) {
  const level = LEVELS.find((x) => x.hash === labId)
  return level?.lessons?.[0]?.id ?? 'quiz'
}

function formatDate(ts) {
  if (!ts) return 'n/a'
  try {
    return new Date(ts).toLocaleDateString('es-ES')
  } catch {
    return 'n/a'
  }
}

function parseRoute(hash) {
  const value = String(hash ?? '').replace('#', '')
  if (value.startsWith('verify=')) return { view: 'certificate', verifyId: value.slice('verify='.length) }
  if (value === 'certificate') return { view: 'certificate', verifyId: null }
  if (value === 'challenges') return { view: 'challenges', verifyId: null }
  if (value === 'advanced') return { view: 'advanced', verifyId: null }
  if (value === 'basics') return { view: 'basics', verifyId: null }
  if (value === 'expert') return { view: 'expert', verifyId: null }
  return { view: 'home', verifyId: null }
}

function App() {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash))

  useEffect(() => {
    function onHash() {
      setRoute(parseRoute(window.location.hash))
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const progress = loadAllProgress()
  const [searchQuery, setSearchQuery] = useState('')
  const [showMetrics, setShowMetrics] = useState(false)
  const [sbEmail, setSbEmail] = useState('')
  const [sbUser, setSbUser] = useState(null)
  const [sbBusy, setSbBusy] = useState(false)
  const [sbMsg, setSbMsg] = useState('')

  const content = useMemo(() => {
    if (route.view === 'basics') return <APILearningLab />
    if (route.view === 'advanced') return <AdvancedAPILab />
    if (route.view === 'expert') return <ExpertAPILab />
    if (route.view === 'challenges') return <ChallengesView onBack={() => (window.location.hash = '#')} />
    if (route.view === 'certificate') {
      return (
        <CertificateView
          progress={progress}
          levels={LEVELS}
          verifyId={route.verifyId}
          onBack={() => (window.location.hash = '#')}
        />
      )
    }
    return null
  }, [route.view, route.verifyId, progress])

  useEffect(() => {
    trackEvent('app_open')
  }, [])

  useEffect(() => {
    if (!supabase) return
    let unsub = null

    getSession()
      .then((s) => setSbUser(s?.user ?? null))
      .catch(() => {})

    const sub = supabase.auth.onAuthStateChange((_event, session) => {
      setSbUser(session?.user ?? null)
    })
    unsub = () => sub.data.subscription.unsubscribe()

    return () => unsub?.()
  }, [])

  useEffect(() => {
    const q = searchQuery.trim()
    if (q.length < 3) return
    const handle = window.setTimeout(() => {
      trackEvent('search', { query: q })
    }, 450)
    return () => window.clearTimeout(handle)
  }, [searchQuery])

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return []
    return LEVELS.flatMap((level) =>
      level.lessons.map((lesson) => ({
        labId: level.hash,
        levelTitle: level.title,
        lesson,
      })),
    )
      .filter(({ lesson, levelTitle }) => {
        const text = `${lesson.title} ${lesson.desc} ${levelTitle}`.toLowerCase()
        return text.includes(query)
      })
      .slice(0, 8)
  }, [searchQuery])

  const achievements = useMemo(() => {
    const visitedTotal = LEVELS.reduce((sum, level) => {
      const visited = Array.isArray(progress?.[level.hash]?.visited) ? progress[level.hash].visited.length : 0
      return sum + visited
    }, 0)
    const bestScores = LEVELS.map((level) => progress?.[level.hash]?.quiz?.bestPct ?? 0)
    const completedLevels = LEVELS.filter((level) => {
      const visited = Array.isArray(progress?.[level.hash]?.visited) ? progress[level.hash].visited.length : 0
      return visited >= level.lessonCount
    }).length
    const maxBest = Math.max(0, ...bestScores)

    return [
      { id: 'first-step', label: 'Primer Paso', unlocked: visitedTotal > 0 },
      { id: 'path-complete', label: 'Ruta Completa', unlocked: completedLevels === LEVELS.length },
      { id: 'quiz-master', label: 'Quiz Master (>=80%)', unlocked: maxBest >= 80 },
      { id: 'consistency', label: 'Constancia (3 quizzes)', unlocked: LEVELS.reduce((n, level) => n + (progress?.[level.hash]?.quiz?.history?.length ? 1 : 0), 0) >= 3 },
    ]
  }, [progress])

  const certificateUnlocked = useMemo(() => {
    return LEVELS.every((level) => {
      const visited = Array.isArray(progress?.[level.hash]?.visited) ? progress[level.hash].visited.length : 0
      const best = progress?.[level.hash]?.quiz?.bestPct ?? 0
      return visited >= level.lessonCount && best >= 60
    })
  }, [progress])

  function openLesson(labId, lessonId) {
    const current = progress?.[labId] ?? {}
    const defaultId = firstLessonId(labId)
    const visitedBase = Array.isArray(current.visited) ? current.visited : [defaultId]
    const visited = visitedBase.includes(lessonId) ? visitedBase : [...visitedBase, lessonId]
    saveLabProgress(labId, { activeLesson: lessonId, visited })
    trackEvent('open_lesson', { labId, lessonId })
    window.location.hash = `#${labId}`
  }

  const metrics = aggregateMetrics(loadEvents())

  if (content) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-zinc-950">
            <Container className="py-10">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 text-zinc-300">
                Cargando…
              </div>
            </Container>
          </div>
        }
      >
        {content}
      </Suspense>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Container className="flex min-h-screen items-center justify-center py-10">
        <div className="w-full max-w-3xl text-center">
          <div className="text-5xl">🚀</div>
          <h1 className="mt-4 bg-gradient-to-r from-indigo-400 via-amber-400 to-red-400 bg-clip-text text-4xl font-black tracking-tight text-transparent">
            API Academy
          </h1>

          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-800">by</span>
            <span className="text-sm font-extrabold tracking-widest text-zinc-500">WHITELABEL</span>
          </div>

          <p className="mt-6 text-sm leading-relaxed text-zinc-500">
            Dominá APIs desde los fundamentos hasta arquitectura de sistemas.
            <br />
            3 niveles · 25 lecciones interactivas · 48 preguntas de quiz
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <a
              href="#challenges"
              onClick={() => trackEvent('nav_challenges')}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm font-bold text-zinc-200 transition-colors hover:bg-zinc-900"
            >
              🎯 Retos
            </a>
            <a
              href="#certificate"
              onClick={() => trackEvent('nav_certificate')}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-500 px-4 text-sm font-bold text-white transition-colors hover:bg-indigo-400"
            >
              🏆 Certificado
            </a>
          </div>

          <div className="mx-auto mt-6 w-full max-w-xl text-left">
            <label htmlFor="lesson-search" className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-500">
              Buscar lección
            </label>
            <input
              id="lesson-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ejemplo: OAuth, headers, distributed..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
            />
            {searchResults.length > 0 && (
              <div className="mt-2 rounded-xl border border-zinc-800 bg-zinc-950 p-2">
                {searchResults.map((r) => (
                  <button
                    key={`${r.labId}:${r.lesson.id}`}
                    onClick={() => openLesson(r.labId, r.lesson.id)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-zinc-900"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-zinc-100">{r.lesson.title}</span>
                      <span className="block text-xs text-zinc-500">{r.levelTitle} · {r.lesson.desc}</span>
                    </span>
                    <span className="text-xs font-bold text-indigo-300">Abrir</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mx-auto mt-6 w-full max-w-3xl text-left">
            <button
              onClick={() => {
                setShowMetrics(!showMetrics)
                trackEvent('toggle_metrics', { open: !showMetrics })
              }}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm font-bold text-zinc-200 transition-colors hover:bg-zinc-900"
            >
              {showMetrics ? 'Ocultar métricas' : 'Ver métricas'}
            </button>

            {showMetrics && (
              <div className="mt-3 grid gap-4 lg:grid-cols-2">
                <Card className="p-5">
                  <div className="mb-3 text-sm font-extrabold text-zinc-100">Métricas (local)</div>
                  <div className="grid gap-2 text-sm text-zinc-400">
                    <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
                      <span>Eventos</span>
                      <span className="font-bold text-zinc-200">{metrics.totalEvents}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
                      <span>Sesiones únicas</span>
                      <span className="font-bold text-zinc-200">{metrics.uniqueSessions}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        const json = JSON.stringify(loadEvents(), null, 2)
                        navigator.clipboard?.writeText(json)
                        trackEvent('export_metrics', { bytes: json.length })
                      }}
                      className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-500 px-4 text-sm font-bold text-white transition-colors hover:bg-indigo-400"
                    >
                      Copiar JSON
                    </button>
                    <button
                      onClick={() => {
                        clearEvents()
                        trackEvent('clear_metrics')
                      }}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm font-bold text-zinc-200 transition-colors hover:bg-zinc-900"
                    >
                      Limpiar
                    </button>
                  </div>
                </Card>

                <Card className="p-5">
                  <div className="mb-3 text-sm font-extrabold text-zinc-100">Funnel por nivel</div>
                  <div className="grid gap-2">
                    {metrics.perLab.map((l) => (
                      <div key={l.labId} className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-zinc-200">{l.labId}</span>
                          <span className="text-xs text-zinc-500">{l.events} eventos</span>
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">
                          Lecciones vistas: <span className="text-zinc-200">{l.lessonsViewed}</span> · Quiz visto:{' '}
                          <span className="text-zinc-200">{l.quizViews}</span> · Quiz completado:{' '}
                          <span className="text-zinc-200">{l.quizCompletes}</span>
                        </div>
                      </div>
                    ))}
                    {metrics.perLab.length === 0 && (
                      <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-500">
                        Sin datos aún. Entrá a un nivel y navegá una lección.
                      </div>
                    )}
                  </div>
                  {metrics.topSearches.length > 0 && (
                    <div className="mt-4">
                      <div className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Top búsquedas</div>
                      <div className="flex flex-wrap gap-2">
                        {metrics.topSearches.map((s) => (
                          <span key={s.query} className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-300">
                            {s.query} · {s.count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            )}

            {showMetrics && (
              <div className="mt-4">
                <Card className="p-5">
                  <div className="mb-3 text-sm font-extrabold text-zinc-100">Supabase (cloud sync)</div>
                  {!supabase ? (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-500">
                      Falta configurar variables de entorno. En Vite podés usar <span className="font-mono">VITE_*</span> o también{' '}
                      <span className="font-mono">NEXT_PUBLIC_*</span> (ya está habilitado).
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <div className="mb-2 text-xs font-bold tracking-widest text-zinc-500">EMAIL</div>
                          <input
                            value={sbEmail}
                            onChange={(e) => setSbEmail(e.target.value)}
                            placeholder="tu@email.com"
                            className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                          />
                        </div>
                        <div>
                          <div className="mb-2 text-xs font-bold tracking-widest text-zinc-500">ESTADO</div>
                          <div className="flex h-10 items-center rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-300">
                            {sbUser?.email ? `Conectado: ${sbUser.email}` : 'No conectado'}
                          </div>
                        </div>
                      </div>

                      {sbMsg && <div className="text-sm text-zinc-500">{sbMsg}</div>}

                      <div className="flex flex-wrap gap-2">
                        {!sbUser ? (
                          <button
                            disabled={sbBusy || !sbEmail.trim()}
                            onClick={async () => {
                              setSbBusy(true)
                              setSbMsg('')
                              try {
                                await signInWithEmailOtp(sbEmail.trim())
                                trackEvent('supabase_signin_otp')
                                setSbMsg('Te envié un link al email. Abrilo para completar el login.')
                              } catch (e) {
                                setSbMsg(e?.message ?? 'No se pudo iniciar sesión.')
                              } finally {
                                setSbBusy(false)
                              }
                            }}
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-500 px-4 text-sm font-bold text-white transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
                          >
                            Conectar
                          </button>
                        ) : (
                          <button
                            disabled={sbBusy}
                            onClick={async () => {
                              setSbBusy(true)
                              setSbMsg('')
                              try {
                                await signOut()
                                trackEvent('supabase_signout')
                                setSbMsg('Sesión cerrada.')
                              } catch (e) {
                                setSbMsg(e?.message ?? 'No se pudo cerrar sesión.')
                              } finally {
                                setSbBusy(false)
                              }
                            }}
                            className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm font-bold text-zinc-200 transition-colors hover:bg-zinc-900 disabled:cursor-not-allowed"
                          >
                            Desconectar
                          </button>
                        )}

                        <button
                          disabled={sbBusy || !sbUser}
                          onClick={async () => {
                            setSbBusy(true)
                            setSbMsg('')
                            try {
                              await pushAllToSupabase()
                              trackEvent('supabase_push_all')
                              setSbMsg('Subido: perfil + progreso + certificado + eventos.')
                            } catch (e) {
                              setSbMsg(e?.message ?? 'No se pudo subir.')
                            } finally {
                              setSbBusy(false)
                            }
                          }}
                          className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-500 px-4 text-sm font-bold text-white transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
                        >
                          Subir
                        </button>

                        <button
                          disabled={sbBusy || !sbUser}
                          onClick={async () => {
                            setSbBusy(true)
                            setSbMsg('')
                            try {
                              await pullAllFromSupabase()
                              trackEvent('supabase_pull_all')
                              setSbMsg('Descargado: perfil + progreso + certificado. Recargá la página para ver todo actualizado.')
                            } catch (e) {
                              setSbMsg(e?.message ?? 'No se pudo descargar.')
                            } finally {
                              setSbBusy(false)
                            }
                          }}
                          className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm font-bold text-zinc-200 transition-colors hover:bg-zinc-900 disabled:cursor-not-allowed"
                        >
                          Descargar
                        </button>

                        <button
                          disabled={sbBusy || !sbUser}
                          onClick={async () => {
                            setSbBusy(true)
                            setSbMsg('')
                            try {
                              await pullEventsFromSupabase(500)
                              trackEvent('supabase_pull_events')
                              setSbMsg('Eventos descargados (máx 500).')
                            } catch (e) {
                              setSbMsg(e?.message ?? 'No se pudieron traer eventos.')
                            } finally {
                              setSbBusy(false)
                            }
                          }}
                          className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm font-bold text-zinc-200 transition-colors hover:bg-zinc-900 disabled:cursor-not-allowed"
                        >
                          Traer eventos
                        </button>
                      </div>

                      <div className="text-xs text-zinc-600">
                        Tablas esperadas en Supabase: <span className="font-mono">profiles</span>, <span className="font-mono">progress</span>,{' '}
                        <span className="font-mono">certificates</span>, <span className="font-mono">events</span>.
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LEVELS.map((l) => (
              <a key={l.hash} href={`#${l.hash}`} className="group">
                <Card className="h-full p-6 text-center transition-transform duration-200 group-hover:-translate-y-1 group-hover:border-zinc-700">
                  <div className="text-4xl">{l.icon}</div>
                  <div className="mt-4 flex justify-center">
                    <Badge color={l.badgeColor}>{l.badge}</Badge>
                  </div>
                  <div className="mt-3 text-lg font-extrabold text-zinc-100">
                    {l.title}
                  </div>
                  <div className="mt-2 min-h-14 text-xs leading-relaxed text-zinc-400">{l.desc}</div>
                  <div className="mt-3 text-xs text-zinc-500">
                    {(() => {
                      const stored = progress?.[l.hash]
                      const visited = Array.isArray(stored?.visited) ? stored.visited.length : 0
                      const pct = l.lessonCount ? Math.round((visited / l.lessonCount) * 100) : 0
                      const best = stored?.quiz?.bestPct
                      const historyCount = Array.isArray(stored?.quiz?.history) ? stored.quiz.history.length : 0
                      return `${visited}/${l.lessonCount} · ${pct}%${typeof best === 'number' ? ` · Quiz best ${best}%` : ''}${historyCount ? ` · Historial ${historyCount}` : ''}`
                    })()}
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-600">
                    {(() => {
                      const stored = progress?.[l.hash]
                      const current = stored?.activeLesson
                      const lesson = l.lessons.find((x) => x.id === current)
                      return lesson ? `Continuar: ${lesson.title}` : 'Continuar donde lo dejaste'
                    })()}
                  </div>
                  <div className="mt-4 text-sm font-bold text-indigo-400 group-hover:text-indigo-300">
                    {(() => {
                      const visited = Array.isArray(progress?.[l.hash]?.visited) ? progress[l.hash].visited.length : 0
                      return visited > 0 ? 'Continuar →' : 'Comenzar →'
                    })()}
                  </div>
                </Card>
              </a>
            ))}
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <Card className="p-5 text-left">
              <div className="mb-3 text-sm font-extrabold text-zinc-100">Logros</div>
              <div className="grid gap-2">
                {achievements.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
                    <span className="text-sm text-zinc-300">{a.label}</span>
                    <span className={`text-xs font-bold ${a.unlocked ? 'text-emerald-300' : 'text-zinc-500'}`}>
                      {a.unlocked ? 'Desbloqueado' : 'Pendiente'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-5 text-left">
              <div className="mb-3 text-sm font-extrabold text-zinc-100">Certificado</div>
              {certificateUnlocked ? (
                <div>
                  <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-zinc-200">
                    Certificado desbloqueado. Última validación: {formatDate(Date.now())}
                  </div>
                  <button
                    onClick={() => {
                      trackEvent('nav_certificate')
                      window.location.hash = '#certificate'
                    }}
                    className="mt-3 inline-flex h-10 items-center justify-center rounded-xl bg-indigo-500 px-4 text-sm font-bold text-white transition-colors hover:bg-indigo-400"
                  >
                    Abrir certificado
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">
                  Requisitos: completar los 3 niveles y obtener al menos 60% en cada quiz.
                </div>
              )}
              <div className="mt-3 text-xs text-zinc-500">
                Tu mejor quiz: Básico {progress?.basics?.quiz?.bestPct ?? 0}% · Avanzado {progress?.advanced?.quiz?.bestPct ?? 0}% · Experto {progress?.expert?.quiz?.bestPct ?? 0}%
              </div>
            </Card>
          </div>

          <p className="mt-10 text-xs text-zinc-600">Whitelabel SAS — Semillero de Automatización</p>
        </div>
      </Container>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
