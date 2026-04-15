import { useEffect, useRef, useState } from 'react'
import { cn } from '../../../utils/cn.js'
import { toneFromHex } from '../../../utils/tone.js'

export default function EventDrivenLesson() {
  const [events, setEvents] = useState([])
  const [activePattern, setActivePattern] = useState('queue')
  const [playing, setPlaying] = useState(false)
  const timerRef = useRef(null)

  const patterns = {
    queue: {
      name: 'Message Queue', icon: '📬', color: '#3b82f6',
      desc: 'Productor → Cola → Consumidor. Un mensaje se procesa UNA vez por UN consumidor. Perfecto para tareas que deben ejecutarse exactamente una vez.',
      services: ['Order Service', 'Queue (BullMQ)', 'Payment Worker', 'Email Worker'],
      events: [
        { from: 0, to: 1, label: 'order.created', detail: '{ orderId: 42, total: $299 }' },
        { from: 1, to: 2, label: '→ process payment', detail: 'Worker toma el job de la cola' },
        { from: 2, to: 1, label: 'payment.ok', detail: "{ status: 'paid', txn: 'txn_abc' }" },
        { from: 1, to: 3, label: '→ send email', detail: 'Otro worker envía confirmación' },
        { from: 3, to: -1, label: '✅ email sent', detail: 'Flujo completo async' },
      ],
      realWorld: 'BullMQ + Redis en n8n, SQS en AWS, RabbitMQ',
    },
    pubsub: {
      name: 'Pub/Sub', icon: '📡', color: '#10b981',
      desc: 'Un evento se emite a TODOS los suscriptores. Cada servicio decide si le interesa. Desacople total — el emisor no sabe quién escucha.',
      services: ['Order Service', 'Event Bus', 'Inventory', 'Analytics', 'Notifications'],
      events: [
        { from: 0, to: 1, label: 'publish: order.created', detail: 'El evento se emite al bus' },
        { from: 1, to: 2, label: '→ inventory.subscribe', detail: 'Reduce stock del producto' },
        { from: 1, to: 3, label: '→ analytics.subscribe', detail: 'Registra la venta en métricas' },
        { from: 1, to: 4, label: '→ notif.subscribe', detail: 'Envía push notification' },
      ],
      realWorld: 'Redis Pub/Sub, Google Pub/Sub, Kafka, EventBridge',
    },
    eventsource: {
      name: 'Event Sourcing', icon: '📜', color: '#f59e0b',
      desc: 'En vez de guardar el ESTADO actual, guardás TODOS los eventos que ocurrieron. El estado se reconstruye reproduciendo los eventos.',
      services: ['Command', 'Event Store', 'Read Model', 'Projection'],
      events: [
        { from: 0, to: 1, label: 'CartCreated', detail: '{ cartId: 1, userId: 7 }' },
        { from: 0, to: 1, label: 'ItemAdded', detail: '{ productId: 5, qty: 2, price: 100 }' },
        { from: 0, to: 1, label: 'ItemAdded', detail: '{ productId: 8, qty: 1, price: 50 }' },
        { from: 0, to: 1, label: 'ItemRemoved', detail: '{ productId: 5, qty: 1 }' },
        { from: 1, to: 2, label: '→ rebuild state', detail: 'Cart: { items: [{id:5,qty:1},{id:8,qty:1}], total: 150 }' },
      ],
      realWorld: 'Cuentas bancarias, auditoría, undo/redo, blockchain',
    },
  }

  const active = patterns[activePattern]

  function playAnimation() {
    setEvents([])
    setPlaying(true)
    let i = 0
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      if (i >= active.events.length) {
        clearInterval(timerRef.current)
        setPlaying(false)
        return
      }
      setEvents((prev) => [...prev, active.events[i]])
      i++
    }, 1500)
  }

  useEffect(() => {
    setEvents([])
    setPlaying(false)
    clearInterval(timerRef.current)
  }, [activePattern])

  useEffect(() => () => clearInterval(timerRef.current), [])

  return (
    <div>
      <p className="mb-5 text-sm leading-relaxed text-zinc-400">
        No todo tiene que ser request → response. En arquitecturas <strong className="text-zinc-100">event-driven</strong>, los servicios reaccionan a eventos de forma asíncrona. Más resiliente, más escalable.
      </p>

      <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {Object.entries(patterns).map(([key, p]) => (
          <button
            key={key}
            onClick={() => setActivePattern(key)}
            className={cn(
              'rounded-xl border-2 px-4 py-4 text-center transition-colors',
              activePattern === key ? cn(toneFromHex(p.color).bg, toneFromHex(p.color).border) : 'border-zinc-800 hover:bg-zinc-900',
            )}
          >
            <div className="text-2xl">{p.icon}</div>
            <div className={cn('mt-2 text-xs font-bold', activePattern === key ? toneFromHex(p.color).text : 'text-zinc-500')}>{p.name}</div>
          </button>
        ))}
      </div>

      <div className={cn('mb-4 rounded-xl border bg-zinc-950 p-5', toneFromHex(active.color).border)}>
        <div className="mb-4 text-sm leading-relaxed text-zinc-300">{active.desc}</div>

        <div className="mb-4 flex flex-wrap gap-2">
          {active.services.map((s, i) => (
            <div
              key={i}
              className={cn(
                'rounded-xl border px-3 py-2 font-mono text-xs font-extrabold',
                toneFromHex(active.color).bg,
                toneFromHex(active.color).border,
                toneFromHex(active.color).text,
              )}
            >
              {s}
            </div>
          ))}
        </div>

        <button
          onClick={playAnimation}
          disabled={playing}
          className={cn(
            'mb-4 inline-flex h-11 w-full items-center justify-center rounded-xl px-6 text-sm font-bold text-white transition-colors',
            playing ? 'cursor-not-allowed bg-zinc-800 text-zinc-500' : cn(toneFromHex(active.color).text, 'bg-indigo-500'),
            !playing && active.color === '#3b82f6' && 'bg-sky-500 hover:bg-sky-400',
            !playing && active.color === '#10b981' && 'bg-emerald-500 hover:bg-emerald-400',
            !playing && active.color === '#f59e0b' && 'bg-amber-500 hover:bg-amber-400',
          )}
        >
          {playing ? '⏳ Reproduciendo eventos...' : '▶ Animar Flujo'}
        </button>

        <div className="grid gap-2">
          {events.map((e, i) => (
            <div key={i} className={cn('rounded-xl border px-4 py-3', toneFromHex(active.color).border, toneFromHex(active.color).bg)}>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className={cn('font-mono text-xs font-extrabold', toneFromHex(active.color).text)}>{e.label}</span>
                {e.from >= 0 && (
                  <span className="text-xs text-zinc-600">
                    {active.services[e.from]} → {e.to >= 0 ? active.services[e.to] : 'Done'}
                  </span>
                )}
              </div>
              <div className="font-mono text-xs text-zinc-500">{e.detail}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 text-xs text-zinc-500">
          <strong className="text-zinc-400">En producción:</strong> {active.realWorld}
        </div>
      </div>
    </div>
  )
}
