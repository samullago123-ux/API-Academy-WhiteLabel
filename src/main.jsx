import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Badge, Card, Container } from './components/ui'

const APILearningLab = lazy(() => import('./api-learning-lab.jsx'))
const AdvancedAPILab = lazy(() => import('./advanced-api-lab.jsx'))
const ExpertAPILab = lazy(() => import('./expert-api-lab.jsx'))

function App() {
  const [view, setView] = useState(() => {
    const hash = window.location.hash.replace('#', '')
    if (hash === 'advanced') return 'advanced'
    if (hash === 'basics') return 'basics'
    if (hash === 'expert') return 'expert'
    return 'home'
  })

  useEffect(() => {
    function onHash() {
      const hash = window.location.hash.replace('#', '')
      if (hash === 'advanced') setView('advanced')
      else if (hash === 'basics') setView('basics')
      else if (hash === 'expert') setView('expert')
      else setView('home')
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const content = useMemo(() => {
    if (view === 'basics') return <APILearningLab />
    if (view === 'advanced') return <AdvancedAPILab />
    if (view === 'expert') return <ExpertAPILab />
    return null
  }, [view])

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

  const levels = [
    {
      hash: 'basics',
      icon: '⚡',
      badge: 'NIVEL 1',
      badgeColor: 'indigo',
      desc: 'HTTP, métodos, status codes, headers, JSON y un playground interactivo',
      lessons: '7 lecciones',
    },
    {
      hash: 'advanced',
      icon: '🔥',
      badge: 'NIVEL 2',
      badgeColor: 'amber',
      desc: 'OAuth, Rate Limiting, Idempotencia, Webhooks, Circuit Breakers y más',
      lessons: '9 lecciones',
    },
    {
      hash: 'expert',
      icon: '👑',
      badge: 'NIVEL 3',
      badgeColor: 'red',
      desc: 'API Design Patterns, GraphQL, Event-Driven, Security, Sistemas Distribuidos',
      lessons: '9 lecciones',
    },
  ]

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

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {levels.map((l) => (
              <a key={l.hash} href={`#${l.hash}`} className="group">
                <Card className="h-full p-6 text-center transition-transform duration-200 group-hover:-translate-y-1 group-hover:border-zinc-700">
                  <div className="text-4xl">{l.icon}</div>
                  <div className="mt-4 flex justify-center">
                    <Badge color={l.badgeColor}>{l.badge}</Badge>
                  </div>
                  <div className="mt-3 text-lg font-extrabold text-zinc-100">
                    {l.hash === 'basics' ? 'API Basics' : l.hash === 'advanced' ? 'Advanced APIs' : 'Expert Design'}
                  </div>
                  <div className="mt-2 min-h-14 text-xs leading-relaxed text-zinc-400">{l.desc}</div>
                  <div className="mt-3 text-xs text-zinc-500">{l.lessons}</div>
                  <div className="mt-4 text-sm font-bold text-indigo-400 group-hover:text-indigo-300">
                    Comenzar →
                  </div>
                </Card>
              </a>
            ))}
          </div>

          <p className="mt-10 text-xs text-zinc-600">Whitelabel SAS — Semillero de Automatización</p>
        </div>
      </Container>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
