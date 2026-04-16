const KEY = 'api-academy-profile:v1'

function safeParse(json) {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function loadProfile() {
  if (typeof window === 'undefined') return { displayName: '' }
  const raw = window.localStorage.getItem(KEY)
  const parsed = raw ? safeParse(raw) : null
  if (!parsed || typeof parsed !== 'object') return { displayName: '' }
  return { displayName: typeof parsed.displayName === 'string' ? parsed.displayName : '' }
}

export function saveProfile(patch) {
  if (typeof window === 'undefined') return
  const prev = loadProfile()
  const next = { ...prev, ...(patch && typeof patch === 'object' ? patch : {}) }
  window.localStorage.setItem(KEY, JSON.stringify(next))
}

