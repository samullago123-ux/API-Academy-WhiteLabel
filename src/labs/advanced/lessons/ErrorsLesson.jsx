import { useState } from 'react'
import { cn } from '../../../utils/cn.js'

export default function ErrorsLesson() {
  const [circuitState, setCircuitState] = useState('closed')
  const [failures, setFailures] = useState(0)
  const [requests, setRequests] = useState([])

  function simulateRequest() {
    const isError = Math.random() < (circuitState === 'half_open' ? 0.5 : 0.6)

    if (circuitState === 'open') {
      setRequests((prev) => [...prev, { status: 'blocked', msg: 'Circuit OPEN — request bloqueado sin enviar' }].slice(-12))
      return
    }

    if (isError) {
      const newFailures = failures + 1
      setFailures(newFailures)
      setRequests((prev) => [...prev, { status: 'error', msg: `500 Error (falla ${newFailures}/3)` }].slice(-12))
      if (newFailures >= 3) {
        setCircuitState('open')
        setTimeout(() => {
          setCircuitState('half_open')
          setFailures(0)
        }, 5000)
      }
    } else {
      setFailures(0)
      if (circuitState === 'half_open') setCircuitState('closed')
      setRequests((prev) => [...prev, { status: 'ok', msg: '200 OK — respuesta exitosa' }].slice(-12))
    }
  }

  function resetCircuit() {
    setCircuitState('closed')
    setFailures(0)
    setRequests([])
  }

  const stateLabels = { closed: 'CERRADO (normal)', open: 'ABIERTO (bloqueando)', half_open: 'SEMI-ABIERTO (probando)' }
  const stateTones = {
    closed: { text: 'text-emerald-300', border: 'border-emerald-400/60', bg: 'bg-emerald-500/10' },
    open: { text: 'text-red-300', border: 'border-red-400/60', bg: 'bg-red-500/10' },
    half_open: { text: 'text-amber-300', border: 'border-amber-400/60', bg: 'bg-amber-500/10' },
  }

  return (
    <div>
      <p className="mb-5 text-sm leading-relaxed text-zinc-400">
        Las APIs fallan. Siempre. Un sistema resiliente no evita los errores — los <strong className="text-zinc-100">maneja con gracia</strong>.
      </p>

      <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="mb-3 text-xs font-bold tracking-widest text-zinc-500">ESTRUCTURA DE ERROR PROFESIONAL</div>
        <pre className="m-0 whitespace-pre-wrap font-mono text-xs leading-relaxed text-zinc-400">{`{
  "error": {
    "code": "VALIDATION_ERROR",      ← código máquina (tu app hace switch)
    "message": "Email inválido",     ← mensaje humano (se muestra al user)
    "details": [                     ← detalles técnicos (para debugging)
      { "field": "email", "issue": "formato inválido" }
    ],
    "request_id": "req_abc123",      ← para soporte: "dame tu request_id"
    "docs": "https://docs.api.com/errors/VALIDATION_ERROR"
  }
}`}</pre>
      </div>

      <div className="mb-2 text-xs font-bold tracking-widest text-zinc-500">⚡ CIRCUIT BREAKER INTERACTIVO</div>
      <p className="mb-4 text-sm leading-relaxed text-zinc-400">
        Un circuit breaker protege tu sistema: si una API falla muchas veces seguidas, <strong className="text-zinc-100">deja de llamarla</strong> temporalmente para no saturarla.
      </p>

      <div className={cn('mb-4 rounded-xl border-2 p-4 text-center', stateTones[circuitState].bg, stateTones[circuitState].border)}>
        <div className="text-3xl">{circuitState === 'closed' ? '🟢' : circuitState === 'open' ? '🔴' : '🟡'}</div>
        <div className={cn('mt-1 font-mono text-base font-black', stateTones[circuitState].text)}>{stateLabels[circuitState]}</div>
        <div className="mt-1 text-xs text-zinc-500">
          Fallos consecutivos: {failures}/3{circuitState === 'open' && ' — Esperando 5s para probar de nuevo...'}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={simulateRequest}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-indigo-500 px-4 text-sm font-bold text-white transition-colors hover:bg-indigo-400"
        >
          ⚡ Enviar Request
        </button>
        <button
          onClick={resetCircuit}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-800"
        >
          ⟲ Reset
        </button>
      </div>

      {requests.length > 0 && (
        <div className="max-h-52 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-3">
          {requests.map((r, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-2 px-2 py-1 font-mono text-xs',
                r.status === 'ok' ? 'text-emerald-300' : r.status === 'error' ? 'text-red-300' : 'text-amber-300',
              )}
            >
              <span>{r.status === 'ok' ? '✅' : r.status === 'error' ? '❌' : '🚫'}</span>
              <span>{r.msg}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-2 text-xs font-bold tracking-widest text-indigo-300">🔄 CICLO DEL CIRCUIT BREAKER</div>
        <div className="text-sm leading-relaxed text-zinc-400">
          <strong className="text-emerald-300">CERRADO</strong> → requests pasan normal. Si hay 3+ fallos seguidos...
          <br />
          <strong className="text-red-300">ABIERTO</strong> → BLOQUEA requests por N segundos (no llama al server). Después...
          <br />
          <strong className="text-amber-300">SEMI-ABIERTO</strong> → deja pasar 1 request de prueba. Si OK → cerrado. Si falla → abierto de nuevo.
        </div>
      </div>
    </div>
  )
}

