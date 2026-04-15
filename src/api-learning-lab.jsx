import { useState, useEffect, useRef } from "react";

// ─── UTILS ───
function getStatusColor(code) {
  if (code >= 200 && code < 300) return "#10b981";
  if (code >= 300 && code < 400) return "#eab308";
  if (code >= 400 && code < 500) return "#f59e0b";
  if (code >= 500) return "#ef4444";
  return "#71717a";
}

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

// ─── SIMULATED API SERVER ───
const fakeDB = {
  usuarios: [
    { id: 1, nombre: "Daniel", email: "daniel@whitelabel.lat", rol: "admin" },
    { id: 2, nombre: "Andrés", email: "andres@whitelabel.lat", rol: "dev" },
    { id: 3, nombre: "María", email: "maria@ejemplo.com", rol: "user" },
  ],
  productos: [
    { id: 1, nombre: "Plan Starter", precio: 99, moneda: "USD" },
    { id: 2, nombre: "Plan Pro", precio: 299, moneda: "USD" },
    { id: 3, nombre: "Plan Enterprise", precio: 799, moneda: "USD" },
  ],
};

function simulateAPI(method, endpoint, body = null, headers = {}) {
  const delay = 300 + Math.random() * 700;
  return new Promise((resolve) => {
    setTimeout(() => {
      const parts = endpoint.split("/").filter(Boolean);
      const resource = parts[0];
      const id = parts[1] ? parseInt(parts[1]) : null;

      if (!headers["Authorization"] && !headers["X-API-Key"]) {
        resolve({ status: 401, statusText: "Unauthorized", body: { error: "No se proporcionó autenticación", message: "Incluí un header Authorization o X-API-Key" }, time: delay });
        return;
      }
      if (!fakeDB[resource]) {
        resolve({ status: 404, statusText: "Not Found", body: { error: "Recurso no encontrado", available: Object.keys(fakeDB) }, time: delay });
        return;
      }

      switch (method) {
        case "GET":
          if (id) {
            const item = fakeDB[resource].find((i) => i.id === id);
            if (!item) resolve({ status: 404, statusText: "Not Found", body: { error: `${resource} con id ${id} no existe` }, time: delay });
            else resolve({ status: 200, statusText: "OK", body: item, time: delay });
          } else {
            resolve({ status: 200, statusText: "OK", body: fakeDB[resource], time: delay });
          }
          break;
        case "POST":
          if (!body || !body.nombre) {
            resolve({ status: 400, statusText: "Bad Request", body: { error: "El campo 'nombre' es requerido" }, time: delay });
          } else {
            const newItem = { id: fakeDB[resource].length + 1, ...body };
            fakeDB[resource].push(newItem);
            resolve({ status: 201, statusText: "Created", body: newItem, time: delay });
          }
          break;
        case "PUT":
          if (!id) {
            resolve({ status: 400, statusText: "Bad Request", body: { error: "Se requiere un ID para actualizar" }, time: delay });
          } else {
            const idx = fakeDB[resource].findIndex((i) => i.id === id);
            if (idx === -1) resolve({ status: 404, statusText: "Not Found", body: { error: `No existe ${resource} con id ${id}` }, time: delay });
            else { fakeDB[resource][idx] = { id, ...body }; resolve({ status: 200, statusText: "OK", body: fakeDB[resource][idx], time: delay }); }
          }
          break;
        case "PATCH":
          if (!id) {
            resolve({ status: 400, statusText: "Bad Request", body: { error: "Se requiere un ID para modificar" }, time: delay });
          } else {
            const idx = fakeDB[resource].findIndex((i) => i.id === id);
            if (idx === -1) resolve({ status: 404, statusText: "Not Found", body: { error: `No existe ${resource} con id ${id}` }, time: delay });
            else { fakeDB[resource][idx] = { ...fakeDB[resource][idx], ...body }; resolve({ status: 200, statusText: "OK", body: fakeDB[resource][idx], time: delay }); }
          }
          break;
        case "DELETE":
          if (!id) {
            resolve({ status: 400, statusText: "Bad Request", body: { error: "Se requiere un ID para eliminar" }, time: delay });
          } else {
            const dIdx = fakeDB[resource].findIndex((i) => i.id === id);
            if (dIdx === -1) resolve({ status: 404, statusText: "Not Found", body: { error: "No existe" }, time: delay });
            else { const deleted = fakeDB[resource].splice(dIdx, 1)[0]; resolve({ status: 200, statusText: "OK", body: { message: "Eliminado exitosamente", deleted }, time: delay }); }
          }
          break;
        default:
          resolve({ status: 405, statusText: "Method Not Allowed", body: { error: "Método no soportado" }, time: delay });
      }
    }, delay);
  });
}

