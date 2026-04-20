import { requireSupabase } from './supabaseClient.js'

function getSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !publishableKey) return null
  try {
    const origin = new URL(String(url)).origin
    return { url: origin, publishableKey: String(publishableKey) }
  } catch {
    return { url: String(url), publishableKey: String(publishableKey) }
  }
}

async function invokeRaw(functionName, body) {
  const cfg = getSupabaseConfig()
  if (!cfg) throw new Error('Supabase no está configurado.')
  const endpoint = `${cfg.url.replace(/\/+$/, '')}/functions/v1/${encodeURIComponent(functionName)}`
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: cfg.publishableKey,
      Authorization: `Bearer ${cfg.publishableKey}`,
    },
    body: JSON.stringify(body ?? {}),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const msg = data?.error || `Edge Function error (${res.status})`
    throw new Error(String(msg))
  }
  return data
}

async function invokeWithFallback(functionName, body) {
  const supabase = requireSupabase()
  try {
    const { data, error } = await supabase.functions.invoke(functionName, { body })
    if (error) throw error
    return data
  } catch {
    return invokeRaw(functionName, body)
  }
}

export async function helloWorld(name) {
  return invokeWithFallback('hello-world', { name })
}

export async function verifyCertificateEdge(certificateId) {
  return invokeWithFallback('verify-certificate', { certificateId })
}

export async function issueCertificateEdge({ certificateId, issuedAt, displayName, scores, courseVersion, signature, public: isPublic = true }) {
  return invokeWithFallback('issue-certificate', { certificateId, issuedAt, displayName, scores, courseVersion, signature, public: isPublic, baseUrl: typeof window !== 'undefined' ? window.location.origin : '' })
}

export async function syncDeviceEdge({ deviceId, profile, progress, certificateId, events }) {
  return invokeWithFallback('sync-device', { deviceId, profile, progress, certificateId, events })
}
