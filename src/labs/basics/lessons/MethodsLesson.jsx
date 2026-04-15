import { useState } from 'react'
import { simulateAPI } from '../../../services/apiMock.js'
import { cn } from '../../../utils/cn.js'
import { methodTone, statusTone } from '../../../utils/tone.js'

export default function MethodsLesson() {
  const [activeMethod, setActiveMethod] = useState('GET')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const methods = [
    { name: 'GET', emoji: '📖', analogy: 'LEER', desc: 'Obtener datos sin modificar nada. Idempotente: podés llamarlo 100 veces y el resultado es el mismo.', example: { endpoint: 'usuarios', body: null }, realWorld: 'Ver tu perfil, cargar una lista de productos, consultar el clima' },
    { name: 'POST', emoji: '✍️', analogy: 'CREAR', desc: 'Crear un recurso nuevo. NO es idempotente: cada llamada crea algo nuevo.', example: { endpoint: 'usuarios', body: { nombre: 'Nuevo User', email: 'nuevo@test.com', rol: 'user' } }, realWorld: 'Registrar un usuario, enviar un mensaje, crear una orden' },
    { name: 'PUT', emoji: '🔄', analogy: 'ACTUALIZAR', desc: 'Reemplazar un recurso completo. Idempotente: actualizarlo 100 veces da el mismo resultado.', example: { endpoint: 'usuarios/1', body: { nombre: 'Daniel Actualizado', email: 'daniel@whitelabel.lat' } }, realWorld: 'Editar tu perfil completo, actualizar un producto' },
    { name: 'PATCH', emoji: '🩹', analogy: 'MODIFICAR', desc: 'Actualizar parcialmente un recurso. Solo enviás los campos que cambian, no todo el objeto completo.', example: { endpoint: 'usuarios/1', body: { email: 'nuevo@correo.com' } }, realWorld: 'Actualizar solo tu foto de perfil o tu contraseña' },
    { name: 'DELETE', emoji: '🗑️', analogy: 'ELIMINAR', desc: 'Borrar un recurso. Idempotente: borrar algo que ya no existe no causa error (en teoría).', example: { endpoint: 'productos/3', body: null }, realWorld: 'Eliminar un post, cancelar una suscripción, borrar un archivo' },
  ]

  const active = methods.find((m) => m.name === activeMethod)

  async function runExample() {
    setLoading(true)
    const res = await simulateAPI(active.name, active.example.endpoint, active.example.body, { Authorization: 'Bearer demo_token' })
    setResult(res)
    setLoading(false)
  }

  return (
    <div>
      <p className="mb-5 text-sm leading-relaxed text-zinc-400">
        Los métodos HTTP representan las 4 operaciones fundamentales sobre datos (<strong className="text-zinc-100">CRUD</strong>). Tocá cada uno y ejecutá el ejemplo.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {methods.map((m) => (
          <button
            key={m.name}
            onClick={() => {
              setActiveMethod(m.name)
              setResult(null)
            }}
            className={cn(
              'rounded-xl border-2 px-3 py-3 text-center transition-colors',
              activeMethod === m.name ? cn(methodTone(m.name).bg, methodTone(m.name).border) : 'border-zinc-800 hover:bg-zinc-900',
            )}
          >
            <div className="text-2xl">{m.emoji}</div>
            <div className={cn('mt-1 font-mono text-sm font-extrabold', methodTone(m.name).text)}>{m.name}</div>
            <div className="mt-1 text-[11px] text-zinc-500">{m.analogy}</div>
          </button>
        ))}
      </div>

      <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
        <div className="mb-4 text-sm leading-relaxed text-zinc-100">{active.desc}</div>

        <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-4 font-mono text-sm text-zinc-300">
          <span className={cn('font-bold', methodTone(active.name).text)}>{active.name}</span>{' '}
          <span className="text-zinc-500">https://api.ejemplo.com/</span>
          <span className="text-zinc-100">{active.example.endpoint}</span>
          {active.example.body && <div className="mt-3 text-amber-300">Body: {JSON.stringify(active.example.body, null, 2)}</div>}
        </div>

        <div className="mb-4 text-sm text-zinc-500">
          <strong className="text-zinc-400">Uso real:</strong> {active.realWorld}
        </div>

        <button
          onClick={runExample}
          disabled={loading}
          className={cn(
            'inline-flex h-10 items-center justify-center rounded-xl px-5 text-sm font-bold text-white transition-colors',
            loading ? 'cursor-wait opacity-70' : 'hover:opacity-95',
            active.name === 'GET' && 'bg-emerald-500',
            active.name === 'POST' && 'bg-sky-500',
            active.name === 'PUT' && 'bg-amber-500',
            active.name === 'PATCH' && 'bg-violet-500',
            active.name === 'DELETE' && 'bg-red-500',
          )}
        >
          {loading ? '⏳ Enviando...' : `▶ Ejecutar ${active.name}`}
        </button>
      </div>

      {result && (
        <div className={cn('rounded-xl border border-zinc-800 bg-zinc-950 p-4 border-l-4', statusTone(result.status).border)}>
          <div className="mb-3 flex items-center justify-between">
            <span className={cn('font-mono font-bold', statusTone(result.status).text)}>
              {result.status} {result.statusText}
            </span>
            <span className="text-xs text-zinc-500">{Math.round(result.time)}ms</span>
          </div>
          <pre className="m-0 whitespace-pre-wrap font-mono text-sm leading-relaxed text-zinc-400">{JSON.stringify(result.body, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
