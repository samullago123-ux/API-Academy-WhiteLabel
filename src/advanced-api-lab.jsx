import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ─── UTILS ───
// ─── QUIZ ───
const ALL_QUESTIONS = [
  { q: "En OAuth 2.0, ¿qué flujo usarías para que un cron job de n8n se conecte a una API sin usuario?", opts: ["Authorization Code: útil para cron jobs automatizados", "Client Credentials: ideal para conexión máquina-a-máquina", "Implicit: pensado para aplicaciones de un solo uso", "PKCE: recomendado para servidores sin estado de usuario"], correct: "Client Credentials: ideal para conexión máquina-a-máquina", explain: "Client Credentials es máquina-a-máquina. No hay usuario involucrado, solo client_id + client_secret." },
  { q: "¿Cuál es la diferencia entre access_token y refresh_token?", opts: ["El access es para el cliente web, el refresh para móviles", "Access es temporal (~1h), refresh es de larga vida para renovar", "El access_token se guarda en DB, el refresh_token en caché", "Access es para lecturas públicas, refresh para escrituras"], correct: "Access es temporal (~1h), refresh es de larga vida para renovar", explain: "El access_token expira rápido por seguridad. El refresh_token permite obtener nuevos access_tokens sin re-autenticar al usuario." },
  { q: "Recibís un 429 Too Many Requests. ¿Cuál es la mejor estrategia?", opts: ["Reintentar la solicitud inmediatamente de forma cíclica", "Implementar un exponential backoff con variación de jitter", "Cambiar temporalmente a un servidor o API key alternativo", "Ignorar la respuesta y continuar con la siguiente petición"], correct: "Implementar un exponential backoff con variación de jitter", explain: "Exponential backoff (0.5s, 1s, 2s, 4s...) con jitter (variación aleatoria) evita que todos los clientes reintenten al mismo tiempo." },
  { q: "¿Para qué sirve el header Idempotency-Key?", opts: ["Para encriptar la carga útil de los métodos de pago", "Para evitar crear duplicados al reintentar un POST fallido", "Para asegurar que el token JWT no haya sido comprometido", "Para limitar la cantidad de peticiones de un solo cliente"], correct: "Para evitar crear duplicados al reintentar un POST fallido", explain: "Si un POST con timeout se reintenta, el server usa la Idempotency-Key para devolver el resultado original en vez de crear un duplicado." },
  { q: "¿Qué tipo de paginación es más eficiente para millones de registros?", opts: ["Offset-based: es más fácil de implementar y consultar", "Cursor-based: ideal cuando los datos cambian raramente", "Keyset-based: usa índices de la DB directamente (WHERE id > N)", "No paginar: es mejor devolver un stream directo al cliente"], correct: "Keyset-based: usa índices de la DB directamente (WHERE id > N)", explain: "Keyset/Seek usa índices de la DB directamente (WHERE id > last_id). Offset tiene que contar N filas antes, lo cual es lento en tablas grandes." },
  { q: "Un webhook de WhatsApp llega a tu endpoint. ¿Qué debés hacer PRIMERO?", opts: ["Procesar el mensaje y guardarlo en la base de datos", "Responder con un estado HTTP 200 inmediatamente", "Verificar la legitimidad mediante la firma HMAC del header", "Encolar el payload en un servicio de mensajería asíncrono"], correct: "Verificar la legitimidad mediante la firma HMAC del header", explain: "PRIMERO verificar que el webhook es legítimo (HMAC). Luego responder 200 rápido y procesar async." },
  { q: "¿Cuál de estos cambios en tu API REQUIERE una nueva versión?", opts: ["Agregar un campo opcional nuevo al objeto de respuesta", "Renombrar o eliminar un campo existente de la respuesta", "Agregar un endpoint completamente nuevo para otra entidad", "Modificar el orden en el que se devuelven los elementos"], correct: "Renombrar o eliminar un campo existente de la respuesta", explain: "Renombrar un campo (nombre → first_name) rompe a todos los clientes que esperan el campo viejo. Es un breaking change." },
  { q: "El circuit breaker está en estado ABIERTO. ¿Qué pasa con los requests?", opts: ["Se envían normalmente al servidor y se espera respuesta", "Se bloquean en el cliente sin llegar a tocar el servidor", "Se envían a una velocidad mucho menor para evitar carga", "Se redirigen automáticamente a un servidor de respaldo"], correct: "Se bloquean en el cliente sin llegar a tocar el servidor", explain: "En estado ABIERTO, el circuit breaker ni siquiera envía el request. Protege al server caído de más carga y falla rápido para el cliente." },
  { q: "¿Qué es PKCE en OAuth?", opts: ["Un tipo de token de acceso encriptado asimétricamente", "Proof Key for Code Exchange — protege apps sin backend", "Un protocolo estándar para el manejo de rate limiting", "Un método criptográfico para firmar los webhooks recibidos"], correct: "Proof Key for Code Exchange — protege apps sin backend", explain: "PKCE agrega un challenge criptográfico al flujo Authorization Code para que sea seguro en apps que no pueden guardar un client_secret (SPAs, móviles)." },
  { q: "¿Para qué sirve el header X-Request-ID?", opts: ["Para validar la autenticación cruzada de microservicios", "Rastrear un request específico a través de múltiples servicios", "Para mantener la compatibilidad hacia atrás en versionamiento", "Para asegurar que la paginación no devuelva datos duplicados"], correct: "Rastrear un request específico a través de múltiples servicios", explain: "X-Request-ID viaja por todos los microservicios, permitiendo correlacionar logs y hacer debugging distribuido." },
  { q: "Polling vs Webhooks: ¿cuál es más eficiente para recibir eventos?", opts: ["Polling, porque permite un control total del flujo de datos", "Webhooks, porque solo notifican cuando hay un evento nuevo", "Son iguales en eficiencia si se usa HTTP/2 o WebSockets", "Polling, porque garantiza que los mensajes no se pierdan"], correct: "Webhooks, porque solo notifican cuando hay un evento nuevo", explain: "Polling desperdicia requests preguntando constantemente. Webhooks solo envían cuando hay un evento real. Más eficiente y en tiempo real." },
  { q: "¿Qué significa que DELETE es idempotente?", opts: ["No se puede usar más de una vez sin un token renovado", "Borrar algo ya borrado no causa un error adicional en el server", "Solo funciona una vez y luego requiere reinicializar la sesión", "Requiere confirmación obligatoria mediante un header especial"], correct: "Borrar algo ya borrado no causa un error adicional en el server", explain: "Borrar un recurso 1 vez o 5 veces da el mismo resultado final: el recurso no existe. El estado del sistema es el mismo." },
  { q: "En un API Gateway, ¿dónde se verifica el JWT?", opts: ["En cada microservicio individual para mayor seguridad interna", "En el API Gateway central, verificándolo una sola vez", "En el cliente front-end antes de enviarlo por la red", "En la base de datos de usuarios en cada petición entrante"], correct: "En el API Gateway central, verificándolo una sola vez", explain: "El gateway centraliza la verificación de auth. Si el token es inválido, el request ni llega a los microservicios. Evita duplicar lógica." },
  { q: "¿Cuál es la ventaja de versionar por fecha (API-Version: 2024-01-15) vs por número (v1, v2)?", opts: ["Reduce la carga de los servidores al cachear las respuestas", "Permite introducir cambios graduales sin grandes saltos de versión", "Es más rápido para el enrutador interpretar fechas que números", "Es una convención requerida por el estándar OpenAPI 3.0"], correct: "Permite introducir cambios graduales sin grandes saltos de versión", explain: "Versionar por fecha (estilo Stripe) permite deprecar comportamientos gradualmente. Cada fecha puede tener cambios pequeños vs saltos grandes de v1→v2." },
  { q: "¿Qué es un 'scope' en OAuth?", opts: ["El tipo de token de seguridad devuelto por el servidor", "Un permiso granular que limita las acciones que puede hacer la app", "La URL de callback registrada para completar el flujo OAuth", "El tiempo total de vida útil antes de que expire la sesión"], correct: "Un permiso granular que limita las acciones que puede hacer la app", explain: "Scopes definen permisos específicos: 'read:messages write:users'. Principio de mínimo privilegio — solo pedir lo que necesitás." },
  { q: "¿Por qué el offset pagination es problemático con datos que cambian?", opts: ["Es mucho más lento de procesar en la memoria del cliente", "Si se insertan filas nuevas, se pueden repetir o saltar items", "No funciona correctamente si se responde con formato JSON", "Requiere mantener conexiones persistentes abiertas en el server"], correct: "Si se insertan filas nuevas, se pueden repetir o saltar items", explain: "Si estás en page=3 y se inserta un item en page=1, todo se desplaza. Podés ver items duplicados o saltarte items. Cursor-based resuelve esto." },
  { q: "¿Qué pasa en el estado SEMI-ABIERTO del circuit breaker?", opts: ["Se bloquean todos los requests temporalmente por seguridad", "Se deja pasar un único request de prueba para verificar estado", "Se envían todos los requests con una prioridad mucho menor", "Se reduce el ancho de banda disponible para el cliente actual"], correct: "Se deja pasar un único request de prueba para verificar estado", explain: "Semi-abierto deja pasar un request de prueba. Si tiene éxito → vuelve a CERRADO. Si falla → vuelve a ABIERTO." },
  { q: "Un error de API devuelve { error: 'algo falló' }. ¿Qué le falta?", opts: ["Nada, es suficiente para no exponer información confidencial", "Un código estándar, request_id, y detalles técnicos claros", "Un número de teléfono o correo del equipo de soporte activo", "El stack trace completo de la base de datos y servidor"], correct: "Un código estándar, request_id, y detalles técnicos claros", explain: "Un buen error tiene: code (VALIDATION_ERROR), message humano, details array, request_id para soporte, y link a docs." },
  { q: "¿Qué header te dice cuántas peticiones te quedan antes del rate limit?", opts: ["Content-Type: nos indica el formato de las peticiones restantes", "X-RateLimit-Remaining: indica cuántas peticiones podés hacer", "Authorization: contiene la cuota en el payload del token JWT", "Cache-Control: especifica el tiempo de retención del límite"], correct: "X-RateLimit-Remaining: indica cuántas peticiones podés hacer", explain: "X-RateLimit-Remaining indica cuántas peticiones podés hacer antes de que te bloqueen. Usalo para throttlear proactivamente." },
  { q: "¿Por qué un webhook debe ser idempotente?", opts: ["Por rendimiento: evita la sobrecarga de la base de datos", "Por resiliencia: el emisor puede reenviar el mismo evento si falla", "Por seguridad: previene ataques de denegación de servicio", "No necesita serlo: los webhooks garantizan entrega única siempre"], correct: "Por resiliencia: el emisor puede reenviar el mismo evento si falla", explain: "Si tu server responde lento o el 200 se pierde, el emisor reenvía el mismo webhook. Si no sos idempotente, procesás el evento dos veces." },
];

