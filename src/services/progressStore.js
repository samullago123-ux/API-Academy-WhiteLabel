const KEY = 'api-academy-progress:v1'

function safeParse(json) {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function loadAllProgress() {
  if (typeof window === 'undefined') return {}
  const raw = window.localStorage.getItem(KEY)
  const parsed = raw ? safeParse(raw) : null
  return parsed && typeof parsed === 'object' ? parsed : {}
}

export function loadLabProgress(labId, defaults) {
  const all = loadAllProgress()
  const existing = all?.[labId]
  if (!existing || typeof existing !== 'object') return { ...defaults }
  return {
    ...defaults,
    ...existing,
    visited: Array.isArray(existing.visited) ? existing.visited : defaults.visited,
    quiz: { ...(defaults.quiz ?? {}), ...(existing.quiz ?? {}) },
  }
}

export function saveLabProgress(labId, patch) {
  if (typeof window === 'undefined') return
  const all = loadAllProgress()
  const prev = all?.[labId] && typeof all[labId] === 'object' ? all[labId] : {}
  const next = {
    ...prev,
    ...patch,
    visited: Array.isArray(patch?.visited) ? patch.visited : prev.visited,
    quiz: { ...(prev.quiz ?? {}), ...(patch.quiz ?? {}) },
  }
  const merged = { ...all, [labId]: next }
  window.localStorage.setItem(KEY, JSON.stringify(merged))
}

export function recordQuizAttempt(labId, attempt, maxItems = 20) {
  const current = loadLabProgress(labId, { quiz: { history: [] } })
  const history = Array.isArray(current?.quiz?.history) ? current.quiz.history : []
  const nextAttempt = {
    score: Number(attempt?.score ?? 0),
    total: Number(attempt?.total ?? 0),
    pct: Number(attempt?.pct ?? 0),
    at: Number(attempt?.at ?? Date.now()),
  }
  const nextHistory = [nextAttempt, ...history].slice(0, maxItems)
  const bestPct = Math.max(current?.quiz?.bestPct ?? 0, nextAttempt.pct)

  saveLabProgress(labId, {
    quiz: {
      lastPct: nextAttempt.pct,
      bestPct,
      lastAt: nextAttempt.at,
      history: nextHistory,
    },
  })
}
