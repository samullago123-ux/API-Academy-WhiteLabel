import { useState } from 'react'
import { simulateAPI } from '../../../services/apiMock.js'
import { cn } from '../../../utils/cn.js'
import { methodTone, statusTone } from '../../../utils/tone.js'

export default function PlaygroundLesson() {
  const [method, setMethod] = useState('GET')
  const [endpoint, setEndpoint] = useState('usuarios')
  const [body, setBody] = useState('{\n  "nombre": "Test User",\n  "email": "test@demo.com"\n}')
  const [authKey, setAuthKey] = useState('Bearer demo_token')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])

  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

  async function sendRequest() {
    setLoading(true)
    let parsedBody = null
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        parsedBody = JSON.parse(body)
      } catch (e) {
        setResult({ status: 0, statusText: 'Parse Error', body: { error: 'El body no es JSON válido: ' + e.message }, time: 0 })
        setLoading(false)
        return
      }
    }
    const headers = authKey ? { Authorization: authKey } : {}
    const res = await simulateAPI(method, endpoint, parsedBody, headers)
    setResult(res)
    setHistory((h) => [{ method, endpoint, status: res.status, time: Math.round(res.time) }, ...h].slice(0, 8))
    setLoading(false)
  }

  return (
    <div>
      <p className="mb-5 text-sm leading-relaxed text-zinc-400">
        Este es tu sandbox. Hacé requests a una <strong className="text-zinc-100">API simulada</strong> con datos reales. Probá diferentes combinaciones y mirá qué pasa.
      </p>

      <div className="mb-5 grid gap-3">
        <div>
          <label className="mb-2 block text-xs font-bold tracking-widest text-zinc-500">MÉTODO</label>
          <div className="flex flex-wrap gap-2">
            {methods.map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={cn(
                  'rounded-xl border-2 px-4 py-2 font-mono text-sm font-extrabold transition-colors',
                  method === m ? cn(methodTone(m).bg, methodTone(m).border, methodTone(m).text) : 'border-zinc-800 text-zinc-400 hover:bg-zinc-900',
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold tracking-widest text-zinc-500">ENDPOINT</label>
          <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-950">
            <span className="whitespace-nowrap px-3 font-mono text-xs text-zinc-600">api.ejemplo.com/</span>
            <input
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="usuarios, productos, usuarios/1..."
              className="flex-1 bg-transparent px-3 py-2 font-mono text-sm text-zinc-100 outline-none"
            />
          </div>
          <div className="mt-1 text-xs text-zinc-600">
            Recursos disponibles: <span className="font-mono text-violet-300">usuarios</span>, <span className="font-mono text-violet-300">productos</span> — Agregá{' '}
            <span className="font-mono text-amber-300">/id</span> para un item específico
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold tracking-widest text-zinc-500">AUTENTICACIÓN</label>
          <input
            value={authKey}
            onChange={(e) => setAuthKey(e.target.value)}
            placeholder="Bearer token o dejá vacío para ver error 401"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70"
          />
          <div className="mt-1 text-xs text-zinc-600">Borrá este campo para ver un error 401 Unauthorized</div>
        </div>

        {['POST', 'PUT', 'PATCH'].includes(method) && (
          <div>
            <label className="mb-2 block text-xs font-bold tracking-widest text-zinc-500">BODY (JSON)</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-28 w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 font-mono text-sm text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70"
              spellCheck={false}
            />
          </div>
        )}

        <button
          onClick={sendRequest}
          disabled={loading}
          className={cn(
            'inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-bold text-white transition-colors',
            loading ? 'cursor-not-allowed bg-zinc-800 text-zinc-500' : 'hover:opacity-95',
            method === 'GET' && 'bg-emerald-500',
            method === 'POST' && 'bg-sky-500',
            method === 'PUT' && 'bg-amber-500',
            method === 'PATCH' && 'bg-violet-500',
            method === 'DELETE' && 'bg-red-500',
          )}
        >
          {loading ? '⏳ Enviando...' : `▶ Enviar ${method} Request`}
        </button>
      </div>

      {result && (
        <div className={cn('mb-5 overflow-hidden rounded-xl border', statusTone(result.status).border)}>
          <div className={cn('flex items-center justify-between px-4 py-3', statusTone(result.status).bg)}>
            <div className="flex items-center gap-3">
              <span className={cn('font-mono text-lg font-black', statusTone(result.status).text)}>{result.status}</span>
              <span className="font-semibold text-zinc-100">{result.statusText}</span>
            </div>
            <span className="font-mono text-xs text-zinc-500">{Math.round(result.time)}ms</span>
          </div>
          <pre className="m-0 whitespace-pre-wrap px-4 py-4 font-mono text-sm leading-relaxed text-zinc-400">{JSON.stringify(result.body, null, 2)}</pre>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <div className="mb-2 text-xs font-bold tracking-widest text-zinc-600">HISTORIAL</div>
          <div className="grid gap-2">
            {history.map((h, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-500">
                <span className={cn('min-w-12 font-bold', methodTone(h.method).text)}>{h.method}</span>
                <span className="flex-1 text-zinc-400">{h.endpoint}</span>
                <span className={cn('font-bold', statusTone(h.status).text)}>{h.status}</span>
                <span>{h.time}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
