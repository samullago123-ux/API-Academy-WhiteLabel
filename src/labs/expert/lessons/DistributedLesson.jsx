import { useState } from 'react'
import { cn } from '../../../utils/cn.js'
import { toneFromHex } from '../../../utils/tone.js'

export default function DistributedLesson() {
  const [capChoice, setCapChoice] = useState(null)
  const [sagaStep, setSagaStep] = useState(0)

  const capTheorem = [
    { id: 'cp', name: 'CP — Consistencia + Partición', color: '#3b82f6', icon: '🔒',
      desc: 'Si la red falla, el sistema se detiene en vez de dar datos incorrectos. Preferí esto para pagos y transacciones bancarias.',
      examples: 'MongoDB (modo strict), PostgreSQL, Redis (modo cluster), HBase',
      tradeoff: 'Sacrifica disponibilidad: si un nodo cae, parte del sistema no responde.' },
    { id: 'ap', name: 'AP — Disponibilidad + Partición', color: '#10b981', icon: '🌍',
      desc: 'Si la red falla, el sistema sigue respondiendo aunque los datos no estén 100% actualizados. Consistencia eventual.',
      examples: 'DynamoDB, Cassandra, CouchDB, DNS',
      tradeoff: 'Sacrifica consistencia: dos usuarios pueden ver datos distintos temporalmente.' },
    { id: 'ca', name: 'CA — Consistencia + Disponibilidad', color: '#f59e0b', icon: '⚠️',
      desc: 'Solo posible si NO hay particiones de red. En la práctica, solo existe en sistemas de un solo nodo (no distribuidos).',
      examples: 'PostgreSQL single node, MySQL single node',
      tradeoff: 'No funciona en sistemas distribuidos reales. Las particiones de red SIEMPRE pasan.' },
  ]

  const sagaSteps = [
    { service: 'Order Service', action: 'Crear orden → PENDING', status: 'ok', color: '#3b82f6' },
    { service: 'Payment Service', action: 'Cobrar $299 → SUCCESS', status: 'ok', color: '#10b981' },
    { service: 'Inventory Service', action: 'Reducir stock → FAIL (sin stock)', status: 'fail', color: '#ef4444' },
    { service: 'Payment Service', action: 'COMPENSAR: Refund $299', status: 'compensate', color: '#f59e0b' },
    { service: 'Order Service', action: 'COMPENSAR: Cancelar orden', status: 'compensate', color: '#f59e0b' },
  ]

  return (
    <div>
      <p className="mb-5 text-sm leading-relaxed text-zinc-400">
        Cuando tu sistema tiene múltiples servicios, bases de datos, y servidores, todo se complica. El <strong className="text-zinc-100">Teorema CAP</strong> te dice qué podés tener y qué tenés que sacrificar.
      </p>

      <div className="mb-2 text-xs font-bold tracking-widest text-zinc-500">TEOREMA CAP — "ELEGÍ 2 DE 3"</div>
      <p className="mb-4 text-sm leading-relaxed text-zinc-500">
        <strong className="text-zinc-100">C</strong>onsistencia (todos ven lo mismo) + <strong className="text-zinc-100">A</strong>vailability (siempre responde) + <strong className="text-zinc-100">P</strong>artition tolerance (funciona si la red falla). En un sistema distribuido, P siempre pasa — elegís entre C o A.
      </p>

      <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {capTheorem.map((c) => (
          <button
            key={c.id}
            onClick={() => setCapChoice(capChoice === c.id ? null : c.id)}
            className={cn(
              'rounded-xl border-2 px-4 py-4 text-center transition-colors',
              capChoice === c.id ? cn(toneFromHex(c.color).bg, toneFromHex(c.color).border) : 'border-zinc-800 hover:bg-zinc-900',
            )}
          >
            <div className="text-2xl">{c.icon}</div>
            <div className={cn('mt-2 text-xs font-bold', toneFromHex(c.color).text)}>{c.name}</div>
          </button>
        ))}
      </div>

      {capChoice && (() => {
        const c = capTheorem.find((x) => x.id === capChoice)
        return (
          <div className={cn('mb-6 rounded-xl border bg-zinc-950 p-5', toneFromHex(c.color).border)}>
            <div className="mb-4 text-sm leading-relaxed text-zinc-300">{c.desc}</div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <div className={cn('mb-1 text-xs font-bold', toneFromHex(c.color).text)}>EJEMPLOS</div>
                <div className="text-sm text-zinc-400">{c.examples}</div>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <div className="mb-1 text-xs font-bold text-amber-300">TRADEOFF</div>
                <div className="text-sm text-zinc-400">{c.tradeoff}</div>
              </div>
            </div>
          </div>
        )
      })()}

      <div className="mb-2 text-xs font-bold tracking-widest text-zinc-500">SAGA PATTERN — TRANSACCIONES DISTRIBUIDAS</div>
      <p className="mb-4 text-sm leading-relaxed text-zinc-500">
        No podés hacer un <code className="font-mono text-violet-300">BEGIN TRANSACTION</code> entre 3 microservicios. Una{' '}
        <strong className="text-zinc-100">Saga</strong> ejecuta pasos secuenciales y si uno falla, ejecuta{' '}
        <strong className="text-amber-300">compensaciones</strong> en reversa.
      </p>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
        <div className="grid gap-2">
          {sagaSteps.map((s, i) => (
            <div
              key={i}
              onClick={() => setSagaStep(i)}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-opacity',
                i <= sagaStep ? cn(toneFromHex(s.color).bg, toneFromHex(s.color).border, 'opacity-100') : 'border-transparent opacity-40',
              )}
            >
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-extrabold',
                  i <= sagaStep ? cn('text-white', s.color === '#ef4444' ? 'bg-red-500' : s.color === '#10b981' ? 'bg-emerald-500' : s.color === '#f59e0b' ? 'bg-amber-500' : 'bg-sky-500') : 'bg-zinc-800 text-zinc-500',
                )}
              >
                {s.status === 'compensate' ? '↩' : i + 1}
              </div>
              <div>
                <div className={cn('font-mono text-xs font-bold', toneFromHex(s.color).text)}>{s.service}</div>
                <div className={cn('text-sm', i <= sagaStep ? 'text-zinc-300' : 'text-zinc-600')}>{s.action}</div>
              </div>
            </div>
          ))}
        </div>
        {sagaStep < sagaSteps.length - 1 && (
          <button
            onClick={() => setSagaStep(sagaStep + 1)}
            className="mt-3 inline-flex h-9 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-4 text-sm font-bold text-indigo-300"
          >
            Siguiente paso →
          </button>
        )}
      </div>
    </div>
  )
}
