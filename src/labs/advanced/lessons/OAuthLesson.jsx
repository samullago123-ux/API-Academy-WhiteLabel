import { useEffect, useRef, useState } from 'react'
import { cn } from '../../../utils/cn.js'
import { toneFromHex } from '../../../utils/tone.js'

export default function OAuthLesson() {
  const [activeFlow, setActiveFlow] = useState('auth_code')
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const timerRef = useRef(null)

  const flows = {
    auth_code: {
      name: 'Authorization Code',
      icon: '🌐',
      when: 'Apps web con backend (la más segura)',
      realWorld: 'Login con Google en tu app, Chatwoot conectándose a WhatsApp API',
      steps: [
        { actor: 'Tu App', action: 'Redirige al usuario al Authorization Server', detail: 'GET /authorize?response_type=code&client_id=XXX&redirect_uri=https://tuapp.com/callback&scope=read+write', color: '#3b82f6' },
        { actor: 'Usuario', action: 'Se autentica y autoriza los permisos', detail: "El usuario ve: '¿Permitir que TuApp acceda a tu perfil y contactos?'", color: '#a78bfa' },
        { actor: 'Auth Server', action: 'Redirige de vuelta con un código temporal', detail: '302 Redirect → https://tuapp.com/callback?code=abc123xyz (este código expira en ~60 segundos)', color: '#f59e0b' },
        { actor: 'Tu Backend', action: 'Intercambia el código por tokens', detail: "POST /token { grant_type: 'authorization_code', code: 'abc123xyz', client_secret: 'SECRET' }", color: '#10b981' },
        { actor: 'Auth Server', action: 'Devuelve access_token + refresh_token', detail: "{ access_token: 'eyJ...', refresh_token: 'dGhpc...', expires_in: 3600, token_type: 'Bearer' }", color: '#f472b6' },
        { actor: 'Tu Backend', action: 'Usa el token para llamar a la API protegida', detail: "GET /api/user -H 'Authorization: Bearer eyJ...' → { name: 'Daniel', email: '...' }", color: '#06b6d4' },
      ],
    },
    client_creds: {
      name: 'Client Credentials',
      icon: '🤖',
      when: 'Máquina a máquina (sin usuario involucrado)',
      realWorld: 'n8n conectándose a APIs, cron jobs, microservicios internos',
      steps: [
        { actor: 'Tu Servidor', action: 'Solicita token directamente con sus credenciales', detail: "POST /token { grant_type: 'client_credentials', client_id: 'XXX', client_secret: 'YYY', scope: 'read' }", color: '#3b82f6' },
        { actor: 'Auth Server', action: 'Valida las credenciales y devuelve un token', detail: "{ access_token: 'eyJ...', expires_in: 3600, token_type: 'Bearer' } (NO hay refresh_token)", color: '#10b981' },
        { actor: 'Tu Servidor', action: 'Usa el token para llamar la API', detail: "GET /api/data -H 'Authorization: Bearer eyJ...'", color: '#f59e0b' },
      ],
    },
    pkce: {
      name: 'Auth Code + PKCE',
      icon: '📱',
      when: 'SPAs y apps móviles (no pueden guardar secrets)',
      realWorld: 'App React sin backend, app móvil nativa',
      steps: [
        { actor: 'Tu App', action: 'Genera un code_verifier aleatorio y su code_challenge', detail: 'code_verifier = random(43-128 chars)\ncode_challenge = BASE64URL(SHA256(code_verifier))', color: '#a78bfa' },
        { actor: 'Tu App', action: 'Redirige al usuario con el challenge', detail: 'GET /authorize?response_type=code&code_challenge=XXXXX&code_challenge_method=S256&client_id=...', color: '#3b82f6' },
        { actor: 'Usuario', action: 'Se autentica y autoriza', detail: 'El Auth Server guarda el code_challenge asociado al código', color: '#f59e0b' },
        { actor: 'Auth Server', action: 'Devuelve código temporal', detail: 'Redirect → tuapp://callback?code=abc123', color: '#f472b6' },
        { actor: 'Tu App', action: 'Intercambia código + code_verifier por token', detail: "POST /token { code: 'abc123', code_verifier: 'el_original' } — el server verifica SHA256(verifier) === challenge", color: '#10b981' },
        { actor: 'Auth Server', action: 'Si la prueba coincide, devuelve tokens', detail: "{ access_token: '...', refresh_token: '...' } — seguro porque nadie más tiene el verifier original", color: '#06b6d4' },
      ],
    },
  }

  const activeFlowData = flows[activeFlow]

  useEffect(() => () => clearInterval(timerRef.current), [])

  function playAnimation() {
    setStep(0)
    setPlaying(true)
    let s = 0
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      s++
      if (s >= activeFlowData.steps.length) {
        clearInterval(timerRef.current)
        setPlaying(false)
        setStep(activeFlowData.steps.length - 1)
      } else {
        setStep(s)
      }
    }, 2200)
  }

  useEffect(() => {
    setStep(0)
    setPlaying(false)
    clearInterval(timerRef.current)
  }, [activeFlow])

  return (
    <div>
      <p className="mb-5 text-sm leading-relaxed text-zinc-400">
        OAuth 2.0 no es "un token". Es un <strong className="text-zinc-100">protocolo de delegación</strong> — le das permiso a una app para actuar en tu nombre sin darle tu contraseña. Hay 3 flujos principales según el contexto.
      </p>

      <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {Object.entries(flows).map(([key, f]) => (
          <button
            key={key}
            onClick={() => setActiveFlow(key)}
            className={cn(
              'rounded-xl border-2 px-4 py-4 text-center transition-colors',
              activeFlow === key ? 'border-indigo-400/70 bg-zinc-900' : 'border-zinc-800 hover:bg-zinc-900',
            )}
          >
            <div className="text-2xl">{f.icon}</div>
            <div className={cn('mt-1 text-xs font-bold', activeFlow === key ? 'text-zinc-100' : 'text-zinc-500')}>{f.name}</div>
            <div className="mt-1 text-[10px] text-zinc-600">{f.when}</div>
          </button>
        ))}
      </div>

      <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="text-xs text-zinc-400">
            <strong className="text-zinc-100">Caso real:</strong> {activeFlowData.realWorld}
          </div>
          <button
            onClick={playAnimation}
            disabled={playing}
            className={cn(
              'inline-flex h-9 items-center justify-center rounded-xl px-4 text-xs font-bold text-white transition-colors',
              playing ? 'cursor-not-allowed bg-zinc-800 text-zinc-500' : 'bg-indigo-500 hover:bg-indigo-400',
            )}
          >
            {playing ? '⏳ Reproduciendo...' : '▶ Animar Flujo'}
          </button>
        </div>

        <div className="grid gap-2">
          {activeFlowData.steps.map((s, i) => (
            <div
              key={i}
              onClick={() => {
                setStep(i)
                setPlaying(false)
                clearInterval(timerRef.current)
              }}
              className={cn(
                'cursor-pointer rounded-xl border px-4 py-4 transition-all duration-300',
                i <= step ? cn(toneFromHex(s.color).bg, toneFromHex(s.color).border) : 'border-zinc-800 bg-zinc-900',
                i <= step ? 'opacity-100' : 'opacity-40',
                i === step && playing ? 'scale-[1.01]' : 'scale-100',
              )}
            >
              <div className="mb-2 flex items-center gap-3">
                <span
                  className={cn(
                    'rounded-md px-2 py-1 font-mono text-[11px] font-extrabold tracking-wider',
                    toneFromHex(s.color).bg,
                    toneFromHex(s.color).text,
                  )}
                >
                  PASO {i + 1}
                </span>
                <span className={cn('text-sm font-bold', toneFromHex(s.color).text)}>{s.actor}</span>
              </div>
              <div className="mb-2 text-sm font-semibold text-zinc-100">{s.action}</div>
              {i <= step && (
                <div className="mt-2 whitespace-pre-wrap break-all rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs leading-relaxed text-zinc-300">
                  {s.detail}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-3 text-xs font-bold tracking-widest text-amber-400">🔑 CONCEPTOS CLAVE</div>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { term: 'Access Token', def: 'Credencial de corta vida (~1h) para acceder a recursos. Es como un ticket de cine.' },
            { term: 'Refresh Token', def: 'Credencial de larga vida para obtener nuevos access tokens sin re-autenticar.' },
            { term: 'Scope', def: "Permisos granulares: 'read:users write:messages'. Principio de mínimo privilegio." },
            { term: 'PKCE', def: 'Proof Key for Code Exchange. Protege contra interceptación del código en apps sin backend.' },
          ].map((c) => (
            <div key={c.term} className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
              <div className="mb-1 font-mono text-sm font-bold text-indigo-300">{c.term}</div>
              <div className="text-sm leading-relaxed text-zinc-400">{c.def}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

