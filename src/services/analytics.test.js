import { beforeEach, describe, expect, it } from 'vitest'
import { aggregateMetrics, clearEvents, loadEvents, trackEvent } from './analytics.js'

describe('analytics', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    clearEvents()
  })

  it('trackEvent guarda eventos y aggregateMetrics agrega conteos', () => {
    trackEvent('app_open')
    trackEvent('lesson_view', { labId: 'basics', lessonId: 'anatomy' })
    trackEvent('quiz_view', { labId: 'basics' })
    trackEvent('quiz_complete', { labId: 'basics', score: 7, total: 10, pct: 70 })
    trackEvent('search', { query: 'OAuth' })

    const events = loadEvents()
    const metrics = aggregateMetrics(events)

    expect(metrics.totalEvents).toBe(5)
    expect(metrics.uniqueSessions).toBe(1)
    expect(metrics.perEvent.app_open).toBe(1)
    expect(metrics.perEvent.quiz_complete).toBe(1)
    expect(metrics.perLab.find((x) => x.labId === 'basics')?.lessonsViewed).toBe(1)
    expect(metrics.topSearches[0].query).toBe('oauth')
  })
})

