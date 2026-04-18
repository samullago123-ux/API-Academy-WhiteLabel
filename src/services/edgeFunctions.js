import { requireSupabase } from './supabaseClient.js'

export async function helloWorld(name) {
  const supabase = requireSupabase()
  const { data, error } = await supabase.functions.invoke('hello-world', {
    body: { name },
  })
  if (error) throw error
  return data
}

export async function verifyCertificateEdge(certificateId) {
  const supabase = requireSupabase()
  const { data, error } = await supabase.functions.invoke('verify-certificate', {
    body: { certificateId },
  })
  if (error) throw error
  return data
}

export async function issueCertificateEdge({ certificateId, issuedAt, displayName, scores, courseVersion, signature, public: isPublic = true }) {
  const supabase = requireSupabase()
  const { data, error } = await supabase.functions.invoke('issue-certificate', {
    body: { certificateId, issuedAt, displayName, scores, courseVersion, signature, public: isPublic, baseUrl: typeof window !== 'undefined' ? window.location.origin : '' },
  })
  if (error) throw error
  return data
}

export async function syncDeviceEdge({ deviceId, profile, progress, certificateId, events }) {
  const supabase = requireSupabase()
  const { data, error } = await supabase.functions.invoke('sync-device', {
    body: { deviceId, profile, progress, certificateId, events },
  })
  if (error) throw error
  return data
}
