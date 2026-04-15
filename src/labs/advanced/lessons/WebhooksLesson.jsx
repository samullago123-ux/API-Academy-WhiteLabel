import { useEffect, useRef, useState } from 'react'

export default function WebhooksLesson() {
  const [events, setEvents] = useState([])
  const [verified, setVerified] = useState(null)
  const timerRef = useRef(null)

  const webhookEvents = [
    { type: 'message.received', source: 'WhatsApp API', payload: { from: '+573001234567', body: 'Hola, necesito información', timestamp: '2025-01-15T10:30:00Z' } },
    { type: 'payment.completed', source: 'Stripe', payload: { amount: 29900, currency: 'COP', customer: 'cus_abc123' } },
    { type: 'issue.created', source: 'Linear', payload: { title: 'Bug en login flow', assignee: 'Daniel', priority: 'high' } },
    { type: 'conversation.assigned', source: 'Chatwoot', payload: { conversation_id: 456, agent: 'Andrés', inbox: 'WhatsApp' } },
  ]

  function simulateWebhooks() {
    setEvents([])
    let i = 0
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      if (i >= webhookEvents.length) {
        clearInterval(timerRef.current)
        return
      }
      setEvents((prev) => [...prev, { ...webhookEvents[i], receivedAt: new Date().toISOString(), id: i }])
      i++
    }, 1800)
  }

  useEffect(() => () => clearInterval(timerRef.current), [])

  function verifySignature() {
    setVerified(null)
    setTimeout(() => setVerified(true), 1000)
  }

  return (
    <div>
      <p className="mb-5 text-sm leading-relaxed text-zinc-400">
        En vez de preguntar constantemente "¿hay algo nuevo?" (<strong className="text-zinc-100">polling</strong>), un webhook hace que el servicio{' '}
        <strong className="text-zinc-100">te avise a vos</strong> cuando algo pasa. Es una API invertida.
      </p>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4">
          <div className="mb-2 text-sm font-bold text-red-300">❌ Polling (mal)</div>
          <div className="font-mono text-xs leading-loose text-zinc-300">
            Cada 5 seg: GET /messages → [] vacío
            <br />
            Cada 5 seg: GET /messages → [] vacío
            <br />
            Cada 5 seg: GET /messages → [] vacío
            <br />
            Cada 5 seg: GET /messages → [1 msg] ¡al fin!
            <br />
            <span className="text-red-300">= 95% de requests desperdiciadas</span>
          </div>
        </div>
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
          <div className="mb-2 text-sm font-bold text-emerald-300">✅ Webhook (bien)</div>
          <div className="font-mono text-xs leading-loose text-zinc-300">
            Tu server espera tranquilo...
            <br />
            WhatsApp → POST /tu-webhook ¡mensaje nuevo!
            <br />
            Tu server procesa inmediatamente.
            <br />
            <span className="text-emerald-300">= 0 requests desperdiciadas, respuesta instantánea</span>
          </div>
        </div>
      </div>

      <button
        onClick={simulateWebhooks}
        className="mb-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-indigo-500 px-6 text-sm font-bold text-white transition-colors hover:bg-indigo-400"
      >
        🪝 Simular Webhooks Entrantes
      </button>

      {events.length > 0 && (
        <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="mb-3 text-[11px] font-bold text-zinc-500">EVENTOS RECIBIDOS EN TU ENDPOINT</div>
          {events.map((e) => (
            <div key={e.id} className="mb-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="font-mono text-sm font-bold text-indigo-300">{e.type}</span>
                <span className="text-xs text-zinc-500">{e.source}</span>
              </div>
              <pre className="m-0 whitespace-pre-wrap font-mono text-xs leading-relaxed text-zinc-400">{JSON.stringify(e.payload, null, 2)}</pre>
            </div>
          ))}
        </div>
      )}

      <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-3 text-xs font-bold tracking-widest text-amber-400">🔏 VERIFICACIÓN HMAC</div>
        <p className="mb-3 text-sm leading-relaxed text-zinc-400">
          ¿Cómo sabés que un webhook realmente viene de WhatsApp y no de un atacante? Con una firma HMAC-SHA256 que solo vos y el servicio conocen.
        </p>
        <div className="mb-3 whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-xs leading-relaxed text-zinc-300">
          {`// 1. Recibís el header con la firma
X-Hub-Signature-256: sha256=abc123...

// 2. Calculás la firma con TU secret
const expected = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(rawBody)
  .digest('hex');

// 3. Comparás
if (signature !== 'sha256=' + expected) {
  return res.status(401).send('Firma inválida');
}`}
        </div>
        <button
          onClick={verifySignature}
          className="inline-flex h-9 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 text-xs font-bold text-amber-300"
        >
          🔐 Simular Verificación
        </button>
        {verified !== null && <div className="mt-3 text-sm font-bold text-emerald-300">✅ Firma verificada. El webhook es legítimo.</div>}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-2 text-xs font-bold tracking-widest text-emerald-300">📋 CHECKLIST DE WEBHOOKS ROBUSTOS</div>
        <div className="text-sm leading-loose text-zinc-400">
          ✓ Responder <strong className="text-zinc-100">200 inmediatamente</strong> y procesar async (con cola/BullMQ)
          <br />
          ✓ Verificar firma HMAC en <strong className="text-zinc-100">cada request</strong>
          <br />
          ✓ Ser <strong className="text-zinc-100">idempotente</strong> (el servicio puede reenviar el mismo evento)
          <br />
          ✓ Loguear todo: event_id, timestamp, payload
          <br />✓ Tener un <strong className="text-zinc-100">mecanismo de retry</strong> propio si tu procesamiento falla
        </div>
      </div>
    </div>
  )
}

