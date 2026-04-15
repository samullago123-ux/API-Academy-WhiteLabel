import { useRef, useState } from 'react'
import { cn } from '../../../utils/cn.js'
import { toneFromHex } from '../../../utils/tone.js'

export default function PerformanceLesson() {
  const [cacheHits, setCacheHits] = useState({ hit: 0, miss: 0 })
  const [requests, setRequests] = useState([])
  const [cacheEnabled, setCacheEnabled] = useState(true)
  const cacheRef = useRef({})

  function simulateRequest() {
    const endpoints = ['/users/1', '/products/list', '/orders/42', '/users/1', '/users/1', '/products/list', '/orders/99', '/users/1']
    const ep = endpoints[Math.floor(Math.random() * endpoints.length)]
    const isCached = cacheEnabled && cacheRef.current[ep]
    const latency = isCached ? 2 + Math.random() * 5 : 80 + Math.random() * 200

    if (!isCached && cacheEnabled) cacheRef.current[ep] = true

    setCacheHits((prev) => ({
      hit: prev.hit + (isCached ? 1 : 0),
      miss: prev.miss + (isCached ? 0 : 1),
    }))

    setRequests((prev) => [...prev, {
      endpoint: ep,
      cached: isCached,
      latency: Math.round(latency),
      time: Date.now(),
    }].slice(-15))
  }

  function resetCache() {
    cacheRef.current = {}
    setCacheHits({ hit: 0, miss: 0 })
    setRequests([])
  }

  const hitRate = cacheHits.hit + cacheHits.miss > 0
    ? Math.round((cacheHits.hit / (cacheHits.hit + cacheHits.miss)) * 100)
    : 0

  const strategies = [
    { name: 'Cache-Aside (Lazy)', color: '#3b82f6', desc: 'App revisa cache primero. Si falta, lee DB y guarda en cache. El más común con Redis.',
      flow: 'Request → Cache? → HIT: return → MISS: DB → Save cache → Return' },
    { name: 'Write-Through', color: '#10b981', desc: 'Cada write va a cache Y DB al mismo tiempo. Cache siempre actualizada, pero writes más lentos.',
      flow: 'Write → Update Cache + Update DB → Return' },
    { name: 'Write-Behind', color: '#f59e0b', desc: 'Write va a cache inmediatamente, y a la DB de forma async después. Muy rápido pero riesgo de pérdida.',
      flow: 'Write → Update Cache → Return → (async) Flush to DB' },
    { name: 'CDN / Edge', color: '#a78bfa', desc: 'Para assets estáticos y APIs públicas. Cloudflare, Vercel Edge. El request ni llega a tu server.',
      flow: 'Request → CDN Edge (Buenos Aires) → HIT: Return → MISS: Origin → Cache → Return' },
  ]

  return (
    <div>
      <p className="mb-5 text-sm leading-relaxed text-zinc-400">
        La diferencia entre una API de <strong className="text-red-300">200ms</strong> y una de <strong className="text-emerald-300">5ms</strong> es caché. Redis, CDN, ETags — cada capa corta latencia.
      </p>

      <div className="mb-2 text-xs font-bold tracking-widest text-zinc-500">⚡ SIMULADOR DE CACHE EN VIVO</div>
      <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            onClick={simulateRequest}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-500 px-4 text-sm font-bold text-white transition-colors hover:bg-indigo-400"
          >
            ⚡ Enviar Request
          </button>
          <button
            onClick={() => {
              setCacheEnabled(!cacheEnabled)
              resetCache()
            }}
            className={cn(
              'inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-bold',
              cacheEnabled
                ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                : 'border-red-400/30 bg-red-500/10 text-red-300',
            )}
          >
            Cache: {cacheEnabled ? 'ON ✅' : 'OFF ❌'}
          </button>
          <button
            onClick={resetCache}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-800"
          >
            ⟲ Reset
          </button>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-center">
            <div className="text-2xl font-black text-emerald-300">{cacheHits.hit}</div>
            <div className="text-[11px] text-zinc-500">Cache HIT</div>
          </div>
          <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-center">
            <div className="text-2xl font-black text-red-300">{cacheHits.miss}</div>
            <div className="text-[11px] text-zinc-500">Cache MISS</div>
          </div>
          <div className="rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-4 text-center">
            <div className="text-2xl font-black text-indigo-300">{hitRate}%</div>
            <div className="text-[11px] text-zinc-500">Hit Rate</div>
          </div>
        </div>

        {requests.length > 0 && (
          <div className="max-h-44 overflow-y-auto">
            {requests.map((r, i) => (
              <div key={i} className="flex items-center gap-3 px-2 py-1 font-mono text-xs">
                <span className={cn('min-w-12 font-black', r.cached ? 'text-emerald-300' : 'text-red-300')}>
                  {r.cached ? 'HIT' : 'MISS'}
                </span>
                <span className="flex-1 text-zinc-500">{r.endpoint}</span>
                <span
                  className={cn(
                    'font-black',
                    r.latency < 10 ? 'text-emerald-300' : r.latency < 100 ? 'text-amber-300' : 'text-red-300',
                  )}
                >
                  {r.latency}ms
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-2 text-xs font-bold tracking-widest text-zinc-500">ESTRATEGIAS DE CACHÉ</div>
      <div className="grid gap-2 sm:grid-cols-2">
        {strategies.map((s) => (
          <div key={s.name} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className={cn('mb-2 text-sm font-bold', toneFromHex(s.color).text)}>{s.name}</div>
            <div className="mb-3 text-sm leading-relaxed text-zinc-400">{s.desc}</div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-[11px] leading-relaxed text-zinc-500">
              {s.flow}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
