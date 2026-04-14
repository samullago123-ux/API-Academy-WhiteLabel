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
  { id: "oauth", title: "OAuth 2.0", icon: "🔐", desc: "Flujos de autenticación avanzada" },
  { id: "ratelimit", title: "Rate Limiting", icon: "🚦", desc: "Throttling y Exponential Backoff" },
  { id: "idempotency", title: "Idempotencia", icon: "🔁", desc: "Operaciones seguras y repetibles" },
  { id: "pagination", title: "Paginación", icon: "📄", desc: "Offset, Cursor y Streaming" },
  { id: "webhooks", title: "Webhooks", icon: "🪝", desc: "APIs invertidas y eventos" },
  { id: "versioning", title: "Versionamiento", icon: "📦", desc: "Backward compatibility y estrategias" },
  { id: "errors", title: "Errores & Resiliencia", icon: "🛡️", desc: "Circuit breakers y retry patterns" },
  { id: "gateway", title: "API Gateway", icon: "🏗️", desc: "Orquestación de microservicios" },
  { id: "quiz", title: "Quiz Avanzado", icon: "🏆", desc: "20 preguntas aleatorias" },
];

// ─── OAUTH LESSON ───
function OAuthLesson() {
  const [activeFlow, setActiveFlow] = useState("auth_code");
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef(null);

  const flows = {
    auth_code: {
      name: "Authorization Code",
      icon: "🌐",
      when: "Apps web con backend (la más segura)",
      realWorld: "Login con Google en tu app, Chatwoot conectándose a WhatsApp API",
      steps: [
        { actor: "Tu App", action: "Redirige al usuario al Authorization Server", detail: "GET /authorize?response_type=code&client_id=XXX&redirect_uri=https://tuapp.com/callback&scope=read+write", color: "#3b82f6" },
        { actor: "Usuario", action: "Se autentica y autoriza los permisos", detail: "El usuario ve: '¿Permitir que TuApp acceda a tu perfil y contactos?'", color: "#a78bfa" },
        { actor: "Auth Server", action: "Redirige de vuelta con un código temporal", detail: "302 Redirect → https://tuapp.com/callback?code=abc123xyz (este código expira en ~60 segundos)", color: "#f59e0b" },
        { actor: "Tu Backend", action: "Intercambia el código por tokens", detail: "POST /token { grant_type: 'authorization_code', code: 'abc123xyz', client_secret: 'SECRET' }", color: "#10b981" },
        { actor: "Auth Server", action: "Devuelve access_token + refresh_token", detail: "{ access_token: 'eyJ...', refresh_token: 'dGhpc...', expires_in: 3600, token_type: 'Bearer' }", color: "#f472b6" },
        { actor: "Tu Backend", action: "Usa el token para llamar a la API protegida", detail: "GET /api/user -H 'Authorization: Bearer eyJ...' → { name: 'Daniel', email: '...' }", color: "#06b6d4" },
      ],
    },
    client_creds: {
      name: "Client Credentials",
      icon: "🤖",
      when: "Máquina a máquina (sin usuario involucrado)",
      realWorld: "n8n conectándose a APIs, cron jobs, microservicios internos",
      steps: [
        { actor: "Tu Servidor", action: "Solicita token directamente con sus credenciales", detail: "POST /token { grant_type: 'client_credentials', client_id: 'XXX', client_secret: 'YYY', scope: 'read' }", color: "#3b82f6" },
        { actor: "Auth Server", action: "Valida las credenciales y devuelve un token", detail: "{ access_token: 'eyJ...', expires_in: 3600, token_type: 'Bearer' } (NO hay refresh_token)", color: "#10b981" },
        { actor: "Tu Servidor", action: "Usa el token para llamar la API", detail: "GET /api/data -H 'Authorization: Bearer eyJ...'", color: "#f59e0b" },
      ],
    },
    pkce: {
      name: "Auth Code + PKCE",
      icon: "📱",
      when: "SPAs y apps móviles (no pueden guardar secrets)",
      realWorld: "App React sin backend, app móvil nativa",
      steps: [
        { actor: "Tu App", action: "Genera un code_verifier aleatorio y su code_challenge", detail: "code_verifier = random(43-128 chars)\ncode_challenge = BASE64URL(SHA256(code_verifier))", color: "#a78bfa" },
        { actor: "Tu App", action: "Redirige al usuario con el challenge", detail: "GET /authorize?response_type=code&code_challenge=XXXXX&code_challenge_method=S256&client_id=...", color: "#3b82f6" },
        { actor: "Usuario", action: "Se autentica y autoriza", detail: "El Auth Server guarda el code_challenge asociado al código", color: "#f59e0b" },
        { actor: "Auth Server", action: "Devuelve código temporal", detail: "Redirect → tuapp://callback?code=abc123", color: "#f472b6" },
        { actor: "Tu App", action: "Intercambia código + code_verifier por token", detail: "POST /token { code: 'abc123', code_verifier: 'el_original' } — el server verifica SHA256(verifier) === challenge", color: "#10b981" },
        { actor: "Auth Server", action: "Si la prueba coincide, devuelve tokens", detail: "{ access_token: '...', refresh_token: '...' } — seguro porque nadie más tiene el verifier original", color: "#06b6d4" },
      ],
    },
  };

  const activeFlowData = flows[activeFlow];

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  function playAnimation() {
    setStep(0);
    setPlaying(true);
    let s = 0;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      s++;
      if (s >= activeFlowData.steps.length) {
        clearInterval(timerRef.current);
        setPlaying(false);
        setStep(activeFlowData.steps.length - 1);
      } else {
        setStep(s);
      }
    }, 2200);
  }

  useEffect(() => {
    setStep(0);
    setPlaying(false);
    clearInterval(timerRef.current);
  }, [activeFlow]);

  return (
    <div>
      <p style={{ color: "#a1a1aa", marginBottom: 20, fontSize: 15, lineHeight: 1.7 }}>
        OAuth 2.0 no es "un token". Es un <strong style={{ color: "#e4e4e7" }}>protocolo de delegación</strong> — le das permiso a una app para actuar en tu nombre sin darle tu contraseña. Hay 3 flujos principales según el contexto.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 24 }}>
        {Object.entries(flows).map(([key, f]) => (
          <button key={key} onClick={() => setActiveFlow(key)} style={{
            background: activeFlow === key ? "#18181b" : "transparent",
            border: `2px solid ${activeFlow === key ? "#6366f1" : "#27272a"}`,
            borderRadius: 12, padding: "14px 10px", cursor: "pointer", textAlign: "center", transition: "all 0.2s",
          }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{f.icon}</div>
            <div style={{ color: activeFlow === key ? "#e4e4e7" : "#71717a", fontWeight: 700, fontSize: 12 }}>{f.name}</div>
            <div style={{ color: "#52525b", fontSize: 10, marginTop: 4 }}>{f.when}</div>
          </button>
        ))}
      </div>

      <div style={{ background: "#09090b", borderRadius: 12, padding: 20, border: "1px solid #27272a", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ color: "#a1a1aa", fontSize: 12 }}>
            <strong style={{ color: "#e4e4e7" }}>Caso real:</strong> {activeFlowData.realWorld}
          </div>
          <button onClick={playAnimation} disabled={playing} style={{
            background: playing ? "#27272a" : "#6366f1", color: "#fff", border: "none", borderRadius: 8,
            padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: playing ? "default" : "pointer",
          }}>
            {playing ? "⏳ Reproduciendo..." : "▶ Animar Flujo"}
          </button>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          {activeFlowData.steps.map((s, i) => (
            <div key={i} style={{
              background: i <= step ? s.color + "12" : "#18181b",
              border: `1px solid ${i <= step ? s.color + "44" : "#27272a"}`,
              borderRadius: 10, padding: "14px 16px",
              opacity: i <= step ? 1 : 0.35,
              transform: i === step && playing ? "scale(1.01)" : "scale(1)",
              transition: "all 0.4s ease",
              cursor: "pointer",
            }} onClick={() => { setStep(i); setPlaying(false); clearInterval(timerRef.current); }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{
                  background: s.color + "33", color: s.color, fontSize: 11, fontWeight: 800,
                  padding: "3px 8px", borderRadius: 6, fontFamily: "monospace",
                }}>PASO {i + 1}</span>
                <span style={{ color: s.color, fontWeight: 700, fontSize: 13 }}>{s.actor}</span>
              </div>
              <div style={{ color: "#e4e4e7", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{s.action}</div>
              {i <= step && (
                <div style={{
                  background: "#09090b", borderRadius: 6, padding: "8px 12px", marginTop: 6,
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#a1a1aa",
                  whiteSpace: "pre-wrap", lineHeight: 1.6, wordBreak: "break-all",
                }}>
                  {s.detail}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "#18181b", borderRadius: 10, padding: 16, border: "1px solid #27272a" }}>
        <div style={{ color: "#f59e0b", fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 10 }}>🔑 CONCEPTOS CLAVE</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { term: "Access Token", def: "Credencial de corta vida (~1h) para acceder a recursos. Es como un ticket de cine." },
            { term: "Refresh Token", def: "Credencial de larga vida para obtener nuevos access tokens sin re-autenticar." },
            { term: "Scope", def: "Permisos granulares: 'read:users write:messages'. Principio de mínimo privilegio." },
            { term: "PKCE", def: "Proof Key for Code Exchange. Protege contra interceptación del código en apps sin backend." },
          ].map((c) => (
            <div key={c.term} style={{ background: "#09090b", borderRadius: 8, padding: 12 }}>
              <div style={{ color: "#6366f1", fontWeight: 700, fontSize: 13, marginBottom: 4, fontFamily: "monospace" }}>{c.term}</div>
              <div style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 1.5 }}>{c.def}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── RATE LIMITING LESSON ───
function RateLimitLesson() {
  const [requests, setRequests] = useState([]);
  const [rateLimit] = useState({ max: 10, windowSec: 10 });
  const [running, setRunning] = useState(false);
  const [strategy, setStrategy] = useState("none");
  const [stats, setStats] = useState({ sent: 0, ok: 0, throttled: 0 });
  const counterRef = useRef(0);
  const timerRef = useRef(null);

  function reset() {
    clearInterval(timerRef.current);
    setRequests([]);
    setRunning(false);
    setStats({ sent: 0, ok: 0, throttled: 0 });
    counterRef.current = 0;
  }

  function simulate() {
    reset();
    setRunning(true);
    let localRequests = [];
    let sent = 0, ok = 0, throttled = 0;
    let retryDelay = 500;
    let i = 0;
    const totalReqs = 25;

    function sendNext() {
      if (i >= totalReqs) {
        setRunning(false);
        return;
      }
      i++;
      sent++;
      const now = Date.now();
      const recentOk = localRequests.filter(r => r.status === 200 && now - r.time < rateLimit.windowSec * 1000).length;
      const isThrottled = recentOk >= rateLimit.max;
      const req = {
        id: i,
        status: isThrottled ? 429 : 200,
        time: now,
        retryOf: null,
      };

      if (isThrottled) {
        throttled++;
        req.retryDelay = strategy === "none" ? null : strategy === "fixed" ? 1000 : retryDelay;
      } else {
        ok++;
        retryDelay = 500;
      }

      localRequests = [...localRequests, req];
      setRequests([...localRequests]);
      setStats({ sent, ok, throttled });

      let nextDelay;
      if (isThrottled && strategy !== "none") {
        nextDelay = strategy === "fixed" ? 1000 : retryDelay;
        if (strategy === "exponential") retryDelay = Math.min(retryDelay * 2, 8000);
      } else {
        nextDelay = strategy === "none" ? 150 : strategy === "fixed" ? 400 : 300;
        retryDelay = 500;
      }

      timerRef.current = setTimeout(sendNext, nextDelay);
    }
    sendNext();
  }

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const strategies = [
    { id: "none", name: "Sin control", icon: "💥", desc: "Enviar todo lo más rápido posible. BOOM.", color: "#ef4444" },
    { id: "fixed", name: "Retry fijo", icon: "⏱️", desc: "Esperar 1 segundo fijo al recibir 429.", color: "#f59e0b" },
    { id: "exponential", name: "Exp. Backoff", icon: "📈", desc: "Esperar 0.5s, 1s, 2s, 4s, 8s... multiplicando.", color: "#10b981" },
  ];

  return (
    <div>
      <p style={{ color: "#a1a1aa", marginBottom: 16, fontSize: 15, lineHeight: 1.7 }}>
        Las APIs limitan cuántas peticiones podés hacer. Si te pasás, recibís <strong style={{ color: "#f59e0b", fontFamily: "monospace" }}>429 Too Many Requests</strong>. La pregunta es: ¿qué hacés cuando eso pasa?
      </p>

      <div style={{ background: "#09090b", borderRadius: 10, padding: 16, border: "1px solid #27272a", marginBottom: 20 }}>
        <div style={{ color: "#71717a", fontSize: 12, marginBottom: 8 }}>CONFIGURACIÓN DEL SERVIDOR</div>
        <div style={{ display: "flex", gap: 20, fontSize: 14 }}>
          <span style={{ color: "#a1a1aa" }}>Límite: <strong style={{ color: "#e4e4e7" }}>{rateLimit.max} req</strong></span>
          <span style={{ color: "#a1a1aa" }}>Ventana: <strong style={{ color: "#e4e4e7" }}>{rateLimit.windowSec}s</strong></span>
          <span style={{ color: "#a1a1aa" }}>Total a enviar: <strong style={{ color: "#e4e4e7" }}>25 requests</strong></span>
        </div>
      </div>

      <div style={{ color: "#71717a", fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>ESTRATEGIA DE REINTENTO</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 20 }}>
        {strategies.map((s) => (
          <button key={s.id} onClick={() => { setStrategy(s.id); reset(); }} style={{
            background: strategy === s.id ? s.color + "15" : "transparent",
            border: `2px solid ${strategy === s.id ? s.color : "#27272a"}`,
            borderRadius: 10, padding: "12px 10px", cursor: "pointer", textAlign: "center",
          }}>
            <div style={{ fontSize: 20 }}>{s.icon}</div>
            <div style={{ color: s.color, fontWeight: 700, fontSize: 12, marginTop: 4 }}>{s.name}</div>
            <div style={{ color: "#52525b", fontSize: 10, marginTop: 4 }}>{s.desc}</div>
          </button>
        ))}
      </div>

      <button onClick={simulate} disabled={running} style={{
        background: running ? "#27272a" : "#6366f1", color: "#fff", border: "none", borderRadius: 10,
        padding: "12px 24px", fontWeight: 700, fontSize: 14, cursor: running ? "default" : "pointer", width: "100%", marginBottom: 20,
      }}>
        {running ? "⏳ Enviando requests..." : "▶ Simular 25 Requests"}
      </button>

      {requests.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
            <div style={{ background: "#09090b", borderRadius: 8, padding: 12, textAlign: "center", border: "1px solid #27272a" }}>
              <div style={{ color: "#71717a", fontSize: 11, marginBottom: 4 }}>ENVIADOS</div>
              <div style={{ color: "#e4e4e7", fontSize: 24, fontWeight: 800 }}>{stats.sent}</div>
            </div>
            <div style={{ background: "#10b98115", borderRadius: 8, padding: 12, textAlign: "center", border: "1px solid #10b98133" }}>
              <div style={{ color: "#10b981", fontSize: 11, marginBottom: 4 }}>EXITOSOS (200)</div>
              <div style={{ color: "#10b981", fontSize: 24, fontWeight: 800 }}>{stats.ok}</div>
            </div>
            <div style={{ background: "#ef444415", borderRadius: 8, padding: 12, textAlign: "center", border: "1px solid #ef444433" }}>
              <div style={{ color: "#ef4444", fontSize: 11, marginBottom: 4 }}>RECHAZADOS (429)</div>
              <div style={{ color: "#ef4444", fontSize: 24, fontWeight: 800 }}>{stats.throttled}</div>
            </div>
          </div>

          <div style={{ background: "#09090b", borderRadius: 10, padding: 12, border: "1px solid #27272a", maxHeight: 200, overflowY: "auto" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {requests.map((r) => (
                <div key={r.id} style={{
                  width: 28, height: 28, borderRadius: 6,
                  background: r.status === 200 ? "#10b98125" : "#ef444425",
                  border: `1px solid ${r.status === 200 ? "#10b98155" : "#ef444455"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, color: r.status === 200 ? "#10b981" : "#ef4444",
                  fontFamily: "monospace",
                }}>
                  {r.status === 200 ? "✓" : "429"}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#18181b", borderRadius: 10, padding: 16, marginTop: 16, border: "1px solid #27272a" }}>
            <div style={{ color: "#6366f1", fontWeight: 700, fontSize: 12, marginBottom: 8 }}>📊 ANÁLISIS</div>
            <div style={{ color: "#a1a1aa", fontSize: 13, lineHeight: 1.7 }}>
              Tasa de éxito: <strong style={{ color: stats.ok / stats.sent > 0.7 ? "#10b981" : "#ef4444" }}>{Math.round((stats.ok / stats.sent) * 100)}%</strong>
              {strategy === "none" && stats.throttled > 5 && " — Sin control, la mayoría de requests se pierden. Desperdicio de recursos."}
              {strategy === "fixed" && " — Mejor que nada, pero el delay fijo no se adapta a la carga."}
              {strategy === "exponential" && " — La mejor estrategia: se adapta dinámicamente y maximiza throughput."}
            </div>
          </div>
        </>
      )}

      <div style={{ background: "#18181b", borderRadius: 10, padding: 16, marginTop: 20, border: "1px solid #27272a" }}>
        <div style={{ color: "#f59e0b", fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 10 }}>📬 HEADERS DE RATE LIMIT</div>
        <div style={{ fontFamily: "monospace", fontSize: 12, color: "#a1a1aa", lineHeight: 2 }}>
          <span style={{ color: "#6366f1" }}>X-RateLimit-Limit:</span> 100 <span style={{ color: "#52525b" }}>← máximo por ventana</span><br />
          <span style={{ color: "#6366f1" }}>X-RateLimit-Remaining:</span> 23 <span style={{ color: "#52525b" }}>← cuántas te quedan</span><br />
          <span style={{ color: "#6366f1" }}>X-RateLimit-Reset:</span> 1625097600 <span style={{ color: "#52525b" }}>← timestamp de reset</span><br />
          <span style={{ color: "#6366f1" }}>Retry-After:</span> 30 <span style={{ color: "#52525b" }}>← segundos para reintentar</span>
        </div>
      </div>
    </div>
  );
}

// ─── IDEMPOTENCY LESSON ───
function IdempotencyLesson() {
  const [scenario, setScenario] = useState(null);
  const [step, setStep] = useState(0);

  const scenarios = [
    {
      id: "payment_bad",
      title: "💸 Pago SIN idempotencia",
      color: "#ef4444",
      steps: [
        "Usuario hace click en 'Pagar $100'",
        "POST /pagos { monto: 100 } → Timeout de red (no sabés si llegó)",
        "Tu app reintenta: POST /pagos { monto: 100 }",
        "💥 El servidor CREÓ DOS pagos de $100. Le cobraste $200 al usuario.",
        "El usuario llama furioso. Tenés que hacer refund manual.",
      ],
    },
    {
      id: "payment_good",
      title: "✅ Pago CON idempotencia",
      color: "#10b981",
      steps: [
        "Tu app genera: idempotency_key = 'pay_abc123_1625097600'",
        "POST /pagos { monto: 100 } -H 'Idempotency-Key: pay_abc123_1625097600' → Timeout",
        "Tu app reintenta con LA MISMA key: POST /pagos + 'Idempotency-Key: pay_abc123_1625097600'",
        "✅ El servidor detecta la key repetida. Devuelve el resultado original sin crear duplicado.",
        "El usuario solo fue cobrado una vez. Todos contentos.",
      ],
    },
  ];

  const methodTable = [
    { method: "GET", idempotent: true, safe: true, desc: "Leer datos no cambia nada. Siempre seguro." },
    { method: "POST", idempotent: false, safe: false, desc: "Cada llamada PUEDE crear algo nuevo. ⚠️ Peligroso sin idempotency key." },
    { method: "PUT", idempotent: true, safe: false, desc: "Reemplazar con los mismos datos da el mismo resultado." },
    { method: "PATCH", idempotent: false, safe: false, desc: "Depende: 'set name=X' es idempotente, 'increment counter' NO." },
    { method: "DELETE", idempotent: true, safe: false, desc: "Borrar algo dos veces = ya estaba borrado." },
  ];

  return (
    <div>
      <p style={{ color: "#a1a1aa", marginBottom: 20, fontSize: 15, lineHeight: 1.7 }}>
        Una operación es <strong style={{ color: "#e4e4e7" }}>idempotente</strong> si ejecutarla 1 vez o 100 veces produce el <strong style={{ color: "#e4e4e7" }}>mismo resultado</strong>. Es CRÍTICO para pagos, transacciones y cualquier cosa que no debería duplicarse.
      </p>

      <div style={{ color: "#71717a", fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>ESCENARIOS INTERACTIVOS</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        {scenarios.map((s) => (
          <button key={s.id} onClick={() => { setScenario(s.id); setStep(0); }} style={{
            background: scenario === s.id ? s.color + "12" : "#18181b",
            border: `2px solid ${scenario === s.id ? s.color : "#27272a"}`,
            borderRadius: 10, padding: 16, cursor: "pointer", textAlign: "left",
          }}>
            <div style={{ color: s.color, fontWeight: 700, fontSize: 14 }}>{s.title}</div>
          </button>
        ))}
      </div>

      {scenario && (() => {
        const s = scenarios.find((x) => x.id === scenario);
        return (
          <div style={{ background: "#09090b", borderRadius: 10, padding: 20, border: `1px solid ${s.color}33`, marginBottom: 24 }}>
            {s.steps.map((st, i) => (
              <div key={i} onClick={() => setStep(i)} style={{
                display: "flex", gap: 12, alignItems: "flex-start",
                padding: "10px 12px", borderRadius: 8, marginBottom: 4, cursor: "pointer",
                opacity: i <= step ? 1 : 0.3, background: i === step ? s.color + "10" : "transparent",
                transition: "all 0.3s",
              }}>
                <div style={{
                  minWidth: 24, height: 24, borderRadius: "50%",
                  background: i <= step ? s.color : "#27272a",
                  color: i <= step ? "#fff" : "#52525b",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                }}>{i + 1}</div>
                <div style={{ color: i <= step ? "#e4e4e7" : "#52525b", fontSize: 13, lineHeight: 1.6, fontFamily: st.includes("POST") || st.includes("key") ? "monospace" : "inherit" }}>
                  {st}
                </div>
              </div>
            ))}
            {step < s.steps.length - 1 && (
              <button onClick={() => setStep(step + 1)} style={{
                background: s.color + "22", color: s.color, border: `1px solid ${s.color}44`,
                borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 10,
              }}>Siguiente paso →</button>
            )}
          </div>
        );
      })()}

      <div style={{ color: "#71717a", fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>TABLA DE IDEMPOTENCIA POR MÉTODO</div>
      <div style={{ background: "#09090b", borderRadius: 10, overflow: "hidden", border: "1px solid #27272a" }}>
        <div style={{ display: "grid", gridTemplateColumns: "80px 90px 70px 1fr", gap: 0, padding: "10px 16px", background: "#18181b", fontSize: 11, color: "#52525b", fontWeight: 700 }}>
          <span>MÉTODO</span><span>IDEMPOTENTE</span><span>SAFE</span><span>NOTA</span>
        </div>
        {methodTable.map((m) => (
          <div key={m.method} style={{ display: "grid", gridTemplateColumns: "80px 90px 70px 1fr", gap: 0, padding: "10px 16px", borderTop: "1px solid #27272a", alignItems: "center" }}>
            <span style={{ color: "#6366f1", fontWeight: 700, fontFamily: "monospace", fontSize: 13 }}>{m.method}</span>
            <span style={{ color: m.idempotent ? "#10b981" : "#ef4444", fontWeight: 700, fontSize: 13 }}>{m.idempotent ? "✅ Sí" : "❌ No"}</span>
            <span style={{ color: m.safe ? "#10b981" : "#f59e0b", fontSize: 13 }}>{m.safe ? "✅" : "⚠️"}</span>
            <span style={{ color: "#a1a1aa", fontSize: 12 }}>{m.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PAGINATION LESSON ───
function PaginationLesson() {
  const [paginationType, setPaginationType] = useState("offset");
  const [currentPage, setCurrentPage] = useState(1);
  const [cursor, setCursor] = useState(null);
  const allItems = Array.from({ length: 47 }, (_, i) => ({ id: i + 1, nombre: `Usuario ${i + 1}`, email: `user${i + 1}@test.com` }));
  const pageSize = 5;

  const types = {
    offset: {
      name: "Offset-Based", icon: "📃", color: "#3b82f6",
      pros: "Simple, puedes saltar a cualquier página",
      cons: "Si se insertan datos, se repiten o saltan items. Lento en tablas grandes (OFFSET 10000).",
      request: `GET /usuarios?page=${currentPage}&limit=${pageSize}`,
      response: () => {
        const start = (currentPage - 1) * pageSize;
        const items = allItems.slice(start, start + pageSize);
        return { data: items, pagination: { page: currentPage, limit: pageSize, total: allItems.length, pages: Math.ceil(allItems.length / pageSize) } };
      },
    },
    cursor: {
      name: "Cursor-Based", icon: "🔗", color: "#10b981",
      pros: "Consistente con datos cambiantes, eficiente en bases de datos grandes",
      cons: "No puedes saltar a una página arbitraria. Solo avance/retroceso.",
      request: `GET /usuarios?limit=${pageSize}${cursor ? `&after=${cursor}` : ""}`,
      response: () => {
        const startIdx = cursor ? allItems.findIndex(i => i.id === cursor) + 1 : 0;
        const items = allItems.slice(startIdx, startIdx + pageSize);
        const nextCursor = items.length === pageSize ? items[items.length - 1].id : null;
        return { data: items, pagination: { next_cursor: nextCursor, has_more: nextCursor !== null } };
      },
    },
    keyset: {
      name: "Keyset (Seek)", icon: "⚡", color: "#f59e0b",
      pros: "El más eficiente para bases de datos enormes (millones de registros). Usa índices.",
      cons: "Requiere un campo ordenable y único. No soporta saltos.",
      request: `GET /usuarios?limit=${pageSize}&id_gt=${cursor || 0}`,
      response: () => {
        const startIdx = cursor ? allItems.findIndex(i => i.id === cursor) + 1 : 0;
        const items = allItems.slice(startIdx, startIdx + pageSize);
        return { data: items, sql_equivalent: `SELECT * FROM users WHERE id > ${cursor || 0} ORDER BY id LIMIT ${pageSize}` };
      },
    },
  };

  const activeType = types[paginationType];

  function nextPage() {
    if (paginationType === "offset") {
      setCurrentPage(p => Math.min(p + 1, Math.ceil(allItems.length / pageSize)));
    } else {
      const res = activeType.response();
      if (res.data.length > 0) setCursor(res.data[res.data.length - 1].id);
    }
  }

  function prevPage() {
    if (paginationType === "offset") setCurrentPage(p => Math.max(1, p - 1));
  }

  function resetPagination() { setCurrentPage(1); setCursor(null); }

  useEffect(() => { resetPagination(); }, [paginationType]);

  const response = activeType.response();

  return (
    <div>
      <p style={{ color: "#a1a1aa", marginBottom: 20, fontSize: 15, lineHeight: 1.7 }}>
        Cuando una API tiene miles de registros, no te los manda todos juntos. La <strong style={{ color: "#e4e4e7" }}>paginación</strong> divide los resultados en bloques manejables. Hay 3 estrategias principales.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 24 }}>
        {Object.entries(types).map(([key, t]) => (
          <button key={key} onClick={() => setPaginationType(key)} style={{
            background: paginationType === key ? t.color + "15" : "transparent",
            border: `2px solid ${paginationType === key ? t.color : "#27272a"}`,
            borderRadius: 10, padding: "14px 10px", cursor: "pointer", textAlign: "center",
          }}>
            <div style={{ fontSize: 22 }}>{t.icon}</div>
            <div style={{ color: t.color, fontWeight: 700, fontSize: 12, marginTop: 4 }}>{t.name}</div>
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <div style={{ background: "#10b98115", borderRadius: 8, padding: 12, border: "1px solid #10b98133" }}>
          <div style={{ color: "#10b981", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>✅ PROS</div>
          <div style={{ color: "#a1a1aa", fontSize: 12 }}>{activeType.pros}</div>
        </div>
        <div style={{ background: "#ef444415", borderRadius: 8, padding: 12, border: "1px solid #ef444433" }}>
          <div style={{ color: "#ef4444", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>⚠️ CONTRAS</div>
          <div style={{ color: "#a1a1aa", fontSize: 12 }}>{activeType.cons}</div>
        </div>
      </div>

      <div style={{ background: "#09090b", borderRadius: 10, padding: 16, border: "1px solid #27272a", marginBottom: 16 }}>
        <div style={{ color: "#52525b", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>REQUEST</div>
        <div style={{ fontFamily: "monospace", fontSize: 13, color: activeType.color, marginBottom: 16 }}>{activeType.request}</div>
        <div style={{ color: "#52525b", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>RESPONSE</div>
        <pre style={{ color: "#a1a1aa", fontSize: 12, margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
          {JSON.stringify(response, null, 2)}
        </pre>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        {paginationType === "offset" && (
          <button onClick={prevPage} disabled={currentPage === 1} style={{
            background: "#18181b", color: currentPage === 1 ? "#27272a" : "#a1a1aa", border: "1px solid #27272a",
            borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: currentPage === 1 ? "default" : "pointer",
          }}>← Anterior</button>
        )}
        <button onClick={nextPage} disabled={response.data.length < pageSize} style={{
          background: response.data.length < pageSize ? "#18181b" : activeType.color,
          color: response.data.length < pageSize ? "#27272a" : "#fff", border: "none",
          borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700,
          cursor: response.data.length < pageSize ? "default" : "pointer",
        }}>Siguiente →</button>
        <button onClick={resetPagination} style={{
          background: "#18181b", color: "#a1a1aa", border: "1px solid #27272a",
          borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer",
        }}>⟲ Reset</button>
      </div>
    </div>
  );
}

// ─── WEBHOOKS LESSON ───
function WebhooksLesson() {
  const [events, setEvents] = useState([]);
  const [verified, setVerified] = useState(null);
  const timerRef = useRef(null);

  const webhookEvents = [
    { type: "message.received", source: "WhatsApp API", payload: { from: "+573001234567", body: "Hola, necesito información", timestamp: "2025-01-15T10:30:00Z" } },
    { type: "payment.completed", source: "Stripe", payload: { amount: 29900, currency: "COP", customer: "cus_abc123" } },
    { type: "issue.created", source: "Linear", payload: { title: "Bug en login flow", assignee: "Daniel", priority: "high" } },
    { type: "conversation.assigned", source: "Chatwoot", payload: { conversation_id: 456, agent: "Andrés", inbox: "WhatsApp" } },
  ];

  function simulateWebhooks() {
    setEvents([]);
    let i = 0;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (i >= webhookEvents.length) { clearInterval(timerRef.current); return; }
      setEvents(prev => [...prev, { ...webhookEvents[i], receivedAt: new Date().toISOString(), id: i }]);
      i++;
    }, 1800);
  }

  useEffect(() => () => clearInterval(timerRef.current), []);

  function verifySignature() {
    setVerified(null);
    setTimeout(() => setVerified(true), 1000);
  }

  return (
    <div>
      <p style={{ color: "#a1a1aa", marginBottom: 20, fontSize: 15, lineHeight: 1.7 }}>
        En vez de preguntar constantemente "¿hay algo nuevo?" (<strong style={{ color: "#e4e4e7" }}>polling</strong>), un webhook hace que el servicio <strong style={{ color: "#e4e4e7" }}>te avise a vos</strong> cuando algo pasa. Es una API invertida.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "#ef444412", borderRadius: 10, padding: 16, border: "1px solid #ef444433" }}>
          <div style={{ color: "#ef4444", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>❌ Polling (mal)</div>
          <div style={{ fontFamily: "monospace", fontSize: 11, color: "#a1a1aa", lineHeight: 2 }}>
            Cada 5 seg: GET /messages → [] vacío<br />
            Cada 5 seg: GET /messages → [] vacío<br />
            Cada 5 seg: GET /messages → [] vacío<br />
            Cada 5 seg: GET /messages → [1 msg] ¡al fin!<br />
            <span style={{ color: "#ef4444" }}>= 95% de requests desperdiciadas</span>
          </div>
        </div>
        <div style={{ background: "#10b98112", borderRadius: 10, padding: 16, border: "1px solid #10b98133" }}>
          <div style={{ color: "#10b981", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>✅ Webhook (bien)</div>
          <div style={{ fontFamily: "monospace", fontSize: 11, color: "#a1a1aa", lineHeight: 2 }}>
            Tu server espera tranquilo...<br />
            WhatsApp → POST /tu-webhook ¡mensaje nuevo!<br />
            Tu server procesa inmediatamente.<br />
            <span style={{ color: "#10b981" }}>= 0 requests desperdiciadas, respuesta instantánea</span>
          </div>
        </div>
      </div>

      <button onClick={simulateWebhooks} style={{
        background: "#6366f1", color: "#fff", border: "none", borderRadius: 10,
        padding: "12px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer", width: "100%", marginBottom: 20,
      }}>🪝 Simular Webhooks Entrantes</button>

      {events.length > 0 && (
        <div style={{ background: "#09090b", borderRadius: 10, padding: 16, border: "1px solid #27272a", marginBottom: 20 }}>
          <div style={{ color: "#52525b", fontSize: 11, fontWeight: 700, marginBottom: 12 }}>EVENTOS RECIBIDOS EN TU ENDPOINT</div>
          {events.map((e) => (
            <div key={e.id} style={{
              background: "#18181b", borderRadius: 8, padding: 12, marginBottom: 8,
              borderLeft: "3px solid #6366f1", animation: "fadeIn 0.3s ease",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "#6366f1", fontWeight: 700, fontSize: 13, fontFamily: "monospace" }}>{e.type}</span>
                <span style={{ color: "#52525b", fontSize: 11 }}>{e.source}</span>
              </div>
              <pre style={{ color: "#a1a1aa", fontSize: 11, margin: 0, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                {JSON.stringify(e.payload, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: "#18181b", borderRadius: 10, padding: 16, border: "1px solid #27272a", marginBottom: 16 }}>
        <div style={{ color: "#f59e0b", fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 12 }}>🔏 VERIFICACIÓN HMAC</div>
        <p style={{ color: "#a1a1aa", fontSize: 13, lineHeight: 1.6, margin: "0 0 12px" }}>
          ¿Cómo sabés que un webhook realmente viene de WhatsApp y no de un atacante? Con una firma HMAC-SHA256 que solo vos y el servicio conocen.
        </p>
        <div style={{ background: "#09090b", borderRadius: 8, padding: 12, fontFamily: "monospace", fontSize: 11, color: "#a1a1aa", lineHeight: 1.8, marginBottom: 12 }}>
          {`// 1. Recibís el header con la firma
X-Hub-Signature-256: sha256=abc123...

// 2. Calculás la firma con TU secret
const expected = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(rawBody)
  .digest('hex');

// 3. Comparás
if (signature !== 'sha256=' + expected) {
  return res.status(401).send('Firma inválida');
}`}
        </div>
        <button onClick={verifySignature} style={{
          background: "#f59e0b22", color: "#f59e0b", border: "1px solid #f59e0b44",
          borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer",
        }}>🔐 Simular Verificación</button>
        {verified !== null && (
          <div style={{ color: "#10b981", marginTop: 10, fontSize: 13, fontWeight: 700 }}>
            ✅ Firma verificada. El webhook es legítimo.
          </div>
        )}
      </div>

      <div style={{ background: "#18181b", borderRadius: 10, padding: 16, border: "1px solid #27272a" }}>
        <div style={{ color: "#10b981", fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 10 }}>📋 CHECKLIST DE WEBHOOKS ROBUSTOS</div>
        <div style={{ color: "#a1a1aa", fontSize: 13, lineHeight: 2 }}>
          ✓ Responder <strong style={{ color: "#e4e4e7" }}>200 inmediatamente</strong> y procesar async (con cola/BullMQ)<br />
          ✓ Verificar firma HMAC en <strong style={{ color: "#e4e4e7" }}>cada request</strong><br />
          ✓ Ser <strong style={{ color: "#e4e4e7" }}>idempotente</strong> (el servicio puede reenviar el mismo evento)<br />
          ✓ Loguear todo: event_id, timestamp, payload<br />
          ✓ Tener un <strong style={{ color: "#e4e4e7" }}>mecanismo de retry</strong> propio si tu procesamiento falla
        </div>
      </div>
    </div>
  );
}

// ─── VERSIONING LESSON ───
function VersioningLesson() {
  const [strategy, setStrategy] = useState("url");

  const strategies = {
    url: {
      name: "URL Path", icon: "🔗", color: "#3b82f6",
      example: `GET /v1/usuarios → { nombre: "Daniel" }
GET /v2/usuarios → { first_name: "Daniel", last_name: "..." }`,
      pros: "Explícito, fácil de cachear, claro en docs",
      cons: "Multiplica rutas, puede generar code duplication",
      who: "Stripe, Google, GitHub, Twitter",
    },
    header: {
      name: "Header", icon: "📋", color: "#10b981",
      example: `GET /usuarios
Accept: application/vnd.miapi.v2+json

# O con header custom:
API-Version: 2024-01-15`,
      pros: "URLs limpias, permite versiones por fecha (Stripe-style)",
      cons: "Más difícil de probar en browser, menos visible",
      who: "Stripe (API-Version por fecha), GitHub (Accept header)",
    },
    query: {
      name: "Query Param", icon: "❓", color: "#f59e0b",
      example: `GET /usuarios?version=2
GET /usuarios?api-version=2024-01-15`,
      pros: "Fácil de probar, compatible con cualquier cliente",
      cons: "Ensucian la URL, fácil de olvidar, difícil de cachear",
      who: "Google Cloud, Azure, AWS (algunos servicios)",
    },
  };

  const active = strategies[strategy];

  return (
    <div>
      <p style={{ color: "#a1a1aa", marginBottom: 20, fontSize: 15, lineHeight: 1.7 }}>
        Cuando cambiás la estructura de tu API, no podés romper a los clientes existentes. El <strong style={{ color: "#e4e4e7" }}>versionamiento</strong> te permite evolucionar sin destruir.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 24 }}>
        {Object.entries(strategies).map(([key, s]) => (
          <button key={key} onClick={() => setStrategy(key)} style={{
            background: strategy === key ? s.color + "15" : "transparent",
            border: `2px solid ${strategy === key ? s.color : "#27272a"}`,
            borderRadius: 10, padding: "14px 10px", cursor: "pointer", textAlign: "center",
          }}>
            <div style={{ fontSize: 22 }}>{s.icon}</div>
            <div style={{ color: s.color, fontWeight: 700, fontSize: 12, marginTop: 4 }}>{s.name}</div>
          </button>
        ))}
      </div>

      <div style={{ background: "#09090b", borderRadius: 10, padding: 16, border: "1px solid #27272a", marginBottom: 16 }}>
        <pre style={{ color: active.color, fontFamily: "monospace", fontSize: 12, margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
          {active.example}
        </pre>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <div style={{ background: "#10b98112", borderRadius: 8, padding: 12 }}>
          <div style={{ color: "#10b981", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>✅ PROS</div>
          <div style={{ color: "#a1a1aa", fontSize: 12 }}>{active.pros}</div>
        </div>
        <div style={{ background: "#ef444412", borderRadius: 8, padding: 12 }}>
          <div style={{ color: "#ef4444", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>⚠️ CONTRAS</div>
          <div style={{ color: "#a1a1aa", fontSize: 12 }}>{active.cons}</div>
        </div>
      </div>
      <div style={{ color: "#52525b", fontSize: 12, marginBottom: 24 }}>
        <strong style={{ color: "#71717a" }}>¿Quién lo usa?</strong> {active.who}
      </div>

      <div style={{ background: "#18181b", borderRadius: 10, padding: 16, border: "1px solid #27272a" }}>
        <div style={{ color: "#6366f1", fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 10 }}>💡 BREAKING vs NON-BREAKING CHANGES</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ background: "#10b98110", borderRadius: 8, padding: 12 }}>
            <div style={{ color: "#10b981", fontWeight: 700, fontSize: 12, marginBottom: 8 }}>✅ No requiere nueva versión</div>
            <div style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 1.8 }}>
              Agregar un campo nuevo al response<br />
              Agregar un endpoint nuevo<br />
              Agregar un query param opcional<br />
              Hacer un campo requerido → opcional
            </div>
          </div>
          <div style={{ background: "#ef444410", borderRadius: 8, padding: 12 }}>
            <div style={{ color: "#ef4444", fontWeight: 700, fontSize: 12, marginBottom: 8 }}>💥 REQUIERE nueva versión</div>
            <div style={{ color: "#a1a1aa", fontSize: 12, lineHeight: 1.8 }}>
              Renombrar un campo (nombre → first_name)<br />
              Eliminar un campo del response<br />
              Cambiar tipo de un campo (string → int)<br />
              Hacer un campo opcional → requerido
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ERRORS & RESILIENCE LESSON ───
function ErrorsLesson() {
  const [circuitState, setCircuitState] = useState("closed");
  const [failures, setFailures] = useState(0);
  const [requests, setRequests] = useState([]);

  function simulateRequest() {
    const isError = Math.random() < (circuitState === "half_open" ? 0.5 : 0.6);

    if (circuitState === "open") {
      setRequests(prev => [...prev, { status: "blocked", msg: "Circuit OPEN — request bloqueado sin enviar" }].slice(-12));
      return;
    }

    if (isError) {
      const newFailures = failures + 1;
      setFailures(newFailures);
      setRequests(prev => [...prev, { status: "error", msg: `500 Error (falla ${newFailures}/3)` }].slice(-12));
      if (newFailures >= 3) {
        setCircuitState("open");
        setTimeout(() => {
          setCircuitState("half_open");
          setFailures(0);
        }, 5000);
      }
    } else {
      setFailures(0);
      if (circuitState === "half_open") setCircuitState("closed");
      setRequests(prev => [...prev, { status: "ok", msg: "200 OK — respuesta exitosa" }].slice(-12));
    }
  }

  function resetCircuit() {
    setCircuitState("closed");
    setFailures(0);
    setRequests([]);
  }

  const stateColors = { closed: "#10b981", open: "#ef4444", half_open: "#f59e0b" };
  const stateLabels = { closed: "CERRADO (normal)", open: "ABIERTO (bloqueando)", half_open: "SEMI-ABIERTO (probando)" };

  return (
    <div>
      <p style={{ color: "#a1a1aa", marginBottom: 20, fontSize: 15, lineHeight: 1.7 }}>
        Las APIs fallan. Siempre. Un sistema resiliente no evita los errores — los <strong style={{ color: "#e4e4e7" }}>maneja con gracia</strong>.
      </p>

      <div style={{ background: "#09090b", borderRadius: 10, padding: 16, border: "1px solid #27272a", marginBottom: 20 }}>
        <div style={{ color: "#71717a", fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>ESTRUCTURA DE ERROR PROFESIONAL</div>
        <pre style={{ color: "#a1a1aa", fontFamily: "monospace", fontSize: 12, margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{`{
  "error": {
    "code": "VALIDATION_ERROR",      ← código máquina (tu app hace switch)
    "message": "Email inválido",     ← mensaje humano (se muestra al user)
    "details": [                     ← detalles técnicos (para debugging)
      { "field": "email", "issue": "formato inválido" }
    ],
    "request_id": "req_abc123",      ← para soporte: "dame tu request_id"
    "docs": "https://docs.api.com/errors/VALIDATION_ERROR"
  }
}`}</pre>
      </div>

      <div style={{ color: "#71717a", fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>⚡ CIRCUIT BREAKER INTERACTIVO</div>
      <p style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 16 }}>
        Un circuit breaker protege tu sistema: si una API falla muchas veces seguidas, <strong style={{ color: "#e4e4e7" }}>deja de llamarla</strong> temporalmente para no saturarla.
      </p>

      <div style={{
        background: stateColors[circuitState] + "15",
        border: `2px solid ${stateColors[circuitState]}`,
        borderRadius: 12, padding: 16, textAlign: "center", marginBottom: 16,
      }}>
        <div style={{ fontSize: 28, marginBottom: 4 }}>
          {circuitState === "closed" ? "🟢" : circuitState === "open" ? "🔴" : "🟡"}
        </div>
        <div style={{ color: stateColors[circuitState], fontWeight: 800, fontSize: 16, fontFamily: "monospace" }}>
          {stateLabels[circuitState]}
        </div>
        <div style={{ color: "#71717a", fontSize: 12, marginTop: 4 }}>
          Fallos consecutivos: {failures}/3
          {circuitState === "open" && " — Esperando 5s para probar de nuevo..."}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={simulateRequest} style={{
          background: "#6366f1", color: "#fff", border: "none", borderRadius: 8,
          padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", flex: 1,
        }}>⚡ Enviar Request</button>
        <button onClick={resetCircuit} style={{
          background: "#18181b", color: "#a1a1aa", border: "1px solid #27272a",
          borderRadius: 8, padding: "10px 20px", fontSize: 13, cursor: "pointer",
        }}>⟲ Reset</button>
      </div>

      {requests.length > 0 && (
        <div style={{ background: "#09090b", borderRadius: 10, padding: 12, border: "1px solid #27272a", maxHeight: 200, overflowY: "auto" }}>
          {requests.map((r, i) => (
            <div key={i} style={{
              display: "flex", gap: 8, alignItems: "center", padding: "6px 8px",
              fontSize: 12, fontFamily: "monospace", color: r.status === "ok" ? "#10b981" : r.status === "error" ? "#ef4444" : "#f59e0b",
            }}>
              <span>{r.status === "ok" ? "✅" : r.status === "error" ? "❌" : "🚫"}</span>
              <span>{r.msg}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: "#18181b", borderRadius: 10, padding: 16, border: "1px solid #27272a", marginTop: 16 }}>
        <div style={{ color: "#6366f1", fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 8 }}>🔄 CICLO DEL CIRCUIT BREAKER</div>
        <div style={{ color: "#a1a1aa", fontSize: 13, lineHeight: 1.8 }}>
          <strong style={{ color: "#10b981" }}>CERRADO</strong> → requests pasan normal. Si hay 3+ fallos seguidos...<br />
          <strong style={{ color: "#ef4444" }}>ABIERTO</strong> → BLOQUEA requests por N segundos (no llama al server). Después...<br />
          <strong style={{ color: "#f59e0b" }}>SEMI-ABIERTO</strong> → deja pasar 1 request de prueba. Si OK → cerrado. Si falla → abierto de nuevo.
        </div>
      </div>
    </div>
  );
}

// ─── API GATEWAY LESSON ───
function GatewayLesson() {
  const [activeFeature, setActiveFeature] = useState(null);

  const features = [
    {
      id: "routing", name: "Routing", icon: "🔀", color: "#3b82f6",
      desc: "Redirige /users → User Service, /orders → Order Service, /payments → Payment Service. Un solo punto de entrada para múltiples microservicios.",
      example: `# nginx.conf / Kong / AWS API Gateway
location /api/users    → http://user-service:3001
location /api/orders   → http://order-service:3002  
location /api/payments → http://payment-service:3003`
    },
    {
      id: "auth", name: "Auth centralizado", icon: "🔐", color: "#10b981",
      desc: "Verifica tokens UNA vez en el gateway, no en cada microservicio. Si el token es inválido, ni siquiera llega al backend.",
      example: `# Antes: cada servicio verifica JWT
User Service   → verifyJWT() ← duplicado
Order Service  → verifyJWT() ← duplicado

# Después: el gateway lo hace
Gateway → verifyJWT() → forward(authenticated_request)`
    },
    {
      id: "ratelimit", name: "Rate Limiting", icon: "🚦", color: "#f59e0b",
      desc: "Controla el tráfico antes de que llegue a tus servicios. Puede ser por usuario, por IP, por plan, por endpoint.",
      example: `# Límites por plan
Plan Free:       100 req/hora
Plan Pro:        1000 req/hora
Plan Enterprise: 10000 req/hora

# Header: X-RateLimit-Remaining: 847`
    },
    {
      id: "transform", name: "Transformación", icon: "🔄", color: "#a78bfa",
      desc: "Modifica requests/responses en tránsito. Agrega headers, transforma formatos, agrega metadata, combina respuestas de múltiples servicios.",
      example: `# Request entrante (API pública)
POST /api/v2/orders { items: [...] }

# Gateway transforma para el servicio interno
POST /internal/orders { 
  items: [...],
  api_version: "v2",
  client_id: "extracted_from_token",
  timestamp: "auto_added"
}`
    },
    {
      id: "logging", name: "Observabilidad", icon: "📊", color: "#f472b6",
      desc: "Logging centralizado, métricas, tracing distribuido. Cada request tiene un X-Request-ID que viaja por todos los servicios.",
      example: `X-Request-ID: req_abc123

Gateway log:  [req_abc123] GET /users → 200 (45ms)
User Service: [req_abc123] DB query → 12ms
Cache:        [req_abc123] HIT redis → 2ms

# Dashboard: latencia p95, error rate, throughput`
    },
  ];

  return (
    <div>
      <p style={{ color: "#a1a1aa", marginBottom: 20, fontSize: 15, lineHeight: 1.7 }}>
        Un API Gateway es la <strong style={{ color: "#e4e4e7" }}>puerta de entrada</strong> a tu sistema de microservicios. Centraliza auth, rate limiting, routing y logging en un solo punto. Es lo que n8n hace a nivel de orquestación.
      </p>

      <div style={{ display: "grid", gap: 8, marginBottom: 20 }}>
        {features.map((f) => (
          <button key={f.id} onClick={() => setActiveFeature(activeFeature === f.id ? null : f.id)} style={{
            background: activeFeature === f.id ? f.color + "12" : "#18181b",
            border: `1px solid ${activeFeature === f.id ? f.color + "44" : "#27272a"}`,
            borderRadius: 10, padding: "14px 16px", cursor: "pointer", textAlign: "left", transition: "all 0.2s",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>{f.icon}</span>
              <span style={{ color: f.color, fontWeight: 700, fontSize: 14 }}>{f.name}</span>
            </div>
            {activeFeature === f.id && (
              <div style={{ marginTop: 12 }}>
                <div style={{ color: "#a1a1aa", fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>{f.desc}</div>
                <pre style={{ background: "#09090b", borderRadius: 8, padding: 12, margin: 0, fontFamily: "monospace", fontSize: 11, color: "#a1a1aa", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                  {f.example}
                </pre>
              </div>
            )}
          </button>
        ))}
      </div>

      <div style={{ background: "#18181b", borderRadius: 10, padding: 16, border: "1px solid #27272a" }}>
        <div style={{ color: "#f59e0b", fontWeight: 700, fontSize: 12, letterSpacing: 1, marginBottom: 10 }}>🏗️ GATEWAYS POPULARES</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {[
            { name: "Kong", desc: "Open source, plugin-based, enterprise-ready" },
            { name: "AWS API Gateway", desc: "Serverless, integra con Lambda" },
            { name: "NGINX", desc: "Reverse proxy + load balancer clásico" },
            { name: "n8n (orquestador)", desc: "No es gateway puro, pero coordina múltiples APIs en flujos" },
          ].map((g) => (
            <div key={g.name} style={{ background: "#09090b", borderRadius: 8, padding: 10 }}>
              <div style={{ color: "#6366f1", fontWeight: 700, fontSize: 13 }}>{g.name}</div>
              <div style={{ color: "#52525b", fontSize: 11, marginTop: 2 }}>{g.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── QUIZ ───
const ALL_QUESTIONS = [
  { q: "En OAuth 2.0, ¿qué flujo usarías para que un cron job de n8n se conecte a una API sin usuario?", opts: ["Authorization Code", "Client Credentials", "Implicit", "PKCE"], correct: "Client Credentials", explain: "Client Credentials es máquina-a-máquina. No hay usuario involucrado, solo client_id + client_secret." },
  { q: "¿Cuál es la diferencia entre access_token y refresh_token?", opts: ["No hay diferencia", "Access es temporal (~1h), refresh es de larga vida para renovar", "Refresh es más rápido", "Access es para leer, refresh para escribir"], correct: "Access es temporal (~1h), refresh es de larga vida para renovar", explain: "El access_token expira rápido por seguridad. El refresh_token permite obtener nuevos access_tokens sin re-autenticar al usuario." },
  { q: "Recibís un 429 Too Many Requests. ¿Cuál es la mejor estrategia?", opts: ["Reintentar inmediatamente en loop", "Exponential backoff con jitter", "Cambiar de API key", "Ignorar y seguir"], correct: "Exponential backoff con jitter", explain: "Exponential backoff (0.5s, 1s, 2s, 4s...) con jitter (variación aleatoria) evita que todos los clientes reintenten al mismo tiempo." },
  { q: "¿Para qué sirve el header Idempotency-Key?", opts: ["Para autenticación", "Para evitar crear duplicados al reintentar un POST", "Para versionar la API", "Para rate limiting"], correct: "Para evitar crear duplicados al reintentar un POST", explain: "Si un POST con timeout se reintenta, el server usa la Idempotency-Key para devolver el resultado original en vez de crear un duplicado." },
  { q: "¿Qué tipo de paginación es más eficiente para millones de registros?", opts: ["Offset (page=N&limit=M)", "Cursor-based", "Keyset (WHERE id > N)", "No paginar"], correct: "Keyset (WHERE id > N)", explain: "Keyset/Seek usa índices de la DB directamente (WHERE id > last_id). Offset tiene que contar N filas antes, lo cual es lento en tablas grandes." },
  { q: "Un webhook de WhatsApp llega a tu endpoint. ¿Qué debés hacer PRIMERO?", opts: ["Procesar el mensaje", "Responder 200 inmediatamente", "Verificar la firma HMAC", "Guardar en base de datos"], correct: "Verificar la firma HMAC", explain: "PRIMERO verificar que el webhook es legítimo (HMAC). Luego responder 200 rápido y procesar async." },
  { q: "¿Cuál de estos cambios en tu API REQUIERE una nueva versión?", opts: ["Agregar un campo nuevo al response", "Renombrar un campo existente", "Agregar un endpoint nuevo", "Agregar un query param opcional"], correct: "Renombrar un campo existente", explain: "Renombrar un campo (nombre → first_name) rompe a todos los clientes que esperan el campo viejo. Es un breaking change." },
  { q: "El circuit breaker está en estado ABIERTO. ¿Qué pasa con los requests?", opts: ["Se envían normal", "Se bloquean sin llegar al servidor", "Se envían más lento", "Se redirigen a otro server"], correct: "Se bloquean sin llegar al servidor", explain: "En estado ABIERTO, el circuit breaker ni siquiera envía el request. Protege al server caído de más carga y falla rápido para el cliente." },
  { q: "¿Qué es PKCE en OAuth?", opts: ["Un tipo de token", "Proof Key for Code Exchange — protege apps sin backend", "Un protocolo de encriptación", "Un método de rate limiting"], correct: "Proof Key for Code Exchange — protege apps sin backend", explain: "PKCE agrega un challenge criptográfico al flujo Authorization Code para que sea seguro en apps que no pueden guardar un client_secret (SPAs, móviles)." },
  { q: "¿Para qué sirve el header X-Request-ID?", opts: ["Autenticación", "Rastrear un request específico a través de múltiples servicios", "Versionamiento", "Paginación"], correct: "Rastrear un request específico a través de múltiples servicios", explain: "X-Request-ID viaja por todos los microservicios, permitiendo correlacionar logs y hacer debugging distribuido." },
  { q: "Polling vs Webhooks: ¿cuál es más eficiente para recibir eventos?", opts: ["Polling porque es más simple", "Webhooks porque solo notifican cuando hay algo nuevo", "Son iguales", "Polling porque es más confiable"], correct: "Webhooks porque solo notifican cuando hay algo nuevo", explain: "Polling desperdicia requests preguntando constantemente. Webhooks solo envían cuando hay un evento real. Más eficiente y en tiempo real." },
  { q: "¿Qué significa que DELETE es idempotente?", opts: ["No se puede usar", "Borrar algo ya borrado no causa error adicional", "Solo funciona una vez", "Requiere confirmación"], correct: "Borrar algo ya borrado no causa error adicional", explain: "Borrar un recurso 1 vez o 5 veces da el mismo resultado final: el recurso no existe. El estado del sistema es el mismo." },
  { q: "En un API Gateway, ¿dónde se verifica el JWT?", opts: ["En cada microservicio individual", "En el gateway, una sola vez", "En el cliente", "En la base de datos"], correct: "En el gateway, una sola vez", explain: "El gateway centraliza la verificación de auth. Si el token es inválido, el request ni llega a los microservicios. Evita duplicar lógica." },
  { q: "¿Cuál es la ventaja de versionar por fecha (API-Version: 2024-01-15) vs por número (v1, v2)?", opts: ["No hay ventaja", "Permite cambios graduales sin grandes saltos de versión", "Es más rápido", "Es más seguro"], correct: "Permite cambios graduales sin grandes saltos de versión", explain: "Versionar por fecha (estilo Stripe) permite deprecar comportamientos gradualmente. Cada fecha puede tener cambios pequeños vs saltos grandes de v1→v2." },
  { q: "¿Qué es un 'scope' en OAuth?", opts: ["El tipo de token", "Un permiso granular que limita qué puede hacer la app", "La URL de callback", "El tiempo de expiración"], correct: "Un permiso granular que limita qué puede hacer la app", explain: "Scopes definen permisos específicos: 'read:messages write:users'. Principio de mínimo privilegio — solo pedir lo que necesitás." },
  { q: "¿Por qué el offset pagination es problemático con datos que cambian?", opts: ["Es más lento", "Si se insertan filas, se repiten o saltan items entre páginas", "No funciona con JSON", "Requiere más memoria"], correct: "Si se insertan filas, se repiten o saltan items entre páginas", explain: "Si estás en page=3 y se inserta un item en page=1, todo se desplaza. Podés ver items duplicados o saltarte items. Cursor-based resuelve esto." },
  { q: "¿Qué pasa en el estado SEMI-ABIERTO del circuit breaker?", opts: ["Se bloquean todos los requests", "Se deja pasar 1 request de prueba", "Se envían todos normal", "Se reduce la velocidad"], correct: "Se deja pasar 1 request de prueba", explain: "Semi-abierto deja pasar un request de prueba. Si tiene éxito → vuelve a CERRADO. Si falla → vuelve a ABIERTO." },
  { q: "Un error de API devuelve { error: 'algo falló' }. ¿Qué le falta?", opts: ["Nada, es suficiente", "Código máquina, request_id, y detalles técnicos", "Un número de teléfono de soporte", "El stack trace completo"], correct: "Código máquina, request_id, y detalles técnicos", explain: "Un buen error tiene: code (VALIDATION_ERROR), message humano, details array, request_id para soporte, y link a docs." },
  { q: "¿Qué header te dice cuántas peticiones te quedan antes del rate limit?", opts: ["Content-Type", "X-RateLimit-Remaining", "Authorization", "Cache-Control"], correct: "X-RateLimit-Remaining", explain: "X-RateLimit-Remaining indica cuántas peticiones podés hacer antes de que te bloqueen. Usalo para throttlear proactivamente." },
  { q: "¿Por qué un webhook debe ser idempotente?", opts: ["Por rendimiento", "Porque el emisor puede reenviar el mismo evento si no recibió tu 200", "Por seguridad", "No necesita serlo"], correct: "Porque el emisor puede reenviar el mismo evento si no recibió tu 200", explain: "Si tu server responde lento o el 200 se pierde, el emisor reenvía el mismo webhook. Si no sos idempotente, procesás el evento dos veces." },
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
    const q = shuffle(ALL_QUESTIONS).slice(0, 15);
    setQuestions(q);
    setShuffledOpts(shuffle(q[0]?.opts || []));
  }, []);

  useEffect(() => {
    if (questions[current]) {
      setShuffledOpts(shuffle(questions[current].opts));
    }
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
    const q = shuffle(ALL_QUESTIONS).slice(0, 15);
    setQuestions(q);
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
    setShowExplain(false);
  }

  if (questions.length === 0) return <div style={{ color: "#71717a" }}>Cargando...</div>;

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    const emoji = pct >= 80 ? "🏆" : pct >= 60 ? "👍" : "📚";
    const msg = pct >= 80 ? "¡Nivel senior! Dominás conceptos avanzados de APIs." : pct >= 60 ? "Buen nivel. Repasá los temas donde fallaste." : "Hay que seguir estudiando. Volvé a las lecciones y reintentá.";
    return (
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{emoji}</div>
        <div style={{ color: "#e4e4e7", fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{score}/{questions.length}</div>
        <div style={{ color: pct >= 80 ? "#10b981" : pct >= 60 ? "#f59e0b" : "#ef4444", fontSize: 48, fontWeight: 900, marginBottom: 12 }}>{pct}%</div>
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
        <div style={{ width: `${((current + 1) / questions.length) * 100}%`, height: 3, background: "linear-gradient(90deg, #6366f1, #a78bfa)", borderRadius: 2, transition: "width 0.3s" }} />
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
          background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px",
          fontWeight: 700, fontSize: 14, cursor: "pointer", width: "100%",
        }}>
          {current + 1 >= questions.length ? "Ver Resultado →" : "Siguiente →"}
        </button>
      )}
    </div>
  );
}


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
