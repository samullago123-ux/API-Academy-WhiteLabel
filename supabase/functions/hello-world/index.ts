import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

interface ReqPayload {
  name: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.info('hello-world started')

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let payload: ReqPayload | null = null
  try {
    payload = (await req.json()) as ReqPayload
  } catch {
    payload = null
  }

  const name = payload?.name ? String(payload.name) : 'World'
  const data = { message: `Hello ${name}!` }

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json', Connection: 'keep-alive' },
  })
})

