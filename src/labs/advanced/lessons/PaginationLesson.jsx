import { useEffect, useState } from 'react'
import { cn } from '../../../utils/cn.js'
import { toneFromHex } from '../../../utils/tone.js'

export default function PaginationLesson() {
  const [paginationType, setPaginationType] = useState('offset')
  const [currentPage, setCurrentPage] = useState(1)
  const [cursor, setCursor] = useState(null)

  const allItems = Array.from({ length: 47 }, (_, i) => ({ id: i + 1, nombre: `Usuario ${i + 1}`, email: `user${i + 1}@test.com` }))
  const pageSize = 5

  const types = {
    offset: {
      name: 'Offset-Based',
      icon: '📃',
      color: '#3b82f6',
      pros: 'Simple, puedes saltar a cualquier página',
      cons: 'Si se insertan datos, se repiten o saltan items. Lento en tablas grandes (OFFSET 10000).',
      request: `GET /usuarios?page=${currentPage}&limit=${pageSize}`,
      response: () => {
        const start = (currentPage - 1) * pageSize
        const items = allItems.slice(start, start + pageSize)
        return { data: items, pagination: { page: currentPage, limit: pageSize, total: allItems.length, pages: Math.ceil(allItems.length / pageSize) } }
      },
    },
    cursor: {
      name: 'Cursor-Based',
      icon: '🔗',
      color: '#10b981',
      pros: 'Consistente con datos cambiantes, eficiente en bases de datos grandes',
      cons: 'No puedes saltar a una página arbitraria. Solo avance/retroceso.',
      request: `GET /usuarios?limit=${pageSize}${cursor ? `&after=${cursor}` : ''}`,
      response: () => {
        const startIdx = cursor ? allItems.findIndex((i) => i.id === cursor) + 1 : 0
        const items = allItems.slice(startIdx, startIdx + pageSize)
        const nextCursor = items.length === pageSize ? items[items.length - 1].id : null
        return { data: items, pagination: { next_cursor: nextCursor, has_more: nextCursor !== null } }
      },
    },
    keyset: {
      name: 'Keyset (Seek)',
      icon: '⚡',
      color: '#f59e0b',
      pros: 'El más eficiente para bases de datos enormes (millones de registros). Usa índices.',
      cons: 'Requiere un campo ordenable y único. No soporta saltos.',
      request: `GET /usuarios?limit=${pageSize}&id_gt=${cursor || 0}`,
      response: () => {
        const startIdx = cursor ? allItems.findIndex((i) => i.id === cursor) + 1 : 0
        const items = allItems.slice(startIdx, startIdx + pageSize)
        return { data: items, sql_equivalent: `SELECT * FROM users WHERE id > ${cursor || 0} ORDER BY id LIMIT ${pageSize}` }
      },
    },
  }

  const activeType = types[paginationType]

  function nextPage() {
    if (paginationType === 'offset') {
      setCurrentPage((p) => Math.min(p + 1, Math.ceil(allItems.length / pageSize)))
    } else {
      const res = activeType.response()
      if (res.data.length > 0) setCursor(res.data[res.data.length - 1].id)
    }
  }

  function prevPage() {
    if (paginationType === 'offset') setCurrentPage((p) => Math.max(1, p - 1))
  }

  function resetPagination() {
    setCurrentPage(1)
    setCursor(null)
  }

  useEffect(() => {
    resetPagination()
  }, [paginationType])

  const response = activeType.response()

  return (
    <div>
      <p className="mb-5 text-sm leading-relaxed text-zinc-400">
        Cuando una API tiene miles de registros, no te los manda todos juntos. La <strong className="text-zinc-100">paginación</strong> divide los resultados en bloques manejables. Hay 3 estrategias principales.
      </p>

      <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {Object.entries(types).map(([key, t]) => (
          <button
            key={key}
            onClick={() => setPaginationType(key)}
            className={cn(
              'rounded-xl border-2 px-4 py-4 text-center transition-colors',
              paginationType === key ? cn(toneFromHex(t.color).bg, toneFromHex(t.color).border) : 'border-zinc-800 hover:bg-zinc-900',
            )}
          >
            <div className="text-2xl">{t.icon}</div>
            <div className={cn('mt-1 text-xs font-bold', toneFromHex(t.color).text)}>{t.name}</div>
          </button>
        ))}
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
          <div className="mb-1 text-[11px] font-bold text-emerald-300">✅ PROS</div>
          <div className="text-sm text-zinc-300">{activeType.pros}</div>
        </div>
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4">
          <div className="mb-1 text-[11px] font-bold text-red-300">⚠️ CONTRAS</div>
          <div className="text-sm text-zinc-300">{activeType.cons}</div>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="mb-1 text-[11px] font-bold text-zinc-500">REQUEST</div>
        <div className={cn('mb-4 font-mono text-sm', toneFromHex(activeType.color).text)}>{activeType.request}</div>
        <div className="mb-1 text-[11px] font-bold text-zinc-500">RESPONSE</div>
        <pre className="m-0 whitespace-pre-wrap font-mono text-xs leading-relaxed text-zinc-400">{JSON.stringify(response, null, 2)}</pre>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {paginationType === 'offset' && (
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className={cn(
              'inline-flex h-9 items-center justify-center rounded-xl border border-zinc-800 px-4 text-sm font-semibold',
              currentPage === 1 ? 'cursor-not-allowed bg-zinc-950 text-zinc-600' : 'bg-zinc-900 text-zinc-200 hover:bg-zinc-800',
            )}
          >
            ← Anterior
          </button>
        )}
        <button
          onClick={nextPage}
          disabled={response.data.length < pageSize}
          className={cn(
            'inline-flex h-9 items-center justify-center rounded-xl px-4 text-sm font-bold text-white transition-colors',
            response.data.length < pageSize
              ? 'cursor-not-allowed bg-zinc-800 text-zinc-500'
              : cn(
                  activeType.color === '#3b82f6' && 'bg-sky-500 hover:bg-sky-400',
                  activeType.color === '#10b981' && 'bg-emerald-500 hover:bg-emerald-400',
                  activeType.color === '#f59e0b' && 'bg-amber-500 hover:bg-amber-400',
                ),
          )}
        >
          Siguiente →
        </button>
        <button
          onClick={resetPagination}
          className="inline-flex h-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-800"
        >
          ⟲ Reset
        </button>
      </div>
    </div>
  )
}

