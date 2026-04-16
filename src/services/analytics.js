const KEY = 'api-academy-analytics:v1'
const SESSION_KEY = 'api-academy-session:v1'

function safeParse(json) {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

function uuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function getSessionId() {
  if (typeof window === 'undefined') return 'server'
  const existing = window.sessionStorage.getItem(SESSION_KEY)
  if (existing) return existing
  const next = uuid()
  window.sessionStorage.setItem(SESSION_KEY, next)
  return next
}

export function loadEvents() {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(KEY)
  const parsed = raw ? safeParse(raw) : null
  return Array.isArray(parsed) ? parsed : []
}

export function saveEvents(events) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(events))
}

export function clearEvents() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(KEY)
}

export function trackEvent(name, props = {}) {
  if (typeof window === 'undefined') return
  const events = loadEvents()
  const evt = {
    id: uuid(),
    name: String(name),
    at: Date.now(),
    sessionId: getSessionId(),
    props: props && typeof props === 'object' ? props : {},
  }
  const next = [evt, ...events].slice(0, 2000)
  saveEvents(next)
}

function dayKey(ts) {
  try {
    return new Date(ts).toISOString().slice(0, 10)
  } catch {
    return 'unknown'
  }
}

export function aggregateMetrics(events) {
  const list = Array.isArray(events) ? events : []
  const sessions = new Set()
  const perDay = {}
  const perEvent = {}
  const perLab = {}
  const searches = {}

  for (const e of list) {
    sessions.add(e?.sessionId)
    const d = dayKey(e?.at)
    perDay[d] = (perDay[d] ?? 0) + 1
    perEvent[e?.name] = (perEvent[e?.name] ?? 0) + 1

    const labId = e?.props?.labId
    if (labId) {
      perLab[labId] = perLab[labId] ?? { labId, events: 0, lessonsViewed: new Set(), quizViews: 0, quizCompletes: 0 }
      perLab[labId].events += 1
      if (e.name === 'lesson_view' && e.props?.lessonId) perLab[labId].lessonsViewed.add(e.props.lessonId)
      if (e.name === 'quiz_view') perLab[labId].quizViews += 1
      if (e.name === 'quiz_complete') perLab[labId].quizCompletes += 1
    }

    if (e?.name === 'search' && typeof e?.props?.query === 'string') {
      const q = e.props.query.trim().toLowerCase()
      if (q) searches[q] = (searches[q] ?? 0) + 1
    }
  }

  const perLabOut = Object.values(perLab).map((x) => ({
    labId: x.labId,
    events: x.events,
    lessonsViewed: x.lessonsViewed.size,
    quizViews: x.quizViews,
    quizCompletes: x.quizCompletes,
  }))

  const topSearches = Object.entries(searches)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([query, count]) => ({ query, count }))

  return {
    totalEvents: list.length,
    uniqueSessions: sessions.size,
    perDay,
    perEvent,
    perLab: perLabOut,
    topSearches,
  }
}

