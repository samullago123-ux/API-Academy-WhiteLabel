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

function uuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function ipFromRequest(req: Request) {
  const xf = req.headers.get('x-forwarded-for')
  if (xf) return xf.split(',')[0].trim()
  const xr = req.headers.get('x-real-ip')
  if (xr) return xr.trim()
  return 'unknown'
}

console.info('issue-certificate started')

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

  const displayName = String(body?.displayName ?? '').trim()
  const courseVersion = String(body?.courseVersion ?? '1.0.0').trim() || '1.0.0'
  const publicFlag = body?.public === false ? false : true
  const scores = body?.scores && typeof body.scores === 'object' ? body.scores : {}
  const signature = String(body?.signature ?? '').trim()
  const providedId = String(body?.certificateId ?? '').trim()
  const providedIssuedAt = Number(body?.issuedAt ?? 0)
  const baseUrl = String(body?.baseUrl ?? '').trim()

  if (!displayName || displayName.length < 2 || displayName.length > 80) {
    return json(400, { error: 'displayName inválido' })
  }

  const supabase = createClient(url, serviceRole)

  const ip = ipFromRequest(req)
  const now = Date.now()
  const windowMs = 60_000
  const windowStart = now - (now % windowMs)

  const { data: rl, error: rlErr } = await supabase
    .from('certificate_rate_limits')
    .select('ip,window_start,count')
    .eq('ip', ip)
    .maybeSingle()

  if (rlErr) return json(500, { error: rlErr.message })

  if (rl && rl.window_start === windowStart && rl.count >= 10) {
    return json(429, { error: 'Rate limit' })
  }

  const nextCount = rl && rl.window_start === windowStart ? rl.count + 1 : 1
  const { error: upErr } = await supabase
    .from('certificate_rate_limits')
    .upsert({ ip, window_start: windowStart, count: nextCount }, { onConflict: 'ip' })
  if (upErr) return json(500, { error: upErr.message })

  const certificateId = providedId && providedId.length <= 120 ? providedId : uuid()
  const issuedAt = Number.isFinite(providedIssuedAt) && providedIssuedAt > 0 ? providedIssuedAt : now
  const shareUrl = baseUrl ? `${baseUrl.replace(/\/+$/, '')}/?verify=${encodeURIComponent(certificateId)}` : null

  const { error } = await supabase.from('public_certificates').upsert({
    certificate_id: certificateId,
    public: publicFlag,
    issued_at: issuedAt,
    display_name: displayName,
    course_version: courseVersion,
    scores,
    signature,
    share_url: shareUrl,
  }, { onConflict: 'certificate_id' })

  if (error) return json(500, { error: error.message })

  return json(200, {
    ok: true,
    certificate: {
      id: certificateId,
      issuedAt,
      courseVersion,
      displayName,
      public: publicFlag,
      scores,
      signature,
    },
  })
})
