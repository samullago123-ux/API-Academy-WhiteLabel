import { useState } from 'react'
import { cn } from '../../../utils/cn.js'

export default function AnatomyLesson() {
  const [hoveredPart, setHoveredPart] = useState(null)

  const parts = [
    { id: 'method', text: 'GET', tone: { text: 'text-pink-300', border: 'border-pink-400/60', bg: 'bg-pink-500/20' }, label: 'MÉTODO', desc: "La acción que querés hacer. GET = leer datos. Como decirle al mesero: 'quiero ver el menú'." },
    { id: 'protocol', text: 'https://', tone: { text: 'text-zinc-500', border: 'border-zinc-600/60', bg: 'bg-zinc-500/15' }, label: 'PROTOCOLO', desc: 'El idioma de comunicación. HTTPS = encriptado y seguro. Como hablar en código para que nadie espíe.' },
    { id: 'host', text: 'api.whitelabel.lat', tone: { text: 'text-sky-300', border: 'border-sky-400/60', bg: 'bg-sky-500/20' }, label: 'HOST', desc: 'El servidor (la cocina del restaurante). Es a DÓNDE va tu petición.' },
    { id: 'path', text: '/v1/usuarios', tone: { text: 'text-violet-300', border: 'border-violet-400/60', bg: 'bg-violet-500/20' }, label: 'PATH (RUTA)', desc: "El recurso específico. '/v1' es la versión de la API. '/usuarios' es QUÉ estás pidiendo." },
    { id: 'query', text: '?rol=admin&limit=10', tone: { text: 'text-amber-300', border: 'border-amber-400/60', bg: 'bg-amber-500/20' }, label: 'QUERY PARAMS', desc: "Filtros opcionales. Como decir: 'solo los que sean admin, y máximo 10 resultados'." },
  ]

  return (
    <div>
      <p className="mb-6 text-sm leading-relaxed text-zinc-400">
        Cada request HTTP es como una oración: tiene sujeto, verbo y complementos. Tocá cada parte para entender qué hace.
      </p>

      <div className="mb-5 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-6">
        <div className="flex flex-wrap font-mono text-base">
          {parts.map((p) => (
            <span
              key={p.id}
              onMouseEnter={() => setHoveredPart(p.id)}
              onMouseLeave={() => setHoveredPart(null)}
              onClick={() => setHoveredPart(hoveredPart === p.id ? null : p.id)}
              className={cn(
                'cursor-pointer rounded border-b-2 px-1 py-1 transition-colors',
                p.id === 'method' && 'mr-3',
                hoveredPart === p.id ? cn('text-white', p.tone.bg, p.tone.border) : cn(p.tone.text, 'border-transparent'),
              )}
            >
              {p.text}
            </span>
          ))}
        </div>
      </div>

      {hoveredPart && (() => {
        const p = parts.find((x) => x.id === hoveredPart)
        return (
          <div className={cn('mb-4 rounded-xl border px-5 py-5', p.tone.bg, p.tone.border)}>
            <div className={cn('mb-2 text-xs font-bold tracking-[0.2em]', p.tone.text)}>{p.label}</div>
            <div className="text-sm leading-relaxed text-zinc-100">{p.desc}</div>
          </div>
        )
      })()}

      <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-5">
        <div className="mb-3 text-xs font-bold tracking-widest text-amber-400">💡 ANALOGÍA COMPLETA</div>
        <div className="text-sm leading-relaxed text-zinc-400">
          <strong className="text-pink-300">GET</strong> → "Quiero ver" &nbsp;|&nbsp;
          <strong className="text-sky-300">api.whitelabel.lat</strong> → "el restaurante" &nbsp;|&nbsp;
          <strong className="text-violet-300">/v1/usuarios</strong> → "la carta de usuarios" &nbsp;|&nbsp;
          <strong className="text-amber-300">?rol=admin</strong> → "solo los administradores"
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-5">
        <div className="mb-3 text-xs font-bold tracking-widest text-emerald-400">🔄 EL CICLO COMPLETO</div>
        <div className="flex flex-wrap items-center justify-center gap-3 py-3">
          {['Tu App', '→ Request →', 'Servidor API', '→ Procesa →', 'Base de Datos', '→ Response →', 'Tu App'].map((step, i) => (
            <div
              key={i}
              className={cn('rounded-lg px-3 py-2 text-xs', i % 2 === 0 ? 'bg-zinc-800 font-semibold text-zinc-100' : 'font-mono text-indigo-300')}
            >
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
