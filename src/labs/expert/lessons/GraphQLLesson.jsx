import { useState } from 'react'
import { cn } from '../../../utils/cn.js'

export default function GraphQLLesson() {
  const [activeTab, setActiveTab] = useState('compare')
  const [queryResult, setQueryResult] = useState(null)
  const [gqlQuery, setGqlQuery] = useState(`query {
  user(id: 1) {
    name
    email
    orders {
      id
      total
      items {
        name
        price
      }
    }
  }
}`)

  function simulateGQL() {
    setQueryResult({
      data: {
        user: {
          name: 'Daniel',
          email: 'daniel@whitelabel.lat',
          orders: [
            { id: 42, total: 29900, items: [{ name: 'Plan Pro', price: 299 }, { name: 'Add-on AI', price: 99 }] },
            { id: 43, total: 9900, items: [{ name: 'Soporte Premium', price: 99 }] },
          ],
        },
      },
    })
  }

  const comparisons = [
    { aspect: 'Estructura', rest: 'Múltiples endpoints fijos', graphql: 'Un solo endpoint, query flexible', winner: 'graphql' },
    { aspect: 'Over-fetching', rest: 'GET /user devuelve 50 campos (usás 3)', graphql: 'Pedís solo name, email — nada más', winner: 'graphql' },
    { aspect: 'Under-fetching', rest: 'GET /user + GET /orders + GET /items (3 requests)', graphql: 'Una sola query trae todo el árbol', winner: 'graphql' },
    { aspect: 'Caché', rest: 'HTTP cache nativo (ETags, CDN) — excelente', graphql: 'Complejo, necesita normalization (Apollo)', winner: 'rest' },
    { aspect: 'Versionamiento', rest: '/v1/users, /v2/users — simple', graphql: 'No hay versiones, campos se deprecan', winner: 'tie' },
    { aspect: 'Tiempo real', rest: 'Polling o WebSockets aparte', graphql: 'Subscriptions nativos', winner: 'graphql' },
    { aspect: 'Curva de aprendizaje', rest: 'Todo el mundo lo conoce', graphql: 'Schema, resolvers, types — más setup', winner: 'rest' },
    { aspect: 'Herramientas', rest: 'Postman, curl, browser — universal', graphql: 'Apollo, Relay, GraphiQL — ecosistema propio', winner: 'tie' },
    { aspect: 'Upload de archivos', rest: 'multipart/form-data — nativo', graphql: 'Requiere spec aparte (no estándar)', winner: 'rest' },
    { aspect: 'Microservicios', rest: 'Un gateway rutea por path', graphql: 'Federation (Apollo) unifica schemas', winner: 'tie' },
  ]

  return (
    <div>
      <p className="mb-5 text-sm leading-relaxed text-zinc-400">
        REST y GraphQL no compiten — resuelven problemas distintos. La pregunta no es "cuál es mejor" sino{' '}
        <strong className="text-zinc-100">cuál encaja en tu caso</strong>.
      </p>

      <div className="mb-5 flex flex-wrap gap-2">
        {[{ id: 'compare', label: 'Comparación' }, { id: 'playground', label: 'GraphQL Playground' }, { id: 'decision', label: '¿Cuál usar?' }].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
              activeTab === t.id ? 'bg-zinc-900 text-zinc-100 ring-1 ring-indigo-500/60' : 'text-zinc-500 hover:bg-zinc-900',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'compare' && (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
          <div className="grid grid-cols-[120px_1fr_1fr] bg-zinc-900 px-4 py-2 text-[11px] font-bold text-zinc-500">
            <span>ASPECTO</span>
            <span className="text-sky-300">REST</span>
            <span className="text-fuchsia-300">GRAPHQL</span>
          </div>
          {comparisons.map((c, i) => (
            <div key={i} className="grid grid-cols-[120px_1fr_1fr] items-center border-t border-zinc-800 px-4 py-3">
              <span className="text-sm font-semibold text-zinc-500">{c.aspect}</span>
              <span className={cn('text-sm', c.winner === 'rest' ? 'font-bold text-sky-300' : 'text-zinc-400')}>
                {c.winner === 'rest' ? '✅ ' : ''}
                {c.rest}
              </span>
              <span className={cn('text-sm', c.winner === 'graphql' ? 'font-bold text-fuchsia-300' : 'text-zinc-400')}>
                {c.winner === 'graphql' ? '✅ ' : ''}
                {c.graphql}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'playground' && (
        <div>
          <div className="mb-2 text-xs font-bold tracking-widest text-zinc-500">QUERY GRAPHQL</div>
          <div className="grid gap-3 lg:grid-cols-2">
            <div>
              <textarea
                value={gqlQuery}
                onChange={(e) => setGqlQuery(e.target.value)}
                className="min-h-56 w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-xs leading-relaxed text-fuchsia-300 outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500/70"
                spellCheck={false}
              />
              <button
                onClick={simulateGQL}
                className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-fuchsia-300 px-5 text-sm font-black text-zinc-950 transition-colors hover:bg-fuchsia-200"
              >
                ▶ Ejecutar Query
              </button>
              <div className="mt-2 text-xs text-zinc-600">
                Con REST necesitarías 3 requests separados para obtener estos mismos datos.
              </div>
            </div>
            <div>
              <div className="mb-2 text-[11px] font-bold tracking-widest text-zinc-500">RESPONSE</div>
              <pre className="m-0 min-h-56 overflow-auto whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-xs leading-relaxed text-zinc-400">
                {queryResult ? JSON.stringify(queryResult, null, 2) : "// Ejecutá la query para ver el resultado\n// Solo devuelve los campos que pediste\n// — sin over-fetching."}
              </pre>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'decision' && (
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 p-5">
            <div className="mb-3 text-base font-black text-sky-300">Usá REST cuando...</div>
            <div className="text-sm leading-loose text-zinc-300">
              ✅ Tu API es pública (documentación simple)<br />
              ✅ Necesitás caché HTTP agresivo<br />
              ✅ Tenés recursos con operaciones CRUD claras<br />
              ✅ El equipo no tiene experiencia con GraphQL<br />
              ✅ Subís archivos frecuentemente<br />
              ✅ Usás microservicios con gateway simple<br />
              <div className="mt-3 text-xs font-bold text-sky-300">
                Ejemplos: Stripe, GitHub API, WhatsApp Business API
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-fuchsia-300/20 bg-fuchsia-500/10 p-5">
            <div className="mb-3 text-base font-black text-fuchsia-300">Usá GraphQL cuando...</div>
            <div className="text-sm leading-loose text-zinc-300">
              ✅ Tu frontend necesita datos muy variados<br />
              ✅ Tenés mobile + web con necesidades distintas<br />
              ✅ Hay relaciones complejas entre entidades<br />
              ✅ Querés evitar N+1 requests<br />
              ✅ Necesitás subscriptions (tiempo real)<br />
              ✅ Tu schema evoluciona rápido<br />
              <div className="mt-3 text-xs font-bold text-fuchsia-300">
                Ejemplos: GitHub GraphQL API, Shopify, Facebook
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
