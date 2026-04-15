import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import LabLayout from './components/LabLayout.jsx'
import Quiz from './components/Quiz.jsx'
import { shuffle } from './utils/shuffle.js'
import { cn } from './utils/cn.js'
import { toneFromHex } from './utils/tone.js'

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
      <p className="mb-5 text-sm leading-relaxed text-zinc-400">
        OAuth 2.0 no es "un token". Es un <strong className="text-zinc-100">protocolo de delegación</strong> — le das permiso a una app para actuar en tu nombre sin darle tu contraseña. Hay 3 flujos principales según el contexto.
      </p>

      <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {Object.entries(flows).map(([key, f]) => (
          <button
            key={key}
            onClick={() => setActiveFlow(key)}
            className={cn(
              'rounded-xl border-2 px-4 py-4 text-center transition-colors',
              activeFlow === key ? 'border-indigo-400/70 bg-zinc-900' : 'border-zinc-800 hover:bg-zinc-900',
            )}
          >
            <div className="text-2xl">{f.icon}</div>
            <div className={cn('mt-1 text-xs font-bold', activeFlow === key ? 'text-zinc-100' : 'text-zinc-500')}>{f.name}</div>
            <div className="mt-1 text-[10px] text-zinc-600">{f.when}</div>
          </button>
        ))}
      </div>

      <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="text-xs text-zinc-400">
            <strong className="text-zinc-100">Caso real:</strong> {activeFlowData.realWorld}
          </div>
          <button
            onClick={playAnimation}
            disabled={playing}
            className={cn(
              'inline-flex h-9 items-center justify-center rounded-xl px-4 text-xs font-bold text-white transition-colors',
              playing ? 'cursor-not-allowed bg-zinc-800 text-zinc-500' : 'bg-indigo-500 hover:bg-indigo-400',
            )}
          >
            {playing ? "⏳ Reproduciendo..." : "▶ Animar Flujo"}
          </button>
        </div>

        <div className="grid gap-2">
          {activeFlowData.steps.map((s, i) => (
            <div
              key={i}
              onClick={() => {
                setStep(i)
                setPlaying(false)
                clearInterval(timerRef.current)
              }}
              className={cn(
                'cursor-pointer rounded-xl border px-4 py-4 transition-all duration-300',
                i <= step ? cn(toneFromHex(s.color).bg, toneFromHex(s.color).border) : 'border-zinc-800 bg-zinc-900',
                i <= step ? 'opacity-100' : 'opacity-40',
                i === step && playing ? 'scale-[1.01]' : 'scale-100',
              )}
            >
              <div className="mb-2 flex items-center gap-3">
                <span
                  className={cn(
                    'rounded-md px-2 py-1 font-mono text-[11px] font-extrabold tracking-wider',
                    toneFromHex(s.color).bg,
                    toneFromHex(s.color).text,
                  )}
                >
                  PASO {i + 1}
                </span>
                <span className={cn('text-sm font-bold', toneFromHex(s.color).text)}>{s.actor}</span>
              </div>
              <div className="mb-2 text-sm font-semibold text-zinc-100">{s.action}</div>
              {i <= step && (
                <div className="mt-2 whitespace-pre-wrap break-all rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs leading-relaxed text-zinc-300">
                  {s.detail}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-3 text-xs font-bold tracking-widest text-amber-400">🔑 CONCEPTOS CLAVE</div>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { term: "Access Token", def: "Credencial de corta vida (~1h) para acceder a recursos. Es como un ticket de cine." },
            { term: "Refresh Token", def: "Credencial de larga vida para obtener nuevos access tokens sin re-autenticar." },
            { term: "Scope", def: "Permisos granulares: 'read:users write:messages'. Principio de mínimo privilegio." },
            { term: "PKCE", def: "Proof Key for Code Exchange. Protege contra interceptación del código en apps sin backend." },
          ].map((c) => (
            <div key={c.term} className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
              <div className="mb-1 font-mono text-sm font-bold text-indigo-300">{c.term}</div>
              <div className="text-sm leading-relaxed text-zinc-400">{c.def}</div>
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
      <p className="mb-4 text-sm leading-relaxed text-zinc-400">
        Las APIs limitan cuántas peticiones podés hacer. Si te pasás, recibís{' '}
        <strong className="font-mono text-amber-300">429 Too Many Requests</strong>. La pregunta es: ¿qué hacés cuando eso pasa?
      </p>

      <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="mb-2 text-xs text-zinc-500">CONFIGURACIÓN DEL SERVIDOR</div>
        <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
          <span>
            Límite: <strong className="text-zinc-100">{rateLimit.max} req</strong>
          </span>
          <span>
            Ventana: <strong className="text-zinc-100">{rateLimit.windowSec}s</strong>
          </span>
          <span>
            Total a enviar: <strong className="text-zinc-100">25 requests</strong>
          </span>
        </div>
      </div>

      <div className="mb-2 text-xs font-bold tracking-widest text-zinc-500">ESTRATEGIA DE REINTENTO</div>
      <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {strategies.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setStrategy(s.id)
              reset()
            }}
            className={cn(
              'rounded-xl border-2 px-4 py-4 text-center transition-colors',
              strategy === s.id ? cn(toneFromHex(s.color).bg, toneFromHex(s.color).border) : 'border-zinc-800 hover:bg-zinc-900',
            )}
          >
            <div className="text-xl">{s.icon}</div>
            <div className={cn('mt-1 text-xs font-bold', toneFromHex(s.color).text)}>{s.name}</div>
            <div className="mt-1 text-[10px] text-zinc-600">{s.desc}</div>
          </button>
        ))}
      </div>

      <button
        onClick={simulate}
        disabled={running}
        className={cn(
          'mb-5 inline-flex h-11 w-full items-center justify-center rounded-xl px-6 text-sm font-bold text-white transition-colors',
          running ? 'cursor-not-allowed bg-zinc-800 text-zinc-500' : 'bg-indigo-500 hover:bg-indigo-400',
        )}
      >
        {running ? "⏳ Enviando requests..." : "▶ Simular 25 Requests"}
      </button>

      {requests.length > 0 && (
        <>
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-center">
              <div className="mb-1 text-[11px] text-zinc-500">ENVIADOS</div>
              <div className="text-2xl font-black text-zinc-100">{stats.sent}</div>
            </div>
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-center">
              <div className="mb-1 text-[11px] text-emerald-300">EXITOSOS (200)</div>
              <div className="text-2xl font-black text-emerald-300">{stats.ok}</div>
            </div>
            <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-center">
              <div className="mb-1 text-[11px] text-red-300">RECHAZADOS (429)</div>
              <div className="text-2xl font-black text-red-300">{stats.throttled}</div>
            </div>
          </div>

          <div className="max-h-52 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-3">
            <div className="flex flex-wrap gap-1.5">
              {requests.map((r) => (
                <div
                  key={r.id}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-lg border font-mono text-[10px] font-extrabold',
                    r.status === 200 ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300' : 'border-red-400/40 bg-red-500/10 text-red-300',
                  )}
                >
                  {r.status === 200 ? "✓" : "429"}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-2 text-xs font-bold text-indigo-300">📊 ANÁLISIS</div>
            <div className="text-sm leading-relaxed text-zinc-400">
              Tasa de éxito:{' '}
              <strong className={stats.ok / stats.sent > 0.7 ? 'text-emerald-300' : 'text-red-300'}>
                {Math.round((stats.ok / stats.sent) * 100)}%
              </strong>
              {strategy === "none" && stats.throttled > 5 && " — Sin control, la mayoría de requests se pierden. Desperdicio de recursos."}
              {strategy === "fixed" && " — Mejor que nada, pero el delay fijo no se adapta a la carga."}
              {strategy === "exponential" && " — La mejor estrategia: se adapta dinámicamente y maximiza throughput."}
            </div>
          </div>
        </>
      )}

      <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-2 text-xs font-bold tracking-widest text-amber-400">📬 HEADERS DE RATE LIMIT</div>
        <div className="font-mono text-xs leading-loose text-zinc-400">
          <span className="text-indigo-300">X-RateLimit-Limit:</span> 100 <span className="text-zinc-600">← máximo por ventana</span><br />
          <span className="text-indigo-300">X-RateLimit-Remaining:</span> 23 <span className="text-zinc-600">← cuántas te quedan</span><br />
          <span className="text-indigo-300">X-RateLimit-Reset:</span> 1625097600 <span className="text-zinc-600">← timestamp de reset</span><br />
          <span className="text-indigo-300">Retry-After:</span> 30 <span className="text-zinc-600">← segundos para reintentar</span>
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
      <p className="mb-5 text-sm leading-relaxed text-zinc-400">
        Una operación es <strong className="text-zinc-100">idempotente</strong> si ejecutarla 1 vez o 100 veces produce el <strong className="text-zinc-100">mismo resultado</strong>. Es CRÍTICO para pagos, transacciones y cualquier cosa que no debería duplicarse.
      </p>

      <div className="mb-2 text-xs font-bold tracking-widest text-zinc-500">ESCENARIOS INTERACTIVOS</div>
      <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {scenarios.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setScenario(s.id)
              setStep(0)
            }}
            className={cn(
              'rounded-xl border-2 px-4 py-4 text-left transition-colors',
              scenario === s.id ? cn(toneFromHex(s.color).bg, toneFromHex(s.color).border) : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800',
            )}
          >
            <div className={cn('text-sm font-bold', toneFromHex(s.color).text)}>{s.title}</div>
          </button>
        ))}
      </div>

      {scenario && (() => {
        const s = scenarios.find((x) => x.id === scenario);
        return (
          <div className={cn('mb-6 rounded-xl border bg-zinc-950 p-5', toneFromHex(s.color).border)}>
            {s.steps.map((st, i) => (
              <div
                key={i}
                onClick={() => setStep(i)}
                className={cn(
                  'mb-1 flex cursor-pointer items-start gap-3 rounded-xl px-3 py-3 transition-colors',
                  i <= step ? 'opacity-100' : 'opacity-40',
                  i === step ? toneFromHex(s.color).bg : 'bg-transparent',
                )}
              >
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-extrabold',
                    i <= step ? cn('text-white', s.color === '#10b981' ? 'bg-emerald-500' : s.color === '#ef4444' ? 'bg-red-500' : 'bg-indigo-500') : 'bg-zinc-800 text-zinc-500',
                  )}
                >
                  {i + 1}
                </div>
                <div
                  className={cn(
                    'text-sm leading-relaxed',
                    i <= step ? 'text-zinc-100' : 'text-zinc-500',
                    st.includes('POST') || st.includes('key') ? 'font-mono' : 'font-sans',
                  )}
                >
                  {st}
                </div>
              </div>
            ))}
            {step < s.steps.length - 1 && (
              <button
                onClick={() => setStep(step + 1)}
                className={cn(
                  'mt-3 inline-flex h-9 items-center justify-center rounded-xl border px-4 text-sm font-bold',
                  toneFromHex(s.color).bg,
                  toneFromHex(s.color).border,
                  toneFromHex(s.color).text,
                )}
              >
                Siguiente paso →
              </button>
            )}
          </div>
        );
      })()}

      <div className="mb-2 text-xs font-bold tracking-widest text-zinc-500">TABLA DE IDEMPOTENCIA POR MÉTODO</div>
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
        <div className="grid grid-cols-[80px_90px_70px_1fr] gap-0 bg-zinc-900 px-4 py-2 text-[11px] font-bold text-zinc-500">
          <span>MÉTODO</span><span>IDEMPOTENTE</span><span>SAFE</span><span>NOTA</span>
        </div>
        {methodTable.map((m) => (
          <div key={m.method} className="grid grid-cols-[80px_90px_70px_1fr] items-center gap-0 border-t border-zinc-800 px-4 py-3">
            <span className="font-mono text-sm font-bold text-indigo-300">{m.method}</span>
            <span className={cn('text-sm font-bold', m.idempotent ? 'text-emerald-300' : 'text-red-300')}>{m.idempotent ? "✅ Sí" : "❌ No"}</span>
            <span className={cn('text-sm', m.safe ? 'text-emerald-300' : 'text-amber-300')}>{m.safe ? "✅" : "⚠️"}</span>
            <span className="text-sm text-zinc-400">{m.desc}</span>
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
        <pre className="m-0 whitespace-pre-wrap font-mono text-xs leading-relaxed text-zinc-400">
          {JSON.stringify(response, null, 2)}
        </pre>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {paginationType === "offset" && (
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
      <p className="mb-5 text-sm leading-relaxed text-zinc-400">
        En vez de preguntar constantemente "¿hay algo nuevo?" (<strong className="text-zinc-100">polling</strong>), un webhook hace que el servicio <strong className="text-zinc-100">te avise a vos</strong> cuando algo pasa. Es una API invertida.
      </p>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4">
          <div className="mb-2 text-sm font-bold text-red-300">❌ Polling (mal)</div>
          <div className="font-mono text-xs leading-loose text-zinc-300">
            Cada 5 seg: GET /messages → [] vacío<br />
            Cada 5 seg: GET /messages → [] vacío<br />
            Cada 5 seg: GET /messages → [] vacío<br />
            Cada 5 seg: GET /messages → [1 msg] ¡al fin!<br />
            <span className="text-red-300">= 95% de requests desperdiciadas</span>
          </div>
        </div>
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
          <div className="mb-2 text-sm font-bold text-emerald-300">✅ Webhook (bien)</div>
          <div className="font-mono text-xs leading-loose text-zinc-300">
            Tu server espera tranquilo...<br />
            WhatsApp → POST /tu-webhook ¡mensaje nuevo!<br />
            Tu server procesa inmediatamente.<br />
            <span className="text-emerald-300">= 0 requests desperdiciadas, respuesta instantánea</span>
          </div>
        </div>
      </div>

      <button
        onClick={simulateWebhooks}
        className="mb-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-indigo-500 px-6 text-sm font-bold text-white transition-colors hover:bg-indigo-400"
      >
        🪝 Simular Webhooks Entrantes
      </button>

      {events.length > 0 && (
        <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="mb-3 text-[11px] font-bold text-zinc-500">EVENTOS RECIBIDOS EN TU ENDPOINT</div>
          {events.map((e) => (
            <div key={e.id} className="mb-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="font-mono text-sm font-bold text-indigo-300">{e.type}</span>
                <span className="text-xs text-zinc-500">{e.source}</span>
              </div>
              <pre className="m-0 whitespace-pre-wrap font-mono text-xs leading-relaxed text-zinc-400">
                {JSON.stringify(e.payload, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}

      <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-3 text-xs font-bold tracking-widest text-amber-400">🔏 VERIFICACIÓN HMAC</div>
        <p className="mb-3 text-sm leading-relaxed text-zinc-400">
          ¿Cómo sabés que un webhook realmente viene de WhatsApp y no de un atacante? Con una firma HMAC-SHA256 que solo vos y el servicio conocen.
        </p>
        <div className="mb-3 whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-xs leading-relaxed text-zinc-300">
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
        <button
          onClick={verifySignature}
          className="inline-flex h-9 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 text-xs font-bold text-amber-300"
        >
          🔐 Simular Verificación
        </button>
        {verified !== null && (
          <div className="mt-3 text-sm font-bold text-emerald-300">✅ Firma verificada. El webhook es legítimo.</div>
        )}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-2 text-xs font-bold tracking-widest text-emerald-300">📋 CHECKLIST DE WEBHOOKS ROBUSTOS</div>
        <div className="text-sm leading-loose text-zinc-400">
          ✓ Responder <strong className="text-zinc-100">200 inmediatamente</strong> y procesar async (con cola/BullMQ)<br />
          ✓ Verificar firma HMAC en <strong className="text-zinc-100">cada request</strong><br />
          ✓ Ser <strong className="text-zinc-100">idempotente</strong> (el servicio puede reenviar el mismo evento)<br />
          ✓ Loguear todo: event_id, timestamp, payload<br />
          ✓ Tener un <strong className="text-zinc-100">mecanismo de retry</strong> propio si tu procesamiento falla
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
      <p className="mb-5 text-sm leading-relaxed text-zinc-400">
        Cuando cambiás la estructura de tu API, no podés romper a los clientes existentes. El <strong className="text-zinc-100">versionamiento</strong> te permite evolucionar sin destruir.
      </p>

      <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {Object.entries(strategies).map(([key, s]) => (
          <button
            key={key}
            onClick={() => setStrategy(key)}
            className={cn(
              'rounded-xl border-2 px-4 py-4 text-center transition-colors',
              strategy === key ? cn(toneFromHex(s.color).bg, toneFromHex(s.color).border) : 'border-zinc-800 hover:bg-zinc-900',
            )}
          >
            <div className="text-2xl">{s.icon}</div>
            <div className={cn('mt-1 text-xs font-bold', toneFromHex(s.color).text)}>{s.name}</div>
          </button>
        ))}
      </div>

      <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <pre className={cn('m-0 whitespace-pre-wrap font-mono text-xs leading-loose', toneFromHex(active.color).text)}>
          {active.example}
        </pre>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
          <div className="mb-1 text-[11px] font-bold text-emerald-300">✅ PROS</div>
          <div className="text-sm text-zinc-300">{active.pros}</div>
        </div>
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-4">
          <div className="mb-1 text-[11px] font-bold text-red-300">⚠️ CONTRAS</div>
          <div className="text-sm text-zinc-300">{active.cons}</div>
        </div>
      </div>
      <div className="mb-6 text-xs text-zinc-500">
        <strong className="text-zinc-400">¿Quién lo usa?</strong> {active.who}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-3 text-xs font-bold tracking-widest text-indigo-300">💡 BREAKING vs NON-BREAKING CHANGES</div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
            <div className="mb-2 text-xs font-bold text-emerald-300">✅ No requiere nueva versión</div>
            <div className="text-sm leading-relaxed text-zinc-300">
              Agregar un campo nuevo al response<br />
              Agregar un endpoint nuevo<br />
              Agregar un query param opcional<br />
              Hacer un campo requerido → opcional
            </div>
          </div>
          <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-4">
            <div className="mb-2 text-xs font-bold text-red-300">💥 REQUIERE nueva versión</div>
            <div className="text-sm leading-relaxed text-zinc-300">
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

  const stateLabels = { closed: "CERRADO (normal)", open: "ABIERTO (bloqueando)", half_open: "SEMI-ABIERTO (probando)" };
  const stateTones = {
    closed: { text: 'text-emerald-300', border: 'border-emerald-400/60', bg: 'bg-emerald-500/10' },
    open: { text: 'text-red-300', border: 'border-red-400/60', bg: 'bg-red-500/10' },
    half_open: { text: 'text-amber-300', border: 'border-amber-400/60', bg: 'bg-amber-500/10' },
  }

  return (
    <div>
      <p className="mb-5 text-sm leading-relaxed text-zinc-400">
        Las APIs fallan. Siempre. Un sistema resiliente no evita los errores — los <strong className="text-zinc-100">maneja con gracia</strong>.
      </p>

      <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="mb-3 text-xs font-bold tracking-widest text-zinc-500">ESTRUCTURA DE ERROR PROFESIONAL</div>
        <pre className="m-0 whitespace-pre-wrap font-mono text-xs leading-relaxed text-zinc-400">{`{
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

      <div className="mb-2 text-xs font-bold tracking-widest text-zinc-500">⚡ CIRCUIT BREAKER INTERACTIVO</div>
      <p className="mb-4 text-sm leading-relaxed text-zinc-400">
        Un circuit breaker protege tu sistema: si una API falla muchas veces seguidas, <strong className="text-zinc-100">deja de llamarla</strong> temporalmente para no saturarla.
      </p>

      <div className={cn('mb-4 rounded-xl border-2 p-4 text-center', stateTones[circuitState].bg, stateTones[circuitState].border)}>
        <div className="text-3xl">
          {circuitState === "closed" ? "🟢" : circuitState === "open" ? "🔴" : "🟡"}
        </div>
        <div className={cn('mt-1 font-mono text-base font-black', stateTones[circuitState].text)}>
          {stateLabels[circuitState]}
        </div>
        <div className="mt-1 text-xs text-zinc-500">
          Fallos consecutivos: {failures}/3
          {circuitState === "open" && " — Esperando 5s para probar de nuevo..."}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={simulateRequest}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-indigo-500 px-4 text-sm font-bold text-white transition-colors hover:bg-indigo-400"
        >
          ⚡ Enviar Request
        </button>
        <button
          onClick={resetCircuit}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-800"
        >
          ⟲ Reset
        </button>
      </div>

      {requests.length > 0 && (
        <div className="max-h-52 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-3">
          {requests.map((r, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-2 px-2 py-1 font-mono text-xs',
                r.status === 'ok' ? 'text-emerald-300' : r.status === 'error' ? 'text-red-300' : 'text-amber-300',
              )}
            >
              <span>{r.status === "ok" ? "✅" : r.status === "error" ? "❌" : "🚫"}</span>
              <span>{r.msg}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-2 text-xs font-bold tracking-widest text-indigo-300">🔄 CICLO DEL CIRCUIT BREAKER</div>
        <div className="text-sm leading-relaxed text-zinc-400">
          <strong className="text-emerald-300">CERRADO</strong> → requests pasan normal. Si hay 3+ fallos seguidos...<br />
          <strong className="text-red-300">ABIERTO</strong> → BLOQUEA requests por N segundos (no llama al server). Después...<br />
          <strong className="text-amber-300">SEMI-ABIERTO</strong> → deja pasar 1 request de prueba. Si OK → cerrado. Si falla → abierto de nuevo.
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
      <p className="mb-5 text-sm leading-relaxed text-zinc-400">
        Un API Gateway es la <strong className="text-zinc-100">puerta de entrada</strong> a tu sistema de microservicios. Centraliza auth, rate limiting, routing y logging en un solo punto. Es lo que n8n hace a nivel de orquestación.
      </p>

      <div className="mb-5 grid gap-2">
        {features.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFeature(activeFeature === f.id ? null : f.id)}
            className={cn(
              'rounded-xl border px-4 py-4 text-left transition-colors',
              activeFeature === f.id ? cn(toneFromHex(f.color).bg, toneFromHex(f.color).border) : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800',
            )}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{f.icon}</span>
              <span className={cn('text-sm font-bold', toneFromHex(f.color).text)}>{f.name}</span>
            </div>
            {activeFeature === f.id && (
              <div className="mt-3">
                <div className="mb-3 text-sm leading-relaxed text-zinc-300">{f.desc}</div>
                <pre className="m-0 whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-xs leading-relaxed text-zinc-400">
                  {f.example}
                </pre>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="mb-3 text-xs font-bold tracking-widest text-amber-400">🏗️ GATEWAYS POPULARES</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            { name: "Kong", desc: "Open source, plugin-based, enterprise-ready" },
            { name: "AWS API Gateway", desc: "Serverless, integra con Lambda" },
            { name: "NGINX", desc: "Reverse proxy + load balancer clásico" },
            { name: "n8n (orquestador)", desc: "No es gateway puro, pero coordina múltiples APIs en flujos" },
          ].map((g) => (
            <div key={g.name} className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
              <div className="text-sm font-bold text-indigo-300">{g.name}</div>
              <div className="mt-1 text-xs text-zinc-500">{g.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
      case "quiz":
        return (
          <Quiz
            questionsBank={ALL_QUESTIONS}
            questionCount={15}
            messages={{
              high: "¡Nivel senior! Dominás conceptos avanzados de APIs.",
              medium: "Buen nivel. Repasá los temas donde fallaste.",
              low: "Hay que seguir estudiando. Volvé a las lecciones y reintentá.",
            }}
            finalButtonText="Ver Resultado →"
            restartButtonText="🔄 Quiz nuevo (preguntas aleatorias)"
            gradientClassName="bg-gradient-to-r from-amber-500 to-red-500"
            primaryClassName="bg-indigo-500 hover:bg-indigo-400"
          />
        )
      default: return null;
    }
  }

  return (
    <LabLayout
      icon="🔥"
      title="Advanced API Lab"
      titleClassName="text-xl font-black tracking-tight bg-gradient-to-r from-amber-400 via-red-400 to-violet-400 bg-clip-text text-transparent"
      subtitle="OAuth, Rate Limiting, Idempotencia, Webhooks y más"
      levelLabel="NIVEL 2"
      levelColor="amber"
      progressBarClassName="bg-gradient-to-r from-amber-500 to-red-500"
      lessons={LESSONS}
      activeLesson={activeLesson}
      visited={visited}
      onNavigate={navigate}
    >
      {renderLesson()}
    </LabLayout>
  )
}
