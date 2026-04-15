import { useState } from 'react'
import { cn } from '../../../utils/cn.js'
import { toneFromHex } from '../../../utils/tone.js'

export default function GatewayLesson() {
  const [activeFeature, setActiveFeature] = useState(null)

  const features = [
    {
      id: 'routing',
      name: 'Routing',
      icon: '🔀',
      color: '#3b82f6',
      desc: 'Redirige /users → User Service, /orders → Order Service, /payments → Payment Service. Un solo punto de entrada para múltiples microservicios.',
      example: `# nginx.conf / Kong / AWS API Gateway
location /api/users    → http://user-service:3001
location /api/orders   → http://order-service:3002  
location /api/payments → http://payment-service:3003`,
    },
    {
      id: 'auth',
      name: 'Auth centralizado',
      icon: '🔐',
      color: '#10b981',
      desc: 'Verifica tokens UNA vez en el gateway, no en cada microservicio. Si el token es inválido, ni siquiera llega al backend.',
      example: `# Antes: cada servicio verifica JWT
User Service   → verifyJWT() ← duplicado
Order Service  → verifyJWT() ← duplicado

# Después: el gateway lo hace
Gateway → verifyJWT() → forward(authenticated_request)`,
    },
    {
      id: 'ratelimit',
      name: 'Rate Limiting',
      icon: '🚦',
      color: '#f59e0b',
      desc: 'Controla el tráfico antes de que llegue a tus servicios. Puede ser por usuario, por IP, por plan, por endpoint.',
      example: `# Límites por plan
Plan Free:       100 req/hora
Plan Pro:        1000 req/hora
Plan Enterprise: 10000 req/hora

# Header: X-RateLimit-Remaining: 847`,
    },
    {
      id: 'transform',
      name: 'Transformación',
      icon: '🔄',
      color: '#a78bfa',
      desc: 'Modifica requests/responses en tránsito. Agrega headers, transforma formatos, agrega metadata, combina respuestas de múltiples servicios.',
      example: `# Request entrante (API pública)
POST /api/v2/orders { items: [...] }

# Gateway transforma para el servicio interno
POST /internal/orders { 
  items: [...],
  api_version: "v2",
  client_id: "extracted_from_token",
  timestamp: "auto_added"
}`,
    },
    {
      id: 'logging',
      name: 'Observabilidad',
      icon: '📊',
      color: '#f472b6',
      desc: 'Logging centralizado, métricas, tracing distribuido. Cada request tiene un X-Request-ID que viaja por todos los servicios.',
      example: `X-Request-ID: req_abc123

Gateway log:  [req_abc123] GET /users → 200 (45ms)
User Service: [req_abc123] DB query → 12ms
Cache:        [req_abc123] HIT redis → 2ms

# Dashboard: latencia p95, error rate, throughput`,
    },
  ]

  return (
    <div>
      <p className="mb-5 text-sm leading-relaxed text-zinc-400">
        Un API Gateway es la <strong className="text-zinc-100">puerta de entrada</strong> a tu sistema de microservicios. Centraliza auth, rate limiting, routing y logging en un solo punto. Es lo que n8n hace a nivel de orquestación.
      </p>

      <div className="mb-5 grid gap-2">
        {features.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFeature(activeFeature === f.id ? null : f.id)}
            className={cn(
              'rounded-xl border px-4 py-4 text-left transition-colors',
              activeFeature === f.id ? cn(toneFromHex(f.color).bg, toneFromHex(f.color).border) : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800',
            )}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{f.icon}</span>
              <span className={cn('text-sm font-bold', toneFromHex(f.color).text)}>{f.name}</span>
            </div>
            {activeFeature === f.id && (
              <div className="mt-3">
                <div className="mb-3 text-sm leading-relaxed text-zinc-300">{f.desc}</div>
                <pre className="m-0 whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-xs leading-relaxed text-zinc-400">
                  {f.example}
                </pre>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-3 text-xs font-bold tracking-widest text-amber-400">🏗️ GATEWAYS POPULARES</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            { name: 'Kong', desc: 'Open source, plugin-based, enterprise-ready' },
            { name: 'AWS API Gateway', desc: 'Serverless, integra con Lambda' },
            { name: 'NGINX', desc: 'Reverse proxy + load balancer clásico' },
            { name: 'n8n (orquestador)', desc: 'No es gateway puro, pero coordina múltiples APIs en flujos' },
          ].map((g) => (
            <div key={g.name} className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
              <div className="text-sm font-bold text-indigo-300">{g.name}</div>
              <div className="mt-1 text-xs text-zinc-500">{g.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

