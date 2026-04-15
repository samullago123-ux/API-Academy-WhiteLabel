import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ─── UTILS ───
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
      case "quiz": return <Quiz 
        questionsBank={ALL_QUESTIONS} 
        questionCount={20} 
        messages={{
          high: "¡Nivel Dios!",
          medium: "¡Aprobado!",
          low: "Falta repaso."
        }}
        thresholds={{ high: 70, medium: 50 }}
        finalButtonText="Ver Resultado →"
        restartButtonText="🔄 Quiz nuevo (preguntas aleatorias)"
        gradient="linear-gradient(90deg, #ef4444, #f59e0b, #10b981)"
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
