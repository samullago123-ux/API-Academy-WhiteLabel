const KEY = 'api-academy-certificate:v1'

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

function toHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function sha256Hex(text) {
  if (typeof crypto === 'undefined' || !crypto.subtle) return null
  const data = new TextEncoder().encode(text)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return toHex(new Uint8Array(hash))
}

export function loadCertificate() {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(KEY)
  const parsed = raw ? safeParse(raw) : null
  return parsed && typeof parsed === 'object' ? parsed : null
}

export function saveCertificate(record) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(record))
}

export async function issueCertificate({ displayName, progress, levels, courseVersion = '1.0.0', public: isPublic = true }) {
  const issuedAt = Date.now()
  const id = uuid()
  const scores = {}

  for (const level of levels) {
    const best = progress?.[level.hash]?.quiz?.bestPct ?? 0
    const visited = Array.isArray(progress?.[level.hash]?.visited) ? progress[level.hash].visited.length : 0
    scores[level.hash] = { bestPct: best, visited, lessonCount: level.lessonCount }
  }

  const payload = {
    id,
    issuedAt,
    courseVersion,
    displayName: String(displayName ?? '').trim(),
    public: Boolean(isPublic),
    scores,
  }

  const signature = (await sha256Hex(JSON.stringify(payload))) ?? ''
  const record = { ...payload, signature }
  saveCertificate(record)
  return record
}

export function isCertificateEligible({ progress, levels, minPct = 60 }) {
  return levels.every((level) => {
    const visited = Array.isArray(progress?.[level.hash]?.visited) ? progress[level.hash].visited.length : 0
    const best = progress?.[level.hash]?.quiz?.bestPct ?? 0
    return visited >= level.lessonCount && best >= minPct
  })
}
