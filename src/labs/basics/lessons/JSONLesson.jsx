import { useState } from 'react'
import { cn } from '../../../utils/cn.js'

export default function JSONLesson() {
  const [jsonInput, setJsonInput] = useState(`{
  "nombre": "Daniel",
  "edad": 28,
  "empresa": {
    "nombre": "Whitelabel SAS",
    "servicios": ["AI Agents", "Automatización", "Software"]
  },
  "activo": true,
  "telefono": null
}`)
  const [parseResult, setParseResult] = useState(null)
  const [showTypes, setShowTypes] = useState(false)

  function analyzeTypes(obj, prefix = '') {
    const types = []
    for (const [key, val] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key
      if (val === null) types.push({ path, type: 'null', val: 'null', colorClass: 'text-zinc-400' })
      else if (Array.isArray(val)) types.push({ path, type: 'array', val: `[${val.length} items]`, colorClass: 'text-pink-300' })
      else if (typeof val === 'object') {
        types.push({ path, type: 'object', val: '{...}', colorClass: 'text-violet-300' })
        types.push(...analyzeTypes(val, path))
      } else if (typeof val === 'string') types.push({ path, type: 'string', val: `"${val}"`, colorClass: 'text-emerald-300' })
      else if (typeof val === 'number') types.push({ path, type: 'number', val: String(val), colorClass: 'text-sky-300' })
      else if (typeof val === 'boolean') types.push({ path, type: 'boolean', val: String(val), colorClass: 'text-amber-300' })
    }
    return types
  }

  function tryParse() {
    try {
      const parsed = JSON.parse(jsonInput)
      setParseResult({ valid: true, data: parsed, types: analyzeTypes(parsed) })
    } catch (e) {
      setParseResult({ valid: false, error: e.message })
    }
  }

  const dataTypes = [
    { type: 'string', example: '"texto"', colorClass: 'text-emerald-300', desc: 'Texto entre comillas dobles' },
    { type: 'number', example: '42, 3.14', colorClass: 'text-sky-300', desc: 'Enteros o decimales, SIN comillas' },
    { type: 'boolean', example: 'true / false', colorClass: 'text-amber-300', desc: 'Verdadero o falso, SIN comillas' },
    { type: 'null', example: 'null', colorClass: 'text-zinc-400', desc: 'Ausencia de valor, SIN comillas' },
    { type: 'array', example: '[1, "a", true]', colorClass: 'text-pink-300', desc: 'Lista ordenada de valores' },
    { type: 'object', example: '{"key": "val"}', colorClass: 'text-violet-300', desc: 'Pares clave-valor (diccionario)' },
  ]

  return (
    <div>
      <p className="mb-3 text-sm leading-relaxed text-zinc-400">
        JSON (JavaScript Object Notation) es el <strong className="text-zinc-100">formato universal</strong> para enviar y recibir datos en APIs. Es legible por humanos y por máquinas.
      </p>

      <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {dataTypes.map((d) => (
          <div key={d.type} className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
            <div className={cn('font-mono text-sm font-extrabold', d.colorClass)}>{d.type}</div>
            <div className="my-1 font-mono text-xs text-zinc-100">{d.example}</div>
            <div className="text-[11px] text-zinc-500">{d.desc}</div>
          </div>
        ))}
      </div>

      <div className="mb-2 text-xs font-bold tracking-widest text-amber-400">🧪 EDITOR INTERACTIVO — Editá y validá JSON</div>
      <textarea
        value={jsonInput}
        onChange={(e) => {
          setJsonInput(e.target.value)
          setParseResult(null)
        }}
        className="min-h-40 w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-sm leading-relaxed text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70"
        spellCheck={false}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={tryParse}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-500 px-4 text-sm font-bold text-white transition-colors hover:bg-indigo-400"
        >
          ✓ Validar JSON
        </button>
        <button
          onClick={() => setShowTypes(!showTypes)}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-800"
        >
          {showTypes ? 'Ocultar' : 'Mostrar'} tipos
        </button>
      </div>

      {parseResult && (
        <div
          className={cn(
            'mt-3 rounded-xl border px-4 py-4',
            parseResult.valid ? 'border-emerald-400/30 bg-emerald-500/10' : 'border-red-400/30 bg-red-500/10',
          )}
        >
          {parseResult.valid ? (
            <>
              <div className="mb-2 font-bold text-emerald-400">✅ JSON válido</div>
              {showTypes && (
                <div className="grid gap-1">
                  {parseResult.types.map((t, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-3 font-mono text-xs">
                      <span className="min-w-44 text-zinc-500">{t.path}</span>
                      <span className={cn('min-w-16 font-bold', t.colorClass)}>{t.type}</span>
                      <span className="text-zinc-400">{t.val}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="mb-1 font-bold text-red-400">❌ JSON inválido</div>
              <div className="font-mono text-xs text-red-200">{parseResult.error}</div>
            </>
          )}
        </div>
      )}

      <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-4">
        <div className="mb-2 text-xs font-bold tracking-widest text-red-400">⚠️ ERRORES COMUNES EN JSON</div>
        <div className="text-sm leading-loose text-zinc-400">
          <span className="font-mono text-red-300">{'{ nombre: "test" }'}</span> → Las keys SIEMPRE van con comillas dobles<br />
          <span className="font-mono text-red-300">{'{ "a": \'test\' }'}</span> → Comillas DOBLES, nunca simples<br />
          <span className="font-mono text-red-300">{'{ "a": 1, }'}</span> → No se permite coma al final (trailing comma)<br />
          <span className="font-mono text-red-300">{'{ "a": undefined }'}</span> → No existe undefined en JSON, usá null
        </div>
      </div>
    </div>
  )
}
