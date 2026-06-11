import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { stageLabel, ARABIC_LEVELS, PRIORITY_CRITERIA } from '../lib/constants'
import { DOCUMENT_TYPES, DOCUMENT_STATUS } from '../lib/documentTypes'

// Evaluation blocks — mirror of EvaluationForm so we can render the full breakdown
const EVAL_BLOCKS = [
  {
    title: '📖 Islamic Knowledge',
    max: 30,
    fields: [
      { key: 'knowledge_pillars',      label: 'Pillars of Islam and Faith',        max: 10 },
      { key: 'knowledge_purification', label: 'Purification and prayer',           max: 8 },
      { key: 'knowledge_quran',        label: 'Quran knowledge',                   max: 6 },
      { key: 'knowledge_seerah',       label: 'Prophet Muhammad (S.A.W.) history', max: 6 }
    ]
  },
  {
    title: '👤 Personal Profile',
    max: 25,
    fields: [
      { key: 'personal_character',  label: 'Character and reputation', max: 10 },
      { key: 'personal_stability',  label: 'Stability and maturity',   max: 8 },
      { key: 'personal_adaptation', label: 'Cultural adaptation',      max: 7 }
    ]
  },
  {
    title: '🎯 Dawah Motivation',
    max: 25,
    fields: [
      { key: 'motivation_clarity',    label: 'Clarity of purpose',        max: 10 },
      { key: 'motivation_experience', label: 'Previous dawah experience', max: 8 },
      { key: 'motivation_vision',     label: 'Future impact vision',      max: 7 }
    ]
  },
  {
    title: '✅ Mandatory Requirements',
    max: 20,
    fields: [
      { key: 'requirements_docs',         label: 'Complete documentation', max: 10 },
      { key: 'requirements_availability', label: 'Confirmed availability', max: 10 }
    ]
  }
]

const FEELING_LABELS = { 5: '😄 Very good', 4: '🙂 Good', 3: '😐 OK', 2: '😟 Hard', 1: '😢 Very hard' }

