import { useState } from 'react'
import { cn } from '../../../utils/cn.js'
import { toneFromHex } from '../../../utils/tone.js'

export default function VersioningLesson() {
  const [strategy, setStrategy] = useState('url')

  const strategies = {
    url: {
      name: 'URL Path',
      icon: '🔗',
      color: '#3b82f6',
      example: `GET /v1/usuarios → { nombre: "Daniel" }
GET /v2/usuarios → { first_name: "Daniel", last_name: "..." }`,
      pros: 'Explícito, fácil de cachear, claro en docs',
      cons: 'Multiplica rutas, puede generar code duplication',
      who: 'Stripe, Google, GitHub, Twitter',
    },
    header: {
      name: 'Header',
      icon: '📋',
      color: '#10b981',
      example: `GET /usuarios
Accept: application/vnd.miapi.v2+json

# O con header custom:
API-Version: 2024-01-15`,
      pros: 'URLs limpias, permite versiones por fecha (Stripe-style)',
      cons: 'Más difícil de probar en browser, menos visible',
      who: 'Stripe (API-Version por fecha), GitHub (Accept header)',
    },
    query: {
      name: 'Query Param',
      icon: '❓',
      color: '#f59e0b',
      example: `GET /usuarios?version=2
GET /usuarios?api-version=2024-01-15`,
      pros: 'Fácil de probar, compatible con cualquier cliente',
      cons: 'Ensucian la URL, fácil de olvidar, difícil de cachear',
      who: 'Google Cloud, Azure, AWS (algunos servicios)',
    },
  }

  const active = strategies[strategy]

  return (
    <div>
      <p className="mb-5 text-sm leading-relaxed text-zinc-400">
        Cuando cambiás la estructura de tu API, no podés romper a los clientes existentes. El <strong className="text-zinc-100">versionamiento</strong> te permite evolucionar sin destruir.
      </p>

      <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {Object.entries(strategies).map(([key, s]) => (
          <button
            key={key}
            onClick={() => setStrategy(key)}
            className={cn(
              'rounded-xl border-2 px-4 py-4 text-center transition-colors',
              strategy === key ? cn(toneFromHex(s.color).bg, toneFromHex(s.color).border) : 'border-zinc-800 hover:bg-zinc-900',
            )}
          >
            <div className="text-2xl">{s.icon}</div>
            <div className={cn('mt-1 text-xs font-bold', toneFromHex(s.color).text)}>{s.name}</div>
          </button>
        ))}
      </div>

      <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <pre className={cn('m-0 whitespace-pre-wrap font-mono text-xs leading-loose', toneFromHex(active.color).text)}>{active.example}</pre>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
          <div className="mb-1 text-[11px] font-bold text-emerald-300">✅ PROS</div>
          <div className="text-sm text-zinc-300">{active.pros}</div>
        </div>
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-4">
          <div className="mb-1 text-[11px] font-bold text-red-300">⚠️ CONTRAS</div>
          <div className="text-sm text-zinc-300">{active.cons}</div>
        </div>
      </div>

      <div className="mb-6 text-xs text-zinc-500">
        <strong className="text-zinc-400">¿Quién lo usa?</strong> {active.who}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-3 text-xs font-bold tracking-widest text-indigo-300">💡 BREAKING vs NON-BREAKING CHANGES</div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
            <div className="mb-2 text-xs font-bold text-emerald-300">✅ No requiere nueva versión</div>
            <div className="text-sm leading-relaxed text-zinc-300">
              Agregar un campo nuevo al response<br />
              Agregar un endpoint nuevo<br />
              Agregar un query param opcional<br />
              Hacer un campo requerido → opcional
            </div>
          </div>
          <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-4">
            <div className="mb-2 text-xs font-bold text-red-300">💥 REQUIERE nueva versión</div>
            <div className="text-sm leading-relaxed text-zinc-300">
              Renombrar un campo (nombre → first_name)<br />
              Eliminar un campo del response<br />
              Cambiar tipo de un campo (string → int)<br />
              Hacer un campo opcional → requerido
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

