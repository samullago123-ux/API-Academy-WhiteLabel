import { useState } from 'react'
import { cn } from '../../../utils/cn.js'
import { toneFromHex } from '../../../utils/tone.js'

export default function RealWorldLesson() {
  const [activeLayer, setActiveLayer] = useState(null)

  const layers = [
    { id: 'client', name: 'Capa Cliente', icon: '📱', color: '#3b82f6',
      tech: ['React / Next.js', 'App móvil (Flutter)', 'WhatsApp (Meta API)', 'n8n webhooks'],
      decisions: 'Acá se decide: ¿SPA o SSR? ¿App nativa o PWA? ¿WhatsApp como canal? Cada cliente consume la API de forma distinta — por eso existen field selection y BFF (Backend for Frontend).',
    },
    { id: 'gateway', name: 'API Gateway', icon: '🏗️', color: '#10b981',
      tech: ['Kong / NGINX / Traefik', 'Rate Limiting por plan', 'JWT validation', 'Request routing', 'CORS headers'],
      decisions: 'Un solo punto de entrada. Acá centralizás auth, rate limiting, logging y routing. Cada request pasa por acá ANTES de llegar a cualquier servicio.',
    },
    { id: 'services', name: 'Microservicios', icon: '⚡', color: '#f59e0b',
      tech: ['User Service (REST)', 'Order Service (REST)', 'Chat Service (WebSockets)', 'AI Agent Service (gRPC)', 'Notification Service (Event-driven)'],
      decisions: 'Cada servicio tiene su propia DB, su propio deploy, y se comunica vía REST, eventos, o gRPC según la necesidad. El secreto: cada servicio hace UNA cosa bien.',
    },
    { id: 'data', name: 'Capa de Datos', icon: '🗄️', color: '#a78bfa',
      tech: ['PostgreSQL (transaccional)', 'Redis (cache + sessions)', 'S3/MinIO (archivos)', 'Elasticsearch (búsqueda)', 'Event Store (auditoría)'],
      decisions: 'Polyglot persistence: cada tipo de dato va a la base que mejor lo maneja. No todo va a PostgreSQL. Cache en Redis para hot data, S3 para archivos, ES para búsqueda full-text.',
    },
    { id: 'infra', name: 'Infraestructura', icon: '☁️', color: '#f472b6',
      tech: ['Docker + Docker Swarm / K8s', 'Cloudflare (CDN + DNS)', 'GitHub Actions (CI/CD)', 'Grafana + Prometheus (observabilidad)', 'Sentry (error tracking)'],
      decisions: 'Containers para todo. CI/CD en cada push. Monitoring con alertas. La infraestructura es código: Docker Compose en dev, Swarm/K8s en producción.',
    },
  ]

  return (
    <div>
      <p className="mb-5 text-sm leading-relaxed text-zinc-400">
        Todo lo que aprendiste en los 3 niveles se conecta acá. Así se ve un{' '}
        <strong className="text-zinc-100">sistema real en producción</strong> — capa por capa, decisión por decisión.
      </p>

      <div className="grid gap-2">
        {layers.map((l) => (
          <button
            key={l.id}
            onClick={() => setActiveLayer(activeLayer === l.id ? null : l.id)}
            className={cn(
              'rounded-xl border px-5 text-left transition-colors',
              activeLayer === l.id ? cn(toneFromHex(l.color).bg, toneFromHex(l.color).border, 'py-5') : 'border-zinc-800 bg-zinc-900 py-4 hover:bg-zinc-800',
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">{l.icon}</span>
                <span className={cn('text-sm font-bold', toneFromHex(l.color).text)}>{l.name}</span>
              </div>
              <span className="text-sm text-zinc-700">{activeLayer === l.id ? '▾' : '▸'}</span>
            </div>

            {activeLayer === l.id && (
              <div className="mt-4">
                <div className="mb-4 flex flex-wrap gap-2">
                  {l.tech.map((t, j) => (
                    <span
                      key={j}
                      className={cn(
                        'rounded-lg border px-3 py-1 font-mono text-xs font-bold',
                        toneFromHex(l.color).bg,
                        toneFromHex(l.color).border,
                        toneFromHex(l.color).text,
                      )}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="text-sm leading-relaxed text-zinc-300">{l.decisions}</div>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-3 text-xs font-bold tracking-widest text-amber-300">🧠 PRINCIPIOS DE ARQUITECTURA</div>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { principle: 'Single Responsibility', desc: 'Cada servicio hace una cosa. Si necesitás cambiar pagos, solo tocás Payment Service.' },
            { principle: 'Fail Gracefully', desc: 'Si un servicio cae, el resto sigue. Circuit breakers, retries, fallbacks.' },
            { principle: 'Design for Scale', desc: 'Stateless services + cache + load balancer = escalás horizontalmente.' },
            { principle: 'Observability First', desc: 'Si no lo podés medir, no lo podés mejorar. Logs, métricas, traces en todo.' },
          ].map((p) => (
            <div key={p.principle} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="mb-1 font-mono text-xs font-bold text-indigo-300">{p.principle}</div>
              <div className="text-sm leading-relaxed text-zinc-500">{p.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
