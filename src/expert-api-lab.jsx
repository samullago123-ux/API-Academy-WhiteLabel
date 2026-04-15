import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ─── UTILS ───
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getStatusColor(c) {
  if (c >= 200 && c < 300) return "#10b981";
  if (c >= 400 && c < 500) return "#f59e0b";
  return "#ef4444";
}

// ─── LESSONS CONFIG ───
const LESSONS = [
  { id: "design", title: "API Design Patterns", icon: "🏛️", desc: "REST maduro, HATEOAS y diseño profesional" },
  { id: "graphql", title: "GraphQL vs REST", icon: "🔮", desc: "Cuándo usar cada uno y por qué" },
  { id: "eventdriven", title: "Event-Driven", icon: "⚡", desc: "Colas, pub/sub y arquitecturas asíncronas" },
  { id: "security", title: "Seguridad Avanzada", icon: "🛡️", desc: "OWASP API Top 10, CORS, CSP y hardening" },
  { id: "performance", title: "Performance & Cache", icon: "🚀", desc: "Redis, CDN, ETags y optimización" },
  { id: "openapi", title: "OpenAPI & Docs", icon: "📋", desc: "Contratos, SDK generation y testing" },
  { id: "distributed", title: "Sistemas Distribuidos", icon: "🌐", desc: "CAP, consistencia eventual y sagas" },
  { id: "realworld", title: "Caso Real: Sistema", icon: "🏗️", desc: "Diseñá una arquitectura completa" },
  { id: "quiz", title: "Quiz Experto", icon: "🏆", desc: "20 preguntas de nivel senior" },
];

