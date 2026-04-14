import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import APILearningLab from './api-learning-lab.jsx'
import AdvancedAPILab from './advanced-api-lab.jsx'
import ExpertAPILab from './expert-api-lab.jsx'

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

  if (view === 'basics') return <APILearningLab />
  if (view === 'advanced') return <AdvancedAPILab />
  if (view === 'expert') return <ExpertAPILab />

  const levels = [
    {
      hash: 'basics', icon: '⚡', badge: 'NIVEL 1', badgeColor: '#6366f1',
      title: 'API Basics', hoverBorder: '#6366f1',
      desc: 'HTTP, métodos, status codes, headers, JSON y un playground interactivo',
      lessons: '7 lecciones',
    },
    {
      hash: 'advanced', icon: '🔥', badge: 'NIVEL 2', badgeColor: '#f59e0b',
      title: 'Advanced APIs', hoverBorder: '#f59e0b',
      desc: 'OAuth, Rate Limiting, Idempotencia, Webhooks, Circuit Breakers y más',
      lessons: '9 lecciones',
    },
    {
      hash: 'expert', icon: '👑', badge: 'NIVEL 3', badgeColor: '#ef4444',
      title: 'Expert Design', hoverBorder: '#ef4444',
      desc: 'API Design Patterns, GraphQL, Event-Driven, Security, Sistemas Distribuidos',
      lessons: '9 lecciones',
    },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#09090b',
      color: '#e4e4e7',
      fontFamily: "'Outfit', -apple-system, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
      `}</style>

      <div style={{ textAlign: 'center', maxWidth: 800 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
        <h1 style={{
          fontSize: 36, fontWeight: 900, marginBottom: 4, letterSpacing: -1,
          background: 'linear-gradient(135deg, #6366f1, #f59e0b, #ef4444)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          API Academy
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ color: '#27272a', fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>by</span>
          <span style={{ color: '#52525b', fontSize: 15, fontWeight: 800, letterSpacing: 1 }}>WHITELABEL</span>
        </div>
        <p style={{ color: '#3f3f46', fontSize: 14, marginBottom: 40, lineHeight: 1.6 }}>
          Dominá APIs desde los fundamentos hasta arquitectura de sistemas.<br />
          3 niveles · 25 lecciones interactivas · 48 preguntas de quiz
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {levels.map((l) => (
            <a key={l.hash} href={`#${l.hash}`} style={{
              background: '#111113', border: '1px solid #27272a', borderRadius: 16,
              padding: '32px 20px', textDecoration: 'none', cursor: 'pointer',
              transition: 'all 0.2s', textAlign: 'center',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = l.hoverBorder; e.currentTarget.style.transform = 'translateY(-3px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#27272a'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>{l.icon}</div>
              <span style={{
                background: l.badgeColor + '22', color: l.badgeColor, fontSize: 10, fontWeight: 800,
                padding: '3px 8px', borderRadius: 6, letterSpacing: 1,
              }}>{l.badge}</span>
              <div style={{ color: '#e4e4e7', fontSize: 18, fontWeight: 800, marginTop: 10 }}>{l.title}</div>
              <div style={{ color: '#52525b', fontSize: 12, marginTop: 8, lineHeight: 1.5, minHeight: 54 }}>
                {l.desc}
              </div>
              <div style={{ color: '#3f3f46', fontSize: 11, marginTop: 12 }}>{l.lessons}</div>
              <div style={{ color: l.badgeColor, fontSize: 13, fontWeight: 700, marginTop: 12 }}>
                Comenzar →
              </div>
            </a>
          ))}
        </div>

        <p style={{ color: '#3f3f46', fontSize: 12, marginTop: 40 }}>
          Whitelabel SAS — Semillero de Automatización
        </p>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
