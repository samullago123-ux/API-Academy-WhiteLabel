import { useEffect, useState } from 'react'
import LabLayout from '../../components/LabLayout.jsx'
import Quiz from '../../components/Quiz.jsx'
import ErrorsLesson from './lessons/ErrorsLesson.jsx'
import GatewayLesson from './lessons/GatewayLesson.jsx'
import IdempotencyLesson from './lessons/IdempotencyLesson.jsx'
import OAuthLesson from './lessons/OAuthLesson.jsx'
import PaginationLesson from './lessons/PaginationLesson.jsx'
import RateLimitLesson from './lessons/RateLimitLesson.jsx'
import VersioningLesson from './lessons/VersioningLesson.jsx'
import WebhooksLesson from './lessons/WebhooksLesson.jsx'
import { ALL_QUESTIONS } from './questions.js'
import { loadLabProgress, recordQuizAttempt, saveLabProgress } from '../../services/progressStore.js'
import { trackEvent } from '../../services/analytics.js'

const LESSONS = [
  { id: 'oauth', title: 'OAuth 2.0', icon: '🔐', desc: 'Flujos de autenticación avanzada' },
  { id: 'ratelimit', title: 'Rate Limiting', icon: '🚦', desc: 'Throttling y Exponential Backoff' },
  { id: 'idempotency', title: 'Idempotencia', icon: '🔁', desc: 'Operaciones seguras y repetibles' },
  { id: 'pagination', title: 'Paginación', icon: '📄', desc: 'Offset, Cursor y Streaming' },
  { id: 'webhooks', title: 'Webhooks', icon: '🪝', desc: 'APIs invertidas y eventos' },
  { id: 'versioning', title: 'Versionamiento', icon: '📦', desc: 'Backward compatibility y estrategias' },
  { id: 'errors', title: 'Errores & Resiliencia', icon: '🛡️', desc: 'Circuit breakers y retry patterns' },
  { id: 'gateway', title: 'API Gateway', icon: '🏗️', desc: 'Orquestación de microservicios' },
  { id: 'quiz', title: 'Quiz Avanzado', icon: '🏆', desc: '20 preguntas aleatorias' },
]

const DEFAULT_PROGRESS = { activeLesson: 'oauth', visited: ['oauth'], quiz: {} }

export default function AdvancedAPILab() {
  const [activeLesson, setActiveLesson] = useState(() => loadLabProgress('advanced', DEFAULT_PROGRESS).activeLesson)
  const [visited, setVisited] = useState(() => loadLabProgress('advanced', DEFAULT_PROGRESS).visited)

  useEffect(() => {
    trackEvent('lab_open', { labId: 'advanced' })
  }, [])

  useEffect(() => {
    saveLabProgress('advanced', { activeLesson, visited })
  }, [activeLesson, visited])

  useEffect(() => {
    trackEvent(activeLesson === 'quiz' ? 'quiz_view' : 'lesson_view', { labId: 'advanced', lessonId: activeLesson })
  }, [activeLesson])

  function navigate(id) {
    setActiveLesson(id)
    setVisited((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }

  function renderLesson() {
    switch (activeLesson) {
      case 'oauth':
        return <OAuthLesson />
      case 'ratelimit':
        return <RateLimitLesson />
      case 'idempotency':
        return <IdempotencyLesson />
      case 'pagination':
        return <PaginationLesson />
      case 'webhooks':
        return <WebhooksLesson />
      case 'versioning':
        return <VersioningLesson />
      case 'errors':
        return <ErrorsLesson />
      case 'gateway':
        return <GatewayLesson />
      case 'quiz':
        return (
          <Quiz
            questionsBank={ALL_QUESTIONS}
            questionCount={15}
            messages={{
              high: '¡Nivel senior! Dominás conceptos avanzados de APIs.',
              medium: 'Buen nivel. Repasá los temas donde fallaste.',
              low: 'Hay que seguir estudiando. Volvé a las lecciones y reintentá.',
            }}
            finalButtonText="Ver Resultado →"
            restartButtonText="🔄 Quiz nuevo (preguntas aleatorias)"
            gradientClassName="accent-amber-500"
            primaryClassName="bg-indigo-500 hover:bg-indigo-400"
            onComplete={({ score, total, pct }) => {
              recordQuizAttempt('advanced', { score, total, pct, at: Date.now() })
              trackEvent('quiz_complete', { labId: 'advanced', score, total, pct })
            }}
          />
        )
      default:
        return null
    }
  }

  return (
    <LabLayout
      icon="🔥"
      title="Advanced API Lab"
      titleClassName="text-xl font-black tracking-tight bg-gradient-to-r from-amber-400 via-red-400 to-violet-400 bg-clip-text text-transparent"
      subtitle="OAuth, Rate Limiting, Idempotencia, Webhooks y más"
      levelLabel="NIVEL 2"
      levelColor="amber"
      progressBarClassName="accent-amber-500"
      lessons={LESSONS}
      activeLesson={activeLesson}
      visited={visited}
      onNavigate={navigate}
    >
      {renderLesson()}
    </LabLayout>
  )
}
