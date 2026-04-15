import { useState } from 'react'
import { cn } from '../../../utils/cn.js'
import { toneFromHex } from '../../../utils/tone.js'

export default function OpenAPILesson() {
  const [activeSection, setActiveSection] = useState('spec')

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
        model: { type: string }`

  const benefits = [
    { icon: '📖', name: 'Documentación Auto', desc: 'Swagger UI / Redoc se generan automáticamente desde el spec. Siempre actualizada.', color: '#3b82f6' },
    { icon: '🛠️', name: 'SDK Generation', desc: 'openapi-generator crea clients en TypeScript, Python, Go, Java — automáticamente.', color: '#10b981' },
    { icon: '✅', name: 'Contract Testing', desc: 'Validás que tu API cumple el spec. Si cambiás algo, el test falla antes del deploy.', color: '#f59e0b' },
    { icon: '🔄', name: 'Mock Servers', desc: 'Generás un server mock desde el spec para que el frontend trabaje en paralelo.', color: '#a78bfa' },
    { icon: '🛡️', name: 'Request Validation', desc: 'Middleware que rechaza requests que no cumplen el schema. Cero inputs inválidos.', color: '#f472b6' },
    { icon: '📊', name: 'API Changelog', desc: 'Diff entre versiones del spec. Sabés exactamente qué cambió y si es breaking.', color: '#06b6d4' },
  ]

  return (
    <div>
      <p className="mb-5 text-sm leading-relaxed text-zinc-400">
        Una API sin documentación no existe. <strong className="text-zinc-100">OpenAPI</strong> (antes Swagger) es el estándar: describís tu API en YAML y todo lo demás se genera automáticamente.
      </p>

      <div className="mb-5 flex flex-wrap gap-2">
        {[{ id: 'spec', label: 'Spec Ejemplo' }, { id: 'benefits', label: '¿Por qué?' }, { id: 'workflow', label: 'Workflow' }].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveSection(t.id)}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
              activeSection === t.id ? 'bg-zinc-900 text-zinc-100 ring-1 ring-indigo-500/60' : 'text-zinc-500 hover:bg-zinc-900',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeSection === 'spec' && (
        <div className="max-h-[460px] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <pre className="m-0 whitespace-pre-wrap font-mono text-xs leading-relaxed text-zinc-400">
            {specExample}
          </pre>
        </div>
      )}

      {activeSection === 'benefits' && (
        <div className="grid gap-2 sm:grid-cols-2">
          {benefits.map((b) => (
            <div key={b.name} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-lg">{b.icon}</span>
                <span className={cn('text-sm font-bold', toneFromHex(b.color).text)}>{b.name}</span>
              </div>
              <div className="text-sm leading-relaxed text-zinc-400">{b.desc}</div>
            </div>
          ))}
        </div>
      )}

      {activeSection === 'workflow' && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
          <div className="mb-4 text-xs font-bold tracking-widest text-indigo-300">API-FIRST DEVELOPMENT WORKFLOW</div>
          {[
            { step: 1, title: 'Diseñar el spec OpenAPI', detail: 'Antes de escribir una línea de código, definís endpoints, schemas, y responses en YAML.', color: '#3b82f6' },
            { step: 2, title: 'Generar mock server', detail: 'El frontend empieza a trabajar contra el mock. Backend trabaja en paralelo.', color: '#10b981' },
            { step: 3, title: 'Implementar el backend', detail: 'Usás el spec como guía. Middleware valida que tus responses cumplan el contrato.', color: '#f59e0b' },
            { step: 4, title: 'Generar SDKs y docs', detail: 'openapi-generator crea clients tipados. Swagger UI genera docs interactivas.', color: '#a78bfa' },
            { step: 5, title: 'Contract testing en CI', detail: 'En cada PR, un test verifica que la implementación cumple el spec. Breaking changes se detectan automáticamente.', color: '#f472b6' },
          ].map((s) => (
            <div key={s.step} className="mb-4 flex items-start gap-3">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-black',
                  toneFromHex(s.color).bg,
                  toneFromHex(s.color).text,
                )}
              >
                {s.step}
              </div>
              <div>
                <div className="mb-1 text-sm font-bold text-zinc-100">{s.title}</div>
                <div className="text-sm leading-relaxed text-zinc-500">{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
