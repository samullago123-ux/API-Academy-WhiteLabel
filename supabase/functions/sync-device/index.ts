import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function clampString(v: unknown, max = 10_000) {
  const s = String(v ?? '')
  return s.length > max ? s.slice(0, max) : s
}

console.info('sync-device started')

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const url = Deno.env.get('SUPABASE_URL')
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceRole) return json(500, { error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' })

  let body: any = null
  try {
    body = await req.json()
  } catch {
    body = null
  }

  const deviceId = clampString(body?.deviceId, 120).trim()
  if (!deviceId) return json(400, { error: 'deviceId is required' })

  const profile = body?.profile && typeof body.profile === 'object' ? body.profile : {}
  const progress = body?.progress && typeof body.progress === 'object' ? body.progress : {}
  const certificateId = clampString(body?.certificateId, 120).trim() || null
  const events = Array.isArray(body?.events) ? body.events.slice(0, 500) : []

  const supabase = createClient(url, serviceRole)

  const { error: stateErr } = await supabase.from('device_state').upsert(
    { device_id: deviceId, profile, progress, certificate_id: certificateId, updated_at: new Date().toISOString() },
    { onConflict: 'device_id' },
  )
  if (stateErr) return json(500, { error: stateErr.message })

  if (events.length) {
    const payload = events.map((e: any) => ({
      device_id: deviceId,
      event_id: clampString(e?.id, 80),
      name: clampString(e?.name, 80),
      at: Number(e?.at ?? Date.now()),
      session_id: clampString(e?.sessionId, 120) || null,
      props: e?.props && typeof e.props === 'object' ? e.props : {},
    }))
    const { error: evErr } = await supabase.from('device_events').upsert(payload, { onConflict: 'device_id,event_id' })
    if (evErr) return json(500, { error: evErr.message })
  }

  return json(200, { ok: true })
})

