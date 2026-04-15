import { useState } from 'react'
import { cn } from '../../../utils/cn.js'

export default function HeadersLesson() {
  const [authType, setAuthType] = useState('api-key')

  const headerExamples = [
    { name: 'Content-Type', value: 'application/json', desc: 'Le dice al servidor qué formato tienen los datos que estás enviando.' },
    { name: 'Accept', value: 'application/json', desc: 'Le dice al servidor en qué formato querés la respuesta.' },
    { name: 'Authorization', value: 'Bearer eyJhbGci...', desc: 'Tu credencial de acceso. El servidor verifica que tenés permiso.' },
    { name: 'X-API-Key', value: 'sk-abc123xyz', desc: 'Alternativa a Authorization. Clave única que identifica tu app.' },
    { name: 'User-Agent', value: 'WhitelabelBot/1.0', desc: 'Identifica quién hace la petición. Útil para debugging.' },
    { name: 'X-Request-ID', value: 'req_abc123', desc: 'ID único para rastrear esta petición específica en logs.' },
  ]

  const authTypes = [
    {
      id: 'api-key',
      name: 'API Key',
      icon: '🔑',
      pros: 'Simple, rápido de implementar',
      cons: 'Menos seguro, no expira automáticamente',
      example: `curl -H "X-API-Key: sk-abc123" \\
  https://api.ejemplo.com/datos`,
      useCase: 'APIs internas, servicios simples, prototipos',
    },
    {
      id: 'bearer',
      name: 'Bearer Token',
      icon: '🎫',
      pros: 'Estándar, puede incluir permisos (JWT), expira',
      cons: 'Más complejo, necesita flujo de login',
      example: `curl -H "Authorization: Bearer eyJhbG..." \\
  https://api.ejemplo.com/datos`,
      useCase: 'Apps con usuarios, OAuth 2.0, APIs públicas',
    },
    {
      id: 'basic',
      name: 'Basic Auth',
      icon: '👤',
      pros: 'Muy simple, soportado en todos lados',
      cons: 'Credenciales en texto (base64), DEBE usar HTTPS',
      example: `curl -u "usuario:password" \\
  https://api.ejemplo.com/datos

Equivale a:
Authorization: Basic dXN1YXJpbzpwYXNz`,
      useCase: 'Servicios legacy, integraciones básicas',
    },
  ]

  const activeAuth = authTypes.find((a) => a.id === authType)

  return (
    <div>
      <p className="mb-5 text-sm leading-relaxed text-zinc-400">
        Los headers son <strong className="text-zinc-100">metadatos</strong> de la petición. Viajan "fuera" del body, como el remitente y sellos en un sobre.
      </p>

      <div className="mb-7 grid gap-2">
        {headerExamples.map((h) => (
          <div key={h.name} className="flex gap-4 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
            <div className="min-w-40">
              <div className="font-mono text-sm font-bold text-violet-300">{h.name}</div>
              <div className="mt-1 font-mono text-xs text-zinc-600">{h.value}</div>
            </div>
            <div className="text-sm leading-relaxed text-zinc-500">{h.desc}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 text-xs font-bold tracking-widest text-amber-400">🔐 TIPOS DE AUTENTICACIÓN</div>

      <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {authTypes.map((a) => (
          <button
            key={a.id}
            onClick={() => setAuthType(a.id)}
            className={cn(
              'rounded-xl border-2 px-4 py-4 text-center transition-colors',
              authType === a.id ? 'border-indigo-400/70 bg-zinc-900' : 'border-zinc-800 hover:bg-zinc-900',
            )}
          >
            <div className="text-2xl">{a.icon}</div>
            <div className={cn('mt-1 text-sm font-bold', authType === a.id ? 'text-zinc-100' : 'text-zinc-500')}>{a.name}</div>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xl">{activeAuth.icon}</span>
          <span className="text-base font-bold text-zinc-100">{activeAuth.name}</span>
        </div>
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3">
            <div className="mb-1 text-[11px] font-bold text-emerald-400">✅ PROS</div>
            <div className="text-sm text-zinc-300">{activeAuth.pros}</div>
          </div>
          <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3">
            <div className="mb-1 text-[11px] font-bold text-red-400">⚠️ CONTRAS</div>
            <div className="text-sm text-zinc-300">{activeAuth.cons}</div>
          </div>
        </div>
        <div className="mb-3 whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 font-mono text-xs leading-relaxed text-zinc-300">
          {activeAuth.example}
        </div>
        <div className="text-xs text-zinc-500">
          <strong className="text-zinc-400">Caso de uso:</strong> {activeAuth.useCase}
        </div>
      </div>
    </div>
  )
}
