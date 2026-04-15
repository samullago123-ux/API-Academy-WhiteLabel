import { beforeEach, describe, expect, it } from 'vitest'
import { loadLabProgress, recordQuizAttempt, saveLabProgress } from './progressStore.js'

describe('progressStore', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('guarda y carga progreso base por nivel', () => {
    saveLabProgress('basics', { activeLesson: 'json', visited: ['anatomy', 'json'] })
    const data = loadLabProgress('basics', { activeLesson: 'anatomy', visited: ['anatomy'], quiz: {} })

    expect(data.activeLesson).toBe('json')
    expect(data.visited).toEqual(['anatomy', 'json'])
  })

  it('registra historial de quiz y calcula bestPct', () => {
    recordQuizAttempt('advanced', { score: 8, total: 10, pct: 80, at: 1 })
    recordQuizAttempt('advanced', { score: 6, total: 10, pct: 60, at: 2 })

    const data = loadLabProgress('advanced', { activeLesson: 'oauth', visited: ['oauth'], quiz: {} })
    expect(data.quiz.bestPct).toBe(80)
    expect(data.quiz.lastPct).toBe(60)
    expect(data.quiz.history).toHaveLength(2)
    expect(data.quiz.history[0].pct).toBe(60)
  })
})
