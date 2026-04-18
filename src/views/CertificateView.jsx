import { useEffect, useMemo, useState } from 'react'
import { Badge, BrandMark, Button, Card, Container } from '../components/ui.jsx'
import { trackEvent } from '../services/analytics.js'
import { issueCertificate, isCertificateEligible, loadCertificate, saveCertificate } from '../services/certificateStore.js'
import { loadProfile, saveProfile } from '../services/profileStore.js'
import { supabase } from '../services/supabaseClient.js'
import { verifyCertificatePublic } from '../services/supabaseSync.js'
import { issueCertificateEdge, syncDeviceEdge, verifyCertificateEdge } from '../services/edgeFunctions.js'
import { loadEvents } from '../services/analytics.js'
import { loadAllProgress } from '../services/progressStore.js'
import { getDeviceId } from '../services/deviceId.js'

function formatDate(ts) {
  if (!ts) return 'n/a'
  try {
    return new Date(ts).toLocaleDateString('es-ES')
  } catch {
    return 'n/a'
  }
}

function CertificateContent({ certificate, displayName, progress, levels, keyLearnings, preferDraftName = false }) {
  const draftName = displayName.trim()
  const finalName = preferDraftName ? (draftName || certificate?.displayName || '—') : (certificate?.displayName || draftName || '—')
  const verifyUrl = (() => {
    if (!certificate?.id) return ''
    if (typeof window === 'undefined') return `?verify=${certificate.id}`
    return `${window.location.origin}/?verify=${certificate.id}`
  })()
  return (
    <div className="certificate-inner p-7 sm:p-9">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <BrandMark tone="onColor" subtitle="Eficiencia operativa con automatización e IA" />
        <div className="text-right">
          <div className="text-[11px] font-bold tracking-[0.22em] text-zinc-100/80">CERTIFICADO</div>
          <div className="mt-1 text-sm font-extrabold text-zinc-100">API Academy</div>
          <div className="mt-1 text-xs text-zinc-100/70">
            ID:{' '}
            <span className="font-mono font-bold text-zinc-100">
              {certificate?.id ?? '—'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <div className="text-[11px] font-bold tracking-[0.30em] text-zinc-100/80">CERTIFICADO DE FINALIZACIÓN</div>
        <div className="mx-auto mt-4 h-px w-48 bg-gradient-to-r from-transparent via-white/70 to-transparent" />
        <div className="mt-6 text-sm text-zinc-100/90">Se certifica que</div>
        <div className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
          {finalName}
        </div>
        <div className="mt-3 text-sm leading-relaxed text-zinc-100/85">
          completó satisfactoriamente el programa de aprendizaje de APIs y arquitectura, con evaluación por nivel.
        </div>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        {levels.map((l) => (
          <div key={l.hash} className="rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-white/20">
            <div className="text-[11px] font-bold tracking-widest text-white/80">{l.badge}</div>
            <div className="mt-1 text-sm font-extrabold text-white">{l.title}</div>
            <div className="mt-2 text-xs text-white/80">
              Best quiz:{' '}
              <span className="font-bold text-white">
                {certificate?.scores?.[l.hash]?.bestPct ?? progress?.[l.hash]?.quiz?.bestPct ?? 0}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl bg-white/10 px-6 py-5 ring-1 ring-white/20">
        <div className="text-[11px] font-bold tracking-[0.22em] text-white/80">LO MÁS IMPORTANTE QUE APRENDIÓ</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {keyLearnings.map((k) => (
            <div key={k.badge} className="rounded-2xl bg-black/10 px-4 py-4 ring-1 ring-white/15">
              <div className="text-[11px] font-bold tracking-widest text-white/80">{k.badge}</div>
              <div className="mt-1 text-sm font-extrabold text-white">{k.title}</div>
              <div className="mt-2 text-xs leading-relaxed text-white/85">{k.text}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 border-t border-white/25 pt-5 sm:grid-cols-2">
        <div>
          <div className="text-xs text-white/80">Fecha</div>
          <div className="mt-1 text-sm font-bold text-white">{formatDate(certificate?.issuedAt ?? Date.now())}</div>
          <div className="mt-4 max-w-sm text-[11px] text-white/80">
            Verificación: <span className="font-mono">{verifyUrl || '—'}</span>
          </div>
        </div>
        <div className="sm:text-right">
          <div className="text-xs text-white/80">Emite</div>
          <div className="mt-1 text-sm font-extrabold text-white">Whitelabel AI</div>
          <div className="mt-4 flex flex-col items-start gap-2 sm:items-end">
            <div className="h-px w-56 bg-white/45" />
            <div className="text-xs font-bold text-white/85">Dirección Académica</div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-white/20">
        <div className="text-[11px] font-bold tracking-[0.22em] text-white/80">REFLEXIÓN</div>
        <div className="mt-2 text-sm leading-relaxed text-white/90">
          “La mejor API no es la más compleja: es la más clara, segura y fácil de evolucionar.”
        </div>
      </div>

      {certificate?.signature && (
        <div className="mt-5 text-[11px] text-white/75">
          Firma: <span className="font-mono">{certificate.signature.slice(0, 28)}…</span>
        </div>
      )}
    </div>
  )
}

export default function CertificateView({ progress, levels, onBack, verifyId }) {
  const [displayName, setDisplayName] = useState(() => loadProfile().displayName)
  const [certificate, setCertificate] = useState(() => loadCertificate())
  const [issuing, setIssuing] = useState(false)
  const [makePublic, setMakePublic] = useState(() => (certificate?.public ?? true) === true)
  const [remoteVerified, setRemoteVerified] = useState(null)
  const [remoteData, setRemoteData] = useState(null)
  const [remoteError, setRemoteError] = useState('')
  const [shareMsg, setShareMsg] = useState('')
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    trackEvent(verifyId ? 'certificate_verify_open' : 'certificate_open', { verifyId: verifyId ?? null })
  }, [verifyId])

  useEffect(() => {
    if (!verifyId) return
    if (!supabase) return
    setRemoteVerified(null)
    setRemoteData(null)
    setRemoteError('')

    verifyCertificateEdge(verifyId)
      .then((res) => {
        const ok = res?.ok === true
        if (ok && res?.data) {
          setRemoteVerified(true)
          setRemoteData(res.data)
        } else {
          setRemoteVerified(false)
        }
      })
      .catch(() => {
        verifyCertificatePublic(verifyId)
          .then((data) => {
            if (data) {
              setRemoteVerified(true)
              setRemoteData(data)
            } else {
              setRemoteVerified(false)
            }
          })
          .catch((e) => {
            setRemoteError(e?.message ?? 'No se pudo verificar con Supabase.')
          })
      })
  }, [verifyId])

  const eligible = useMemo(() => isCertificateEligible({ progress, levels, minPct: 60 }), [progress, levels])
  const verified = useMemo(() => {
    if (!verifyId) return null
    if (remoteVerified === true) return true
    if (remoteVerified === false) return false
    if (!certificate) return false
    return certificate.id === verifyId
  }, [verifyId, certificate, remoteVerified])

  async function issue() {
    const name = displayName.trim()
    if (!name) return
    setIssuing(true)
    saveProfile({ displayName: name })
    try {
      const record = await issueCertificate({ displayName: name, progress, levels, public: makePublic })
      setCertificate(record)
      trackEvent('certificate_issued', { id: record.id })

      if (supabase) {
        const res = await issueCertificateEdge({
          certificateId: record.id,
          issuedAt: record.issuedAt,
          displayName: record.displayName,
          courseVersion: record.courseVersion,
          scores: record.scores,
          signature: record.signature,
          public: record.public === true,
        })
        if (res?.ok !== true) throw new Error('No se pudo guardar el certificado en Supabase.')
        setShareMsg('Certificado guardado en Supabase. El link ya es validable.')
      } else {
        setShareMsg('Supabase no está configurado. El certificado se guardó localmente.')
      }

      try {
        if (supabase) {
          const deviceId = getDeviceId()
          const payload = {
            deviceId,
            profile: { displayName: loadProfile().displayName },
            progress: loadAllProgress(),
            certificateId: record.id,
            events: loadEvents().slice(0, 500),
          }
          await syncDeviceEdge(payload)
        }
      } catch (e) {
        trackEvent('device_sync_failed', { error: e?.message ?? 'unknown' })
      }
    } finally {
      setIssuing(false)
    }
  }

  const shareUrl = useMemo(() => {
    if (!certificate?.id) return ''
    if (typeof window === 'undefined') return `?verify=${certificate.id}`
    return `${window.location.origin}/?verify=${certificate.id}`
  }, [certificate?.id])

  const verifyLink = useMemo(() => {
    if (!verifyId) return ''
    if (typeof window === 'undefined') return `?verify=${verifyId}`
    return `${window.location.origin}/?verify=${verifyId}`
  }, [verifyId])

  const linkedinShareUrl = useMemo(() => {
    if (!shareUrl) return ''
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
  }, [shareUrl])

  const linkedinVerifyShareUrl = useMemo(() => {
    if (!verifyLink) return ''
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyLink)}`
  }, [verifyLink])

  async function copyToClipboard(text) {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setShareMsg('Link copiado.')
    } catch {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setShareMsg('Link copiado.')
    }
  }

  async function publishToSupabase() {
    if (!certificate?.id) return
    if (!supabase) {
      setShareMsg('Supabase no está configurado.')
      return
    }
    setPublishing(true)
    setShareMsg('')
    try {
      const res = await issueCertificateEdge({
        certificateId: certificate.id,
        issuedAt: certificate.issuedAt,
        displayName: certificate.displayName,
        courseVersion: certificate.courseVersion,
        scores: certificate.scores,
        signature: certificate.signature,
        public: certificate.public === true,
      })
      if (res?.ok !== true) throw new Error('No se pudo guardar el certificado en Supabase.')
      saveCertificate(certificate)
      setShareMsg('Certificado guardado en Supabase. El link ya es validable.')
      trackEvent('certificate_publish')
    } catch (e) {
      setShareMsg(e?.message ?? 'No se pudo guardar en Supabase.')
    } finally {
      setPublishing(false)
    }
  }

  const keyLearnings = [
    {
      badge: 'NIVEL 1',
      title: 'Fundamentos HTTP',
      text: 'Cómo modelar requests/responses con métodos, status codes, headers y JSON de forma clara y consistente.',
    },
    {
      badge: 'NIVEL 2',
      title: 'APIs robustas',
      text: 'Autenticación, resiliencia y operación: OAuth, rate limiting, idempotencia, webhooks y versionamiento sin romper clientes.',
    },
    {
      badge: 'NIVEL 3',
      title: 'Diseño senior',
      text: 'Diseño profesional y arquitectura: patrones, seguridad, performance, contratos (OpenAPI) y sistemas distribuidos.',
    },
  ]

  return (
    <div className="print-certificate min-h-screen bg-zinc-950">
      <Container className="py-10">
        <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold tracking-widest text-zinc-500">CERTIFICADO</div>
            <div className="mt-1 text-2xl font-black text-zinc-100">API Academy</div>
            <div className="mt-1 text-sm text-zinc-400">Listo para imprimir / guardar como PDF</div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onBack}>← Volver</Button>
            <Button
              onClick={() => {
                trackEvent('certificate_print')
                window.print()
              }}
              disabled={!certificate}
            >
              Descargar PDF
            </Button>
          </div>
        </div>

        {verifyId && (
          <Card className="no-print mb-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold text-zinc-100">Verificación</div>
                <div className="mt-1 text-sm text-zinc-400">ID: <span className="font-mono text-zinc-200">{verifyId}</span></div>
                {remoteError && <div className="mt-1 text-xs text-zinc-500">{remoteError}</div>}
                {remoteData && (
                  <div className="mt-2 text-xs text-zinc-500">
                    {remoteData.displayName ? `Nombre: ${remoteData.displayName} · ` : ''}
                    {remoteData.issuedAt ? `Fecha: ${formatDate(remoteData.issuedAt)}` : ''}
                  </div>
                )}
              </div>
              <Badge color={verified ? 'emerald' : 'red'}>{verified ? 'VÁLIDO' : 'NO ENCONTRADO'}</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => copyToClipboard(verifyLink)}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm font-bold text-zinc-200 transition-colors hover:bg-zinc-900"
              >
                Copiar link
              </button>
              <a
                href={linkedinVerifyShareUrl || '#'}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackEvent('share_linkedin')}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-500 px-4 text-sm font-bold text-white transition-colors hover:bg-indigo-400"
              >
                Compartir en LinkedIn
              </a>
            </div>
          </Card>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="no-print p-6">
            <div className="text-sm font-extrabold text-zinc-100">Datos del alumno</div>
            <div className="mt-3">
              <label className="mb-2 block text-xs font-bold tracking-widest text-zinc-500">NOMBRE</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tu nombre y apellido"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
              />
              <div className="mt-2 text-xs text-zinc-500">
                Se guarda localmente en tu navegador.
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-xs font-bold tracking-widest text-zinc-500">REQUISITOS</div>
              <div className="mt-2 grid gap-2 text-sm text-zinc-400">
                {levels.map((l) => {
                  const visited = Array.isArray(progress?.[l.hash]?.visited) ? progress[l.hash].visited.length : 0
                  const best = progress?.[l.hash]?.quiz?.bestPct ?? 0
                  const ok = visited >= l.lessonCount && best >= 60
                  return (
                    <div key={l.hash} className="flex items-center justify-between">
                      <span>{l.title}</span>
                      <span className={ok ? 'text-emerald-300' : 'text-zinc-500'}>
                        {visited}/{l.lessonCount} · best {best}% {ok ? '✅' : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-xs font-bold tracking-widest text-zinc-500">VERIFICACIÓN PÚBLICA</div>
              <label className="mt-3 flex cursor-pointer items-center gap-3 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={makePublic}
                  onChange={(e) => setMakePublic(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-indigo-500"
                />
                Hacer público este certificado (para validar con link)
              </label>
              <div className="mt-2 text-xs text-zinc-600">
                Si está activo, el certificado se puede verificar con su ID.
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-xs font-bold tracking-widest text-zinc-500">LINK PARA VALIDAR / COMPARTIR</div>
              {certificate?.id ? (
                <div className="mt-3">
                  <div className="mb-2 text-xs text-zinc-500">
                    Este es el link que podés poner en LinkedIn. Abrelo en incógnito para validar que se vea como “VÁLIDO”.
                  </div>
                  <input
                    readOnly
                    value={shareUrl}
                    className="h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 font-mono text-xs text-zinc-200 outline-none"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => copyToClipboard(shareUrl)}>
                      Copiar link
                    </Button>
                    <a
                      href={linkedinShareUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => trackEvent('share_linkedin')}
                      className="inline-flex h-10 items-center justify-center rounded-xl bg-indigo-500 px-4 text-sm font-bold text-white transition-colors hover:bg-indigo-400"
                    >
                      Compartir en LinkedIn
                    </a>
                    <Button variant="ghost" onClick={() => window.open(shareUrl, '_blank', 'noreferrer')}>
                      Abrir
                    </Button>
                    <Button variant="ghost" onClick={publishToSupabase} disabled={publishing || !makePublic}>
                      {publishing ? 'Guardando...' : 'Reintentar guardado'}
                    </Button>
                  </div>
                  {shareMsg && <div className="mt-3 text-xs text-zinc-500">{shareMsg}</div>}
                  {!makePublic && (
                    <div className="mt-2 text-xs text-zinc-600">
                      Activá “Hacer público” y re-emití el certificado para que el link sea validable.
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-2 text-sm text-zinc-500">
                  Emití el certificado para generar el link público.
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={issue} disabled={!eligible || issuing || !displayName.trim()}>
                {certificate ? 'Re-emitir certificado' : 'Emitir certificado'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  saveProfile({ displayName: displayName.trim() })
                  trackEvent('profile_saved')
                }}
                disabled={!displayName.trim()}
              >
                Guardar nombre
              </Button>
            </div>

            {!eligible && (
              <div className="mt-3 text-sm text-zinc-500">
                Completá los 3 niveles y alcanzá 60%+ en cada quiz para emitir.
              </div>
            )}
          </Card>

          <Card className="border-0 bg-transparent p-0">
            <div className="no-print border-b border-zinc-800 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-extrabold text-zinc-100">Vista previa</div>
                {certificate ? <Badge color="emerald">LISTO</Badge> : <Badge color="zinc">PENDIENTE</Badge>}
              </div>
              <div className="mt-1 text-xs text-zinc-500">Imprimir → Guardar como PDF</div>
            </div>
            <div className="certificate-preview-only certificate-page">
              <div className="certificate-preview-frame">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500 via-sky-400 to-emerald-500 opacity-85" />
                <div className="pointer-events-none absolute inset-0 opacity-70 mix-blend-overlay [background:radial-gradient(60rem_60rem_at_20%_10%,rgba(255,255,255,0.25),transparent_55%),radial-gradient(50rem_50rem_at_80%_90%,rgba(255,255,255,0.20),transparent_55%)]" />
                <div className="pointer-events-none absolute -right-28 -top-28 h-96 w-96 rounded-full bg-white/25 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-36 -left-36 h-[28rem] w-[28rem] rounded-full bg-white/15 blur-3xl" />

                <div className="certificate-preview-canvas">
                  <CertificateContent
                    certificate={certificate}
                    displayName={displayName}
                    progress={progress}
                    levels={levels}
                    keyLearnings={keyLearnings}
                    preferDraftName
                  />
                </div>
              </div>
            </div>

            <div className="print-only certificate-page">
              <div className="certificate-print-frame">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500 via-sky-400 to-emerald-500 opacity-85" />
                <div className="pointer-events-none absolute inset-0 opacity-70 mix-blend-overlay [background:radial-gradient(60rem_60rem_at_20%_10%,rgba(255,255,255,0.25),transparent_55%),radial-gradient(50rem_50rem_at_80%_90%,rgba(255,255,255,0.20),transparent_55%)]" />
                <div className="pointer-events-none absolute -right-28 -top-28 h-96 w-96 rounded-full bg-white/25 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-36 -left-36 h-[28rem] w-[28rem] rounded-full bg-white/15 blur-3xl" />

                <div className="certificate-print-canvas">
                  <CertificateContent
                    certificate={certificate}
                    displayName={displayName}
                    progress={progress}
                    levels={levels}
                    keyLearnings={keyLearnings}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Container>
    </div>
  )
}
