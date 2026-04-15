import { useState } from 'react'
import LabLayout from './components/LabLayout.jsx'
import Quiz from './components/Quiz.jsx'
import { simulateAPI } from './services/apiMock.js'
import { cn } from './utils/cn.js'
import { methodTone, statusTone } from './utils/tone.js'

// ─── LESSONS CONFIG ───
const LESSONS = [
  { id: "anatomy", title: "Anatomía de un Request", icon: "🔬", desc: "Entendé cada pieza de una petición HTTP" },
  { id: "methods", title: "Métodos HTTP (CRUD)", icon: "⚡", desc: "GET, POST, PUT, DELETE en acción" },
  { id: "status", title: "Códigos de Estado", icon: "🚦", desc: "Qué significan 200, 404, 500..." },
  { id: "headers", title: "Headers & Auth", icon: "🔐", desc: "Autenticación y metadatos" },
  { id: "json", title: "JSON: El Idioma", icon: "📦", desc: "Cómo se estructuran los datos" },
  { id: "playground", title: "API Playground", icon: "🎮", desc: "Hacé requests reales a una API" },
  { id: "quiz", title: "Quiz Final", icon: "🏆", desc: "Poné a prueba lo aprendido" },
];

// ─── ANATOMY LESSON ───
function AnatomyLesson() {
  const [hoveredPart, setHoveredPart] = useState(null);

  const parts = [
    { id: "method", text: "GET", tone: { text: "text-pink-300", border: "border-pink-400/60", bg: "bg-pink-500/20" }, label: "MÉTODO", desc: "La acción que querés hacer. GET = leer datos. Como decirle al mesero: 'quiero ver el menú'." },
    { id: "protocol", text: "https://", tone: { text: "text-zinc-500", border: "border-zinc-600/60", bg: "bg-zinc-500/15" }, label: "PROTOCOLO", desc: "El idioma de comunicación. HTTPS = encriptado y seguro. Como hablar en código para que nadie espíe." },
    { id: "host", text: "api.whitelabel.lat", tone: { text: "text-sky-300", border: "border-sky-400/60", bg: "bg-sky-500/20" }, label: "HOST", desc: "El servidor (la cocina del restaurante). Es a DÓNDE va tu petición." },
    { id: "path", text: "/v1/usuarios", tone: { text: "text-violet-300", border: "border-violet-400/60", bg: "bg-violet-500/20" }, label: "PATH (RUTA)", desc: "El recurso específico. '/v1' es la versión de la API. '/usuarios' es QUÉ estás pidiendo." },
    { id: "query", text: "?rol=admin&limit=10", tone: { text: "text-amber-300", border: "border-amber-400/60", bg: "bg-amber-500/20" }, label: "QUERY PARAMS", desc: "Filtros opcionales. Como decir: 'solo los que sean admin, y máximo 10 resultados'." },
  ];

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
                'cursor-pointer rounded px-1 py-1 transition-colors border-b-2',
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
        const p = parts.find((x) => x.id === hoveredPart);
        return (
          <div className={cn('mb-4 rounded-xl border px-5 py-5', p.tone.bg, p.tone.border)}>
            <div className={cn('mb-2 text-xs font-bold tracking-[0.2em]', p.tone.text)}>{p.label}</div>
            <div className="text-sm leading-relaxed text-zinc-100">{p.desc}</div>
          </div>
        );
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
          {["Tu App", "→ Request →", "Servidor API", "→ Procesa →", "Base de Datos", "→ Response →", "Tu App"].map((step, i) => (
            <div
              key={i}
              className={cn(
                'rounded-lg px-3 py-2 text-xs',
                i % 2 === 0 ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'font-mono text-indigo-300',
              )}
            >
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── METHODS LESSON ───
function MethodsLesson() {
  const [activeMethod, setActiveMethod] = useState("GET");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const methods = [
    { name: "GET", emoji: "📖", analogy: "LEER", desc: "Obtener datos sin modificar nada. Idempotente: podés llamarlo 100 veces y el resultado es el mismo.", example: { endpoint: "usuarios", body: null }, realWorld: "Ver tu perfil, cargar una lista de productos, consultar el clima" },
    { name: "POST", emoji: "✍️", analogy: "CREAR", desc: "Crear un recurso nuevo. NO es idempotente: cada llamada crea algo nuevo.", example: { endpoint: "usuarios", body: { nombre: "Nuevo User", email: "nuevo@test.com", rol: "user" } }, realWorld: "Registrar un usuario, enviar un mensaje, crear una orden" },
    { name: "PUT", emoji: "🔄", analogy: "ACTUALIZAR", desc: "Reemplazar un recurso completo. Idempotente: actualizarlo 100 veces da el mismo resultado.", example: { endpoint: "usuarios/1", body: { nombre: "Daniel Actualizado", email: "daniel@whitelabel.lat" } }, realWorld: "Editar tu perfil completo, actualizar un producto" },
    { name: "PATCH", emoji: "🩹", analogy: "MODIFICAR", desc: "Actualizar parcialmente un recurso. Solo enviás los campos que cambian, no todo el objeto completo.", example: { endpoint: "usuarios/1", body: { email: "nuevo@correo.com" } }, realWorld: "Actualizar solo tu foto de perfil o tu contraseña" },
    { name: "DELETE", emoji: "🗑️", analogy: "ELIMINAR", desc: "Borrar un recurso. Idempotente: borrar algo que ya no existe no causa error (en teoría).", example: { endpoint: "productos/3", body: null }, realWorld: "Eliminar un post, cancelar una suscripción, borrar un archivo" },
  ];

  const active = methods.find((m) => m.name === activeMethod);

  async function runExample() {
    setLoading(true);
    const res = await simulateAPI(active.name, active.example.endpoint, active.example.body, { Authorization: "Bearer demo_token" });
    setResult(res);
    setLoading(false);
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
          {active.example.body && (
            <div className="mt-3 text-amber-300">Body: {JSON.stringify(active.example.body, null, 2)}</div>
          )}
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
          {loading ? "⏳ Enviando..." : `▶ Ejecutar ${active.name}`}
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
          <pre className="m-0 whitespace-pre-wrap font-mono text-sm leading-relaxed text-zinc-400">
            {JSON.stringify(result.body, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ─── STATUS CODES LESSON ───
function StatusLesson() {
  const [selected, setSelected] = useState(null);

  const codes = [
    { code: 200, text: "OK", family: "2xx", color: "#10b981", emoji: "✅", desc: "Todo salió bien. El servidor procesó tu petición y devolvió los datos." },
    { code: 201, text: "Created", family: "2xx", color: "#10b981", emoji: "🎉", desc: "Se creó un recurso nuevo exitosamente. Típico de un POST." },
    { code: 204, text: "No Content", family: "2xx", color: "#10b981", emoji: "🤫", desc: "Éxito, pero no hay nada que devolver. Común en DELETE." },
    { code: 301, text: "Moved Permanently", family: "3xx", color: "#eab308", emoji: "📍", desc: "El recurso se movió a otra URL permanentemente. Actualizá tus enlaces." },
    { code: 304, text: "Not Modified", family: "3xx", color: "#eab308", emoji: "📦", desc: "El recurso no cambió desde tu última petición. Usá tu cache." },
    { code: 400, text: "Bad Request", family: "4xx", color: "#f59e0b", emoji: "🤦", desc: "Tu petición tiene errores. Revisá el body, los parámetros o el formato." },
    { code: 401, text: "Unauthorized", family: "4xx", color: "#f59e0b", emoji: "🔒", desc: "No proporcionaste credenciales. Necesitás autenticarte." },
    { code: 403, text: "Forbidden", family: "4xx", color: "#f59e0b", emoji: "🚫", desc: "Tenés credenciales pero NO permiso para este recurso." },
    { code: 404, text: "Not Found", family: "4xx", color: "#f59e0b", emoji: "🔍", desc: "El recurso no existe. Revisá la URL." },
    { code: 429, text: "Too Many Requests", family: "4xx", color: "#f59e0b", emoji: "🚦", desc: "Enviaste demasiadas peticiones. Esperá antes de reintentar (rate limit)." },
    { code: 500, text: "Internal Server Error", family: "5xx", color: "#ef4444", emoji: "💥", desc: "El servidor explotó. No es tu culpa — es un bug del backend." },
    { code: 502, text: "Bad Gateway", family: "5xx", color: "#ef4444", emoji: "🔗", desc: "El servidor intermedio (proxy/gateway) recibió una respuesta inválida." },
    { code: 503, text: "Service Unavailable", family: "5xx", color: "#ef4444", emoji: "🔧", desc: "El servidor está caído o en mantenimiento. Reintentá después." },
  ];

  return (
    <div>
      <p className="mb-4 text-sm leading-relaxed text-zinc-400">
        Los códigos de estado te dicen <strong className="text-zinc-100">qué pasó</strong> con tu petición. La regla de oro:
      </p>

      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { range: "2xx", label: "Éxito", tone: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-400/20" }, emoji: "✅" },
          { range: "3xx", label: "Redirección", tone: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-400/20" }, emoji: "↗️" },
          { range: "4xx", label: "Error tuyo", tone: { text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-400/20" }, emoji: "🤦" },
          { range: "5xx", label: "Error servidor", tone: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-400/20" }, emoji: "💥" },
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
        const c = codes.find((x) => x.code === selected);
        return (
          <div className={cn('mt-4 rounded-xl border px-5 py-5', statusTone(c.code).bg, statusTone(c.code).border)}>
            <div className="mb-2 flex items-center gap-3">
              <span className="text-2xl">{c.emoji}</span>
              <span className={cn('font-mono text-2xl font-black', statusTone(c.code).text)}>{c.code}</span>
              <span className="font-semibold text-zinc-100">{c.text}</span>
            </div>
            <div className="text-sm leading-relaxed text-zinc-400">{c.desc}</div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── HEADERS & AUTH LESSON ───
function HeadersLesson() {
  const [authType, setAuthType] = useState("api-key");

  const headerExamples = [
    { name: "Content-Type", value: "application/json", desc: "Le dice al servidor qué formato tienen los datos que estás enviando.", category: "contenido" },
    { name: "Accept", value: "application/json", desc: "Le dice al servidor en qué formato querés la respuesta.", category: "contenido" },
    { name: "Authorization", value: "Bearer eyJhbGci...", desc: "Tu credencial de acceso. El servidor verifica que tenés permiso.", category: "auth" },
    { name: "X-API-Key", value: "sk-abc123xyz", desc: "Alternativa a Authorization. Clave única que identifica tu app.", category: "auth" },
    { name: "User-Agent", value: "WhitelabelBot/1.0", desc: "Identifica quién hace la petición. Útil para debugging.", category: "meta" },
    { name: "X-Request-ID", value: "req_abc123", desc: "ID único para rastrear esta petición específica en logs.", category: "meta" },
  ];

  const authTypes = [
    { id: "api-key", name: "API Key", icon: "🔑", pros: "Simple, rápido de implementar", cons: "Menos seguro, no expira automáticamente", example: `curl -H "X-API-Key: sk-abc123" \\\n  https://api.ejemplo.com/datos`, useCase: "APIs internas, servicios simples, prototipos" },
    { id: "bearer", name: "Bearer Token", icon: "🎫", pros: "Estándar, puede incluir permisos (JWT), expira", cons: "Más complejo, necesita flujo de login", example: `curl -H "Authorization: Bearer eyJhbG..." \\\n  https://api.ejemplo.com/datos`, useCase: "Apps con usuarios, OAuth 2.0, APIs públicas" },
    { id: "basic", name: "Basic Auth", icon: "👤", pros: "Muy simple, soportado en todos lados", cons: "Credenciales en texto (base64), DEBE usar HTTPS", example: `curl -u "usuario:password" \\\n  https://api.ejemplo.com/datos\n# Equivale a:\n# Authorization: Basic dXN1YXJpbzpwYXNz`, useCase: "Servicios legacy, integraciones básicas" },
  ];

  const activeAuth = authTypes.find((a) => a.id === authType);

  return (
    <div>
      <p className="mb-5 text-sm leading-relaxed text-zinc-400">
        Los headers son <strong className="text-zinc-100">metadatos</strong> de la petición. Viajan "fuera" del body, como el remitente y sellos en un sobre.
      </p>

      <div className="mb-7 grid gap-2">
        {headerExamples.map((h) => (
          <div key={h.name} className="flex gap-4 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
            <div className="min-w-40">
              <div className="font-mono text-sm font-bold text-violet-300">{h.name}</div>
              <div className="mt-1 font-mono text-xs text-zinc-600">{h.value}</div>
            </div>
            <div className="text-sm leading-relaxed text-zinc-500">{h.desc}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 text-xs font-bold tracking-widest text-amber-400">🔐 TIPOS DE AUTENTICACIÓN</div>

      <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {authTypes.map((a) => (
          <button
            key={a.id}
            onClick={() => setAuthType(a.id)}
            className={cn(
              'rounded-xl border-2 px-4 py-4 text-center transition-colors',
              authType === a.id ? 'border-indigo-400/70 bg-zinc-900' : 'border-zinc-800 hover:bg-zinc-900',
            )}
          >
            <div className="text-2xl">{a.icon}</div>
            <div className={cn('mt-1 text-sm font-bold', authType === a.id ? 'text-zinc-100' : 'text-zinc-500')}>{a.name}</div>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xl">{activeAuth.icon}</span>
          <span className="text-base font-bold text-zinc-100">{activeAuth.name}</span>
        </div>
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3">
            <div className="mb-1 text-[11px] font-bold text-emerald-400">✅ PROS</div>
            <div className="text-sm text-zinc-300">{activeAuth.pros}</div>
          </div>
          <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3">
            <div className="mb-1 text-[11px] font-bold text-red-400">⚠️ CONTRAS</div>
            <div className="text-sm text-zinc-300">{activeAuth.cons}</div>
          </div>
        </div>
        <div className="mb-3 whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 font-mono text-xs leading-relaxed text-zinc-300">
          {activeAuth.example}
        </div>
        <div className="text-xs text-zinc-500">
          <strong className="text-zinc-400">Caso de uso:</strong> {activeAuth.useCase}
        </div>
      </div>
    </div>
  );
}

// ─── JSON LESSON ───
function JSONLesson() {
  const [jsonInput, setJsonInput] = useState(`{
  "nombre": "Daniel",
  "edad": 28,
  "empresa": {
    "nombre": "Whitelabel SAS",
    "servicios": ["AI Agents", "Automatización", "Software"]
  },
  "activo": true,
  "telefono": null
}`);
  const [parseResult, setParseResult] = useState(null);
  const [showTypes, setShowTypes] = useState(false);

  function tryParse() {
    try {
      const parsed = JSON.parse(jsonInput);
      setParseResult({ valid: true, data: parsed, types: analyzeTypes(parsed) });
    } catch (e) {
      setParseResult({ valid: false, error: e.message });
    }
  }

  function analyzeTypes(obj, prefix = "") {
    const types = [];
    for (const [key, val] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (val === null) types.push({ path, type: "null", val: "null", colorClass: "text-zinc-400" });
      else if (Array.isArray(val)) types.push({ path, type: "array", val: `[${val.length} items]`, colorClass: "text-pink-300" });
      else if (typeof val === "object") {
        types.push({ path, type: "object", val: "{...}", colorClass: "text-violet-300" });
        types.push(...analyzeTypes(val, path));
      }
      else if (typeof val === "string") types.push({ path, type: "string", val: `"${val}"`, colorClass: "text-emerald-300" });
      else if (typeof val === "number") types.push({ path, type: "number", val: String(val), colorClass: "text-sky-300" });
      else if (typeof val === "boolean") types.push({ path, type: "boolean", val: String(val), colorClass: "text-amber-300" });
    }
    return types;
  }

  const dataTypes = [
    { type: "string", example: '"texto"', colorClass: "text-emerald-300", desc: "Texto entre comillas dobles" },
    { type: "number", example: "42, 3.14", colorClass: "text-sky-300", desc: "Enteros o decimales, SIN comillas" },
    { type: "boolean", example: "true / false", colorClass: "text-amber-300", desc: "Verdadero o falso, SIN comillas" },
    { type: "null", example: "null", colorClass: "text-zinc-400", desc: "Ausencia de valor, SIN comillas" },
    { type: "array", example: '[1, "a", true]', colorClass: "text-pink-300", desc: "Lista ordenada de valores" },
    { type: "object", example: '{"key": "val"}', colorClass: "text-violet-300", desc: "Pares clave-valor (diccionario)" },
  ];

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
        onChange={(e) => { setJsonInput(e.target.value); setParseResult(null); }}
        className="min-h-40 w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-sm leading-relaxed text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70"
        spellCheck={false}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={tryParse} className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-500 px-4 text-sm font-bold text-white transition-colors hover:bg-indigo-400">
          ✓ Validar JSON
        </button>
        <button onClick={() => setShowTypes(!showTypes)} className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-800">
          {showTypes ? "Ocultar" : "Mostrar"} tipos
        </button>
      </div>

      {parseResult && (
        <div className={cn('mt-3 rounded-xl border px-4 py-4', parseResult.valid ? 'border-emerald-400/30 bg-emerald-500/10' : 'border-red-400/30 bg-red-500/10')}>
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
          <span className="font-mono text-red-300">{'{ nombre: "test" }'}</span> → Las keys SIEMPRE van con comillas dobles<br/>
          <span className="font-mono text-red-300">{'{ "a": \'test\' }'}</span> → Comillas DOBLES, nunca simples<br/>
          <span className="font-mono text-red-300">{'{ "a": 1, }'}</span> → No se permite coma al final (trailing comma)<br/>
          <span className="font-mono text-red-300">{'{ "a": undefined }'}</span> → No existe undefined en JSON, usá null
        </div>
      </div>
    </div>
  );
}

// ─── PLAYGROUND LESSON ───
function PlaygroundLesson() {
  const [method, setMethod] = useState("GET");
  const [endpoint, setEndpoint] = useState("usuarios");
  const [body, setBody] = useState('{\n  "nombre": "Test User",\n  "email": "test@demo.com"\n}');
  const [authKey, setAuthKey] = useState("Bearer demo_token");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"];

  async function sendRequest() {
    setLoading(true);
    let parsedBody = null;
    if (["POST", "PUT", "PATCH"].includes(method)) {
      try { parsedBody = JSON.parse(body); } catch (e) {
        setResult({ status: 0, statusText: "Parse Error", body: { error: "El body no es JSON válido: " + e.message }, time: 0 });
        setLoading(false);
        return;
      }
    }
    const headers = authKey ? { Authorization: authKey } : {};
    const res = await simulateAPI(method, endpoint, parsedBody, headers);
    setResult(res);
    setHistory((h) => [{ method, endpoint, status: res.status, time: Math.round(res.time) }, ...h].slice(0, 8));
    setLoading(false);
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
              value={endpoint} onChange={(e) => setEndpoint(e.target.value)}
              placeholder="usuarios, productos, usuarios/1..."
              className="flex-1 bg-transparent px-3 py-2 font-mono text-sm text-zinc-100 outline-none"
            />
          </div>
          <div className="mt-1 text-xs text-zinc-600">
            Recursos disponibles: <span className="font-mono text-violet-300">usuarios</span>, <span className="font-mono text-violet-300">productos</span> — Agregá <span className="font-mono text-amber-300">/id</span> para un item específico
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold tracking-widest text-zinc-500">AUTENTICACIÓN</label>
          <input
            value={authKey} onChange={(e) => setAuthKey(e.target.value)}
            placeholder="Bearer token o dejá vacío para ver error 401"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70"
          />
          <div className="mt-1 text-xs text-zinc-600">Borrá este campo para ver un error 401 Unauthorized</div>
        </div>

        {["POST", "PUT", "PATCH"].includes(method) && (
          <div>
            <label className="mb-2 block text-xs font-bold tracking-widest text-zinc-500">BODY (JSON)</label>
            <textarea
              value={body} onChange={(e) => setBody(e.target.value)}
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
          {loading ? "⏳ Enviando..." : `▶ Enviar ${method} Request`}
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
          <pre className="m-0 whitespace-pre-wrap px-4 py-4 font-mono text-sm leading-relaxed text-zinc-400">
            {JSON.stringify(result.body, null, 2)}
          </pre>
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
  );
}

// ─── QUIZ LESSON ───
const ALL_QUESTIONS = [
  { q: "¿Qué método HTTP usás para CREAR un recurso nuevo?", opts: ["GET: Obtiene los recursos actuales", "POST: Envía datos para crear el recurso", "PUT: Modifica un recurso parcialmente", "DELETE: Oculta el recurso del sistema"], correct: "POST: Envía datos para crear el recurso", explain: "POST crea recursos nuevos. Cada POST puede crear un recurso diferente (no es idempotente)." },
  { q: "Recibís un error 401. ¿Qué significa?", opts: ["El servidor no encontró el recurso solicitado", "No enviaste credenciales válidas de autenticación", "Ocurrió un error interno en el servidor", "Excediste el límite de peticiones permitidas"], correct: "No enviaste credenciales válidas de autenticación", explain: "401 = Unauthorized. No proporcionaste credenciales válidas. Diferente de 403 (tenés credenciales pero no permiso)." },
  { q: "¿Cuál de estos JSON es VÁLIDO?", opts: ["{ nombre: 'test', activo: true }", '{ "nombre": "test", "activo": true }', "{ 'nombre': 'test', 'activo': true }", '{ "nombre": test, "activo": true }'], correct: '{ "nombre": "test", "activo": true }', explain: 'En JSON, las keys y strings SIEMPRE van con comillas dobles (").' },
  { q: "¿Qué header se usa para indicar el formato del body?", opts: ["Authorization: Bearer <token>", "Content-Type: application/json", "Accept: application/json", "User-Agent: Mozilla/5.0"], correct: "Content-Type: application/json", explain: "Content-Type dice qué formato ENVÍAS (ej: application/json). Accept dice qué formato QUERÉS recibir." },
  { q: "Error 404 vs 403: ¿cuál es la diferencia?", opts: ["404 = error del servidor, 403 = error del cliente", "404 = el recurso no existe, 403 = no tenés permiso", "403 = el recurso no existe, 404 = no tenés permiso", "404 = recurso movido, 403 = recurso eliminado"], correct: "404 = el recurso no existe, 403 = no tenés permiso", explain: "404 = el recurso no existe. 403 = existe pero no tenés permiso para accederlo." },
  { q: "¿Cuál es la diferencia entre PUT y PATCH?", opts: ["PUT crea un recurso nuevo, PATCH solo lo elimina", "PUT reemplaza el recurso entero, PATCH solo partes", "PATCH actualiza datos sincrónicamente, PUT es async", "PUT es más seguro para datos, PATCH es más rápido"], correct: "PUT reemplaza el recurso entero, PATCH solo partes", explain: "PUT reemplaza el recurso completo. PATCH actualiza solo los campos que enviás. PUT necesita el objeto completo." },
  { q: "¿Qué significa que GET es 'idempotente'?", opts: ["Es el método más rápido para obtener información", "Llamarlo una o mil veces produce el mismo estado", "Solo se puede ejecutar una vez por cada sesión", "No requiere autenticación para devolver datos"], correct: "Llamarlo una o mil veces produce el mismo estado", explain: "Idempotente = llamarlo 1 vez o 100 da el mismo resultado. GET, PUT y DELETE son idempotentes. POST no." },
  { q: "Recibís un 429. ¿Qué hacés?", opts: ["Reintentar la petición inmediatamente de forma cíclica", "Implementar exponential backoff y reintentar luego", "Cambiar de endpoint para evadir el bloqueo actual", "Renovar el token de autenticación inmediatamente"], correct: "Implementar exponential backoff y reintentar luego", explain: "429 = Too Many Requests (rate limit). La estrategia correcta es exponential backoff: esperar cada vez más entre reintentos." },
  { q: "¿Cuál es el código de estado para un éxito estándar en GET?", opts: ["200 OK: La solicitud tuvo éxito", "201 Created: El recurso fue creado", "204 No Content: Éxito sin respuesta", "400 Bad Request: Todo correcto"], correct: "200 OK: La solicitud tuvo éxito", explain: "El código 200 indica que la petición se procesó con éxito y el servidor devuelve la información." },
  { q: "¿Qué hace el método DELETE?", opts: ["Elimina un recurso de forma permanente o lógica", "Oculta el recurso temporalmente al usuario", "Borra el token de autenticación del cliente", "Elimina los encabezados HTTP del request"], correct: "Elimina un recurso de forma permanente o lógica", explain: "DELETE se utiliza para eliminar un recurso. Es idempotente, borrarlo 10 veces seguidas da el mismo resultado (el recurso no existe)." },
  { q: "¿Qué código indica que el servidor falló internamente?", opts: ["400 Bad Request", "404 Not Found", "500 Internal Server Error", "502 Bad Gateway"], correct: "500 Internal Server Error", explain: "500 indica que ocurrió un error inesperado en el servidor y no pudo procesar la solicitud (ej. error de código, caída de DB)." },
  { q: "¿Para qué sirve el endpoint en una API?", opts: ["Es el formato de datos de la respuesta", "Es la URL específica donde vive el recurso", "Es el método de autenticación del usuario", "Es el código de estado del servidor"], correct: "Es la URL específica donde vive el recurso", explain: "El endpoint es la ruta (URL) que representa al recurso, por ejemplo: /api/usuarios/1" }
];

// ─── MAIN APP ───
export default function APILearningLab() {
  const [activeLesson, setActiveLesson] = useState("anatomy");
  const [visited, setVisited] = useState(["anatomy"]);

  function navigate(id) {
    setActiveLesson(id);
    if (!visited.includes(id)) setVisited([...visited, id]);
  }

  function renderLesson() {
    switch (activeLesson) {
      case "anatomy":
        return <AnatomyLesson />
      case "methods":
        return <MethodsLesson />
      case "status":
        return <StatusLesson />
      case "headers":
        return <HeadersLesson />
      case "json":
        return <JSONLesson />
      case "playground":
        return <PlaygroundLesson />
      case "quiz":
        return (
          <Quiz
            questionsBank={ALL_QUESTIONS}
            questionCount={8}
            messages={{
              high: "¡Excelente! Dominás los fundamentos.",
              medium: "¡Bien! Repasá los conceptos que fallaste.",
              low: "Necesitás repasar. Volvé a las lecciones.",
            }}
          />
        )
      default:
        return null
    }
  }

  return (
    <LabLayout
      icon="⚡"
      title="API Learning Lab"
      titleClassName="text-xl font-black tracking-tight bg-gradient-to-r from-sky-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent"
      subtitle="Aprendé APIs desde cero con ejemplos interactivos"
      levelLabel="NIVEL 1"
      levelColor="indigo"
      progressBarClassName="bg-gradient-to-r from-indigo-500 to-violet-500"
      lessons={LESSONS}
      activeLesson={activeLesson}
      visited={visited}
      onNavigate={navigate}
    >
      {renderLesson()}
    </LabLayout>
  );
}
