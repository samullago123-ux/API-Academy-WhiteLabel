import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, Container } from '../components/ui.jsx'
import { trackEvent } from '../services/analytics.js'
import { issueCertificate, isCertificateEligible, loadCertificate } from '../services/certificateStore.js'
import { loadProfile, saveProfile } from '../services/profileStore.js'
import { supabase } from '../services/supabaseClient.js'
import { verifyCertificatePublic } from '../services/supabaseSync.js'
import { verifyCertificateEdge } from '../services/edgeFunctions.js'

function formatDate(ts) {
  if (!ts) return 'n/a'
  try {
    return new Date(ts).toLocaleDateString('es-ES')
  } catch {
    return 'n/a'
  }
}

export default function CertificateView({ progress, levels, onBack, verifyId }) {
  const [displayName, setDisplayName] = useState(() => loadProfile().displayName)
  const [certificate, setCertificate] = useState(() => loadCertificate())
  const [issuing, setIssuing] = useState(false)
  const [makePublic, setMakePublic] = useState(() => (certificate?.public ?? true) === true)
  const [remoteVerified, setRemoteVerified] = useState(null)
  const [remoteData, setRemoteData] = useState(null)
  const [remoteError, setRemoteError] = useState('')

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
    } finally {
      setIssuing(false)
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

          <Card className="p-0">
            <div className="border-b border-zinc-800 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-extrabold text-zinc-100">Vista previa</div>
                {certificate ? <Badge color="emerald">LISTO</Badge> : <Badge color="zinc">PENDIENTE</Badge>}
              </div>
              <div className="mt-1 text-xs text-zinc-500">Imprimir → Guardar como PDF</div>
            </div>
            <div className="certificate-page px-8 py-10">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-bold tracking-widest text-zinc-500">CERTIFICADO DE FINALIZACIÓN</div>
                  <div className="text-2xl">🏆</div>
                </div>
                <div className="mt-3 text-3xl font-black text-zinc-100">API Academy</div>
                <div className="mt-2 text-sm text-zinc-400">
                  Se certifica que
                </div>
                <div className="mt-2 text-2xl font-extrabold text-zinc-100">
                  {certificate?.displayName || displayName.trim() || '—'}
                </div>
                <div className="mt-2 text-sm text-zinc-400">
                  completó satisfactoriamente el programa de aprendizaje.
                </div>

                <div className="mt-6 grid gap-2 sm:grid-cols-3">
                  {levels.map((l) => (
                    <div key={l.hash} className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
                      <div className="text-[11px] font-bold tracking-widest text-zinc-500">{l.badge}</div>
                      <div className="mt-1 text-sm font-bold text-zinc-100">{l.title}</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        Best quiz: {certificate?.scores?.[l.hash]?.bestPct ?? progress?.[l.hash]?.quiz?.bestPct ?? 0}%
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-zinc-800 pt-5">
                  <div>
                    <div className="text-xs text-zinc-500">Fecha</div>
                    <div className="text-sm font-bold text-zinc-200">{formatDate(certificate?.issuedAt ?? Date.now())}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-zinc-500">Código</div>
                    <div className="font-mono text-xs font-bold text-zinc-200">{certificate?.id ?? '—'}</div>
                    <div className="mt-1 text-[11px] text-zinc-600">
                      Verificar: <span className="font-mono">/#verify={certificate?.id ?? '...'}</span>
                    </div>
                  </div>
                </div>

                {certificate?.signature && (
                  <div className="mt-4 text-[11px] text-zinc-600">
                    Firma: <span className="font-mono">{certificate.signature.slice(0, 24)}…</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </Container>
    </div>
  )
}
