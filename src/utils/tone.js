export function statusTone(code) {
  if (code >= 200 && code < 300) return { text: 'text-emerald-400', border: 'border-emerald-400/40', bg: 'bg-emerald-500/10' }
  if (code >= 300 && code < 400) return { text: 'text-amber-400', border: 'border-amber-400/40', bg: 'bg-amber-500/10' }
  if (code >= 400 && code < 500) return { text: 'text-orange-400', border: 'border-orange-400/40', bg: 'bg-orange-500/10' }
  if (code >= 500) return { text: 'text-red-400', border: 'border-red-400/40', bg: 'bg-red-500/10' }
  return { text: 'text-zinc-400', border: 'border-zinc-700', bg: 'bg-zinc-900' }
}

export function methodTone(method) {
  const tones = {
    GET: { text: 'text-emerald-300', border: 'border-emerald-400/60', bg: 'bg-emerald-500/10' },
    POST: { text: 'text-sky-300', border: 'border-sky-400/60', bg: 'bg-sky-500/10' },
    PUT: { text: 'text-amber-300', border: 'border-amber-400/60', bg: 'bg-amber-500/10' },
    PATCH: { text: 'text-violet-300', border: 'border-violet-400/60', bg: 'bg-violet-500/10' },
    DELETE: { text: 'text-red-300', border: 'border-red-400/60', bg: 'bg-red-500/10' },
  }
  return tones[method] ?? { text: 'text-zinc-300', border: 'border-zinc-700', bg: 'bg-zinc-900' }
}

export function toneFromHex(hex) {
  const normalized = String(hex).toLowerCase()
  const tones = {
    '#6366f1': { text: 'text-indigo-300', border: 'border-indigo-400/60', bg: 'bg-indigo-500/10' },
    '#3b82f6': { text: 'text-sky-300', border: 'border-sky-400/60', bg: 'bg-sky-500/10' },
    '#60a5fa': { text: 'text-sky-300', border: 'border-sky-400/60', bg: 'bg-sky-500/10' },
    '#a78bfa': { text: 'text-violet-300', border: 'border-violet-400/60', bg: 'bg-violet-500/10' },
    '#8b5cf6': { text: 'text-violet-300', border: 'border-violet-400/60', bg: 'bg-violet-500/10' },
    '#f59e0b': { text: 'text-amber-300', border: 'border-amber-400/60', bg: 'bg-amber-500/10' },
    '#eab308': { text: 'text-amber-300', border: 'border-amber-400/60', bg: 'bg-amber-500/10' },
    '#10b981': { text: 'text-emerald-300', border: 'border-emerald-400/60', bg: 'bg-emerald-500/10' },
    '#ef4444': { text: 'text-red-300', border: 'border-red-400/60', bg: 'bg-red-500/10' },
    '#f472b6': { text: 'text-pink-300', border: 'border-pink-400/60', bg: 'bg-pink-500/10' },
    '#06b6d4': { text: 'text-cyan-300', border: 'border-cyan-400/60', bg: 'bg-cyan-500/10' },
  }
  return tones[normalized] ?? { text: 'text-zinc-300', border: 'border-zinc-700', bg: 'bg-zinc-900' }
}