// ─── MAIN APP ───
export default function AdvancedAPILab() {
  const [activeLesson, setActiveLesson] = useState("oauth");
  const [visited, setVisited] = useState(["oauth"]);

  function navigate(id) {
    setActiveLesson(id);
    if (!visited.includes(id)) setVisited([...visited, id]);
  }

  function renderLesson() {
    switch (activeLesson) {
      case "oauth": return <OAuthLesson />;
      case "ratelimit": return <RateLimitLesson />;
      case "idempotency": return <IdempotencyLesson />;
      case "pagination": return <PaginationLesson />;
      case "webhooks": return <WebhooksLesson />;
      case "versioning": return <VersioningLesson />;
      case "errors": return <ErrorsLesson />;
      case "gateway": return <GatewayLesson />;
      case "quiz": return <Quiz 
        questionsBank={ALL_QUESTIONS} 
        questionCount={15} 
        messages={{
          high: "¡Nivel Arquitecto!",
          medium: "¡Muy bien! Dominás los conceptos.",
          low: "Falta repasar un poco."
        }}
        finalButtonText="Ver Resultado →"
      />;
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
            <span style={{ fontSize: 26 }}>🔥</span>
            <h1 style={{
              margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: -0.5,
              background: "linear-gradient(135deg, #f59e0b, #ef4444, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Advanced API Lab
            </h1>
            <span style={{
              background: "#f59e0b22", color: "#f59e0b", fontSize: 10, fontWeight: 800,
              padding: "3px 8px", borderRadius: 6, letterSpacing: 1,
            }}>NIVEL 2</span>
          </div>
          <p style={{ margin: 0, color: "#52525b", fontSize: 13 }}>OAuth, Rate Limiting, Idempotencia, Webhooks y más</p>
          <div style={{ marginTop: 10, display: "flex", gap: 4, alignItems: "center" }}>
            <div style={{ flex: 1, height: 3, background: "#27272a", borderRadius: 2 }}>
              <div style={{
                width: `${(visited.length / LESSONS.length) * 100}%`, height: 3,
                background: "linear-gradient(90deg, #f59e0b, #ef4444)", borderRadius: 2, transition: "width 0.5s",
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
