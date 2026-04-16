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

