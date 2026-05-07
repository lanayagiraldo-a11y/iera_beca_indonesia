import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { TEAM } from '../lib/team'
import { stageLabel, ARABIC_LEVELS, PRIORITY_CRITERIA } from '../lib/constants'

export default function BiuDocument() {
  const { id } = useParams()
  const [candidate, setCandidate] = useState(null)
  const [documents, setDocuments] = useState([])
  const [evaluation, setEvaluation] = useState(null)
  const [directorDecisions, setDirectorDecisions] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('candidates').select('*, countries(name, code, embassy_location)').eq('id', id).single(),
      supabase.from('documents').select('*').eq('candidate_id', id),
      supabase.from('evaluations').select('*').eq('candidate_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('director_decisions').select('*').eq('candidate_id', id).order('decided_at', { ascending: false }),
      supabase.from('stages_history').select('*').eq('candidate_id', id).order('changed_at', { ascending: true })
    ]).then(([c, d, e, dd, h]) => {
      setCandidate(c.data)
      setDocuments(d.data || [])
      setEvaluation(e.data)
      setDirectorDecisions(dd.data || [])
      setHistory(h.data || [])
      setLoading(false)
    })
  }, [id])

  if (loading) return <div className="text-center py-12 text-slate-400">Loading...</div>
  if (!candidate) return <div>Candidate not found</div>

  const age = candidate.birth_date
    ? Math.floor((new Date() - new Date(candidate.birth_date)) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  const validatedDocs = documents.filter((d) => d.status === 'valid')
  const arabicLevel = ARABIC_LEVELS.find((l) => l.value === candidate.arabic_level)?.label || candidate.arabic_level
  const priorityActive = PRIORITY_CRITERIA.filter((c) => candidate[c.key])
  const priorityBonus = priorityActive.reduce((sum, c) => sum + c.points, 0)
  const latestDirectorDecision = directorDecisions[0]

  return (
    <div className="biu-document-wrapper bg-slate-100 min-h-screen py-6 print:bg-white print:py-0">
      {/* Toolbar (no se imprime) */}
      <div className="max-w-[210mm] mx-auto mb-4 px-4 print:hidden">
        <div className="bg-white border border-slate-200 rounded-lg p-3 flex justify-between items-center">
          <Link to={`/candidatos/${id}`} className="text-sm text-slate-600 hover:text-iera-700">
            ← Volver al candidato
          </Link>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="bg-iera-500 hover:bg-iera-700 text-white font-bold px-5 py-2 rounded-lg text-sm"
            >
              🖨 Imprimir / Guardar PDF
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2 px-1">
          💡 Al imprimir, elige <strong>"Guardar como PDF"</strong> en el destino para descargar el documento.
          Los menús laterales y este aviso no aparecerán en el archivo final.
        </p>
      </div>

      {/* DOCUMENTO A4 */}
      <div className="biu-doc-page max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none p-12 text-sm">
        {/* HEADER */}
        <div className="flex justify-between items-start pb-4 border-b-4 border-iera-500">
          <div>
            <img src="/iera-logo.png" alt="iERA" className="h-12 mb-1" />
            <div className="text-[10px] text-slate-600 italic">Islamic Education and Research Academy</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Document ID</div>
            <div className="text-[11px] font-mono text-slate-700">{id.split('-')[0].toUpperCase()}</div>
            <div className="text-[10px] text-slate-500 mt-1">
              Generated: {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* TITLE */}
        <div className="text-center my-6">
          <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">Confidential</div>
          <h1 className="text-2xl font-extrabold mt-1">Candidate Information for BIU</h1>
          <div className="text-sm text-slate-700 mt-1">
            Dawah Pioneers Program · Indonesia 2026
          </div>
          <div className="text-xs italic text-slate-600 mt-2">
            Información de candidato para Bonyan International University
          </div>
        </div>

        {/* CANDIDATE PHOTO + NAME */}
        <div className="bg-iera-50 rounded-lg p-4 mb-5 border border-iera-200">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-iera-700 text-white flex items-center justify-center font-extrabold text-2xl flex-shrink-0">
              {candidate.full_name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')}
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-iera-900">{candidate.full_name}</h2>
              <div className="text-sm text-slate-700 mt-1">
                {candidate.countries?.name} · {candidate.email} · {candidate.whatsapp}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Current stage / Etapa actual: <strong>{stageLabel(candidate.current_stage)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1: PERSONAL INFO */}
        <Section number="1" title="Personal Information / Información personal">
          <Grid cols={2}>
            <Field label="Full name (as in passport)" labelEs="Nombre completo (como en pasaporte)" value={candidate.full_name} />
            <Field label="Date of birth" labelEs="Fecha de nacimiento" value={candidate.birth_date} />
            <Field label="Age" labelEs="Edad" value={age ? `${age} years` : '—'} />
            <Field label="Email" labelEs="Email" value={candidate.email} />
            <Field label="WhatsApp" labelEs="WhatsApp" value={candidate.whatsapp} />
            <Field label="Phone" labelEs="Teléfono" value={candidate.phone} />
            <Field label="Country of residence" labelEs="País de residencia" value={candidate.countries?.name} />
            <Field label="City" labelEs="Ciudad" value={candidate.city} />
            <Field label="Occupation" labelEs="Ocupación" value={candidate.occupation} />
            <Field label="Education level" labelEs="Nivel de estudios" value={candidate.education_level} />
          </Grid>
        </Section>

        {/* SECTION 2: PASSPORT */}
        <Section number="2" title="Passport Information / Pasaporte">
          <Grid cols={3}>
            <Field label="Passport number" labelEs="Número" value={candidate.passport_number} />
            <Field label="Expiry date" labelEs="Vencimiento" value={candidate.passport_expiry} />
            <Field label="Issuing country" labelEs="País emisor" value={candidate.passport_country} />
          </Grid>
          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800">
            <strong>Visa application:</strong> B211A E-Visa · Embassy: {candidate.countries?.embassy_location}
          </div>
        </Section>

        {/* SECTION 3: ISLAMIC PROFILE */}
        <Section number="3" title="Islamic Profile / Perfil islámico">
          <Grid cols={2}>
            <Field label="Reference Sheikh" labelEs="Sheikh de referencia" value={candidate.sheikh_reference_name} />
            <Field label="Sheikh contact" labelEs="Contacto sheikh" value={candidate.sheikh_reference_contact} />
            <Field label="Islamic center" labelEs="Centro islámico" value={candidate.islamic_center_name} />
            <Field label="Arabic level" labelEs="Nivel de árabe" value={arabicLevel} />
            <Field label="Other languages" labelEs="Otros idiomas" value={candidate.other_languages} fullWidth />
          </Grid>
          {(candidate.islamic_courses || []).length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-bold text-slate-700 mb-1.5">
                Islamic courses completed / Cursos completados:
              </div>
              <ul className="text-xs space-y-1">
                {candidate.islamic_courses.map((c, i) => (
                  <li key={i} className="pl-3 border-l-2 border-iera-300">
                    <strong>{c.name}</strong>{c.institution && ` — ${c.institution}`}{c.date && ` (${c.date})`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>

        {/* SECTION 4: MOTIVATION */}
        <Section number="4" title="Motivation / Motivación">
          <FieldBlock label="Why do you want to participate?" labelEs="¿Por qué deseas participar?" value={candidate.motivation_text} />
          {candidate.dawah_activities_current && (
            <FieldBlock label="Current dawah activities" labelEs="Actividades de dawah actuales" value={candidate.dawah_activities_current} />
          )}
        </Section>

        {/* SECTION 5: EVALUATION */}
        {evaluation && (
          <Section number="5" title="Manager Evaluation / Evaluación del Gerente">
            <div className="bg-iera-50 rounded p-3 mb-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Total Score</div>
                  <div className="text-2xl font-extrabold text-iera-700">
                    {evaluation.total_score}<span className="text-sm text-slate-400">/100</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Priority Bonus</div>
                  <div className="text-2xl font-extrabold text-iera-700">+{priorityBonus}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Final</div>
                  <div className="text-2xl font-extrabold text-iera-700">{evaluation.total_score + priorityBonus}</div>
                </div>
              </div>
            </div>
            <Grid cols={2}>
              <Field label="Score breakdown" labelEs="Detalle del score">
                <ul className="text-[11px] space-y-0.5 mt-1">
                  <li>Islamic Knowledge: {(evaluation.knowledge_pillars || 0) + (evaluation.knowledge_purification || 0) + (evaluation.knowledge_quran || 0) + (evaluation.knowledge_seerah || 0)}/30</li>
                  <li>Personal Profile: {(evaluation.personal_character || 0) + (evaluation.personal_stability || 0) + (evaluation.personal_adaptation || 0)}/25</li>
                  <li>Motivation: {(evaluation.motivation_clarity || 0) + (evaluation.motivation_experience || 0) + (evaluation.motivation_vision || 0)}/25</li>
                  <li>Requirements: {(evaluation.requirements_docs || 0) + (evaluation.requirements_availability || 0)}/20</li>
                </ul>
              </Field>
              <Field label="Manager Recommendation" labelEs="Recomendación del Gerente" value={
                evaluation.recommendation === 'selected' ? '✓ Selected' :
                evaluation.recommendation === 'waitlist' ? '⏱ Waitlist' :
                evaluation.recommendation === 'rejected' ? '✗ Rejected' : '—'
              } />
            </Grid>
            {priorityActive.length > 0 && (
              <div className="mt-3">
                <div className="text-xs font-bold text-slate-700 mb-1">Priority criteria met:</div>
                <div className="flex flex-wrap gap-1">
                  {priorityActive.map((c) => (
                    <span key={c.key} className="text-[10px] bg-iera-100 text-iera-700 px-1.5 py-0.5 rounded font-semibold">
                      {c.label} (+{c.points})
                    </span>
                  ))}
                </div>
              </div>
            )}
            {evaluation.comments && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="text-xs font-bold text-slate-700 mb-1">Manager comments:</div>
                <p className="text-xs text-slate-700 italic">"{evaluation.comments}"</p>
              </div>
            )}
          </Section>
        )}

        {/* SECTION 6: DIRECTOR DECISION */}
        {latestDirectorDecision && (
          <Section number="6" title="Director Continental Decision / Decisión del Director">
            <div className={`p-3 rounded border-2 ${
              latestDirectorDecision.decision === 'approved' ? 'bg-green-50 border-green-300' :
              latestDirectorDecision.decision === 'waitlist' ? 'bg-amber-50 border-amber-300' :
              'bg-red-50 border-red-300'
            }`}>
              <div className="text-xs font-bold mb-1">
                {latestDirectorDecision.decision === 'approved' && '✓ APPROVED / APROBADO'}
                {latestDirectorDecision.decision === 'waitlist' && '⏱ WAITLIST / LISTA DE ESPERA'}
                {latestDirectorDecision.decision === 'rejected' && '✗ REJECTED / RECHAZADO'}
              </div>
              <div className="text-[11px] text-slate-700">
                Decided by <strong>{latestDirectorDecision.director_name}</strong> on{' '}
                {new Date(latestDirectorDecision.decided_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
              {latestDirectorDecision.notes && (
                <p className="text-xs text-slate-700 italic mt-2">"{latestDirectorDecision.notes}"</p>
              )}
            </div>
          </Section>
        )}

        {/* SECTION 7: VALIDATED DOCUMENTS */}
        <Section number="7" title="Validated Documents / Documentos validados">
          <div className="grid grid-cols-2 gap-2">
            {[
              { type: 'passport', label: 'Passport copy / Copia de pasaporte' },
              { type: 'tazkiyah', label: 'Tazkiyah letter / Carta Tazkiyah' },
              { type: 'background_check', label: 'Background check / Antecedentes penales' },
              { type: 'availability_decl', label: 'Availability declaration / Declaración disponibilidad' },
              { type: 'photo', label: 'Passport photo / Foto pasaporte' }
            ].map((d) => {
              const isValid = validatedDocs.some((doc) => doc.type === d.type)
              return (
                <div
                  key={d.type}
                  className={`text-xs flex items-center gap-2 p-2 rounded ${isValid ? 'bg-green-50 text-green-800' : 'bg-slate-50 text-slate-400'}`}
                >
                  <span>{isValid ? '✓' : '○'}</span>
                  <span>{d.label}</span>
                </div>
              )
            })}
          </div>
        </Section>

        {/* SECTION 8: EMERGENCY CONTACT */}
        <Section number="8" title="Emergency Contact / Contacto de emergencia">
          <Grid cols={3}>
            <Field label="Name" labelEs="Nombre" value={candidate.emergency_contact_name} />
            <Field label="Phone" labelEs="Teléfono" value={candidate.emergency_contact_phone} />
            <Field label="Relationship" labelEs="Relación" value={candidate.emergency_contact_relation} />
          </Grid>
        </Section>

        {/* SECTION 9: TIMELINE */}
        {history.length > 0 && (
          <Section number="9" title="Process Timeline / Cronología del proceso">
            <ul className="text-[11px] space-y-1">
              {history.map((h) => (
                <li key={h.id} className="flex justify-between pl-3 border-l-2 border-iera-300">
                  <span>
                    {h.from_stage ? `${stageLabel(h.from_stage)} → ` : '📝 '}
                    <strong>{stageLabel(h.to_stage)}</strong>
                  </span>
                  <span className="text-slate-500">
                    {new Date(h.changed_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* AUTHORIZATION */}
        <div className="mt-8 pt-6 border-t-2 border-slate-300">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-3">
            Authorization / Autorización
          </div>
          <p className="text-[11px] text-slate-600 mb-6 italic leading-relaxed">
            iERA — Islamic Education and Research Academy hereby submits this candidate's information to Bonyan International University
            for the purpose of issuing the Letter of Acceptance (LOA), Letter of Invitation (LOI), and processing the B211A visa application
            under the Dawah Pioneers Program 2026.
          </p>

          <div className="grid grid-cols-2 gap-8 mt-6">
            <div>
              <div className="border-b border-slate-400 mb-1 h-12"></div>
              <div className="text-xs font-bold">{TEAM.director_continental.name}</div>
              <div className="text-[10px] text-slate-600">{TEAM.director_continental.title}, iERA</div>
            </div>
            <div>
              <div className="border-b border-slate-400 mb-1 h-12"></div>
              <div className="text-xs font-bold">{TEAM.coordinador.name}</div>
              <div className="text-[10px] text-slate-600">{TEAM.coordinador.title}, iERA Dawah Pioneers</div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-10 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-500">
          iERA — Islamic Education and Research Academy · Confidential Internal Document
          <br />
          Document ID: {id} · Generated: {new Date().toISOString()}
        </div>
      </div>
    </div>
  )
}

function Section({ number, title, children }) {
  return (
    <div className="mb-5 break-inside-avoid">
      <div className="flex items-center gap-2 mb-2 pb-1 border-b-2 border-iera-200">
        <div className="w-6 h-6 rounded-full bg-iera-700 text-white text-xs font-bold flex items-center justify-center">
          {number}
        </div>
        <h3 className="text-sm font-bold text-iera-900">{title}</h3>
      </div>
      <div className="px-1">{children}</div>
    </div>
  )
}

function Grid({ cols = 2, children }) {
  return <div className={`grid grid-cols-${cols} gap-x-4 gap-y-2`}>{children}</div>
}

function Field({ label, labelEs, value, fullWidth, children }) {
  return (
    <div className={`text-xs ${fullWidth ? 'col-span-full' : ''}`}>
      <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
        {label}
        {labelEs && <span className="font-normal italic text-slate-400 normal-case ml-1">/ {labelEs}</span>}
      </div>
      {children || <div className="text-slate-800 mt-0.5">{value || <span className="text-slate-400 italic">—</span>}</div>}
    </div>
  )
}

function FieldBlock({ label, labelEs, value }) {
  return (
    <div className="mb-2">
      <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-1">
        {label}
        {labelEs && <span className="font-normal italic text-slate-400 normal-case ml-1">/ {labelEs}</span>}
      </div>
      <p className="text-xs text-slate-800 whitespace-pre-wrap">{value || <span className="text-slate-400 italic">—</span>}</p>
    </div>
  )
}
