import { useState } from 'react'
import { cn } from '../../../utils/cn.js'
import { statusTone } from '../../../utils/tone.js'

export default function StatusLesson() {
  const [selected, setSelected] = useState(null)

  const codes = [
    { code: 200, text: 'OK', emoji: '✅', desc: 'Todo salió bien. El servidor procesó tu petición y devolvió los datos.' },
    { code: 201, text: 'Created', emoji: '🎉', desc: 'Se creó un recurso nuevo exitosamente. Típico de un POST.' },
    { code: 204, text: 'No Content', emoji: '🤫', desc: 'Éxito, pero no hay nada que devolver. Común en DELETE.' },
    { code: 301, text: 'Moved Permanently', emoji: '📍', desc: 'El recurso se movió a otra URL permanentemente. Actualizá tus enlaces.' },
    { code: 304, text: 'Not Modified', emoji: '📦', desc: 'El recurso no cambió desde tu última petición. Usá tu cache.' },
    { code: 400, text: 'Bad Request', emoji: '🤦', desc: 'Tu petición tiene errores. Revisá el body, los parámetros o el formato.' },
    { code: 401, text: 'Unauthorized', emoji: '🔒', desc: 'No proporcionaste credenciales. Necesitás autenticarte.' },
    { code: 403, text: 'Forbidden', emoji: '🚫', desc: 'Tenés credenciales pero NO permiso para este recurso.' },
    { code: 404, text: 'Not Found', emoji: '🔍', desc: 'El recurso no existe. Revisá la URL.' },
    { code: 429, text: 'Too Many Requests', emoji: '🚦', desc: 'Enviaste demasiadas peticiones. Esperá antes de reintentar (rate limit).' },
    { code: 500, text: 'Internal Server Error', emoji: '💥', desc: 'El servidor explotó. No es tu culpa — es un bug del backend.' },
    { code: 502, text: 'Bad Gateway', emoji: '🔗', desc: 'El servidor intermedio (proxy/gateway) recibió una respuesta inválida.' },
    { code: 503, text: 'Service Unavailable', emoji: '🔧', desc: 'El servidor está caído o en mantenimiento. Reintentá después.' },
  ]

  return (
    <div>
      <p className="mb-4 text-sm leading-relaxed text-zinc-400">
        Los códigos de estado te dicen <strong className="text-zinc-100">qué pasó</strong> con tu petición. La regla de oro:
      </p>

      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { range: '2xx', label: 'Éxito', tone: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-400/20' }, emoji: '✅' },
          { range: '3xx', label: 'Redirección', tone: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-400/20' }, emoji: '↗️' },
          { range: '4xx', label: 'Error tuyo', tone: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-400/20' }, emoji: '🤦' },
          { range: '5xx', label: 'Error servidor', tone: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-400/20' }, emoji: '💥' },
        ].map((f) => (
          <div key={f.range} className={cn('rounded-xl border px-3 py-3 text-center', f.tone.bg, f.tone.border)}>
            <div className="text-lg">{f.emoji}</div>
            <div className={cn('font-mono text-base font-extrabold', f.tone.text)}>{f.range}</div>
            <div className="text-[11px] text-zinc-500">{f.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {codes.map((c) => (
          <button
            key={c.code}
            onClick={() => setSelected(selected === c.code ? null : c.code)}
            className={cn(
              'rounded-xl border px-3 py-3 text-left transition-colors',
              selected === c.code ? cn(statusTone(c.code).bg, statusTone(c.code).border) : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800',
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{c.emoji}</span>
              <span className={cn('font-mono text-sm font-extrabold', statusTone(c.code).text)}>{c.code}</span>
            </div>
            <div className="mt-1 text-[11px] text-zinc-500">{c.text}</div>
          </button>
        ))}
      </div>

      {selected && (() => {
        const c = codes.find((x) => x.code === selected)
        return (
          <div className={cn('mt-4 rounded-xl border px-5 py-5', statusTone(c.code).bg, statusTone(c.code).border)}>
            <div className="mb-2 flex items-center gap-3">
              <span className="text-2xl">{c.emoji}</span>
              <span className={cn('font-mono text-2xl font-black', statusTone(c.code).text)}>{c.code}</span>
              <span className="font-semibold text-zinc-100">{c.text}</span>
            </div>
            <div className="text-sm leading-relaxed text-zinc-400">{c.desc}</div>
          </div>
        )
      })()}
    </div>
  )
}
