import { loadEvents, saveEvents } from './analytics.js'
import { loadAllProgress, saveAllProgress } from './progressStore.js'
import { loadCertificate, saveCertificate } from './certificateStore.js'
import { loadProfile, saveProfile } from './profileStore.js'
import { requireSupabase } from './supabaseClient.js'

const TABLES = {
  profile: 'profiles',
  progress: 'progress',
  certificate: 'certificates',
  events: 'events',
}

export async function signInWithEmailOtp(email) {
  const supabase = requireSupabase()
  const emailRedirectTo = typeof window !== 'undefined' ? `${window.location.origin}/` : undefined
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo },
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const supabase = requireSupabase()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const supabase = requireSupabase()
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export async function pushAllToSupabase() {
  const supabase = requireSupabase()
  const session = await getSession()
  if (!session?.user?.id) throw new Error('No hay sesión activa. Iniciá sesión con Supabase.')
  const userId = session.user.id

  const profile = loadProfile()
  const progress = loadAllProgress()
  const certificate = loadCertificate()
  const events = loadEvents()

  const profileRes = await supabase.from(TABLES.profile).upsert(
    { user_id: userId, display_name: profile.displayName ?? '' },
    { onConflict: 'user_id' },
  )
  if (profileRes.error) throw profileRes.error

  const progressRes = await supabase.from(TABLES.progress).upsert(
    { user_id: userId, data: progress },
    { onConflict: 'user_id' },
  )
  if (progressRes.error) throw progressRes.error

  if (certificate) {
    const certRes = await supabase.from(TABLES.certificate).upsert(
      { user_id: userId, certificate_id: certificate.id, data: certificate },
      { onConflict: 'user_id' },
    )
    if (certRes.error) throw certRes.error
  }

  if (events.length) {
    const payload = events.slice(0, 500).map((e) => ({
      user_id: userId,
      event_id: e.id,
      name: e.name,
      at: e.at,
      session_id: e.sessionId,
      props: e.props ?? {},
    }))
    const eventsRes = await supabase.from(TABLES.events).upsert(payload, { onConflict: 'user_id,event_id' })
    if (eventsRes.error) throw eventsRes.error
  }
}

export async function pullEventsFromSupabase(limit = 500) {
  const supabase = requireSupabase()
  const session = await getSession()
  if (!session?.user?.id) throw new Error('No hay sesión activa. Iniciá sesión con Supabase.')
  const userId = session.user.id

  const { data, error } = await supabase
    .from(TABLES.events)
    .select('event_id,name,at,session_id,props')
    .eq('user_id', userId)
    .order('at', { ascending: false })
    .limit(limit)

  if (error) throw error
  const mapped = (data ?? []).map((r) => ({
    id: r.event_id,
    name: r.name,
    at: r.at,
    sessionId: r.session_id,
    props: r.props ?? {},
  }))
  saveEvents(mapped)
}

export async function pullAllFromSupabase() {
  const supabase = requireSupabase()
  const session = await getSession()
  if (!session?.user?.id) throw new Error('No hay sesión activa. Iniciá sesión con Supabase.')
  const userId = session.user.id

  const profileRes = await supabase.from(TABLES.profile).select('display_name').eq('user_id', userId).maybeSingle()
  if (profileRes.error) throw profileRes.error
  if (profileRes.data?.display_name) saveProfile({ displayName: profileRes.data.display_name })

  const progressRes = await supabase.from(TABLES.progress).select('data').eq('user_id', userId).maybeSingle()
  if (progressRes.error) throw progressRes.error
  if (progressRes.data?.data && typeof progressRes.data.data === 'object') saveAllProgress(progressRes.data.data)

  const certRes = await supabase.from(TABLES.certificate).select('data').eq('user_id', userId).maybeSingle()
  if (certRes.error) throw certRes.error
  if (certRes.data?.data && typeof certRes.data.data === 'object') saveCertificate(certRes.data.data)
}