// ─── ANATOMY LESSON ───
function AnatomyLesson() {
  const [hoveredPart, setHoveredPart] = useState(null);

  const parts = [
    { id: "method", text: "GET", color: "#f472b6", label: "MÉTODO", desc: "La acción que querés hacer. GET = leer datos. Como decirle al mesero: 'quiero ver el menú'." },
    { id: "protocol", text: "https://", color: "#71717a", label: "PROTOCOLO", desc: "El idioma de comunicación. HTTPS = encriptado y seguro. Como hablar en código para que nadie espíe." },
    { id: "host", text: "api.whitelabel.lat", color: "#60a5fa", label: "HOST", desc: "El servidor (la cocina del restaurante). Es a DÓNDE va tu petición." },
    { id: "path", text: "/v1/usuarios", color: "#a78bfa", label: "PATH (RUTA)", desc: "El recurso específico. '/v1' es la versión de la API. '/usuarios' es QUÉ estás pidiendo." },
    { id: "query", text: "?rol=admin&limit=10", color: "#fbbf24", label: "QUERY PARAMS", desc: "Filtros opcionales. Como decir: 'solo los que sean admin, y máximo 10 resultados'." },
  ];

  return (
    <div>
      <p style={{ color: "#a1a1aa", marginBottom: 24, fontSize: 15, lineHeight: 1.7 }}>
        Cada request HTTP es como una oración: tiene sujeto, verbo y complementos. Tocá cada parte para entender qué hace.
      </p>

      <div style={{ background: "#09090b", borderRadius: 12, padding: "24px 20px", marginBottom: 20, overflowX: "auto", border: "1px solid #27272a" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 16 }}>
          {parts.map((p) => (
            <span
              key={p.id}
              onMouseEnter={() => setHoveredPart(p.id)}
              onMouseLeave={() => setHoveredPart(null)}
              onClick={() => setHoveredPart(hoveredPart === p.id ? null : p.id)}
              style={{
                color: hoveredPart === p.id ? "#fff" : p.color,
                background: hoveredPart === p.id ? p.color + "33" : "transparent",
                padding: "4px 2px", borderRadius: 4, cursor: "pointer", transition: "all 0.2s",
                borderBottom: `2px solid ${hoveredPart === p.id ? p.color : "transparent"}`,
                marginRight: p.id === "method" ? 12 : 0,
              }}
            >
              {p.text}
            </span>
          ))}
        </div>
      </div>

      {hoveredPart && (() => {
        const p = parts.find((x) => x.id === hoveredPart);
        return (
          <div style={{
            background: p.color + "12", border: `1px solid ${p.color}33`,
            borderRadius: 10, padding: 20, marginBottom: 16,
          }}>
            <div style={{ color: p.color, fontWeight: 700, fontSize: 12, letterSpacing: 1.5, marginBottom: 8 }}>{p.label}</div>
            <div style={{ color: "#e4e4e7", fontSize: 15, lineHeight: 1.6 }}>{p.desc}</div>
          </div>
        );
      })()}

      <div style={{ background: "#18181b", borderRadius: 10, padding: 20, marginTop: 20, border: "1px solid #27272a" }}>
        <div style={{ color: "#f59e0b", fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 12 }}>💡 ANALOGÍA COMPLETA</div>
        <div style={{ color: "#a1a1aa", fontSize: 14, lineHeight: 1.8 }}>
          <strong style={{ color: "#f472b6" }}>GET</strong> → "Quiero ver" &nbsp;|&nbsp;
          <strong style={{ color: "#60a5fa" }}>api.whitelabel.lat</strong> → "el restaurante" &nbsp;|&nbsp;
          <strong style={{ color: "#a78bfa" }}>/v1/usuarios</strong> → "la carta de usuarios" &nbsp;|&nbsp;
          <strong style={{ color: "#fbbf24" }}>?rol=admin</strong> → "solo los administradores"
        </div>
      </div>

      <div style={{ background: "#18181b", borderRadius: 10, padding: 20, marginTop: 16, border: "1px solid #27272a" }}>
        <div style={{ color: "#10b981", fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 12 }}>🔄 EL CICLO COMPLETO</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap", padding: "12px 0" }}>
          {["Tu App", "→ Request →", "Servidor API", "→ Procesa →", "Base de Datos", "→ Response →", "Tu App"].map((step, i) => (
            <div key={i} style={{
              padding: "8px 14px", borderRadius: 8,
              background: i % 2 === 0 ? "#27272a" : "transparent",
              color: i % 2 === 0 ? "#e4e4e7" : "#6366f1",
              fontSize: 13, fontWeight: i % 2 === 0 ? 600 : 400,
              fontFamily: i % 2 !== 0 ? "monospace" : "inherit",
            }}>
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
    { name: "GET", color: "#10b981", emoji: "📖", analogy: "LEER", desc: "Obtener datos sin modificar nada. Idempotente: podés llamarlo 100 veces y el resultado es el mismo.", example: { endpoint: "usuarios", body: null }, realWorld: "Ver tu perfil, cargar una lista de productos, consultar el clima" },
    { name: "POST", color: "#3b82f6", emoji: "✍️", analogy: "CREAR", desc: "Crear un recurso nuevo. NO es idempotente: cada llamada crea algo nuevo.", example: { endpoint: "usuarios", body: { nombre: "Nuevo User", email: "nuevo@test.com", rol: "user" } }, realWorld: "Registrar un usuario, enviar un mensaje, crear una orden" },
    { name: "PUT", color: "#f59e0b", emoji: "🔄", analogy: "ACTUALIZAR", desc: "Reemplazar un recurso completo. Idempotente: actualizarlo 100 veces da el mismo resultado.", example: { endpoint: "usuarios/1", body: { nombre: "Daniel Actualizado", email: "daniel@whitelabel.lat" } }, realWorld: "Editar tu perfil completo, actualizar un producto" },
    { name: "PATCH", color: "#a855f7", emoji: "🩹", analogy: "MODIFICAR", desc: "Actualizar parcialmente un recurso. Solo enviás los campos que cambian, no todo el objeto completo.", example: { endpoint: "usuarios/1", body: { email: "nuevo@correo.com" } }, realWorld: "Actualizar solo tu foto de perfil o tu contraseña" },
    { name: "DELETE", color: "#ef4444", emoji: "🗑️", analogy: "ELIMINAR", desc: "Borrar un recurso. Idempotente: borrar algo que ya no existe no causa error (en teoría).", example: { endpoint: "productos/3", body: null }, realWorld: "Eliminar un post, cancelar una suscripción, borrar un archivo" },
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
      <p style={{ color: "#a1a1aa", marginBottom: 20, fontSize: 15, lineHeight: 1.7 }}>
        Los métodos HTTP representan las 4 operaciones fundamentales sobre datos (<strong style={{ color: "#e4e4e7" }}>CRUD</strong>). Tocá cada uno y ejecutá el ejemplo.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 24 }}>
        {methods.map((m) => (
          <button key={m.name} onClick={() => { setActiveMethod(m.name); setResult(null); }} style={{
            background: activeMethod === m.name ? m.color + "15" : "transparent",
            border: `2px solid ${activeMethod === m.name ? m.color : "#27272a"}`,
            borderRadius: 12, padding: "14px 8px", cursor: "pointer", textAlign: "center", transition: "all 0.2s",
          }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{m.emoji}</div>
            <div style={{ color: m.color, fontWeight: 800, fontSize: 14, fontFamily: "monospace" }}>{m.name}</div>
            <div style={{ color: "#52525b", fontSize: 11, marginTop: 2 }}>{m.analogy}</div>
          </button>
        ))}
      </div>

      <div style={{ background: "#09090b", borderRadius: 12, padding: 20, border: `1px solid ${active.color}33`, marginBottom: 20 }}>
        <div style={{ color: "#e4e4e7", fontSize: 15, lineHeight: 1.7, marginBottom: 16 }}>{active.desc}</div>

        <div style={{ background: "#18181b", borderRadius: 8, padding: 16, marginBottom: 16, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
          <span style={{ color: active.color, fontWeight: 700 }}>{active.name}</span>{" "}
          <span style={{ color: "#52525b" }}>https://api.ejemplo.com/</span>
          <span style={{ color: "#e4e4e7" }}>{active.example.endpoint}</span>
          {active.example.body && (
            <div style={{ color: "#f59e0b", marginTop: 8 }}>
              Body: {JSON.stringify(active.example.body, null, 2)}
            </div>
          )}
        </div>

        <div style={{ color: "#71717a", fontSize: 13, marginBottom: 16 }}>
          <strong style={{ color: "#a1a1aa" }}>Uso real:</strong> {active.realWorld}
        </div>

        <button onClick={runExample} disabled={loading} style={{
          background: active.color, color: "#fff", border: "none", borderRadius: 8,
          padding: "10px 24px", fontWeight: 700, fontSize: 14, cursor: loading ? "wait" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}>
          {loading ? "⏳ Enviando..." : `▶ Ejecutar ${active.name}`}
        </button>
      </div>

      {result && (
        <div style={{
          background: "#09090b", borderRadius: 10, padding: 16,
          borderLeft: `4px solid ${getStatusColor(result.status)}`, border: "1px solid #27272a",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ color: getStatusColor(result.status), fontWeight: 700, fontFamily: "monospace" }}>
              {result.status} {result.statusText}
            </span>
            <span style={{ color: "#52525b", fontSize: 12 }}>{Math.round(result.time)}ms</span>
          </div>
          <pre style={{ color: "#a1a1aa", fontSize: 13, margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
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
      <p style={{ color: "#a1a1aa", marginBottom: 16, fontSize: 15, lineHeight: 1.7 }}>
        Los códigos de estado te dicen <strong style={{ color: "#e4e4e7" }}>qué pasó</strong> con tu petición. La regla de oro:
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 24 }}>
        {[
          { range: "2xx", label: "Éxito", color: "#10b981", emoji: "✅" },
          { range: "3xx", label: "Redirección", color: "#eab308", emoji: "↗️" },
          { range: "4xx", label: "Error tuyo", color: "#f59e0b", emoji: "🤦" },
          { range: "5xx", label: "Error servidor", color: "#ef4444", emoji: "💥" },
        ].map((f) => (
          <div key={f.range} style={{
            background: f.color + "12", borderRadius: 10, padding: "10px 12px",
            textAlign: "center", border: `1px solid ${f.color}22`,
          }}>
            <div style={{ fontSize: 18 }}>{f.emoji}</div>
            <div style={{ color: f.color, fontWeight: 800, fontFamily: "monospace", fontSize: 16 }}>{f.range}</div>
            <div style={{ color: "#52525b", fontSize: 11 }}>{f.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
        {codes.map((c) => (
          <button key={c.code} onClick={() => setSelected(selected === c.code ? null : c.code)} style={{
            background: selected === c.code ? c.color + "18" : "#18181b",
            border: `1px solid ${selected === c.code ? c.color : "#27272a"}`,
            borderRadius: 10, padding: "10px 12px", cursor: "pointer", textAlign: "left", transition: "all 0.15s",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14 }}>{c.emoji}</span>
              <span style={{ color: c.color, fontWeight: 800, fontFamily: "monospace", fontSize: 15 }}>{c.code}</span>
            </div>
            <div style={{ color: "#52525b", fontSize: 11, marginTop: 4 }}>{c.text}</div>
          </button>
        ))}
      </div>

      {selected && (() => {
        const c = codes.find((x) => x.code === selected);
        return (
          <div style={{
            background: c.color + "10", border: `1px solid ${c.color}33`,
            borderRadius: 10, padding: 20, marginTop: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 24 }}>{c.emoji}</span>
              <span style={{ color: c.color, fontWeight: 800, fontFamily: "monospace", fontSize: 22 }}>{c.code}</span>
              <span style={{ color: "#e4e4e7", fontWeight: 600 }}>{c.text}</span>
            </div>
            <div style={{ color: "#a1a1aa", fontSize: 15, lineHeight: 1.7 }}>{c.desc}</div>
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
      <p style={{ color: "#a1a1aa", marginBottom: 20, fontSize: 15, lineHeight: 1.7 }}>
        Los headers son <strong style={{ color: "#e4e4e7" }}>metadatos</strong> de la petición. Viajan "fuera" del body, como el remitente y sellos en un sobre.
      </p>

      <div style={{ display: "grid", gap: 8, marginBottom: 28 }}>
        {headerExamples.map((h) => (
          <div key={h.name} style={{
            background: "#09090b", borderRadius: 10, padding: "12px 16px",
            display: "flex", gap: 16, alignItems: "flex-start", border: "1px solid #27272a",
          }}>
            <div style={{ minWidth: 160 }}>
              <div style={{ color: "#a78bfa", fontFamily: "monospace", fontWeight: 700, fontSize: 13 }}>{h.name}</div>
              <div style={{ color: "#3f3f46", fontFamily: "monospace", fontSize: 11, marginTop: 2 }}>{h.value}</div>
            </div>
            <div style={{ color: "#71717a", fontSize: 13, lineHeight: 1.5 }}>{h.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ color: "#f59e0b", fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 16 }}>🔐 TIPOS DE AUTENTICACIÓN</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 20 }}>
        {authTypes.map((a) => (
          <button key={a.id} onClick={() => setAuthType(a.id)} style={{
            background: authType === a.id ? "#18181b" : "transparent",
            border: `2px solid ${authType === a.id ? "#6366f1" : "#27272a"}`,
            borderRadius: 12, padding: "14px 12px", cursor: "pointer", textAlign: "center", transition: "all 0.2s",
          }}>
            <div style={{ fontSize: 22 }}>{a.icon}</div>
            <div style={{ color: authType === a.id ? "#e4e4e7" : "#71717a", fontWeight: 700, fontSize: 13, marginTop: 4 }}>{a.name}</div>
          </button>
        ))}
      </div>

      <div style={{ background: "#09090b", borderRadius: 12, padding: 20, border: "1px solid #27272a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 20 }}>{activeAuth.icon}</span>
          <span style={{ color: "#e4e4e7", fontWeight: 700, fontSize: 16 }}>{activeAuth.name}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div style={{ background: "#10b98112", borderRadius: 8, padding: 12, border: "1px solid #10b98122" }}>
            <div style={{ color: "#10b981", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>✅ PROS</div>
            <div style={{ color: "#a1a1aa", fontSize: 12 }}>{activeAuth.pros}</div>
          </div>
          <div style={{ background: "#ef444412", borderRadius: 8, padding: 12, border: "1px solid #ef444422" }}>
            <div style={{ color: "#ef4444", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>⚠️ CONTRAS</div>
            <div style={{ color: "#a1a1aa", fontSize: 12 }}>{activeAuth.cons}</div>
          </div>
        </div>
        <div style={{ background: "#18181b", borderRadius: 8, padding: 12, marginBottom: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#a1a1aa", whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
          {activeAuth.example}
        </div>
        <div style={{ color: "#52525b", fontSize: 12 }}>
          <strong style={{ color: "#71717a" }}>Caso de uso:</strong> {activeAuth.useCase}
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
      if (val === null) types.push({ path, type: "null", val: "null", color: "#71717a" });
      else if (Array.isArray(val)) types.push({ path, type: "array", val: `[${val.length} items]`, color: "#f472b6" });
      else if (typeof val === "object") {
        types.push({ path, type: "object", val: "{...}", color: "#a78bfa" });
        types.push(...analyzeTypes(val, path));
      }
      else if (typeof val === "string") types.push({ path, type: "string", val: `"${val}"`, color: "#10b981" });
      else if (typeof val === "number") types.push({ path, type: "number", val: String(val), color: "#60a5fa" });
      else if (typeof val === "boolean") types.push({ path, type: "boolean", val: String(val), color: "#fbbf24" });
    }
    return types;
  }

  const dataTypes = [
    { type: "string", example: '"texto"', color: "#10b981", desc: "Texto entre comillas dobles" },
    { type: "number", example: "42, 3.14", color: "#60a5fa", desc: "Enteros o decimales, SIN comillas" },
    { type: "boolean", example: "true / false", color: "#fbbf24", desc: "Verdadero o falso, SIN comillas" },
    { type: "null", example: "null", color: "#71717a", desc: "Ausencia de valor, SIN comillas" },
    { type: "array", example: '[1, "a", true]', color: "#f472b6", desc: "Lista ordenada de valores" },
    { type: "object", example: '{"key": "val"}', color: "#a78bfa", desc: "Pares clave-valor (diccionario)" },
  ];

  return (
    <div>
      <p style={{ color: "#a1a1aa", marginBottom: 12, fontSize: 15, lineHeight: 1.7 }}>
        JSON (JavaScript Object Notation) es el <strong style={{ color: "#e4e4e7" }}>formato universal</strong> para enviar y recibir datos en APIs. Es legible por humanos y por máquinas.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 20 }}>
        {dataTypes.map((d) => (
          <div key={d.type} style={{ background: "#09090b", borderRadius: 10, padding: "10px 12px", border: "1px solid #27272a" }}>
            <div style={{ color: d.color, fontWeight: 800, fontFamily: "monospace", fontSize: 13 }}>{d.type}</div>
            <div style={{ color: "#e4e4e7", fontFamily: "monospace", fontSize: 12, margin: "4px 0" }}>{d.example}</div>
            <div style={{ color: "#52525b", fontSize: 11 }}>{d.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ color: "#f59e0b", fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 10 }}>🧪 EDITOR INTERACTIVO — Editá y validá JSON</div>
      <textarea
        value={jsonInput}
        onChange={(e) => { setJsonInput(e.target.value); setParseResult(null); }}
        style={{
          width: "100%", minHeight: 160, background: "#09090b", color: "#e4e4e7",
          border: "1px solid #27272a", borderRadius: 10, padding: 14,
          fontFamily: "'JetBrains Mono', monospace", fontSize: 13, lineHeight: 1.6,
          resize: "vertical", boxSizing: "border-box", outline: "none",
        }}
        spellCheck={false}
      />
      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <button onClick={tryParse} style={{
          background: "#6366f1", color: "#fff", border: "none", borderRadius: 8,
          padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer",
        }}>
          ✓ Validar JSON
        </button>
        <button onClick={() => setShowTypes(!showTypes)} style={{
          background: "#27272a", color: "#a1a1aa", border: "none", borderRadius: 8,
          padding: "10px 20px", fontSize: 13, cursor: "pointer",
        }}>
          {showTypes ? "Ocultar" : "Mostrar"} tipos
        </button>
      </div>

      {parseResult && (
        <div style={{
          marginTop: 12, background: parseResult.valid ? "#10b98110" : "#ef444415",
          border: `1px solid ${parseResult.valid ? "#10b98133" : "#ef444433"}`,
          borderRadius: 10, padding: 16,
        }}>
          {parseResult.valid ? (
            <>
              <div style={{ color: "#10b981", fontWeight: 700, marginBottom: 8 }}>✅ JSON válido</div>
              {showTypes && (
                <div style={{ display: "grid", gap: 4 }}>
                  {parseResult.types.map((t, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13, fontFamily: "monospace" }}>
                      <span style={{ color: "#71717a", minWidth: 180 }}>{t.path}</span>
                      <span style={{ color: t.color, fontWeight: 700, minWidth: 60 }}>{t.type}</span>
                      <span style={{ color: "#52525b" }}>{t.val}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ color: "#ef4444", fontWeight: 700, marginBottom: 4 }}>❌ JSON inválido</div>
              <div style={{ color: "#fca5a5", fontSize: 13, fontFamily: "monospace" }}>{parseResult.error}</div>
            </>
          )}
        </div>
      )}

      <div style={{ background: "#18181b", borderRadius: 10, padding: 16, marginTop: 20, border: "1px solid #27272a" }}>
        <div style={{ color: "#ef4444", fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 10 }}>⚠️ ERRORES COMUNES EN JSON</div>
        <div style={{ color: "#a1a1aa", fontSize: 13, lineHeight: 2 }}>
          <span style={{ color: "#ef4444", fontFamily: "monospace" }}>{'{ nombre: "test" }'}</span> → Las keys SIEMPRE van con comillas dobles<br/>
          <span style={{ color: "#ef4444", fontFamily: "monospace" }}>{"{ \"a\": 'test' }"}</span> → Comillas DOBLES, nunca simples<br/>
          <span style={{ color: "#ef4444", fontFamily: "monospace" }}>{'{ "a": 1, }'}</span> → No se permite coma al final (trailing comma)<br/>
          <span style={{ color: "#ef4444", fontFamily: "monospace" }}>{'{ "a": undefined }'}</span> → No existe undefined en JSON, usá null
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

  const methodColors = { GET: "#10b981", POST: "#3b82f6", PUT: "#f59e0b", PATCH: "#a855f7", DELETE: "#ef4444" };

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
      <p style={{ color: "#a1a1aa", marginBottom: 20, fontSize: 15, lineHeight: 1.7 }}>
        Este es tu sandbox. Hacé requests a una <strong style={{ color: "#e4e4e7" }}>API simulada</strong> con datos reales. Probá diferentes combinaciones y mirá qué pasa.
      </p>

      <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
        <div>
          <label style={{ color: "#71717a", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6, letterSpacing: 1 }}>MÉTODO</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
              <button key={m} onClick={() => setMethod(m)} style={{
                background: method === m ? methodColors[m] + "18" : "transparent",
                border: `2px solid ${method === m ? methodColors[m] : "#27272a"}`,
                color: methodColors[m], borderRadius: 8, padding: "8px 16px",
                fontWeight: 800, fontFamily: "monospace", fontSize: 14, cursor: "pointer",
              }}>{m}</button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ color: "#71717a", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6, letterSpacing: 1 }}>ENDPOINT</label>
          <div style={{ display: "flex", alignItems: "center", background: "#09090b", borderRadius: 10, border: "1px solid #27272a" }}>
            <span style={{ color: "#3f3f46", padding: "0 12px", fontSize: 13, fontFamily: "monospace", whiteSpace: "nowrap" }}>api.ejemplo.com/</span>
            <input
              value={endpoint} onChange={(e) => setEndpoint(e.target.value)}
              placeholder="usuarios, productos, usuarios/1..."
              style={{ flex: 1, background: "transparent", border: "none", color: "#e4e4e7", padding: "10px 12px", fontFamily: "monospace", fontSize: 14, outline: "none" }}
            />
          </div>
          <div style={{ color: "#3f3f46", fontSize: 11, marginTop: 4 }}>
            Recursos disponibles: <span style={{ color: "#a78bfa", fontFamily: "monospace" }}>usuarios</span>, <span style={{ color: "#a78bfa", fontFamily: "monospace" }}>productos</span> — Agregá <span style={{ color: "#f59e0b", fontFamily: "monospace" }}>/id</span> para un item específico
          </div>
        </div>

        <div>
          <label style={{ color: "#71717a", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6, letterSpacing: 1 }}>AUTENTICACIÓN</label>
          <input
            value={authKey} onChange={(e) => setAuthKey(e.target.value)}
            placeholder="Bearer token o dejá vacío para ver error 401"
            style={{ width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 10, color: "#e4e4e7", padding: "10px 12px", fontFamily: "monospace", fontSize: 13, outline: "none", boxSizing: "border-box" }}
          />
          <div style={{ color: "#3f3f46", fontSize: 11, marginTop: 4 }}>Borrá este campo para ver un error 401 Unauthorized</div>
        </div>

        {["POST", "PUT", "PATCH"].includes(method) && (
          <div>
            <label style={{ color: "#71717a", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6, letterSpacing: 1 }}>BODY (JSON)</label>
            <textarea
              value={body} onChange={(e) => setBody(e.target.value)}
              style={{ width: "100%", minHeight: 100, background: "#09090b", color: "#e4e4e7", border: "1px solid #27272a", borderRadius: 10, padding: 12, fontFamily: "monospace", fontSize: 13, resize: "vertical", boxSizing: "border-box", outline: "none" }}
              spellCheck={false}
            />
          </div>
        )}

        <button onClick={sendRequest} disabled={loading} style={{
          background: loading ? "#27272a" : methodColors[method],
          color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px",
          fontWeight: 700, fontSize: 14, cursor: loading ? "default" : "pointer",
        }}>
          {loading ? "⏳ Enviando..." : `▶ Enviar ${method} Request`}
        </button>
      </div>

      {result && (
        <div style={{ background: "#09090b", borderRadius: 12, overflow: "hidden", marginBottom: 20, border: `1px solid ${getStatusColor(result.status)}33` }}>
          <div style={{ background: getStatusColor(result.status) + "12", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: getStatusColor(result.status), fontWeight: 800, fontFamily: "monospace", fontSize: 18 }}>{result.status}</span>
              <span style={{ color: "#e4e4e7", fontWeight: 600 }}>{result.statusText}</span>
            </div>
            <span style={{ color: "#52525b", fontSize: 12, fontFamily: "monospace" }}>{Math.round(result.time)}ms</span>
          </div>
          <pre style={{ color: "#a1a1aa", fontSize: 13, margin: 0, padding: 16, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
            {JSON.stringify(result.body, null, 2)}
          </pre>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <div style={{ color: "#3f3f46", fontSize: 12, fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>HISTORIAL</div>
          <div style={{ display: "grid", gap: 4 }}>
            {history.map((h, i) => (
              <div key={i} style={{
                display: "flex", gap: 10, alignItems: "center", fontSize: 12, fontFamily: "monospace",
                color: "#52525b", padding: "6px 10px", background: "#18181b", borderRadius: 8, border: "1px solid #27272a",
              }}>
                <span style={{ color: methodColors[h.method], fontWeight: 700, minWidth: 50 }}>{h.method}</span>
                <span style={{ color: "#71717a", flex: 1 }}>{h.endpoint}</span>
                <span style={{ color: getStatusColor(h.status), fontWeight: 700 }}>{h.status}</span>
                <span>{h.time}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function shuffle(arr) {
  const newArr = [...arr];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
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

function QuizLesson() {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const [shuffledOpts, setShuffledOpts] = useState([]);

  useEffect(() => {
    const q = shuffle(ALL_QUESTIONS).slice(0, 8);
    setQuestions(q);
    if (q[0]) setShuffledOpts(shuffle(q[0].opts));
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
    if (current + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrent(current + 1);
      setSelected(null);
      setShowExplain(false);
    }
  }

  function restart() {
    const q = shuffle(ALL_QUESTIONS).slice(0, 8);
    setQuestions(q);
    if (q[0]) setShuffledOpts(shuffle(q[0].opts));
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
    setShowExplain(false);
  }

  if (questions.length === 0) return null;

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    const emoji = pct >= 80 ? "🏆" : pct >= 60 ? "👍" : "📚";
    const msg = pct >= 80 ? "¡Excelente! Dominás los fundamentos." : pct >= 60 ? "¡Bien! Repasá los conceptos que fallaste." : "Necesitás repasar. Volvé a las lecciones.";
    return (
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{emoji}</div>
        <div style={{ color: "#e4e4e7", fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{score}/{questions.length}</div>
        <div style={{ color: pct >= 80 ? "#10b981" : pct >= 60 ? "#f59e0b" : "#ef4444", fontSize: 48, fontWeight: 900, marginBottom: 12 }}>{pct}%</div>
        <div style={{ color: "#a1a1aa", fontSize: 15, marginBottom: 24 }}>{msg}</div>
        <button onClick={restart} style={{
          background: "#6366f1", color: "#fff", border: "none", borderRadius: 10,
          padding: "12px 32px", fontWeight: 700, fontSize: 15, cursor: "pointer",
        }}>
          🔄 Intentar de nuevo
        </button>
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
        <div style={{ width: `${((current + 1) / questions.length) * 100}%`, height: 3, background: "linear-gradient(90deg, #6366f1, #a78bfa)", borderRadius: 2, transition: "width 0.3s" }} />
      </div>

      <div style={{ color: "#e4e4e7", fontSize: 17, fontWeight: 700, marginBottom: 24, lineHeight: 1.6 }}>{q.q}</div>

      <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
        {shuffledOpts.map((opt, idx) => {
          let bg = "#18181b", border = "#27272a", textColor = "#e4e4e7";
          if (selected !== null) {
            if (opt === q.correct) { bg = "#10b98118"; border = "#10b981"; textColor = "#10b981"; }
            else if (opt === selected && opt !== q.correct) { bg = "#ef444418"; border = "#ef4444"; textColor = "#ef4444"; }
          }
          return (
            <button key={idx} onClick={() => selectAnswer(opt)} style={{
              background: bg, border: `2px solid ${border}`, borderRadius: 10, padding: "14px 16px",
              color: textColor, fontSize: 14, cursor: selected !== null ? "default" : "pointer",
              textAlign: "left", fontFamily: opt.includes('{') ? "monospace" : "inherit", transition: "all 0.2s",
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
          {current + 1 >= questions.length ? "Ver Resultado Final →" : "Siguiente →"}
        </button>
      )}
    </div>
  );
}

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
      case "anatomy": return <AnatomyLesson />;
      case "methods": return <MethodsLesson />;
      case "status": return <StatusLesson />;
      case "headers": return <HeadersLesson />;
      case "json": return <JSONLesson />;
      case "playground": return <PlaygroundLesson />;
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
            <span style={{ fontSize: 26 }}>⚡</span>
            <h1 style={{
              margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: -0.5,
              background: "linear-gradient(135deg, #60a5fa, #a78bfa, #6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              API Learning Lab
            </h1>
            <span style={{
              background: "#6366f122", color: "#6366f1", fontSize: 10, fontWeight: 800,
              padding: "3px 8px", borderRadius: 6, letterSpacing: 1,
            }}>NIVEL 1</span>
          </div>
          <p style={{ margin: 0, color: "#52525b", fontSize: 13 }}>Aprendé APIs desde cero con ejemplos interactivos</p>
          <div style={{ marginTop: 10, display: "flex", gap: 4, alignItems: "center" }}>
            <div style={{ flex: 1, height: 3, background: "#27272a", borderRadius: 2 }}>
              <div style={{
                width: `${(visited.length / LESSONS.length) * 100}%`, height: 3,
                background: "linear-gradient(90deg, #6366f1, #a78bfa)", borderRadius: 2, transition: "width 0.5s",
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
              background: currentIdx === LESSONS.length - 1 ? "#18181b" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
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
