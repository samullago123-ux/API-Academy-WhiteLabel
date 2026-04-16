import { useEffect, useState } from 'react'
import LabLayout from '../../components/LabLayout.jsx'
import Quiz from '../../components/Quiz.jsx'
import AnatomyLesson from './lessons/AnatomyLesson.jsx'
import HeadersLesson from './lessons/HeadersLesson.jsx'
import JSONLesson from './lessons/JSONLesson.jsx'
import MethodsLesson from './lessons/MethodsLesson.jsx'
import PlaygroundLesson from './lessons/PlaygroundLesson.jsx'
import StatusLesson from './lessons/StatusLesson.jsx'
import { ALL_QUESTIONS } from './questions.js'
import { loadLabProgress, recordQuizAttempt, saveLabProgress } from '../../services/progressStore.js'
import { trackEvent } from '../../services/analytics.js'

const LESSONS = [
  { id: 'anatomy', title: 'Anatomía de un Request', icon: '🔬', desc: 'Entendé cada pieza de una petición HTTP' },
  { id: 'methods', title: 'Métodos HTTP (CRUD)', icon: '⚡', desc: 'GET, POST, PUT, DELETE en acción' },
  { id: 'status', title: 'Códigos de Estado', icon: '🚦', desc: 'Qué significan 200, 404, 500...' },
  { id: 'headers', title: 'Headers & Auth', icon: '🔐', desc: 'Autenticación y metadatos' },
  { id: 'json', title: 'JSON: El Idioma', icon: '📦', desc: 'Cómo se estructuran los datos' },
  { id: 'playground', title: 'API Playground', icon: '🎮', desc: 'Hacé requests reales a una API' },
  { id: 'quiz', title: 'Quiz Final', icon: '🏆', desc: 'Poné a prueba lo aprendido' },
]

const DEFAULT_PROGRESS = { activeLesson: 'anatomy', visited: ['anatomy'], quiz: {} }

export default function APILearningLab() {
  const [activeLesson, setActiveLesson] = useState(() => loadLabProgress('basics', DEFAULT_PROGRESS).activeLesson)
  const [visited, setVisited] = useState(() => loadLabProgress('basics', DEFAULT_PROGRESS).visited)

  useEffect(() => {
    trackEvent('lab_open', { labId: 'basics' })
  }, [])

  useEffect(() => {
    saveLabProgress('basics', { activeLesson, visited })
  }, [activeLesson, visited])

  useEffect(() => {
    trackEvent(activeLesson === 'quiz' ? 'quiz_view' : 'lesson_view', { labId: 'basics', lessonId: activeLesson })
  }, [activeLesson])

  function navigate(id) {
    setActiveLesson(id)
    setVisited((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }

  function renderLesson() {
    switch (activeLesson) {
      case 'anatomy':
        return <AnatomyLesson />
      case 'methods':
        return <MethodsLesson />
      case 'status':
        return <StatusLesson />
      case 'headers':
        return <HeadersLesson />
      case 'json':
        return <JSONLesson />
      case 'playground':
        return <PlaygroundLesson />
      case 'quiz':
        return (
          <Quiz
            questionsBank={ALL_QUESTIONS}
            questionCount={8}
            messages={{
              high: '¡Excelente! Dominás los fundamentos.',
              medium: '¡Bien! Repasá los conceptos que fallaste.',
              low: 'Necesitás repasar. Volvé a las lecciones.',
            }}
            onComplete={({ score, total, pct, wrongQuestions }) => {
              recordQuizAttempt('basics', { score, total, pct, wrongQuestions, at: Date.now() })
              trackEvent('quiz_complete', { labId: 'basics', score, total, pct })
            }}
          />
        )
      default:
        return null
    }
  }

  return (
    <LabLayout
      icon="⚡"
      title="API Learning Lab"
      titleClassName="text-xl font-black tracking-tight bg-gradient-to-r from-sky-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent"
      subtitle="Aprendé APIs desde cero con ejemplos interactivos"
      levelLabel="NIVEL 1"
      levelColor="indigo"
      progressBarClassName="accent-indigo-500"
      lessons={LESSONS}
      activeLesson={activeLesson}
      visited={visited}
      onNavigate={navigate}
    >
      {renderLesson()}
    </LabLayout>
  )
}
