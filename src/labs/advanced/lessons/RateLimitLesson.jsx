import { useEffect, useRef, useState } from 'react'
import { cn } from '../../../utils/cn.js'
import { toneFromHex } from '../../../utils/tone.js'

export default function RateLimitLesson() {
  const [requests, setRequests] = useState([])
  const [rateLimit] = useState({ max: 10, windowSec: 10 })
  const [running, setRunning] = useState(false)
  const [strategy, setStrategy] = useState('none')
  const [stats, setStats] = useState({ sent: 0, ok: 0, throttled: 0 })
  const timerRef = useRef(null)

  function reset() {
    clearTimeout(timerRef.current)
    setRequests([])
    setRunning(false)
    setStats({ sent: 0, ok: 0, throttled: 0 })
  }

  function simulate() {
    reset()
    setRunning(true)
    let localRequests = []
    let sent = 0
    let ok = 0
    let throttled = 0
    let retryDelay = 500
    let i = 0
    const totalReqs = 25

    function sendNext() {
      if (i >= totalReqs) {
        setRunning(false)
        return
      }
      i++
      sent++
      const now = Date.now()
      const recentOk = localRequests.filter((r) => r.status === 200 && now - r.time < rateLimit.windowSec * 1000).length
      const isThrottled = recentOk >= rateLimit.max
      const req = { id: i, status: isThrottled ? 429 : 200, time: now, retryOf: null }

      if (isThrottled) {
        throttled++
        req.retryDelay = strategy === 'none' ? null : strategy === 'fixed' ? 1000 : retryDelay
      } else {
        ok++
        retryDelay = 500
      }

      localRequests = [...localRequests, req]
      setRequests([...localRequests])
      setStats({ sent, ok, throttled })

      let nextDelay
      if (isThrottled && strategy !== 'none') {
        nextDelay = strategy === 'fixed' ? 1000 : retryDelay
        if (strategy === 'exponential') retryDelay = Math.min(retryDelay * 2, 8000)
      } else {
        nextDelay = strategy === 'none' ? 150 : strategy === 'fixed' ? 400 : 300
        retryDelay = 500
      }

      timerRef.current = setTimeout(sendNext, nextDelay)
    }

    sendNext()
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const strategies = [
    { id: 'none', name: 'Sin control', icon: '💥', desc: 'Enviar todo lo más rápido posible. BOOM.', color: '#ef4444' },
    { id: 'fixed', name: 'Retry fijo', icon: '⏱️', desc: 'Esperar 1 segundo fijo al recibir 429.', color: '#f59e0b' },
    { id: 'exponential', name: 'Exp. Backoff', icon: '📈', desc: 'Esperar 0.5s, 1s, 2s, 4s, 8s... multiplicando.', color: '#10b981' },
  ]

  return (
    <div>
      <p className="mb-4 text-sm leading-relaxed text-zinc-400">
        Las APIs limitan cuántas peticiones podés hacer. Si te pasás, recibís <strong className="font-mono text-amber-300">429 Too Many Requests</strong>. La pregunta es: ¿qué hacés cuando eso pasa?
      </p>

      <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="mb-2 text-xs text-zinc-500">CONFIGURACIÓN DEL SERVIDOR</div>
        <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
          <span>
            Límite: <strong className="text-zinc-100">{rateLimit.max} req</strong>
          </span>
          <span>
            Ventana: <strong className="text-zinc-100">{rateLimit.windowSec}s</strong>
          </span>
          <span>
            Total a enviar: <strong className="text-zinc-100">25 requests</strong>
          </span>
        </div>
      </div>

      <div className="mb-2 text-xs font-bold tracking-widest text-zinc-500">ESTRATEGIA DE REINTENTO</div>
      <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {strategies.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setStrategy(s.id)
              reset()
            }}
            className={cn(
              'rounded-xl border-2 px-4 py-4 text-center transition-colors',
              strategy === s.id ? cn(toneFromHex(s.color).bg, toneFromHex(s.color).border) : 'border-zinc-800 hover:bg-zinc-900',
            )}
          >
            <div className="text-xl">{s.icon}</div>
            <div className={cn('mt-1 text-xs font-bold', toneFromHex(s.color).text)}>{s.name}</div>
            <div className="mt-1 text-[10px] text-zinc-600">{s.desc}</div>
          </button>
        ))}
      </div>

      <button
        onClick={simulate}
        disabled={running}
        className={cn(
          'mb-5 inline-flex h-11 w-full items-center justify-center rounded-xl px-6 text-sm font-bold text-white transition-colors',
          running ? 'cursor-not-allowed bg-zinc-800 text-zinc-500' : 'bg-indigo-500 hover:bg-indigo-400',
        )}
      >
        {running ? '⏳ Enviando requests...' : '▶ Simular 25 Requests'}
      </button>

      {requests.length > 0 && (
        <>
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-center">
              <div className="mb-1 text-[11px] text-zinc-500">ENVIADOS</div>
              <div className="text-2xl font-black text-zinc-100">{stats.sent}</div>
            </div>
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-center">
              <div className="mb-1 text-[11px] text-emerald-300">EXITOSOS (200)</div>
              <div className="text-2xl font-black text-emerald-300">{stats.ok}</div>
            </div>
            <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-center">
              <div className="mb-1 text-[11px] text-red-300">RECHAZADOS (429)</div>
              <div className="text-2xl font-black text-red-300">{stats.throttled}</div>
            </div>
          </div>

          <div className="max-h-52 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-3">
            <div className="flex flex-wrap gap-1.5">
              {requests.map((r) => (
                <div
                  key={r.id}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-lg border font-mono text-[10px] font-extrabold',
                    r.status === 200 ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300' : 'border-red-400/40 bg-red-500/10 text-red-300',
                  )}
                >
                  {r.status === 200 ? '✓' : '429'}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-2 text-xs font-bold text-indigo-300">📊 ANÁLISIS</div>
            <div className="text-sm leading-relaxed text-zinc-400">
              Tasa de éxito:{' '}
              <strong className={stats.ok / stats.sent > 0.7 ? 'text-emerald-300' : 'text-red-300'}>
                {Math.round((stats.ok / stats.sent) * 100)}%
              </strong>
              {strategy === 'none' && stats.throttled > 5 && ' — Sin control, la mayoría de requests se pierden. Desperdicio de recursos.'}
              {strategy === 'fixed' && ' — Mejor que nada, pero el delay fijo no se adapta a la carga.'}
              {strategy === 'exponential' && ' — La mejor estrategia: se adapta dinámicamente y maximiza throughput.'}
            </div>
          </div>
        </>
      )}

      <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-2 text-xs font-bold tracking-widest text-amber-400">📬 HEADERS DE RATE LIMIT</div>
        <div className="font-mono text-xs leading-loose text-zinc-400">
          <span className="text-indigo-300">X-RateLimit-Limit:</span> 100 <span className="text-zinc-600">← máximo por ventana</span>
          <br />
          <span className="text-indigo-300">X-RateLimit-Remaining:</span> 23 <span className="text-zinc-600">← cuántas te quedan</span>
          <br />
          <span className="text-indigo-300">X-RateLimit-Reset:</span> 1625097600 <span className="text-zinc-600">← timestamp de reset</span>
          <br />
          <span className="text-indigo-300">Retry-After:</span> 30 <span className="text-zinc-600">← segundos para reintentar</span>
        </div>
      </div>
    </div>
  )
}

