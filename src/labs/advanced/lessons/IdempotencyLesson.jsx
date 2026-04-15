import { useState } from 'react'
import { cn } from '../../../utils/cn.js'
import { toneFromHex } from '../../../utils/tone.js'

export default function IdempotencyLesson() {
  const [scenario, setScenario] = useState(null)
  const [step, setStep] = useState(0)

  const scenarios = [
    {
      id: 'payment_bad',
      title: '💸 Pago SIN idempotencia',
      color: '#ef4444',
      steps: [
        "Usuario hace click en 'Pagar $100'",
        'POST /pagos { monto: 100 } → Timeout de red (no sabés si llegó)',
        'Tu app reintenta: POST /pagos { monto: 100 }',
        '💥 El servidor CREÓ DOS pagos de $100. Le cobraste $200 al usuario.',
        'El usuario llama furioso. Tenés que hacer refund manual.',
      ],
    },
    {
      id: 'payment_good',
      title: '✅ Pago CON idempotencia',
      color: '#10b981',
      steps: [
        "Tu app genera: idempotency_key = 'pay_abc123_1625097600'",
        "POST /pagos { monto: 100 } -H 'Idempotency-Key: pay_abc123_1625097600' → Timeout",
        "Tu app reintenta con LA MISMA key: POST /pagos + 'Idempotency-Key: pay_abc123_1625097600'",
        '✅ El servidor detecta la key repetida. Devuelve el resultado original sin crear duplicado.',
        'El usuario solo fue cobrado una vez. Todos contentos.',
      ],
    },
  ]

  const methodTable = [
    { method: 'GET', idempotent: true, safe: true, desc: 'Leer datos no cambia nada. Siempre seguro.' },
    { method: 'POST', idempotent: false, safe: false, desc: 'Cada llamada PUEDE crear algo nuevo. ⚠️ Peligroso sin idempotency key.' },
    { method: 'PUT', idempotent: true, safe: false, desc: 'Reemplazar con los mismos datos da el mismo resultado.' },
    { method: 'PATCH', idempotent: false, safe: false, desc: "Depende: 'set name=X' es idempotente, 'increment counter' NO." },
    { method: 'DELETE', idempotent: true, safe: false, desc: 'Borrar algo dos veces = ya estaba borrado.' },
  ]

  return (
    <div>
      <p className="mb-5 text-sm leading-relaxed text-zinc-400">
        Una operación es <strong className="text-zinc-100">idempotente</strong> si ejecutarla 1 vez o 100 veces produce el{' '}
        <strong className="text-zinc-100">mismo resultado</strong>. Es CRÍTICO para pagos, transacciones y cualquier cosa que no debería duplicarse.
      </p>

      <div className="mb-2 text-xs font-bold tracking-widest text-zinc-500">ESCENARIOS INTERACTIVOS</div>
      <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {scenarios.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setScenario(s.id)
              setStep(0)
            }}
            className={cn(
              'rounded-xl border-2 px-4 py-4 text-left transition-colors',
              scenario === s.id ? cn(toneFromHex(s.color).bg, toneFromHex(s.color).border) : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800',
            )}
          >
            <div className={cn('text-sm font-bold', toneFromHex(s.color).text)}>{s.title}</div>
          </button>
        ))}
      </div>

      {scenario && (() => {
        const s = scenarios.find((x) => x.id === scenario)
        return (
          <div className={cn('mb-6 rounded-xl border bg-zinc-950 p-5', toneFromHex(s.color).border)}>
            {s.steps.map((st, i) => (
              <div
                key={i}
                onClick={() => setStep(i)}
                className={cn(
                  'mb-1 flex cursor-pointer items-start gap-3 rounded-xl px-3 py-3 transition-colors',
                  i <= step ? 'opacity-100' : 'opacity-40',
                  i === step ? toneFromHex(s.color).bg : 'bg-transparent',
                )}
              >
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-extrabold',
                    i <= step ? cn('text-white', s.color === '#10b981' ? 'bg-emerald-500' : s.color === '#ef4444' ? 'bg-red-500' : 'bg-indigo-500') : 'bg-zinc-800 text-zinc-500',
                  )}
                >
                  {i + 1}
                </div>
                <div
                  className={cn(
                    'text-sm leading-relaxed',
                    i <= step ? 'text-zinc-100' : 'text-zinc-500',
                    st.includes('POST') || st.includes('key') ? 'font-mono' : 'font-sans',
                  )}
                >
                  {st}
                </div>
              </div>
            ))}
            {step < s.steps.length - 1 && (
              <button
                onClick={() => setStep(step + 1)}
                className={cn(
                  'mt-3 inline-flex h-9 items-center justify-center rounded-xl border px-4 text-sm font-bold',
                  toneFromHex(s.color).bg,
                  toneFromHex(s.color).border,
                  toneFromHex(s.color).text,
                )}
              >
                Siguiente paso →
              </button>
            )}
          </div>
        )
      })()}

      <div className="mb-2 text-xs font-bold tracking-widest text-zinc-500">TABLA DE IDEMPOTENCIA POR MÉTODO</div>
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
        <div className="grid grid-cols-[80px_90px_70px_1fr] gap-0 bg-zinc-900 px-4 py-2 text-[11px] font-bold text-zinc-500">
          <span>MÉTODO</span>
          <span>IDEMPOTENTE</span>
          <span>SAFE</span>
          <span>NOTA</span>
        </div>
        {methodTable.map((m) => (
          <div key={m.method} className="grid grid-cols-[80px_90px_70px_1fr] items-center gap-0 border-t border-zinc-800 px-4 py-3">
            <span className="font-mono text-sm font-bold text-indigo-300">{m.method}</span>
            <span className={cn('text-sm font-bold', m.idempotent ? 'text-emerald-300' : 'text-red-300')}>{m.idempotent ? '✅ Sí' : '❌ No'}</span>
            <span className={cn('text-sm', m.safe ? 'text-emerald-300' : 'text-amber-300')}>{m.safe ? '✅' : '⚠️'}</span>
            <span className="text-sm text-zinc-400">{m.desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