// ─── API DESIGN PATTERNS LESSON ───
function DesignPatternsLesson() {
  const [maturityLevel, setMaturityLevel] = useState(0);
  const [activePattern, setActivePattern] = useState(null);

  const richardsonLevels = [
    {
      level: 0, name: "El Pantano", color: "#ef4444", icon: "🏚️",
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
      level: 1, name: "Recursos", color: "#f59e0b", icon: "📦",
      desc: "Cada entidad tiene su propia URL, pero aún usás un solo método (generalmente POST) para todo.",
      example: `POST /users
{ "action": "get", "id": 1 }

POST /orders
{ "action": "create", "items": [...] }

// Mejor: al menos tenés URLs separadas.
// Pero seguís usando POST para leer datos...`,
    },
    {
      level: 2, name: "Verbos HTTP", color: "#10b981", icon: "⚡",
      desc: "Usás los métodos HTTP correctos (GET, POST, PUT, DELETE) + status codes semánticos. Acá está el 90% de las APIs buenas.",
      example: `GET    /users/1        → 200 { name: "Daniel" }
POST   /orders         → 201 { id: 42 }
PUT    /users/1        → 200 { updated: true }
DELETE /products/5     → 204 No Content

// Status codes correctos:
// 201 para creaciones, 204 para deletes,
// 400 para errores del cliente, etc.`,
    },
    {
      level: 3, name: "HATEOAS", color: "#6366f1", icon: "🧠",
      desc: "El response te dice QUÉ podés hacer después. Links de navegación incluidos. El cliente no necesita hardcodear URLs.",
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
  ];

  const designPatterns = [
    {
      id: "naming", name: "Naming Conventions", icon: "📝", color: "#3b82f6",
      rules: [
        { good: "GET /users/1/orders", bad: "GET /getUserOrders?id=1", why: "Sustantivos en plural, jerarquía en la URL" },
        { good: "POST /users/1/avatar", bad: "POST /uploadUserAvatar", why: "La acción la define el método, no la URL" },
        { good: "/order-items (kebab-case)", bad: "/orderItems o /order_items", why: "URLs en kebab-case, JSON en camelCase o snake_case" },
        { good: "GET /users?status=active", bad: "GET /active-users", why: "Filtros como query params, no como endpoints separados" },
      ],
    },
    {
      id: "envelope", name: "Response Envelopes", icon: "📨", color: "#10b981",
      rules: [
        { good: `{ "data": [...], "meta": { "total": 100, "page": 1 } }`, bad: `[...] (array directo)`, why: "Un envelope permite agregar metadata sin romper el contrato" },
        { good: `{ "data": { "id": 1 }, "included": { "company": {...} } }`, bad: `{ "id": 1, "company_name": "..." }`, why: "Separar datos principales de relaciones (patrón JSON:API)" },
      ],
    },
    {
      id: "bulk", name: "Operaciones Bulk", icon: "📦", color: "#f59e0b",
      rules: [
        { good: `POST /users/bulk\n[{...}, {...}, {...}]`, bad: `3x POST /users (uno por uno)`, why: "Un solo roundtrip de red vs tres. Crítico con latencia alta." },
        { good: `Response: { "results": [\n  { "id": 1, "status": 201 },\n  { "id": null, "status": 400, "error": "..." }\n]}`, bad: `Todo falla si uno falla`, why: "Respuestas parciales: cada item tiene su propio status." },
      ],
    },
    {
      id: "expand", name: "Field Selection & Expansion", icon: "🔍", color: "#a78bfa",
      rules: [
        { good: `GET /users?fields=id,name,email`, bad: `GET /users (devuelve 50 campos)`, why: "El cliente pide solo lo que necesita. Menos bytes, más rápido." },
        { good: `GET /orders?expand=customer,items`, bad: `GET /order → GET /user → GET /items`, why: "Un solo request con relaciones expandidas vs N+1 requests." },
      ],
    },
  ];

  return (
    <div>
      <p style={{ color: "#a1a1aa", marginBottom: 20, fontSize: 15, lineHeight: 1.7 }}>
        Diseñar una API no es solo elegir GET o POST. Es crear un <strong style={{ color: "#e4e4e7" }}>contrato claro, consistente y evolucionable</strong>. El modelo de madurez de Richardson te dice en qué nivel estás.
      </p>

      <div style={{ color: "#71717a", fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>MODELO DE MADUREZ DE RICHARDSON</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 }}>
        {richardsonLevels.map((l) => (
          <button key={l.level} onClick={() => setMaturityLevel(l.level)} style={{
            background: maturityLevel === l.level ? l.color + "15" : "transparent",
            border: `2px solid ${maturityLevel === l.level ? l.color : "#27272a"}`,
            borderRadius: 12, padding: "14px 8px", cursor: "pointer", textAlign: "center", transition: "all 0.2s",
          }}>
            <div style={{ fontSize: 22, marginBottom: 2 }}>{l.icon}</div>
            <div style={{ color: l.color, fontWeight: 800, fontSize: 16, fontFamily: "monospace" }}>Nivel {l.level}</div>
            <div style={{ color: "#52525b", fontSize: 10, marginTop: 2 }}>{l.name}</div>
          </button>
        ))}
      </div>

      {(() => {
        const l = richardsonLevels[maturityLevel];
        return (
          <div style={{ background: "#09090b", borderRadius: 12, padding: 20, border: `1px solid ${l.color}33`, marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>{l.icon}</span>
              <div>
                <span style={{ color: l.color, fontWeight: 800, fontSize: 16, fontFamily: "monospace" }}>Nivel {l.level}</span>
                <span style={{ color: "#52525b", fontSize: 14, marginLeft: 10 }}>{l.name}</span>
              </div>
            </div>
            <div style={{ color: "#a1a1aa", fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>{l.desc}</div>
            <pre style={{ background: "#18181b", borderRadius: 8, padding: 14, margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#a1a1aa", whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
              {l.example}
            </pre>
          </div>
        );
      })()}

      <div style={{ color: "#71717a", fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>PATRONES DE DISEÑO PROFESIONAL</div>
      <div style={{ display: "grid", gap: 8 }}>
        {designPatterns.map((p) => (
          <button key={p.id} onClick={() => setActivePattern(activePattern === p.id ? null : p.id)} style={{
            background: activePattern === p.id ? p.color + "10" : "#18181b",
            border: `1px solid ${activePattern === p.id ? p.color + "44" : "#27272a"}`,
            borderRadius: 10, padding: "14px 16px", cursor: "pointer", textAlign: "left", transition: "all 0.2s",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>{p.icon}</span>
              <span style={{ color: p.color, fontWeight: 700, fontSize: 14 }}>{p.name}</span>
            </div>
            {activePattern === p.id && (
              <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
                {p.rules.map((r, i) => (
                  <div key={i} style={{ background: "#09090b", borderRadius: 8, padding: 14, border: "1px solid #27272a" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                      <div>
                        <div style={{ color: "#10b981", fontSize: 10, fontWeight: 700, marginBottom: 4, letterSpacing: 1 }}>✅ CORRECTO</div>
                        <pre style={{ color: "#10b981", fontFamily: "monospace", fontSize: 11, margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{r.good}</pre>
                      </div>
                      <div>
                        <div style={{ color: "#ef4444", fontSize: 10, fontWeight: 700, marginBottom: 4, letterSpacing: 1 }}>❌ EVITAR</div>
                        <pre style={{ color: "#ef4444", fontFamily: "monospace", fontSize: 11, margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.5, opacity: 0.7 }}>{r.bad}</pre>
                      </div>
                    </div>
                    <div style={{ color: "#71717a", fontSize: 12, lineHeight: 1.5 }}>💡 {r.why}</div>
                  </div>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── GRAPHQL VS REST LESSON ───
function GraphQLLesson() {
  const [activeTab, setActiveTab] = useState("compare");
  const [queryResult, setQueryResult] = useState(null);
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
}`);

  function simulateGQL() {
    setQueryResult({
      data: {
        user: {
          name: "Daniel",
          email: "daniel@whitelabel.lat",
          orders: [
            { id: 42, total: 29900, items: [{ name: "Plan Pro", price: 299 }, { name: "Add-on AI", price: 99 }] },
            { id: 43, total: 9900, items: [{ name: "Soporte Premium", price: 99 }] },
          ],
        },
      },
    });
  }

  const comparisons = [
    { aspect: "Estructura", rest: "Múltiples endpoints fijos", graphql: "Un solo endpoint, query flexible", winner: "graphql" },
    { aspect: "Over-fetching", rest: "GET /user devuelve 50 campos (usás 3)", graphql: "Pedís solo name, email — nada más", winner: "graphql" },
    { aspect: "Under-fetching", rest: "GET /user + GET /orders + GET /items (3 requests)", graphql: "Una sola query trae todo el árbol", winner: "graphql" },
    { aspect: "Caché", rest: "HTTP cache nativo (ETags, CDN) — excelente", graphql: "Complejo, necesita normalization (Apollo)", winner: "rest" },
    { aspect: "Versionamiento", rest: "/v1/users, /v2/users — simple", graphql: "No hay versiones, campos se deprecan", winner: "tie" },
    { aspect: "Tiempo real", rest: "Polling o WebSockets aparte", graphql: "Subscriptions nativos", winner: "graphql" },
    { aspect: "Curva de aprendizaje", rest: "Todo el mundo lo conoce", graphql: "Schema, resolvers, types — más setup", winner: "rest" },
    { aspect: "Herramientas", rest: "Postman, curl, browser — universal", graphql: "Apollo, Relay, GraphiQL — ecosistema propio", winner: "tie" },
    { aspect: "Upload de archivos", rest: "multipart/form-data — nativo", graphql: "Requiere spec aparte (no estándar)", winner: "rest" },
    { aspect: "Microservicios", rest: "Un gateway rutea por path", graphql: "Federation (Apollo) unifica schemas", winner: "tie" },
  ];

  const winnerColors = { rest: "#3b82f6", graphql: "#e879f9", tie: "#71717a" };

  return (
    <div>
      <p style={{ color: "#a1a1aa", marginBottom: 20, fontSize: 15, lineHeight: 1.7 }}>
        REST y GraphQL no compiten — resuelven problemas distintos. La pregunta no es "cuál es mejor" sino <strong style={{ color: "#e4e4e7" }}>cuál encaja en tu caso</strong>.
      </p>

      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {[{ id: "compare", label: "Comparación" }, { id: "playground", label: "GraphQL Playground" }, { id: "decision", label: "¿Cuál usar?" }].map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            background: activeTab === t.id ? "#18181b" : "transparent",
            border: `1px solid ${activeTab === t.id ? "#6366f1" : "transparent"}`,
            borderRadius: 8, padding: "8px 16px", cursor: "pointer",
            color: activeTab === t.id ? "#e4e4e7" : "#52525b", fontSize: 13, fontWeight: activeTab === t.id ? 700 : 500,
          }}>{t.label}</button>
        ))}
      </div>

      {activeTab === "compare" && (
        <div style={{ background: "#09090b", borderRadius: 12, overflow: "hidden", border: "1px solid #27272a" }}>
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr", padding: "10px 16px", background: "#18181b", fontSize: 11, fontWeight: 700, color: "#52525b" }}>
            <span>ASPECTO</span>
            <span style={{ color: "#3b82f6" }}>REST</span>
            <span style={{ color: "#e879f9" }}>GRAPHQL</span>
          </div>
          {comparisons.map((c, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr", padding: "10px 16px", borderTop: "1px solid #27272a", alignItems: "center" }}>
              <span style={{ color: "#71717a", fontWeight: 600, fontSize: 12 }}>{c.aspect}</span>
              <span style={{
                color: c.winner === "rest" ? "#3b82f6" : "#a1a1aa", fontSize: 12,
                fontWeight: c.winner === "rest" ? 700 : 400,
              }}>{c.winner === "rest" ? "✅ " : ""}{c.rest}</span>
              <span style={{
                color: c.winner === "graphql" ? "#e879f9" : "#a1a1aa", fontSize: 12,
                fontWeight: c.winner === "graphql" ? 700 : 400,
              }}>{c.winner === "graphql" ? "✅ " : ""}{c.graphql}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === "playground" && (
        <div>
          <div style={{ color: "#71717a", fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>QUERY GRAPHQL</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <textarea value={gqlQuery} onChange={(e) => setGqlQuery(e.target.value)} style={{
                width: "100%", minHeight: 220, background: "#09090b", color: "#e879f9", border: "1px solid #27272a",
                borderRadius: 10, padding: 14, fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                lineHeight: 1.6, resize: "vertical", boxSizing: "border-box", outline: "none",
              }} spellCheck={false} />
              <button onClick={simulateGQL} style={{
                background: "#e879f9", color: "#09090b", border: "none", borderRadius: 8,
                padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", marginTop: 8, width: "100%",
              }}>▶ Ejecutar Query</button>
              <div style={{ color: "#52525b", fontSize: 11, marginTop: 8 }}>
                Con REST necesitarías 3 requests separados para obtener estos mismos datos.
              </div>
            </div>
            <div>
              <div style={{ color: "#52525b", fontSize: 11, fontWeight: 700, marginBottom: 6, letterSpacing: 1 }}>RESPONSE</div>
              <pre style={{
                background: "#09090b", borderRadius: 10, padding: 14, border: "1px solid #27272a",
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#a1a1aa",
                whiteSpace: "pre-wrap", lineHeight: 1.6, minHeight: 220, margin: 0, overflow: "auto",
              }}>
                {queryResult ? JSON.stringify(queryResult, null, 2) : "// Ejecutá la query para ver el resultado\n// Solo devuelve los campos que pediste\n// — sin over-fetching."}
              </pre>
            </div>
          </div>
        </div>
      )}

      {activeTab === "decision" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ background: "#3b82f612", borderRadius: 12, padding: 20, border: "1px solid #3b82f633" }}>
            <div style={{ color: "#3b82f6", fontWeight: 800, fontSize: 16, marginBottom: 12 }}>Usá REST cuando...</div>
            <div style={{ color: "#a1a1aa", fontSize: 13, lineHeight: 2 }}>
              ✅ Tu API es pública (documentación simple)<br />
              ✅ Necesitás caché HTTP agresivo<br />
              ✅ Tenés recursos con operaciones CRUD claras<br />
              ✅ El equipo no tiene experiencia con GraphQL<br />
              ✅ Subís archivos frecuentemente<br />
              ✅ Usás microservicios con gateway simple<br />
              <div style={{ color: "#3b82f6", fontWeight: 700, marginTop: 12, fontSize: 12 }}>
                Ejemplos: Stripe, GitHub API, WhatsApp Business API
              </div>
            </div>
          </div>
          <div style={{ background: "#e879f912", borderRadius: 12, padding: 20, border: "1px solid #e879f933" }}>
            <div style={{ color: "#e879f9", fontWeight: 800, fontSize: 16, marginBottom: 12 }}>Usá GraphQL cuando...</div>
            <div style={{ color: "#a1a1aa", fontSize: 13, lineHeight: 2 }}>
              ✅ Tu frontend necesita datos muy variados<br />
              ✅ Tenés mobile + web con necesidades distintas<br />
              ✅ Hay relaciones complejas entre entidades<br />
              ✅ Querés evitar N+1 requests<br />
              ✅ Necesitás subscriptions (tiempo real)<br />
              ✅ Tu schema evoluciona rápido<br />
              <div style={{ color: "#e879f9", fontWeight: 700, marginTop: 12, fontSize: 12 }}>
                Ejemplos: GitHub GraphQL API, Shopify, Facebook
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── EVENT-DRIVEN LESSON ───
function EventDrivenLesson() {
  const [events, setEvents] = useState([]);
  const [activePattern, setActivePattern] = useState("queue");
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef(null);

  const patterns = {
    queue: {
      name: "Message Queue", icon: "📬", color: "#3b82f6",
      desc: "Productor → Cola → Consumidor. Un mensaje se procesa UNA vez por UN consumidor. Perfecto para tareas que deben ejecutarse exactamente una vez.",
      services: ["Order Service", "Queue (BullMQ)", "Payment Worker", "Email Worker"],
      events: [
        { from: 0, to: 1, label: "order.created", detail: "{ orderId: 42, total: $299 }" },
        { from: 1, to: 2, label: "→ process payment", detail: "Worker toma el job de la cola" },
        { from: 2, to: 1, label: "payment.ok", detail: "{ status: 'paid', txn: 'txn_abc' }" },
        { from: 1, to: 3, label: "→ send email", detail: "Otro worker envía confirmación" },
        { from: 3, to: -1, label: "✅ email sent", detail: "Flujo completo async" },
      ],
      realWorld: "BullMQ + Redis en n8n, SQS en AWS, RabbitMQ",
    },
    pubsub: {
      name: "Pub/Sub", icon: "📡", color: "#10b981",
      desc: "Un evento se emite a TODOS los suscriptores. Cada servicio decide si le interesa. Desacople total — el emisor no sabe quién escucha.",
      services: ["Order Service", "Event Bus", "Inventory", "Analytics", "Notifications"],
      events: [
        { from: 0, to: 1, label: "publish: order.created", detail: "El evento se emite al bus" },
        { from: 1, to: 2, label: "→ inventory.subscribe", detail: "Reduce stock del producto" },
        { from: 1, to: 3, label: "→ analytics.subscribe", detail: "Registra la venta en métricas" },
        { from: 1, to: 4, label: "→ notif.subscribe", detail: "Envía push notification" },
      ],
      realWorld: "Redis Pub/Sub, Google Pub/Sub, Kafka, EventBridge",
    },
    eventsource: {
      name: "Event Sourcing", icon: "📜", color: "#f59e0b",
      desc: "En vez de guardar el ESTADO actual, guardás TODOS los eventos que ocurrieron. El estado se reconstruye reproduciendo los eventos.",
      services: ["Command", "Event Store", "Read Model", "Projection"],
      events: [
        { from: 0, to: 1, label: "CartCreated", detail: "{ cartId: 1, userId: 7 }" },
        { from: 0, to: 1, label: "ItemAdded", detail: "{ productId: 5, qty: 2, price: 100 }" },
        { from: 0, to: 1, label: "ItemAdded", detail: "{ productId: 8, qty: 1, price: 50 }" },
        { from: 0, to: 1, label: "ItemRemoved", detail: "{ productId: 5, qty: 1 }" },
        { from: 1, to: 2, label: "→ rebuild state", detail: "Cart: { items: [{id:5,qty:1},{id:8,qty:1}], total: 150 }" },
      ],
      realWorld: "Cuentas bancarias, auditoría, undo/redo, blockchain",
    },
  };

  const active = patterns[activePattern];

  function playAnimation() {
    setEvents([]);
    setPlaying(true);
    let i = 0;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (i >= active.events.length) {
        clearInterval(timerRef.current);
        setPlaying(false);
        return;
      }
      setEvents((prev) => [...prev, active.events[i]]);
      i++;
    }, 1500);
  }

  useEffect(() => {
    setEvents([]);
    setPlaying(false);
    clearInterval(timerRef.current);
  }, [activePattern]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  return (
    <div>
      <p style={{ color: "#a1a1aa", marginBottom: 20, fontSize: 15, lineHeight: 1.7 }}>
        No todo tiene que ser request → response. En arquitecturas <strong style={{ color: "#e4e4e7" }}>event-driven</strong>, los servicios reaccionan a eventos de forma asíncrona. Más resiliente, más escalable.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 24 }}>
        {Object.entries(patterns).map(([key, p]) => (
          <button key={key} onClick={() => setActivePattern(key)} style={{
            background: activePattern === key ? p.color + "15" : "transparent",
            border: `2px solid ${activePattern === key ? p.color : "#27272a"}`,
            borderRadius: 12, padding: "14px 10px", cursor: "pointer", textAlign: "center", transition: "all 0.2s",
          }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{p.icon}</div>
            <div style={{ color: activePattern === key ? p.color : "#71717a", fontWeight: 700, fontSize: 12 }}>{p.name}</div>
          </button>
        ))}
      </div>

      <div style={{ background: "#09090b", borderRadius: 12, padding: 20, border: `1px solid ${active.color}33`, marginBottom: 16 }}>
        <div style={{ color: "#a1a1aa", fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>{active.desc}</div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {active.services.map((s, i) => (
            <div key={i} style={{
              background: active.color + "15", border: `1px solid ${active.color}33`, borderRadius: 8,
              padding: "6px 12px", fontSize: 11, fontWeight: 700, color: active.color, fontFamily: "monospace",
            }}>{s}</div>
          ))}
        </div>

        <button onClick={playAnimation} disabled={playing} style={{
          background: playing ? "#27272a" : active.color, color: playing ? "#71717a" : "#fff",
          border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700,
          cursor: playing ? "default" : "pointer", width: "100%", marginBottom: 16,
        }}>
          {playing ? "⏳ Reproduciendo eventos..." : "▶ Animar Flujo"}
        </button>

        <div style={{ display: "grid", gap: 6 }}>
          {events.map((e, i) => (
            <div key={i} style={{
              background: active.color + "08", border: `1px solid ${active.color}22`, borderRadius: 8,
              padding: "10px 14px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ color: active.color, fontWeight: 700, fontSize: 12, fontFamily: "monospace" }}>{e.label}</span>
                {e.from >= 0 && <span style={{ color: "#52525b", fontSize: 11 }}>
                  {active.services[e.from]} → {e.to >= 0 ? active.services[e.to] : "Done"}
                </span>}
              </div>
              <div style={{ color: "#52525b", fontSize: 11, fontFamily: "monospace" }}>{e.detail}</div>
            </div>
          ))}
        </div>

        <div style={{ color: "#52525b", fontSize: 12, marginTop: 12 }}>
          <strong style={{ color: "#71717a" }}>En producción:</strong> {active.realWorld}
        </div>
      </div>
    </div>
  );
}

// ─── SECURITY LESSON ───
function SecurityLesson() {
  const [activeThreat, setActiveThreat] = useState(null);
  const [corsStep, setCorsStep] = useState(0);

  const owaspTop = [
    { id: "bola", name: "BOLA", fullName: "Broken Object-Level Authorization", risk: "CRÍTICO", color: "#ef4444",
      desc: "El atacante cambia el ID en la URL y accede a datos de otro usuario. GET /users/1 → GET /users/2. El 95% de las APIs son vulnerables a esto.",
      fix: "Siempre verificar que el usuario autenticado TIENE permiso sobre el recurso solicitado. No confiar solo en el ID de la URL.",
      code: `// ❌ MALO — cualquiera accede a cualquier usuario
app.get('/users/:id', (req, res) => {
  const user = db.findById(req.params.id);
  return res.json(user);
});

// ✅ BUENO — verifica ownership
app.get('/users/:id', auth, (req, res) => {
  if (req.params.id !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const user = db.findById(req.params.id);
  return res.json(user);
});` },
    { id: "auth", name: "Broken Auth", fullName: "Broken Authentication", risk: "CRÍTICO", color: "#ef4444",
      desc: "Tokens sin expiración, passwords en texto plano, no rate-limit en login, API keys expuestas en el frontend.",
      fix: "JWT con expiración corta + refresh tokens, bcrypt para passwords, rate limit en login, API keys solo en backend.",
      code: `// ❌ Token que nunca expira
const token = jwt.sign({ userId: 1 }); // sin expiresIn

// ✅ Token con expiración + refresh
const accessToken = jwt.sign(
  { userId: 1, role: 'admin' },
  SECRET,
  { expiresIn: '15m' }
);
const refreshToken = generateRefreshToken(); // en DB` },
    { id: "injection", name: "Injection", fullName: "Injection (SQL, NoSQL, LDAP)", risk: "ALTO", color: "#f59e0b",
      desc: "El input del usuario se ejecuta como código. Si concatenás strings en queries, sos vulnerable.",
      fix: "SIEMPRE usar parameterized queries / prepared statements. Nunca concatenar input del usuario en queries.",
      code: `// ❌ SQL Injection vulnerable
const query = \`SELECT * FROM users 
  WHERE email = '\${req.body.email}'\`;
// Input: ' OR '1'='1 → devuelve TODOS los usuarios

// ✅ Parameterized query
const query = 'SELECT * FROM users WHERE email = $1';
db.query(query, [req.body.email]);` },
    { id: "mass", name: "Mass Assignment", fullName: "Mass Assignment / Excessive Data Exposure", risk: "ALTO", color: "#f59e0b",
      desc: "El cliente envía campos que no debería poder modificar (ej: { role: 'admin' }) y el server los acepta ciegamente.",
      fix: "Whitelist explícita de campos permitidos. Nunca hacer spread directo del body a la DB.",
      code: `// ❌ Mass assignment — el user se hace admin
app.put('/users/:id', (req, res) => {
  db.update(req.params.id, req.body);
  // Si envían { role: "admin" } → se vuelven admin
});

// ✅ Whitelist de campos permitidos
app.put('/users/:id', (req, res) => {
  const { name, email, avatar } = req.body;
  db.update(req.params.id, { name, email, avatar });
});` },
  ];

  const corsSteps = [
    { label: "Browser", action: "Quiere hacer fetch('https://api.otro.com') desde tuapp.com", color: "#3b82f6" },
    { label: "Browser", action: "Envía preflight: OPTIONS /api con Origin: https://tuapp.com", color: "#a78bfa" },
    { label: "Server", action: "Responde: Access-Control-Allow-Origin: https://tuapp.com ✅", color: "#10b981" },
    { label: "Browser", action: "Ahora sí envía el GET/POST real al server", color: "#3b82f6" },
    { label: "Server", action: "Responde con datos + headers CORS", color: "#10b981" },
  ];

  return (
    <div>
      <p style={{ color: "#a1a1aa", marginBottom: 20, fontSize: 15, lineHeight: 1.7 }}>
        Las APIs son el vector de ataque #1 en aplicaciones modernas. OWASP tiene un <strong style={{ color: "#e4e4e7" }}>Top 10 específico para APIs</strong>. Si no conocés estas vulnerabilidades, tu API es un colador.
      </p>

      <div style={{ color: "#71717a", fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>OWASP API SECURITY TOP 10 (PRINCIPALES)</div>
      <div style={{ display: "grid", gap: 8, marginBottom: 24 }}>
        {owaspTop.map((t) => (
          <button key={t.id} onClick={() => setActiveThreat(activeThreat === t.id ? null : t.id)} style={{
            background: activeThreat === t.id ? t.color + "10" : "#18181b",
            border: `1px solid ${activeThreat === t.id ? t.color + "44" : "#27272a"}`,
            borderRadius: 10, padding: "14px 16px", cursor: "pointer", textAlign: "left", transition: "all 0.2s",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: t.color, fontWeight: 800, fontSize: 14, fontFamily: "monospace" }}>{t.name}</span>
                <span style={{ color: "#52525b", fontSize: 12 }}>{t.fullName}</span>
              </div>
              <span style={{ background: t.color + "22", color: t.color, fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 6 }}>{t.risk}</span>
            </div>
            {activeThreat === t.id && (
              <div style={{ marginTop: 14 }}>
                <div style={{ color: "#a1a1aa", fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>{t.desc}</div>
                <div style={{ background: "#10b98115", borderRadius: 8, padding: 10, marginBottom: 12, border: "1px solid #10b98122" }}>
                  <div style={{ color: "#10b981", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>🔧 SOLUCIÓN</div>
                  <div style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 1.6 }}>{t.fix}</div>
                </div>
                <pre style={{ background: "#09090b", borderRadius: 8, padding: 14, margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#a1a1aa", whiteSpace: "pre-wrap", lineHeight: 1.6, border: "1px solid #27272a" }}>
                  {t.code}
                </pre>
              </div>
            )}
          </button>
        ))}
      </div>

      <div style={{ color: "#71717a", fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>🌐 CORS — POR QUÉ TU API DA ERROR EN EL BROWSER</div>
      <div style={{ background: "#09090b", borderRadius: 12, padding: 20, border: "1px solid #27272a" }}>
        <p style={{ color: "#a1a1aa", fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
          CORS (Cross-Origin Resource Sharing) es el mecanismo del browser para preguntar: "¿Este server permite que ESTA página le hable?". No aplica en backend (n8n, curl, Postman).
        </p>
        <div style={{ display: "grid", gap: 6, marginBottom: 12 }}>
          {corsSteps.map((s, i) => (
            <div key={i} onClick={() => setCorsStep(i)} style={{
              display: "flex", gap: 12, alignItems: "center", padding: "10px 14px", borderRadius: 8, cursor: "pointer",
              background: i <= corsStep ? s.color + "10" : "transparent",
              opacity: i <= corsStep ? 1 : 0.3, transition: "all 0.3s",
            }}>
              <span style={{ background: s.color + "33", color: s.color, fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 6, fontFamily: "monospace", minWidth: 50, textAlign: "center" }}>{s.label}</span>
              <span style={{ color: i <= corsStep ? "#a1a1aa" : "#52525b", fontSize: 12 }}>{s.action}</span>
            </div>
          ))}
        </div>
        {corsStep < corsSteps.length - 1 && (
          <button onClick={() => setCorsStep(corsStep + 1)} style={{
            background: "#6366f122", color: "#6366f1", border: "1px solid #6366f144",
            borderRadius: 8, padding: "6px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>Siguiente paso →</button>
        )}
      </div>
    </div>
  );
}

// ─── PERFORMANCE & CACHE LESSON ───
function PerformanceLesson() {
  const [cacheHits, setCacheHits] = useState({ hit: 0, miss: 0 });
  const [requests, setRequests] = useState([]);
  const [cacheEnabled, setCacheEnabled] = useState(true);
  const cacheRef = useRef({});

  function simulateRequest() {
    const endpoints = ["/users/1", "/products/list", "/orders/42", "/users/1", "/users/1", "/products/list", "/orders/99", "/users/1"];
    const ep = endpoints[Math.floor(Math.random() * endpoints.length)];
    const isCached = cacheEnabled && cacheRef.current[ep];
    const latency = isCached ? 2 + Math.random() * 5 : 80 + Math.random() * 200;

    if (!isCached && cacheEnabled) cacheRef.current[ep] = true;

    setCacheHits((prev) => ({
      hit: prev.hit + (isCached ? 1 : 0),
      miss: prev.miss + (isCached ? 0 : 1),
    }));

    setRequests((prev) => [...prev, {
      endpoint: ep,
      cached: isCached,
      latency: Math.round(latency),
      time: Date.now(),
    }].slice(-15));
  }

  function resetCache() {
    cacheRef.current = {};
    setCacheHits({ hit: 0, miss: 0 });
    setRequests([]);
  }

  const hitRate = cacheHits.hit + cacheHits.miss > 0
    ? Math.round((cacheHits.hit / (cacheHits.hit + cacheHits.miss)) * 100)
    : 0;

  const strategies = [
    { name: "Cache-Aside (Lazy)", color: "#3b82f6", desc: "App revisa cache primero. Si falta, lee DB y guarda en cache. El más común con Redis.",
      flow: "Request → Cache? → HIT: return → MISS: DB → Save cache → Return" },
    { name: "Write-Through", color: "#10b981", desc: "Cada write va a cache Y DB al mismo tiempo. Cache siempre actualizada, pero writes más lentos.",
      flow: "Write → Update Cache + Update DB → Return" },
    { name: "Write-Behind", color: "#f59e0b", desc: "Write va a cache inmediatamente, y a la DB de forma async después. Muy rápido pero riesgo de pérdida.",
      flow: "Write → Update Cache → Return → (async) Flush to DB" },
    { name: "CDN / Edge", color: "#a78bfa", desc: "Para assets estáticos y APIs públicas. Cloudflare, Vercel Edge. El request ni llega a tu server.",
      flow: "Request → CDN Edge (Buenos Aires) → HIT: Return → MISS: Origin → Cache → Return" },
  ];

  return (
    <div>
      <p style={{ color: "#a1a1aa", marginBottom: 20, fontSize: 15, lineHeight: 1.7 }}>
        La diferencia entre una API de <strong style={{ color: "#ef4444" }}>200ms</strong> y una de <strong style={{ color: "#10b981" }}>5ms</strong> es caché. Redis, CDN, ETags — cada capa corta latencia.
      </p>

      <div style={{ color: "#71717a", fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>⚡ SIMULADOR DE CACHE EN VIVO</div>
      <div style={{ background: "#09090b", borderRadius: 12, padding: 20, border: "1px solid #27272a", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
          <button onClick={simulateRequest} style={{
            background: "#6366f1", color: "#fff", border: "none", borderRadius: 8,
            padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}>⚡ Enviar Request</button>
          <button onClick={() => { setCacheEnabled(!cacheEnabled); resetCache(); }} style={{
            background: cacheEnabled ? "#10b98122" : "#ef444422",
            color: cacheEnabled ? "#10b981" : "#ef4444",
            border: `1px solid ${cacheEnabled ? "#10b98144" : "#ef444444"}`,
            borderRadius: 8, padding: "10px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>Cache: {cacheEnabled ? "ON ✅" : "OFF ❌"}</button>
          <button onClick={resetCache} style={{
            background: "#27272a", color: "#71717a", border: "none", borderRadius: 8,
            padding: "10px 16px", fontSize: 12, cursor: "pointer",
          }}>⟲ Reset</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
          <div style={{ background: "#10b98112", borderRadius: 8, padding: 12, textAlign: "center", border: "1px solid #10b98122" }}>
            <div style={{ color: "#10b981", fontSize: 24, fontWeight: 900 }}>{cacheHits.hit}</div>
            <div style={{ color: "#52525b", fontSize: 11 }}>Cache HIT</div>
          </div>
          <div style={{ background: "#ef444412", borderRadius: 8, padding: 12, textAlign: "center", border: "1px solid #ef444422" }}>
            <div style={{ color: "#ef4444", fontSize: 24, fontWeight: 900 }}>{cacheHits.miss}</div>
            <div style={{ color: "#52525b", fontSize: 11 }}>Cache MISS</div>
          </div>
          <div style={{ background: "#6366f112", borderRadius: 8, padding: 12, textAlign: "center", border: "1px solid #6366f122" }}>
            <div style={{ color: "#6366f1", fontSize: 24, fontWeight: 900 }}>{hitRate}%</div>
            <div style={{ color: "#52525b", fontSize: 11 }}>Hit Rate</div>
          </div>
        </div>

        {requests.length > 0 && (
          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            {requests.map((r, i) => (
              <div key={i} style={{
                display: "flex", gap: 10, alignItems: "center", padding: "5px 8px",
                fontSize: 12, fontFamily: "monospace",
              }}>
                <span style={{ color: r.cached ? "#10b981" : "#ef4444", fontWeight: 700, minWidth: 40 }}>
                  {r.cached ? "HIT" : "MISS"}
                </span>
                <span style={{ color: "#71717a", flex: 1 }}>{r.endpoint}</span>
                <span style={{ color: r.latency < 10 ? "#10b981" : r.latency < 100 ? "#f59e0b" : "#ef4444", fontWeight: 700 }}>
                  {r.latency}ms
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ color: "#71717a", fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>ESTRATEGIAS DE CACHÉ</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {strategies.map((s) => (
          <div key={s.name} style={{ background: "#18181b", borderRadius: 10, padding: 16, border: "1px solid #27272a" }}>
            <div style={{ color: s.color, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{s.name}</div>
            <div style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 1.6, marginBottom: 10 }}>{s.desc}</div>
            <div style={{ background: "#09090b", borderRadius: 6, padding: 8, fontFamily: "monospace", fontSize: 10, color: "#52525b", lineHeight: 1.5 }}>
              {s.flow}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── OPENAPI & DOCS LESSON ───
function OpenAPILesson() {
  const [activeSection, setActiveSection] = useState("spec");

  const specExample = `openapi: 3.1.0
info:
  title: Whitelabel API
  version: 2.0.0
  description: API para gestión de agentes AI

paths:
  /agents:
    get:
      summary: Listar agentes AI
      tags: [Agents]
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [active, paused, draft]
      responses:
        '200':
          description: Lista de agentes
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Agent'
                  meta:
                    $ref: '#/components/schemas/Pagination'

    post:
      summary: Crear nuevo agente
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateAgent'
      responses:
        '201':
          description: Agente creado

components:
  schemas:
    Agent:
      type: object
      properties:
        id:    { type: string, format: uuid }
        name:  { type: string, example: "Asistente GUOMAN" }
        status: { type: string, enum: [active, paused, draft] }
        model: { type: string, example: "gpt-4o" }
    CreateAgent:
      type: object
      required: [name, model]
      properties:
        name:  { type: string }
        model: { type: string }`;

  const benefits = [
    { icon: "📖", name: "Documentación Auto", desc: "Swagger UI / Redoc se generan automáticamente desde el spec. Siempre actualizada.", color: "#3b82f6" },
    { icon: "🛠️", name: "SDK Generation", desc: "openapi-generator crea clients en TypeScript, Python, Go, Java — automáticamente.", color: "#10b981" },
    { icon: "✅", name: "Contract Testing", desc: "Validás que tu API cumple el spec. Si cambiás algo, el test falla antes del deploy.", color: "#f59e0b" },
    { icon: "🔄", name: "Mock Servers", desc: "Generás un server mock desde el spec para que el frontend trabaje en paralelo.", color: "#a78bfa" },
    { icon: "🛡️", name: "Request Validation", desc: "Middleware que rechaza requests que no cumplen el schema. Cero inputs inválidos.", color: "#f472b6" },
    { icon: "📊", name: "API Changelog", desc: "Diff entre versiones del spec. Sabés exactamente qué cambió y si es breaking.", color: "#06b6d4" },
  ];

  return (
    <div>
      <p style={{ color: "#a1a1aa", marginBottom: 20, fontSize: 15, lineHeight: 1.7 }}>
        Una API sin documentación no existe. <strong style={{ color: "#e4e4e7" }}>OpenAPI</strong> (antes Swagger) es el estándar: describís tu API en YAML y todo lo demás se genera automáticamente.
      </p>

      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {[{ id: "spec", label: "Spec Ejemplo" }, { id: "benefits", label: "¿Por qué?" }, { id: "workflow", label: "Workflow" }].map((t) => (
          <button key={t.id} onClick={() => setActiveSection(t.id)} style={{
            background: activeSection === t.id ? "#18181b" : "transparent",
            border: `1px solid ${activeSection === t.id ? "#6366f1" : "transparent"}`,
            borderRadius: 8, padding: "8px 16px", cursor: "pointer",
            color: activeSection === t.id ? "#e4e4e7" : "#52525b", fontSize: 13, fontWeight: activeSection === t.id ? 700 : 500,
          }}>{t.label}</button>
        ))}
      </div>

      {activeSection === "spec" && (
        <div style={{ background: "#09090b", borderRadius: 12, padding: 16, border: "1px solid #27272a", maxHeight: 460, overflowY: "auto" }}>
          <pre style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#a1a1aa", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
            {specExample}
          </pre>
        </div>
      )}

      {activeSection === "benefits" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {benefits.map((b) => (
            <div key={b.name} style={{ background: "#18181b", borderRadius: 10, padding: 16, border: "1px solid #27272a" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>{b.icon}</span>
                <span style={{ color: b.color, fontWeight: 700, fontSize: 13 }}>{b.name}</span>
              </div>
              <div style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 1.6 }}>{b.desc}</div>
            </div>
          ))}
        </div>
      )}

      {activeSection === "workflow" && (
        <div style={{ background: "#09090b", borderRadius: 12, padding: 20, border: "1px solid #27272a" }}>
          <div style={{ color: "#6366f1", fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 16 }}>API-FIRST DEVELOPMENT WORKFLOW</div>
          {[
            { step: 1, title: "Diseñar el spec OpenAPI", detail: "Antes de escribir una línea de código, definís endpoints, schemas, y responses en YAML.", color: "#3b82f6" },
            { step: 2, title: "Generar mock server", detail: "El frontend empieza a trabajar contra el mock. Backend trabaja en paralelo.", color: "#10b981" },
            { step: 3, title: "Implementar el backend", detail: "Usás el spec como guía. Middleware valida que tus responses cumplan el contrato.", color: "#f59e0b" },
            { step: 4, title: "Generar SDKs y docs", detail: "openapi-generator crea clients tipados. Swagger UI genera docs interactivas.", color: "#a78bfa" },
            { step: 5, title: "Contract testing en CI", detail: "En cada PR, un test verifica que la implementación cumple el spec. Breaking changes se detectan automáticamente.", color: "#f472b6" },
          ].map((s) => (
            <div key={s.step} style={{ display: "flex", gap: 14, marginBottom: 16, alignItems: "flex-start" }}>
              <div style={{
                minWidth: 32, height: 32, borderRadius: "50%", background: s.color + "22", color: s.color,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800,
              }}>{s.step}</div>
              <div>
                <div style={{ color: "#e4e4e7", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{s.title}</div>
                <div style={{ color: "#71717a", fontSize: 12, lineHeight: 1.6 }}>{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── DISTRIBUTED SYSTEMS LESSON ───
function DistributedLesson() {
  const [capChoice, setCapChoice] = useState(null);
  const [sagaStep, setSagaStep] = useState(0);

  const capTheorem = [
    { id: "cp", name: "CP — Consistencia + Partición", color: "#3b82f6", icon: "🔒",
      desc: "Si la red falla, el sistema se detiene en vez de dar datos incorrectos. Preferí esto para pagos y transacciones bancarias.",
      examples: "MongoDB (modo strict), PostgreSQL, Redis (modo cluster), HBase",
      tradeoff: "Sacrifica disponibilidad: si un nodo cae, parte del sistema no responde." },
    { id: "ap", name: "AP — Disponibilidad + Partición", color: "#10b981", icon: "🌍",
      desc: "Si la red falla, el sistema sigue respondiendo aunque los datos no estén 100% actualizados. Consistencia eventual.",
      examples: "DynamoDB, Cassandra, CouchDB, DNS",
      tradeoff: "Sacrifica consistencia: dos usuarios pueden ver datos distintos temporalmente." },
    { id: "ca", name: "CA — Consistencia + Disponibilidad", color: "#f59e0b", icon: "⚠️",
      desc: "Solo posible si NO hay particiones de red. En la práctica, solo existe en sistemas de un solo nodo (no distribuidos).",
      examples: "PostgreSQL single node, MySQL single node",
      tradeoff: "No funciona en sistemas distribuidos reales. Las particiones de red SIEMPRE pasan." },
  ];

  const sagaSteps = [
    { service: "Order Service", action: "Crear orden → PENDING", status: "ok", color: "#3b82f6" },
    { service: "Payment Service", action: "Cobrar $299 → SUCCESS", status: "ok", color: "#10b981" },
    { service: "Inventory Service", action: "Reducir stock → FAIL (sin stock)", status: "fail", color: "#ef4444" },
    { service: "Payment Service", action: "COMPENSAR: Refund $299", status: "compensate", color: "#f59e0b" },
    { service: "Order Service", action: "COMPENSAR: Cancelar orden", status: "compensate", color: "#f59e0b" },
  ];

  return (
    <div>
      <p style={{ color: "#a1a1aa", marginBottom: 20, fontSize: 15, lineHeight: 1.7 }}>
        Cuando tu sistema tiene múltiples servicios, bases de datos, y servidores, todo se complica. El <strong style={{ color: "#e4e4e7" }}>Teorema CAP</strong> te dice qué podés tener y qué tenés que sacrificar.
      </p>

      <div style={{ color: "#71717a", fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>TEOREMA CAP — "ELEGÍ 2 DE 3"</div>
      <p style={{ color: "#52525b", fontSize: 13, marginBottom: 16 }}>
        <strong style={{ color: "#e4e4e7" }}>C</strong>onsistencia (todos ven lo mismo) + <strong style={{ color: "#e4e4e7" }}>A</strong>vailability (siempre responde) + <strong style={{ color: "#e4e4e7" }}>P</strong>artition tolerance (funciona si la red falla). En un sistema distribuido, P siempre pasa — elegís entre C o A.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 20 }}>
        {capTheorem.map((c) => (
          <button key={c.id} onClick={() => setCapChoice(capChoice === c.id ? null : c.id)} style={{
            background: capChoice === c.id ? c.color + "15" : "transparent",
            border: `2px solid ${capChoice === c.id ? c.color : "#27272a"}`,
            borderRadius: 12, padding: "14px 10px", cursor: "pointer", textAlign: "center", transition: "all 0.2s",
          }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{c.icon}</div>
            <div style={{ color: c.color, fontWeight: 700, fontSize: 12 }}>{c.name}</div>
          </button>
        ))}
      </div>

      {capChoice && (() => {
        const c = capTheorem.find((x) => x.id === capChoice);
        return (
          <div style={{ background: "#09090b", borderRadius: 12, padding: 20, border: `1px solid ${c.color}33`, marginBottom: 24 }}>
            <div style={{ color: "#a1a1aa", fontSize: 14, lineHeight: 1.7, marginBottom: 12 }}>{c.desc}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ background: "#18181b", borderRadius: 8, padding: 12 }}>
                <div style={{ color: c.color, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>EJEMPLOS</div>
                <div style={{ color: "#a1a1aa", fontSize: 12 }}>{c.examples}</div>
              </div>
              <div style={{ background: "#18181b", borderRadius: 8, padding: 12 }}>
                <div style={{ color: "#f59e0b", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>TRADEOFF</div>
                <div style={{ color: "#a1a1aa", fontSize: 12 }}>{c.tradeoff}</div>
              </div>
            </div>
          </div>
        );
      })()}

      <div style={{ color: "#71717a", fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>SAGA PATTERN — TRANSACCIONES DISTRIBUIDAS</div>
      <p style={{ color: "#52525b", fontSize: 13, marginBottom: 16 }}>
        No podés hacer un <code style={{ color: "#a78bfa" }}>BEGIN TRANSACTION</code> entre 3 microservicios. Una <strong style={{ color: "#e4e4e7" }}>Saga</strong> ejecuta pasos secuenciales y si uno falla, ejecuta <strong style={{ color: "#f59e0b" }}>compensaciones</strong> en reversa.
      </p>

      <div style={{ background: "#09090b", borderRadius: 12, padding: 20, border: "1px solid #27272a" }}>
        <div style={{ display: "grid", gap: 8 }}>
          {sagaSteps.map((s, i) => (
            <div key={i} onClick={() => setSagaStep(i)} style={{
              display: "flex", gap: 12, alignItems: "center", padding: "12px 14px", borderRadius: 8, cursor: "pointer",
              background: i <= sagaStep ? s.color + "10" : "transparent",
              opacity: i <= sagaStep ? 1 : 0.3, transition: "all 0.3s",
              border: `1px solid ${i <= sagaStep ? s.color + "33" : "transparent"}`,
            }}>
              <div style={{
                minWidth: 28, height: 28, borderRadius: "50%",
                background: i <= sagaStep ? s.color : "#27272a", color: i <= sagaStep ? "#fff" : "#52525b",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700,
              }}>{s.status === "compensate" ? "↩" : i + 1}</div>
              <div>
                <div style={{ color: s.color, fontWeight: 700, fontSize: 12, fontFamily: "monospace" }}>{s.service}</div>
                <div style={{ color: i <= sagaStep ? "#a1a1aa" : "#52525b", fontSize: 12 }}>{s.action}</div>
              </div>
            </div>
          ))}
        </div>
        {sagaStep < sagaSteps.length - 1 && (
          <button onClick={() => setSagaStep(sagaStep + 1)} style={{
            background: "#6366f122", color: "#6366f1", border: "1px solid #6366f144",
            borderRadius: 8, padding: "8px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer", marginTop: 12,
          }}>Siguiente paso →</button>
        )}
      </div>
    </div>
  );
}

// ─── REAL WORLD ARCHITECTURE LESSON ───
function RealWorldLesson() {
  const [activeLayer, setActiveLayer] = useState(null);

  const layers = [
    { id: "client", name: "Capa Cliente", icon: "📱", color: "#3b82f6",
      tech: ["React / Next.js", "App móvil (Flutter)", "WhatsApp (Meta API)", "n8n webhooks"],
      decisions: "Acá se decide: ¿SPA o SSR? ¿App nativa o PWA? ¿WhatsApp como canal? Cada cliente consume la API de forma distinta — por eso existen field selection y BFF (Backend for Frontend).",
    },
    { id: "gateway", name: "API Gateway", icon: "🏗️", color: "#10b981",
      tech: ["Kong / NGINX / Traefik", "Rate Limiting por plan", "JWT validation", "Request routing", "CORS headers"],
      decisions: "Un solo punto de entrada. Acá centralizás auth, rate limiting, logging y routing. Cada request pasa por acá ANTES de llegar a cualquier servicio.",
    },
    { id: "services", name: "Microservicios", icon: "⚡", color: "#f59e0b",
      tech: ["User Service (REST)", "Order Service (REST)", "Chat Service (WebSockets)", "AI Agent Service (gRPC)", "Notification Service (Event-driven)"],
      decisions: "Cada servicio tiene su propia DB, su propio deploy, y se comunica vía REST, eventos, o gRPC según la necesidad. El secreto: cada servicio hace UNA cosa bien.",
    },
    { id: "data", name: "Capa de Datos", icon: "🗄️", color: "#a78bfa",
      tech: ["PostgreSQL (transaccional)", "Redis (cache + sessions)", "S3/MinIO (archivos)", "Elasticsearch (búsqueda)", "Event Store (auditoría)"],
      decisions: "Polyglot persistence: cada tipo de dato va a la base que mejor lo maneja. No todo va a PostgreSQL. Cache en Redis para hot data, S3 para archivos, ES para búsqueda full-text.",
    },
    { id: "infra", name: "Infraestructura", icon: "☁️", color: "#f472b6",
      tech: ["Docker + Docker Swarm / K8s", "Cloudflare (CDN + DNS)", "GitHub Actions (CI/CD)", "Grafana + Prometheus (observabilidad)", "Sentry (error tracking)"],
      decisions: "Containers para todo. CI/CD en cada push. Monitoring con alertas. La infraestructura es código: Docker Compose en dev, Swarm/K8s en producción.",
    },
  ];

  return (
    <div>
      <p style={{ color: "#a1a1aa", marginBottom: 20, fontSize: 15, lineHeight: 1.7 }}>
        Todo lo que aprendiste en los 3 niveles se conecta acá. Así se ve un <strong style={{ color: "#e4e4e7" }}>sistema real en producción</strong> — capa por capa, decisión por decisión.
      </p>

      <div style={{ display: "grid", gap: 8 }}>
        {layers.map((l, i) => (
          <button key={l.id} onClick={() => setActiveLayer(activeLayer === l.id ? null : l.id)} style={{
            background: activeLayer === l.id ? l.color + "10" : "#18181b",
            border: `1px solid ${activeLayer === l.id ? l.color + "44" : "#27272a"}`,
            borderRadius: 10, padding: activeLayer === l.id ? "16px 18px" : "14px 18px",
            cursor: "pointer", textAlign: "left", transition: "all 0.2s",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>{l.icon}</span>
                <span style={{ color: l.color, fontWeight: 700, fontSize: 14 }}>{l.name}</span>
              </div>
              <span style={{ color: "#27272a", fontSize: 14 }}>{activeLayer === l.id ? "▾" : "▸"}</span>
            </div>

            {activeLayer === l.id && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                  {l.tech.map((t, j) => (
                    <span key={j} style={{
                      background: l.color + "15", border: `1px solid ${l.color}33`, borderRadius: 6,
                      padding: "4px 10px", fontSize: 11, fontWeight: 600, color: l.color, fontFamily: "monospace",
                    }}>{t}</span>
                  ))}
                </div>
                <div style={{ color: "#a1a1aa", fontSize: 13, lineHeight: 1.7 }}>{l.decisions}</div>
              </div>
            )}
          </button>
        ))}
      </div>

      <div style={{ background: "#18181b", borderRadius: 10, padding: 16, marginTop: 20, border: "1px solid #27272a" }}>
        <div style={{ color: "#f59e0b", fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 10 }}>🧠 PRINCIPIOS DE ARQUITECTURA</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { principle: "Single Responsibility", desc: "Cada servicio hace una cosa. Si necesitás cambiar pagos, solo tocás Payment Service." },
            { principle: "Fail Gracefully", desc: "Si un servicio cae, el resto sigue. Circuit breakers, retries, fallbacks." },
            { principle: "Design for Scale", desc: "Stateless services + cache + load balancer = escalás horizontalmente." },
            { principle: "Observability First", desc: "Si no lo podés medir, no lo podés mejorar. Logs, métricas, traces en todo." },
          ].map((p) => (
            <div key={p.principle} style={{ background: "#09090b", borderRadius: 8, padding: 12 }}>
              <div style={{ color: "#6366f1", fontWeight: 700, fontSize: 12, marginBottom: 4, fontFamily: "monospace" }}>{p.principle}</div>
              <div style={{ color: "#71717a", fontSize: 11, lineHeight: 1.5 }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── QUIZ ───
const ALL_QUESTIONS = [
  { q: "¿Qué nivel del modelo de Richardson usa HATEOAS?", opts: ["Nivel 0: usa HTTP como transporte básico", "Nivel 1: introduce el concepto de recursos", "Nivel 2: utiliza los verbos HTTP estándar", "Nivel 3: agrega hypermedia y controles"], correct: "Nivel 3: agrega hypermedia y controles", explain: "Nivel 3 agrega Hypermedia As The Engine Of Application State: el response incluye links de navegación que dicen qué acciones están disponibles." },
  { q: "¿Cuál es la principal ventaja de GraphQL sobre REST?", opts: ["Es más rápido al usar WebSockets por defecto", "Evita problemas de over-fetching y under-fetching", "Es inherentemente más seguro contra inyecciones", "Facilita la implementación de caché HTTP estándar"], correct: "Evita problemas de over-fetching y under-fetching", explain: "GraphQL te deja pedir exactamente los campos que necesitás en una sola query, sin recibir datos de más ni hacer múltiples requests." },
  { q: "En el Teorema CAP, ¿qué se sacrifica en un sistema AP (Disponibilidad + Partición)?", opts: ["Disponibilidad de todos los nodos en la red", "Consistencia estricta en lecturas inmediatas", "Velocidad de procesamiento de consultas", "Seguridad en la transmisión de los paquetes"], correct: "Consistencia estricta en lecturas inmediatas", explain: "AP sacrifica consistencia: el sistema sigue respondiendo durante particiones de red, pero dos nodos pueden dar datos distintos temporalmente (consistencia eventual)." },
  { q: "¿Qué es una Saga en sistemas distribuidos?", opts: ["Un motor de base de datos relacional distribuida", "Una secuencia de transacciones con compensaciones", "Un protocolo de autenticación federada seguro", "Un patrón de caché para sistemas asíncronos"], correct: "Una secuencia de transacciones con compensaciones", explain: "Las Sagas reemplazan las transacciones distribuidas: si un paso falla, se ejecutan compensaciones en reversa para deshacer los pasos anteriores." },
  { q: "¿Qué es BOLA según OWASP API Security?", opts: ["Un tipo de ataque de denegación de servicio (DDoS)", "Broken Object-Level Authorization (acceso ilegítimo a IDs)", "Un protocolo de encriptación de datos en reposo", "Un método de autenticación biométrica de dos pasos"], correct: "Broken Object-Level Authorization (acceso ilegítimo a IDs)", explain: "BOLA es la vulnerabilidad #1 en APIs: cambiar /users/1 a /users/2 y acceder a datos ajenos porque no se verifica el ownership del recurso." },
  { q: "¿Qué estrategia de cache lee la DB solo cuando hay cache miss?", opts: ["Write-Through: escribe simultáneamente en ambos", "Write-Behind: retrasa la escritura en base de datos", "Cache-Aside: la aplicación gestiona la lectura de forma diferida", "CDN Edge: almacena respuestas en nodos geográficos"], correct: "Cache-Aside: la aplicación gestiona la lectura de forma diferida", explain: "Cache-Aside: la app revisa cache primero → si HIT, devuelve → si MISS, lee DB, guarda en cache, devuelve. Es el patrón más común con Redis." },
  { q: "¿Para qué sirve OpenAPI (Swagger)?", opts: ["Es exclusivamente un motor de generación de documentación", "Es un framework backend para aplicaciones NodeJS de alto tráfico", "Describe el contrato de la API para generar docs, mocks y SDKs", "Es un motor de persistencia de datos especializado en JSON"], correct: "Describe el contrato de la API para generar docs, mocks y SDKs", explain: "OpenAPI es un spec que describe tu API. Desde ese archivo se generan docs (Swagger UI), SDKs (openapi-generator), mocks, y validación de requests." },
  { q: "¿Cuál es la diferencia entre Message Queue y Pub/Sub?", opts: ["Son exactamente el mismo concepto con distintos nombres comerciales", "Queue: un mensaje a un worker. Pub/Sub: un evento a todos", "Pub/Sub procesa información más rápido usando memoria volátil", "Queue es exclusivo para archivos y Pub/Sub para texto plano"], correct: "Queue: un mensaje a un worker. Pub/Sub: un evento a todos", explain: "Message Queue: cada mensaje se procesa UNA vez por UN worker. Pub/Sub: un evento se envía a TODOS los servicios suscritos." },
  { q: "¿Por qué CORS solo afecta al browser y no a Postman/curl/n8n?", opts: ["Es una falla temporal que afecta a los navegadores modernos", "Es una política del navegador; otros clientes la ignoran por diseño", "Postman cuenta con permisos especiales de red en el sistema", "CORS se aplica únicamente cuando el código es JavaScript"], correct: "Es una política del navegador; otros clientes la ignoran por diseño", explain: "CORS es un mecanismo de seguridad implementado por los browsers. Herramientas como Postman, curl, y n8n no lo implementan porque no ejecutan JavaScript en un origen web." },
  { q: "¿Qué patrón permite que el frontend trabaje antes de que el backend esté listo?", opts: ["Cache-Aside: simula datos utilizando almacenamiento local", "API-First: usa mock servers generados desde el spec OpenAPI", "Event Sourcing: reproduce eventos para el cliente de prueba", "Circuit Breaker: devuelve respuestas predeterminadas"], correct: "API-First: usa mock servers generados desde el spec OpenAPI", explain: "Con API-First, definís el spec OpenAPI primero, generás un mock server, y el frontend trabaja contra ese mock mientras el backend implementa la API real en paralelo." },
  { q: "En Event Sourcing, ¿cómo se obtiene el estado actual?", opts: ["Se lee de una tabla especial directamente en la DB relacional", "Se reproduce la secuencia completa de eventos históricos", "Se cachea permanentemente usando una solución como Redis", "Se calcula en el cliente utilizando librerías GraphQL"], correct: "Se reproduce la secuencia completa de eventos históricos", explain: "En Event Sourcing no guardás el estado actual — guardás todos los eventos. El estado se reconstruye reproduciendo los eventos en orden. Como un libro contable." },
  { q: "¿Qué es Mass Assignment?", opts: ["Asignar un bloque de memoria excesivo en el servidor backend", "Aceptar y guardar campos no permitidos enviados por el cliente", "Un tipo de base de datos no relacional de alta disponibilidad", "Un protocolo de red optimizado para transferencia de archivos"], correct: "Aceptar y guardar campos no permitidos enviados por el cliente", explain: "Mass Assignment ocurre cuando hacés db.update(req.body) sin whitelist. El atacante puede enviar { role: 'admin' } y el server lo acepta ciegamente." },
  { q: "¿Cuándo NO deberías usar GraphQL?", opts: ["Cuando tu dominio incluye relaciones de datos muy complejas", "Cuando necesitás caché HTTP agresivo para un CRUD público simple", "Cuando la aplicación cliente está construida utilizando React", "Cuando manejás volúmenes de datos que exceden los gigabytes"], correct: "Cuando necesitás caché HTTP agresivo para un CRUD público simple", explain: "GraphQL complica el caching HTTP (todo va a POST /graphql). Para APIs públicas con CRUD simple y caché agresivo, REST es más eficiente." },
  { q: "¿Qué significa 'polyglot persistence'?", opts: ["La capacidad del sistema para traducir mensajes a varios idiomas", "Usar la tecnología de base de datos óptima para cada caso de uso", "Una única base de datos que entiende múltiples lenguajes de query", "Un Object-Relational Mapper (ORM) compatible con cualquier DB"], correct: "Usar la tecnología de base de datos óptima para cada caso de uso", explain: "Polyglot persistence: PostgreSQL para transacciones, Redis para cache, Elasticsearch para búsqueda, S3 para archivos. Cada dato va donde mejor se maneja." },
  { q: "¿Qué es un BFF (Backend for Frontend)?", opts: ["Un framework JavaScript moderno para construir Single Page Apps", "Un servicio que adapta respuestas para un tipo de cliente específico", "Una capa de almacenamiento en caché para respuestas repetitivas", "Un protocolo de red diseñado para aplicaciones móviles ligeras"], correct: "Un servicio que adapta respuestas para un tipo de cliente específico", explain: "BFF: un servicio que adapta la API general para las necesidades específicas de cada cliente (web vs mobile vs WhatsApp). Evita que un solo endpoint sirva a todos mal." },
  { q: "¿Por qué es importante que los servicios sean stateless?", opts: ["Porque reducen significativamente los costos de infraestructura", "Permiten escalar horizontalmente al no atar peticiones a un servidor", "Proporcionan una capa de seguridad extra contra inyecciones SQL", "Aceleran el procesamiento al no validar tokens en cada petición"], correct: "Permiten escalar horizontalmente al no atar peticiones a un servidor", explain: "Si un servicio no guarda estado en memoria, podés tener 10 instancias detrás de un load balancer. Cualquiera puede atender cualquier request." },
  { q: "¿Qué es contract testing?", opts: ["Una técnica manual para revisar los términos de uso del servicio", "Tests que verifican que la API cumpla su especificación OpenAPI", "Pruebas automatizadas exclusivas para pasarelas de pago externas", "Un método para medir la latencia y rendimiento de las peticiones"], correct: "Tests que verifican que la API cumpla su especificación OpenAPI", explain: "Contract testing: en cada PR/deploy, un test automático verifica que tus endpoints devuelven exactamente lo que dice el spec OpenAPI. Si rompés el contrato, el test falla." },
  { q: "Un campo nuevo en el response de tu API, ¿es un breaking change?", opts: ["Sí, en todos los casos requerirá actualizar la versión principal", "No, agregar campos nunca rompe clientes que ignoran lo desconocido", "Solo es problemático si el nuevo campo es una lista o arreglo", "Depende de las convenciones de nomenclatura utilizadas en el proyecto"], correct: "No, agregar campos nunca rompe clientes que ignoran lo desconocido", explain: "Agregar un campo nuevo es un non-breaking change. Los clientes existentes simplemente lo ignoran. Remover o renombrar un campo SÍ es breaking." },
  { q: "¿Qué hace kebab-case en URLs de APIs?", opts: ["Usa camelCase: /getUserOrders para mantener consistencia con código", "Usa guiones: /user-orders para mayor legibilidad y estándar web", "Usa snake_case: /user_orders típico de bases de datos relacionales", "Usa MAYÚSCULAS: /USER_ORDERS para resaltar rutas críticas del sistema"], correct: "Usa guiones: /user-orders para mayor legibilidad y estándar web", explain: "Las URLs de APIs profesionales usan kebab-case: /order-items, /user-profiles. Es el estándar porque las URLs son case-insensitive en la práctica." },
  { q: "¿Qué es consistencia eventual?", opts: ["Garantiza que los datos estén consistentes inmediatamente en todos lados", "Los nodos convergen al mismo estado después de un breve período", "Un motor de base de datos diseñado para transacciones financieras", "Un protocolo de seguridad que verifica firmas digitales por lotes"], correct: "Los nodos convergen al mismo estado después de un breve período", explain: "Consistencia eventual: después de escribir, puede haber un momento donde distintos nodos tienen datos distintos, pero eventualmente todos convergen. Tradeoff de sistemas AP." },
];

function QuizLesson() {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const [shuffledOpts, setShuffledOpts] = useState([]);

  useEffect(() => {
    const q = shuffle(ALL_QUESTIONS).slice(0, 20);
    setQuestions(q);
    setShuffledOpts(shuffle(q[0]?.opts || []));
  }, []);

  useEffect(() => {
    if (questions[current]) setShuffledOpts(shuffle(questions[current].opts));
  }, [current, questions]);

  function selectAnswer(opt) {
    if (selected !== null) return;
    setSelected(opt);
    setShowExplain(true);
    if (opt === questions[current].correct) setScore(score + 1);
  }

  function nextQuestion() {
    if (current + 1 >= questions.length) setFinished(true);
    else { setCurrent(current + 1); setSelected(null); setShowExplain(false); }
  }

  function restart() {
    const q = shuffle(ALL_QUESTIONS).slice(0, 20);
    setQuestions(q);
    setCurrent(0); setSelected(null); setScore(0); setFinished(false); setShowExplain(false);
  }

  if (questions.length === 0) return <div style={{ color: "#71717a" }}>Cargando...</div>;

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    const emoji = pct >= 90 ? "👑" : pct >= 70 ? "🏆" : pct >= 50 ? "👍" : "📚";
    const msg = pct >= 90 ? "¡Nivel Arquitecto! Dominás API design a nivel senior." : pct >= 70 ? "Excelente base. Profundizá en los temas que fallaste." : pct >= 50 ? "Buen progreso. Repasá las lecciones y volvé a intentar." : "Necesitás más estudio. Revisá cada lección a fondo.";
    return (
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{emoji}</div>
        <div style={{ color: "#e4e4e7", fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{score}/{questions.length}</div>
        <div style={{ color: pct >= 70 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444", fontSize: 48, fontWeight: 900, marginBottom: 12 }}>{pct}%</div>
        <div style={{ color: "#a1a1aa", fontSize: 15, marginBottom: 24 }}>{msg}</div>
        <button onClick={restart} style={{
          background: "#6366f1", color: "#fff", border: "none", borderRadius: 10,
          padding: "12px 32px", fontWeight: 700, fontSize: 15, cursor: "pointer",
        }}>🔄 Quiz nuevo (preguntas aleatorias)</button>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ color: "#52525b", fontSize: 13 }}>Pregunta {current + 1} de {questions.length}</span>
        <span style={{ color: "#10b981", fontWeight: 700, fontSize: 14 }}>Score: {score}</span>
      </div>

      <div style={{ width: "100%", height: 3, background: "#27272a", borderRadius: 2, marginBottom: 24 }}>
        <div style={{ width: `${((current + 1) / questions.length) * 100}%`, height: 3, background: "linear-gradient(90deg, #ef4444, #f59e0b, #10b981)", borderRadius: 2, transition: "width 0.3s" }} />
      </div>

      <div style={{ color: "#e4e4e7", fontSize: 17, fontWeight: 700, marginBottom: 24, lineHeight: 1.6 }}>{q.q}</div>

      <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
        {shuffledOpts.map((opt, idx) => {
          let bg = "#18181b", border = "#27272a", textColor = "#e4e4e7";
          if (selected !== null) {
            if (opt === q.correct) { bg = "#10b98118"; border = "#10b981"; textColor = "#10b981"; }
            else if (opt === selected) { bg = "#ef444418"; border = "#ef4444"; textColor = "#ef4444"; }
          }
          return (
            <button key={opt} onClick={() => selectAnswer(opt)} style={{
              background: bg, border: `2px solid ${border}`, borderRadius: 10, padding: "14px 16px",
              color: textColor, fontSize: 14, cursor: selected ? "default" : "pointer", textAlign: "left", transition: "all 0.2s",
            }}>
              <span style={{ color: "#52525b", marginRight: 10, fontWeight: 700 }}>{String.fromCharCode(65 + idx)}.</span>
              {opt}
            </button>
          );
        })}
      </div>

      {showExplain && (
        <div style={{
          background: "#18181b", borderRadius: 10, padding: 16, marginBottom: 16,
          borderLeft: `4px solid ${selected === q.correct ? "#10b981" : "#f59e0b"}`,
        }}>
          <div style={{ color: selected === q.correct ? "#10b981" : "#f59e0b", fontWeight: 700, marginBottom: 6 }}>
            {selected === q.correct ? "✅ ¡Correcto!" : "❌ Incorrecto"}
          </div>
          <div style={{ color: "#a1a1aa", fontSize: 13, lineHeight: 1.6 }}>{q.explain}</div>
        </div>
      )}

      {selected !== null && (
        <button onClick={nextQuestion} style={{
          background: "#6366f1", color: "#fff", border: "none", borderRadius: 10,
          padding: "12px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer", width: "100%",
        }}>
          {current + 1 >= questions.length ? "Ver Resultado →" : "Siguiente →"}
        </button>
      )}
    </div>
  );
}

// ─── MAIN APP ───
export default function ExpertAPILab() {
  const [activeLesson, setActiveLesson] = useState("design");
  const [visited, setVisited] = useState(["design"]);

  function navigate(id) {
    setActiveLesson(id);
    if (!visited.includes(id)) setVisited([...visited, id]);
  }

  function renderLesson() {
    switch (activeLesson) {
      case "design": return <DesignPatternsLesson />;
      case "graphql": return <GraphQLLesson />;
      case "eventdriven": return <EventDrivenLesson />;
      case "security": return <SecurityLesson />;
      case "performance": return <PerformanceLesson />;
      case "openapi": return <OpenAPILesson />;
      case "distributed": return <DistributedLesson />;
      case "realworld": return <RealWorldLesson />;
      case "quiz": return <QuizLesson />;
      default: return null;
    }
  }

  const currentIdx = LESSONS.findIndex((l) => l.id === activeLesson);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#09090b",
      color: "#e4e4e7",
      fontFamily: "'Outfit', 'Satoshi', -apple-system, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #27272a; border-radius: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      <div style={{
        background: "linear-gradient(160deg, #09090b 0%, #18181b 50%, #1a1025 100%)",
        borderBottom: "1px solid #27272a",
        padding: "20px 20px",
      }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 26 }}>👑</span>
            <h1 style={{
              margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: -0.5,
              background: "linear-gradient(135deg, #ef4444, #f59e0b, #10b981)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Expert API Lab
            </h1>
            <span style={{
              background: "linear-gradient(135deg, #ef444422, #f59e0b22)", color: "#ef4444", fontSize: 10, fontWeight: 800,
              padding: "3px 8px", borderRadius: 6, letterSpacing: 1,
            }}>NIVEL 3</span>
          </div>
          <p style={{ margin: 0, color: "#52525b", fontSize: 13 }}>API Design, GraphQL, Event-Driven, Security, Sistemas Distribuidos</p>
          <div style={{ marginTop: 10, display: "flex", gap: 4, alignItems: "center" }}>
            <div style={{ flex: 1, height: 3, background: "#27272a", borderRadius: 2 }}>
              <div style={{
                width: `${(visited.length / LESSONS.length) * 100}%`, height: 3,
                background: "linear-gradient(90deg, #ef4444, #f59e0b, #10b981)", borderRadius: 2, transition: "width 0.5s",
              }} />
            </div>
            <span style={{ color: "#52525b", fontSize: 11, marginLeft: 8 }}>{visited.length}/{LESSONS.length}</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "14px 14px 40px" }}>
        <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 6, marginBottom: 20, scrollbarWidth: "thin" }}>
          {LESSONS.map((l) => (
            <button key={l.id} onClick={() => navigate(l.id)} style={{
              background: activeLesson === l.id ? "#18181b" : "transparent",
              border: `1px solid ${activeLesson === l.id ? "#6366f1" : "transparent"}`,
              borderRadius: 8, padding: "8px 12px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
            }}>
              <span style={{ fontSize: 14 }}>{visited.includes(l.id) && l.id !== activeLesson ? "✅" : l.icon}</span>
              <span style={{ color: activeLesson === l.id ? "#e4e4e7" : "#52525b", fontSize: 12, fontWeight: activeLesson === l.id ? 700 : 500 }}>
                {l.title}
              </span>
            </button>
          ))}
        </div>

        <div style={{ background: "#111113", borderRadius: 14, border: "1px solid #27272a", overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid #27272a", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 26 }}>{LESSONS[currentIdx].icon}</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>{LESSONS[currentIdx].title}</h2>
              <p style={{ margin: "2px 0 0", color: "#52525b", fontSize: 12 }}>{LESSONS[currentIdx].desc}</p>
            </div>
          </div>
          <div style={{ padding: 22 }} key={activeLesson}>
            {renderLesson()}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
          <button
            onClick={() => navigate(LESSONS[Math.max(0, currentIdx - 1)].id)}
            disabled={currentIdx === 0}
            style={{
              background: "#18181b", color: currentIdx === 0 ? "#27272a" : "#a1a1aa",
              border: "1px solid #27272a", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 600,
              cursor: currentIdx === 0 ? "default" : "pointer",
            }}
          >← Anterior</button>
          <button
            onClick={() => navigate(LESSONS[Math.min(LESSONS.length - 1, currentIdx + 1)].id)}
            disabled={currentIdx === LESSONS.length - 1}
            style={{
              background: currentIdx === LESSONS.length - 1 ? "#18181b" : "linear-gradient(135deg, #ef4444, #f59e0b)",
              color: currentIdx === LESSONS.length - 1 ? "#27272a" : "#fff",
              border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 700,
              cursor: currentIdx === LESSONS.length - 1 ? "default" : "pointer",
            }}
          >Siguiente →</button>
        </div>
      </div>
    </div>
  );
}
