import { useEffect, useState } from 'react'
import LabLayout from '../../components/LabLayout.jsx'
import Quiz from '../../components/Quiz.jsx'
import DesignPatternsLesson from './lessons/DesignPatternsLesson.jsx'
import DistributedLesson from './lessons/DistributedLesson.jsx'
import EventDrivenLesson from './lessons/EventDrivenLesson.jsx'
import GraphQLLesson from './lessons/GraphQLLesson.jsx'
import OpenAPILesson from './lessons/OpenAPILesson.jsx'
import PerformanceLesson from './lessons/PerformanceLesson.jsx'
import RealWorldLesson from './lessons/RealWorldLesson.jsx'
import SecurityLesson from './lessons/SecurityLesson.jsx'
import { ALL_QUESTIONS } from './questions.js'
import { loadLabProgress, recordQuizAttempt, saveLabProgress } from '../../services/progressStore.js'
import { trackEvent } from '../../services/analytics.js'

const LESSONS = [
  { id: 'design', title: 'API Design Patterns', icon: '🏛️', desc: 'REST maduro, HATEOAS y diseño profesional' },
  { id: 'graphql', title: 'GraphQL vs REST', icon: '🔮', desc: 'Cuándo usar cada uno y por qué' },
  { id: 'eventdriven', title: 'Event-Driven', icon: '⚡', desc: 'Colas, pub/sub y arquitecturas asíncronas' },
  { id: 'security', title: 'Seguridad Avanzada', icon: '🛡️', desc: 'OWASP API Top 10, CORS, CSP y hardening' },
  { id: 'performance', title: 'Performance & Cache', icon: '🚀', desc: 'Redis, CDN, ETags y optimización' },
  { id: 'openapi', title: 'OpenAPI & Docs', icon: '📋', desc: 'Contratos, SDK generation y testing' },
  { id: 'distributed', title: 'Sistemas Distribuidos', icon: '🌐', desc: 'CAP, consistencia eventual y sagas' },
  { id: 'realworld', title: 'Caso Real: Sistema', icon: '🏗️', desc: 'Diseñá una arquitectura completa' },
  { id: 'quiz', title: 'Quiz Experto', icon: '🏆', desc: '20 preguntas de nivel senior' },
]

const DEFAULT_PROGRESS = { activeLesson: 'design', visited: ['design'], quiz: {} }

export default function ExpertAPILab() {
  const [activeLesson, setActiveLesson] = useState(() => loadLabProgress('expert', DEFAULT_PROGRESS).activeLesson)
  const [visited, setVisited] = useState(() => loadLabProgress('expert', DEFAULT_PROGRESS).visited)

  useEffect(() => {
    trackEvent('lab_open', { labId: 'expert' })
  }, [])

  useEffect(() => {
    saveLabProgress('expert', { activeLesson, visited })
  }, [activeLesson, visited])

  useEffect(() => {
    trackEvent(activeLesson === 'quiz' ? 'quiz_view' : 'lesson_view', { labId: 'expert', lessonId: activeLesson })
  }, [activeLesson])

  function navigate(id) {
    setActiveLesson(id)
    setVisited((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }

  function renderLesson() {
    switch (activeLesson) {
      case 'design':
        return <DesignPatternsLesson />
      case 'graphql':
        return <GraphQLLesson />
      case 'eventdriven':
        return <EventDrivenLesson />
      case 'security':
        return <SecurityLesson />
      case 'performance':
        return <PerformanceLesson />
      case 'openapi':
        return <OpenAPILesson />
      case 'distributed':
        return <DistributedLesson />
      case 'realworld':
        return <RealWorldLesson />
      case 'quiz':
        return (
          <Quiz
            questionsBank={ALL_QUESTIONS}
            questionCount={20}
            messages={{
              high: '¡Nivel Arquitecto! Dominás API design a nivel senior.',
              medium: 'Excelente base. Profundizá en los temas que fallaste.',
              low: 'Buen progreso. Repasá las lecciones y volvé a intentar.',
            }}
            thresholds={{ high: 70, medium: 50 }}
            finalButtonText="Ver Resultado →"
            restartButtonText="🔄 Quiz nuevo (preguntas aleatorias)"
            gradientClassName="accent-red-500"
            primaryClassName="bg-indigo-500 hover:bg-indigo-400"
            onComplete={({ score, total, pct }) => {
              recordQuizAttempt('expert', { score, total, pct, at: Date.now() })
              trackEvent('quiz_complete', { labId: 'expert', score, total, pct })
            }}
          />
        )
      default:
        return null
    }
  }

  return (
    <LabLayout
      icon="👑"
      title="Expert API Lab"
      titleClassName="text-xl font-black tracking-tight bg-gradient-to-r from-red-400 via-amber-400 to-emerald-400 bg-clip-text text-transparent"
      subtitle="API Design, GraphQL, Event-Driven, Security, Sistemas Distribuidos"
      levelLabel="NIVEL 3"
      levelColor="red"
      progressBarClassName="accent-red-500"
      lessons={LESSONS}
      activeLesson={activeLesson}
      visited={visited}
      onNavigate={navigate}
    >
      {renderLesson()}
    </LabLayout>
  )
}
