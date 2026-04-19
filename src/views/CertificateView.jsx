import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, Container } from '../components/ui.jsx'
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

function CertificateContent({ certificate, displayName, progress, levels, preferDraftName = false }) {
  const draftName = displayName.trim()
  const finalName = preferDraftName
    ? (draftName || certificate?.displayName || '—')
    : (certificate?.displayName || draftName || '—')

  const verifyUrl = (() => {
    if (!certificate?.id) return ''
    if (typeof window === 'undefined') return `?verify=${certificate.id}`
    return `${window.location.origin}/?verify=${certificate.id}`
  })()

  return (
    <div className="certificate-inner">
      {/* Geometric shapes */}
      <div className="cert-shape-tl" />
      <div className="cert-shape-br" />
      <div className="cert-shape-tr" />
      <div className="cert-shape-bl" />
      <div className="cert-gold-stripe-tl" />
      <div className="cert-gold-stripe-br" />

      {/* Gold border frame */}
      <div className="cert-frame-gold" />

      {/* Content */}
      <div className="cert-content">

        {/* Logo */}
        <div className="cert-logo">
          <span className="cert-logo-text">WL</span>
        </div>
        <div className="cert-academy">Whitelabel AI Academy</div>

        {/* Title */}
        <div className="cert-title">Certificate</div>
        <div className="cert-subtitle">of Completion</div>

        {/* Divider */}
        <div className="cert-divider">
          <div className="cert-divider-line" />
          <div className="cert-divider-diamond" />
          <div className="cert-divider-line" />
        </div>

        {/* Recipient */}
        <div className="cert-presented">This is proudly presented to</div>
        <div className="cert-name">{finalName}</div>
        <div className="cert-name-line" />

        {/* Description */}
        <p className="cert-desc">
          por completar satisfactoriamente el programa de aprendizaje
          de APIs y arquitectura, con evaluación por nivel.
        </p>

        {/* Levels */}
        <div className="cert-levels">
          {levels.map((l, idx) => {
            const score = certificate?.scores?.[l.hash]?.bestPct
              ?? progress?.[l.hash]?.quiz?.bestPct ?? 0
            const passed = score > 0
            return (
              <div key={l.hash} className={`cert-level ${passed ? 'cert-level-passed' : ''}`}>
                {passed && (
                  <div className="cert-level-check">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5L4.2 7.2L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
                <div className="cert-level-num">Nivel {idx + 1}</div>
                <div className="cert-level-title">{l.title}</div>
                <div className="cert-level-score" style={{
                  color: passed ? '#c6a344' : '#ccc',
                  fontWeight: passed ? 700 : 500,
                }}>{score}%</div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="cert-footer">
          <div className="cert-footer-col">
            <div className="cert-footer-line" />
            <div className="cert-footer-label">Fecha de emisión</div>
            <div className="cert-footer-val">
              {certificate?.issuedAt
                ? new Date(certificate.issuedAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
                : new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          {/* Seal */}
          <div className="cert-seal">
            <svg width="68" height="68" viewBox="0 0 68 68" fill="none">
              <g opacity="0.6">
                <line x1="34" y1="2" x2="34" y2="8" stroke="#c6a344" strokeWidth="1.5"/>
                <line x1="34" y1="60" x2="34" y2="66" stroke="#c6a344" strokeWidth="1.5"/>
                <line x1="2" y1="34" x2="8" y2="34" stroke="#c6a344" strokeWidth="1.5"/>
                <line x1="60" y1="34" x2="66" y2="34" stroke="#c6a344" strokeWidth="1.5"/>
                <line x1="10.6" y1="10.6" x2="14.8" y2="14.8" stroke="#c6a344" strokeWidth="1"/>
                <line x1="53.2" y1="53.2" x2="57.4" y2="57.4" stroke="#c6a344" strokeWidth="1"/>
                <line x1="57.4" y1="10.6" x2="53.2" y2="14.8" stroke="#c6a344" strokeWidth="1"/>
                <line x1="14.8" y1="53.2" x2="10.6" y2="57.4" stroke="#c6a344" strokeWidth="1"/>
              </g>
              <circle cx="34" cy="34" r="28" stroke="#c6a344" strokeWidth="2" fill="none"/>
              <circle cx="34" cy="34" r="23" stroke="#c6a344" strokeWidth="0.8" fill="none"/>
              <circle cx="34" cy="34" r="20" stroke="#0f1b3d" strokeWidth="0.5" fill="#0f1b3d"/>
              <text x="34" y="31" textAnchor="middle" fill="#c6a344"
                fontSize="7" fontWeight="700" fontFamily="Outfit, sans-serif" letterSpacing="1.5">VERIFIED</text>
              <text x="34" y="40" textAnchor="middle" fill="#c6a344"
                fontSize="5" fontWeight="400" fontFamily="Outfit, sans-serif" letterSpacing="1">WHITELABEL</text>
            </svg>
          </div>

          <div className="cert-footer-col">
            <div className="cert-footer-line" />
            <div className="cert-footer-label">ID Certificado</div>
            <div className="cert-footer-val cert-footer-id">{certificate?.id ?? '—'}</div>
          </div>
        </div>

        {verifyUrl && <div className="cert-verify-url">Verificación: {verifyUrl}</div>}
        {certificate?.signature && (
          <div className="cert-signature-text">Firma: {certificate.signature.slice(0, 18)}…</div>
        )}
        <div className="cert-brand">whitelabel.ai</div>

      </div>
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
            <div className="no-print certificate-page">
              <div className="certificate-screen-frame cert-frame">
                <div className="certificate-screen-canvas">
                  <CertificateContent
                    certificate={certificate}
                    displayName={displayName}
                    progress={progress}
                    levels={levels}
                    preferDraftName
                  />
                </div>
              </div>
            </div>

            <div className="print-only certificate-page">
              <div className="certificate-print-frame cert-frame">
                <div className="certificate-print-canvas">
                  <CertificateContent
                    certificate={certificate}
                    displayName={displayName}
                    progress={progress}
                    levels={levels}
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
