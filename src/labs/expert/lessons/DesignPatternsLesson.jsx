import { useState } from 'react'
import { cn } from '../../../utils/cn.js'
import { toneFromHex } from '../../../utils/tone.js'

export default function DesignPatternsLesson() {
  const [maturityLevel, setMaturityLevel] = useState(0)
  const [activePattern, setActivePattern] = useState(null)

  const richardsonLevels = [
    {
      level: 0, name: 'El Pantano', color: '#ef4444', icon: '🏚️',
      desc: "Un solo endpoint para todo. POST /api con un campo 'action'. Básicamente un RPC disfrazado de API.",
      example: `POST /api
{ "action": "getUser", "userId": 1 }

POST /api  
{ "action": "createOrder", "items": [...] }

POST /api
{ "action": "deleteProduct", "productId": 5 }

// Todo va al mismo endpoint — imposible de cachear,
// difícil de documentar, un caos para escalar.`,
    },
    {
      level: 1, name: 'Recursos', color: '#f59e0b', icon: '📦',
      desc: 'Cada entidad tiene su propia URL, pero aún usás un solo método (generalmente POST) para todo.',
      example: `POST /users
{ "action": "get", "id": 1 }

POST /orders
{ "action": "create", "items": [...] }

// Mejor: al menos tenés URLs separadas.
// Pero seguís usando POST para leer datos...`,
    },
    {
      level: 2, name: 'Verbos HTTP', color: '#10b981', icon: '⚡',
      desc: 'Usás los métodos HTTP correctos (GET, POST, PUT, DELETE) + status codes semánticos. Acá está el 90% de las APIs buenas.',
      example: `GET    /users/1        → 200 { name: "Daniel" }
POST   /orders         → 201 { id: 42 }
PUT    /users/1        → 200 { updated: true }
DELETE /products/5     → 204 No Content

// Status codes correctos:
// 201 para creaciones, 204 para deletes,
// 400 para errores del cliente, etc.`,
    },
    {
      level: 3, name: 'HATEOAS', color: '#6366f1', icon: '🧠',
      desc: 'El response te dice QUÉ podés hacer después. Links de navegación incluidos. El cliente no necesita hardcodear URLs.',
      example: `GET /orders/42
{
  "id": 42,
  "status": "pending",
  "total": 29900,
  "_links": {
    "self":    { "href": "/orders/42" },
    "pay":     { "href": "/orders/42/pay", "method": "POST" },
    "cancel":  { "href": "/orders/42/cancel", "method": "POST" },
    "items":   { "href": "/orders/42/items" },
    "customer": { "href": "/users/7" }
  }
}
// El cliente DESCUBRE las acciones disponibles.
// Si el pedido ya está pagado, "pay" desaparece.`,
    },
  ]

  const designPatterns = [
    {
      id: 'naming', name: 'Naming Conventions', icon: '📝', color: '#3b82f6',
      rules: [
        { good: 'GET /users/1/orders', bad: 'GET /getUserOrders?id=1', why: 'Sustantivos en plural, jerarquía en la URL' },
        { good: 'POST /users/1/avatar', bad: 'POST /uploadUserAvatar', why: 'La acción la define el método, no la URL' },
        { good: '/order-items (kebab-case)', bad: '/orderItems o /order_items', why: 'URLs en kebab-case, JSON en camelCase o snake_case' },
        { good: 'GET /users?status=active', bad: 'GET /active-users', why: 'Filtros como query params, no como endpoints separados' },
      ],
    },
    {
      id: 'envelope', name: 'Response Envelopes', icon: '📨', color: '#10b981',
      rules: [
        { good: `{ "data": [...], "meta": { "total": 100, "page": 1 } }`, bad: `[...] (array directo)`, why: 'Un envelope permite agregar metadata sin romper el contrato' },
        { good: `{ "data": { "id": 1 }, "included": { "company": {...} } }`, bad: `{ "id": 1, "company_name": "..." }`, why: 'Separar datos principales de relaciones (patrón JSON:API)' },
      ],
    },
    {
      id: 'bulk', name: 'Operaciones Bulk', icon: '📦', color: '#f59e0b',
      rules: [
        { good: `POST /users/bulk\n[{...}, {...}, {...}]`, bad: `3x POST /users (uno por uno)`, why: 'Un solo roundtrip de red vs tres. Crítico con latencia alta.' },
        { good: `Response: { "results": [\n  { "id": 1, "status": 201 },\n  { "id": null, "status": 400, "error": "..." }\n]}`, bad: `Todo falla si uno falla`, why: 'Respuestas parciales: cada item tiene su propio status.' },
      ],
    },
    {
      id: 'expand', name: 'Field Selection & Expansion', icon: '🔍', color: '#a78bfa',
      rules: [
        { good: `GET /users?fields=id,name,email`, bad: `GET /users (devuelve 50 campos)`, why: 'El cliente pide solo lo que necesita. Menos bytes, más rápido.' },
        { good: `GET /orders?expand=customer,items`, bad: `GET /order → GET /user → GET /items`, why: 'Un solo request con relaciones expandidas vs N+1 requests.' },
      ],
    },
  ]

  return (
    <div>
      <p className="mb-5 text-sm leading-relaxed text-zinc-400">
        Diseñar una API no es solo elegir GET o POST. Es crear un{' '}
        <strong className="text-zinc-100">contrato claro, consistente y evolucionable</strong>. El modelo de madurez de Richardson te dice en qué nivel estás.
      </p>

      <div className="mb-2 text-xs font-bold tracking-widest text-zinc-500">MODELO DE MADUREZ DE RICHARDSON</div>
      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {richardsonLevels.map((l) => (
          <button
            key={l.level}
            onClick={() => setMaturityLevel(l.level)}
            className={cn(
              'rounded-xl border-2 px-3 py-3 text-center transition-colors',
              maturityLevel === l.level ? cn(toneFromHex(l.color).bg, toneFromHex(l.color).border) : 'border-zinc-800 hover:bg-zinc-900',
            )}
          >
            <div className="text-2xl">{l.icon}</div>
            <div className={cn('mt-1 font-mono text-base font-black', toneFromHex(l.color).text)}>Nivel {l.level}</div>
            <div className="mt-1 text-[10px] text-zinc-500">{l.name}</div>
          </button>
        ))}
      </div>

      {(() => {
        const l = richardsonLevels[maturityLevel]
        return (
          <div className={cn('mb-6 rounded-xl border bg-zinc-950 p-5', toneFromHex(l.color).border)}>
            <div className="mb-3 flex items-center gap-3">
              <span className="text-2xl">{l.icon}</span>
              <div>
                <span className={cn('font-mono text-base font-black', toneFromHex(l.color).text)}>Nivel {l.level}</span>
                <span className="ml-2 text-sm text-zinc-500">{l.name}</span>
              </div>
            </div>
            <div className="mb-4 text-sm leading-relaxed text-zinc-300">{l.desc}</div>
            <pre className="m-0 whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 font-mono text-xs leading-relaxed text-zinc-400">
              {l.example}
            </pre>
          </div>
        )
      })()}

      <div className="mb-2 text-xs font-bold tracking-widest text-zinc-500">PATRONES DE DISEÑO PROFESIONAL</div>
      <div className="grid gap-2">
        {designPatterns.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePattern(activePattern === p.id ? null : p.id)}
            className={cn(
              'rounded-xl border px-4 py-4 text-left transition-colors',
              activePattern === p.id ? cn(toneFromHex(p.color).bg, toneFromHex(p.color).border) : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800',
            )}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{p.icon}</span>
              <span className={cn('text-sm font-bold', toneFromHex(p.color).text)}>{p.name}</span>
            </div>
            {activePattern === p.id && (
              <div className="mt-4 grid gap-2">
                {p.rules.map((r, i) => (
                  <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                    <div className="mb-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <div className="mb-1 text-[10px] font-bold tracking-widest text-emerald-300">✅ CORRECTO</div>
                        <pre className="m-0 whitespace-pre-wrap font-mono text-xs leading-relaxed text-emerald-300">{r.good}</pre>
                      </div>
                      <div>
                        <div className="mb-1 text-[10px] font-bold tracking-widest text-red-300">❌ EVITAR</div>
                        <pre className="m-0 whitespace-pre-wrap font-mono text-xs leading-relaxed text-red-300/80">{r.bad}</pre>
                      </div>
                    </div>
                    <div className="text-sm leading-relaxed text-zinc-400">💡 {r.why}</div>
                  </div>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