export default function CandidateExport() {
  const { id } = useParams()
  const [candidate, setCandidate] = useState(null)
  const [documents, setDocuments] = useState([])
  const [evaluation, setEvaluation] = useState(null)
  const [directorDecisions, setDirectorDecisions] = useState([])
  const [history, setHistory] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('candidates').select('*, countries(name, code, embassy_location)').eq('id', id).single(),
      supabase.from('documents').select('*').eq('candidate_id', id).order('uploaded_at', { ascending: false }),
      supabase.from('evaluations').select('*').eq('candidate_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('director_decisions').select('*').eq('candidate_id', id).order('decided_at', { ascending: false }),
      supabase.from('stages_history').select('*').eq('candidate_id', id).order('changed_at', { ascending: true }),
      supabase.from('student_reports').select('*').eq('candidate_id', id).order('submitted_at', { ascending: false })
    ]).then(([c, d, e, dd, h, r]) => {
      setCandidate(c.data)
      setDocuments(d.data || [])
      setEvaluation(e.data)
      setDirectorDecisions(dd.data || [])
      setHistory(h.data || [])
      setReports(r.data || [])
      setLoading(false)
    })
  }, [id])

  if (loading) return <div className="text-center py-12 text-slate-400">Loading...</div>
  if (!candidate) return <div>Candidate not found</div>

  const age = candidate.birth_date
    ? Math.floor((new Date() - new Date(candidate.birth_date)) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  const arabicLevel = ARABIC_LEVELS.find((l) => l.value === candidate.arabic_level)?.label || candidate.arabic_level
  const priorityActive = PRIORITY_CRITERIA.filter((c) => candidate[c.key])
  const priorityBonus = priorityActive.reduce((sum, c) => sum + c.points, 0)
  const latestDirectorDecision = directorDecisions[0]

  // Documents indexed by type (latest per type)
  const docByType = {}
  for (const doc of documents) {
    if (!docByType[doc.type]) docByType[doc.type] = doc
  }
  const requiredDocs = DOCUMENT_TYPES.filter((d) => d.required)
  const validCount = requiredDocs.filter((r) => docByType[r.type]?.status === 'valid').length

  const blockTotal = (block) => block.fields.reduce((sum, f) => sum + (evaluation?.[f.key] || 0), 0)
  const evalTotal = evaluation
    ? EVAL_BLOCKS.reduce((sum, b) => sum + blockTotal(b), 0)
    : null

  return (
    <div className="export-wrapper bg-slate-100 min-h-screen py-6 print:bg-white print:py-0">
      {/* Toolbar (not printed) */}
      <div className="max-w-[210mm] mx-auto mb-4 px-4 print:hidden">
        <div className="bg-white border border-slate-200 rounded-lg p-3 flex justify-between items-center">
          <Link to={`/candidatos/${id}`} className="text-sm text-slate-600 hover:text-iera-700">
            ← Back to candidate
          </Link>
          <button
            onClick={() => window.print()}
            className="bg-iera-500 hover:bg-iera-700 text-white font-bold px-5 py-2 rounded-lg text-sm"
          >
            🖨 Print / Save as PDF
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2 px-1">
          💡 When printing, choose <strong>"Save as PDF"</strong> as the destination to download the file.
          The sidebar and this notice will not appear in the final document.
        </p>
      </div>

      {/* A4 DOCUMENT */}
      <div className="export-doc-page max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none p-12 text-sm">
        {/* HEADER */}
        <div className="flex justify-between items-start pb-4 border-b-4 border-iera-500">
          <div>
            <img src="/iera-logo.png" alt="iERA" className="h-12 mb-1" />
            <div className="text-[10px] text-slate-600 italic">Islamic Education and Research Academy</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Candidate ID</div>
            <div className="text-[11px] font-mono text-slate-700">{id.split('-')[0].toUpperCase()}</div>
            <div className="text-[10px] text-slate-500 mt-1">
              Generated: {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* TITLE */}
        <div className="text-center my-6">
          <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">Confidential · Internal</div>
          <h1 className="text-2xl font-extrabold mt-1">Candidate Full Dossier</h1>
          <div className="text-sm text-slate-700 mt-1">Dawah Pioneers Program · Indonesia 2026</div>
        </div>

        {/* CANDIDATE HEADER */}
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
                Current stage: <strong>{stageLabel(candidate.current_stage)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1: OVERVIEW */}
        <Section number="1" title="Overview">
          <div className="grid grid-cols-3 gap-3 text-center">
            <KPI label="Valid documents" value={`${validCount} / ${requiredDocs.length}`} />
            <KPI label="Evaluation score" value={evalTotal != null ? `${evalTotal} / 100` : '—'} />
            <KPI label="Priority bonus" value={`+${priorityBonus} pts`} />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
            <Field label="Current stage" value={stageLabel(candidate.current_stage)} />
            <Field label="Final score (eval + bonus)" value={evalTotal != null ? evalTotal + priorityBonus : '—'} />
            <Field label="Country" value={candidate.countries?.name} />
            <Field label="City" value={candidate.city} />
            <Field label="Passport number" value={candidate.passport_number} />
            <Field label="Passport expiry" value={candidate.passport_expiry} />
          </div>
        </Section>

        {/* SECTION 2: INFORMATION */}
        <Section number="2" title="Information">
          <SubTitle>Personal data</SubTitle>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <Field label="Full name" value={candidate.full_name} />
            <Field label="Date of birth" value={candidate.birth_date} />
            <Field label="Age" value={age ? `${age} years` : '—'} />
            <Field label="Email" value={candidate.email} />
            <Field label="WhatsApp" value={candidate.whatsapp} />
            <Field label="Phone" value={candidate.phone} />
            <Field label="Occupation" value={candidate.occupation} />
            <Field label="Education level" value={candidate.education_level} />
          </div>

          <SubTitle>Passport</SubTitle>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <Field label="Number" value={candidate.passport_number} />
            <Field label="Expiry" value={candidate.passport_expiry} />
            <Field label="Issuing country" value={candidate.passport_country} />
            <Field label="Indonesian embassy" value={candidate.countries?.embassy_location} />
          </div>

          <SubTitle>Islamic profile</SubTitle>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <Field
              label="Muslim status"
              value={
                candidate.muslim_status === 'born_muslim' ? 'Born Muslim' :
                candidate.muslim_status === 'new_muslim' ?
                  `New Muslim${candidate.conversion_month ? ` (since ${candidate.conversion_month})` : ''}` : null
              }
            />
            <Field label="Reference Sheikh" value={candidate.sheikh_reference_name} />
            <Field label="Sheikh contact" value={candidate.sheikh_reference_contact} />
            <Field label="Islamic center" value={candidate.islamic_center_name} />
            <Field label="Arabic level" value={arabicLevel} />
            <Field label="Other languages" value={candidate.other_languages} />
          </div>
          {(candidate.islamic_courses || []).length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-bold text-slate-700 mb-1.5">Islamic courses completed:</div>
              <ul className="text-xs space-y-1">
                {candidate.islamic_courses.map((c, i) => (
                  <li key={i} className="pl-3 border-l-2 border-iera-300">
                    <strong>{c.name}</strong>{c.institution && ` — ${c.institution}`}{c.date && ` (${c.date})`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <SubTitle>Emergency contact</SubTitle>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <Field label="Name" value={candidate.emergency_contact_name} />
            <Field
              label="Phone"
              value={candidate.emergency_contact_phone
                ? `${candidate.emergency_contact_country_code || ''} ${candidate.emergency_contact_phone}` : null}
            />
            <Field label="Relationship" value={candidate.emergency_contact_relation} />
          </div>

          <SubTitle>Motivation and experience</SubTitle>
          <FieldBlock label="Why do you want to participate?" value={candidate.motivation_text} />
          {candidate.dawah_activities_current && (
            <FieldBlock label="Current dawah activities" value={candidate.dawah_activities_current} />
          )}

          <SubTitle>Priority criteria</SubTitle>
          <div className="grid grid-cols-2 gap-2">
            {PRIORITY_CRITERIA.map((c) => {
              const on = !!candidate[c.key]
              return (
                <div key={c.key} className={`text-xs flex items-center gap-2 p-2 rounded ${on ? 'bg-iera-50 text-iera-800' : 'bg-slate-50 text-slate-400'}`}>
                  <span>{on ? '✓' : '○'}</span>
                  <span className="flex-1">{c.label}</span>
                  <span className="font-bold">+{c.points}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-2 text-xs font-bold text-iera-700">Total priority bonus: +{priorityBonus} pts</div>
        </Section>

        {/* SECTION 3: DOCUMENTS */}
        <Section number="3" title="Documents">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-300 text-left text-[10px] uppercase tracking-wide text-slate-500">
                <th className="py-1.5 pr-2">Document</th>
                <th className="py-1.5 px-2">Required</th>
                <th className="py-1.5 px-2">Status</th>
                <th className="py-1.5 pl-2">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {DOCUMENT_TYPES.map((dt) => {
                const doc = docByType[dt.type]
                const status = doc ? (DOCUMENT_STATUS[doc.status]?.label || doc.status) : 'Not uploaded'
                return (
                  <tr key={dt.type} className="border-b border-slate-100">
                    <td className="py-1.5 pr-2 font-medium">{dt.icon} {dt.label}</td>
                    <td className="py-1.5 px-2">{dt.required ? 'Yes' : 'Optional'}</td>
                    <td className="py-1.5 px-2">
                      <StatusBadge status={doc?.status} label={status} />
                    </td>
                    <td className="py-1.5 pl-2 text-slate-500">
                      {doc?.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="mt-2 text-xs text-slate-600">
            {validCount} of {requiredDocs.length} required documents validated.
          </div>
        </Section>

        {/* SECTION 4: EVALUATION */}
        <Section number="4" title="Evaluation">
          {evaluation ? (
            <>
              <div className="bg-iera-50 rounded p-3 mb-3 grid grid-cols-3 gap-3 text-center">
                <KPI label="Total score" value={`${evalTotal}/100`} />
                <KPI label="Priority bonus" value={`+${priorityBonus}`} />
                <KPI label="Final" value={evalTotal + priorityBonus} />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
                <Field label="Evaluator / Manager" value={evaluation.evaluator_name} />
                <Field label="Interview date" value={evaluation.interview_date} />
                <Field
                  label="Manager recommendation"
                  value={
                    evaluation.recommendation === 'selected' ? '✓ Selected' :
                    evaluation.recommendation === 'waitlist' ? '⏱ Waitlist' :
                    evaluation.recommendation === 'rejected' ? '✗ Not selected' : null
                  }
                />
                <Field
                  label="Last update"
                  value={evaluation.updated_at ? new Date(evaluation.updated_at).toLocaleString('en-US') : null}
                />
              </div>

              {EVAL_BLOCKS.map((block) => (
                <div key={block.title} className="mb-3 break-inside-avoid">
                  <div className="flex justify-between items-center pb-1 border-b border-iera-300 mb-1">
                    <span className="font-bold text-iera-700 text-xs">{block.title}</span>
                    <span className="text-xs font-bold text-iera-700">{blockTotal(block)} / {block.max}</span>
                  </div>
                  {block.fields.map((f) => (
                    <div key={f.key} className="flex justify-between text-xs py-0.5">
                      <span className="text-slate-700">{f.label}</span>
                      <span className="font-medium">{evaluation[f.key] || 0} / {f.max}</span>
                    </div>
                  ))}
                </div>
              ))}

              {evaluation.comments && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <div className="text-xs font-bold text-slate-700 mb-1">Manager comments:</div>
                  <p className="text-xs text-slate-700 italic whitespace-pre-wrap">"{evaluation.comments}"</p>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-400 italic">No evaluation recorded yet.</p>
          )}

          {/* Director decision */}
          {latestDirectorDecision && (
            <div className="mt-4">
              <SubTitle>Continental Director decision</SubTitle>
              <div className={`p-3 rounded border-2 ${
                latestDirectorDecision.decision === 'approved' ? 'bg-green-50 border-green-300' :
                latestDirectorDecision.decision === 'waitlist' ? 'bg-amber-50 border-amber-300' :
                'bg-red-50 border-red-300'
              }`}>
                <div className="text-xs font-bold mb-1">
                  {latestDirectorDecision.decision === 'approved' && '✓ APPROVED'}
                  {latestDirectorDecision.decision === 'waitlist' && '⏱ WAITLIST'}
                  {latestDirectorDecision.decision === 'rejected' && '✗ REJECTED'}
                </div>
                <div className="text-[11px] text-slate-700">
                  Decided by <strong>{latestDirectorDecision.director_name}</strong> on{' '}
                  {new Date(latestDirectorDecision.decided_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
                {latestDirectorDecision.notes && (
                  <p className="text-xs text-slate-700 italic mt-2">"{latestDirectorDecision.notes}"</p>
                )}
              </div>
            </div>
          )}
        </Section>

        {/* SECTION 5: REPORTS */}
        <Section number="5" title="Monthly Reports">
          {reports.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No student reports received yet.</p>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <div key={r.id} className="border border-slate-200 rounded-lg p-3 break-inside-avoid">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-bold text-xs">
                      Month {r.month_number || '—'}
                      {r.feeling_score && <span className="ml-2 font-normal text-slate-600">{FEELING_LABELS[r.feeling_score]}</span>}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(r.submitted_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {r.reviewed_by_manager && ' · ✓ Reviewed'}
                    </span>
                  </div>
                  {r.what_learned && (
                    <div className="mb-1.5">
                      <div className="text-[10px] font-bold text-slate-600 uppercase">📚 What I learned</div>
                      <p className="text-xs text-slate-700 whitespace-pre-wrap">{r.what_learned}</p>
                    </div>
                  )}
                  {r.difficulties && (
                    <div className="mb-1.5">
                      <div className="text-[10px] font-bold text-slate-600 uppercase">⚠️ Difficulties</div>
                      <p className="text-xs text-slate-700 whitespace-pre-wrap">{r.difficulties}</p>
                    </div>
                  )}
                  {r.feeling && (
                    <div className="mb-1.5">
                      <div className="text-[10px] font-bold text-slate-600 uppercase">💚 How I feel</div>
                      <p className="text-xs text-slate-700 italic whitespace-pre-wrap">"{r.feeling}"</p>
                    </div>
                  )}
                  {r.manager_comment && (
                    <div className="mt-2 bg-iera-50 rounded p-2">
                      <div className="text-[10px] font-bold text-iera-700">💬 Manager comment</div>
                      <p className="text-xs text-slate-700">{r.manager_comment}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* SECTION 6: HISTORY */}
        <Section number="6" title="Stage History">
          {history.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No stage changes recorded yet.</p>
          ) : (
            <ul className="text-[11px] space-y-1">
              {history.map((h) => (
                <li key={h.id} className="pl-3 border-l-2 border-iera-300 py-1">
                  <div className="flex justify-between">
                    <span>
                      {h.from_stage ? `${stageLabel(h.from_stage)} → ` : '📝 '}
                      <strong>{stageLabel(h.to_stage)}</strong>
                    </span>
                    <span className="text-slate-500">
                      {new Date(h.changed_at).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  {h.notes && <div className="text-slate-600 italic mt-0.5">"{h.notes}"</div>}
                  {h.changed_by && <div className="text-slate-400 mt-0.5">by {h.changed_by}</div>}
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* FOOTER */}
        <div className="mt-10 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-500">
          iERA — Islamic Education and Research Academy · Confidential Internal Document
          <br />
          Candidate ID: {id} · Generated: {new Date().toISOString()}
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

function SubTitle({ children }) {
  return <div className="text-[11px] font-bold text-iera-700 uppercase tracking-wide mt-4 mb-1.5">{children}</div>
}

function KPI({ label, value }) {
  return (
    <div>
      <div className="text-[10px] text-slate-500 uppercase font-bold">{label}</div>
      <div className="text-xl font-extrabold text-iera-700 mt-0.5">{value}</div>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div className="text-xs">
      <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">{label}</div>
      <div className="text-slate-800 mt-0.5">{value || <span className="text-slate-400 italic">—</span>}</div>
    </div>
  )
}

function FieldBlock({ label, value }) {
  return (
    <div className="mb-2">
      <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wide mb-1">{label}</div>
      <p className="text-xs text-slate-800 whitespace-pre-wrap">{value || <span className="text-slate-400 italic">—</span>}</p>
    </div>
  )
}

function StatusBadge({ status, label }) {
  const styles = {
    valid: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    expired: 'bg-orange-100 text-orange-700',
    rejected: 'bg-red-100 text-red-700'
  }
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${styles[status] || 'bg-slate-100 text-slate-500'}`}>
      {label}
    </span>
  )
}
