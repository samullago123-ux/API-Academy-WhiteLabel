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

console.info('verify-certificate started')

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const url = Deno.env.get('SUPABASE_URL')
  const anon = Deno.env.get('SUPABASE_ANON_KEY')
  if (!url || !anon) return json(500, { error: 'Missing SUPABASE_URL or SUPABASE_ANON_KEY' })

  let certificateId = ''
  try {
    const body = await req.json()
    certificateId = String(body?.certificateId ?? body?.id ?? '')
  } catch {
    certificateId = ''
  }
  if (!certificateId) {
    const u = new URL(req.url)
    certificateId = u.searchParams.get('id') ?? ''
  }

  if (!certificateId) return json(400, { error: 'certificateId is required' })

  const supabase = createClient(url, anon)
  const { data, error } = await supabase.rpc('verify_certificate', { p_certificate_id: certificateId })
  if (error) return json(500, { error: error.message })
  if (!data) return json(404, { ok: false })

  return json(200, { ok: true, data })
})

