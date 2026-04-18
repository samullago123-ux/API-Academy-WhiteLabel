const KEY = 'api-academy-device-id:v1'

function uuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function getDeviceId() {
  if (typeof window === 'undefined') return 'server'
  const existing = window.localStorage.getItem(KEY)
  if (existing) return existing
  const next = uuid()
  window.localStorage.setItem(KEY, next)
  return next
}

