import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { stageLabel, PRIORITY_CRITERIA } from '../lib/constants'
import DocumentsSection from '../components/DocumentsSection'
import NextActionCard from '../components/NextActionCard'
import EvaluationForm from '../components/EvaluationForm'
import ProgressTimeline from '../components/ProgressTimeline'
import StageHistory from '../components/StageHistory'
import DirectorDecisionPanel from '../components/DirectorDecisionPanel'
import ReportsSection from '../components/ReportsSection'

const TABS = [
  { id: 'overview', label: '🏠 Overview', help: 'Candidate overview' },
  { id: 'data', label: '📋 Information', help: 'Personal data of the candidate' },
  { id: 'docs', label: '📂 Documents', help: 'Upload and validation of the 5 required documents' },
  { id: 'eval', label: '⭐ Evaluation', help: '100-pt evaluation form post-interview' },
  { id: 'reports', label: '📨 Reports', help: 'Monthly reports from the student in Indonesia' },
  { id: 'history', label: '📜 History', help: 'Stage change history' }
]

export default function CandidateDetail() {
  const { id } = useParams()
  const [candidate, setCandidate] = useState(null)
  const [documents, setDocuments] = useState([])
  const [evaluation, setEvaluation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const load = async () => {
    setLoading(true)
    try {
      const [{ data: c }, { data: docs }, { data: ev }] = await Promise.all([
        supabase.from('candidates').select('*, countries(name, code, embassy_location)').eq('id', id).single(),
        supabase.from('documents').select('*').eq('candidate_id', id),
        supabase.from('evaluations').select('*').eq('candidate_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle()
      ])
      setCandidate(c)
      setDocuments(docs || [])
      setEvaluation(ev)
    } catch (err) {
      console.error('Error loading candidate detail:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  if (loading) return <div className="text-center py-12 text-slate-400">Loading...</div>
  if (!candidate) return <div>Candidate not found</div>

  const age = candidate.birth_date
    ? Math.floor((new Date() - new Date(candidate.birth_date)) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  const validDocsCount = documents.filter((d) => d.status === 'valid').length
  const requiredDocsCount = 5
  const docsProgress = Math.round((validDocsCount / requiredDocsCount) * 100)

  const priorityBonus = PRIORITY_CRITERIA.reduce(
    (sum, c) => sum + (candidate[c.key] ? c.points : 0),
    0
  )

  return (
    <div className="max-w-6xl">
      <Link to="/candidatos" className="text-sm text-slate-500 hover:text-iera-700 mb-3 inline-flex items-center gap-1">
        ← Back to candidates
      </Link>

      {/* HEADER */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{candidate.full_name}</h2>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-600">
              <span>📍 {candidate.countries?.name}</span>
              <span>·</span>
              <span>📧 {candidate.email}</span>
              {candidate.whatsapp && <><span>·</span><span>💬 {candidate.whatsapp}</span></>}
              {age && <><span>·</span><span>🎂 {age} years</span></>}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {candidate.whatsapp && (
                <WhatsAppQuickActions candidate={candidate} />
              )}
              {candidate.email && (
                <a
                  href={`mailto:${candidate.email}`}
                  className="text-xs px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold inline-flex items-center gap-1.5 transition"
                >
                  📧 Email
                </a>
              )}
              <Link
                to={`/candidatos/${candidate.id}/biu-document`}
                target="_blank"
                className="text-xs px-3 py-1.5 rounded-md bg-iera-100 hover:bg-iera-200 text-iera-800 font-semibold inline-flex items-center gap-1.5 transition"
              >
                📄 BIU document
              </Link>
              <Link
                to={`/candidatos/${candidate.id}/export`}
                target="_blank"
                className="text-xs px-3 py-1.5 rounded-md bg-iera-700 hover:bg-iera-800 text-white font-semibold inline-flex items-center gap-1.5 transition"
              >
                📑 Export PDF
              </Link>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide font-bold text-slate-500">Current stage</div>
            <div className="px-3 py-1.5 bg-iera-100 text-iera-800 rounded-lg text-sm font-bold mt-1">
              {stageLabel(candidate.current_stage)}
            </div>
          </div>
        </div>

        {/* QUICK KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Valid documents</div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-iera-700">{validDocsCount}</span>
              <span className="text-sm text-slate-400">/ {requiredDocsCount}</span>
              <span className="ml-auto text-xs font-bold text-iera-700">{docsProgress}%</span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-iera-500" style={{ width: `${docsProgress}%` }} />
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Evaluation score</div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-iera-700">{evaluation?.total_score ?? '—'}</span>
              <span className="text-sm text-slate-400">/ 100</span>
              {evaluation?.total_score >= 70 && (
                <span className="ml-auto text-xs font-bold text-green-600">✓ Qualified</span>
              )}
              {evaluation?.total_score && evaluation.total_score < 70 && (
                <span className="ml-auto text-xs font-bold text-red-600">Not qualified</span>
              )}
            </div>
            {evaluation?.total_score && (
              <div className="text-[10px] text-slate-500 mt-1">
                + priority bonus: {priorityBonus} = <strong>{evaluation.total_score + priorityBonus} final</strong>
              </div>
            )}
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Priority bonus</div>
            <div className="text-xl font-bold text-iera-700 mt-1">+{priorityBonus} pts</div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {PRIORITY_CRITERIA.filter(c => candidate[c.key]).length} criteria met
            </div>
          </div>
        </div>
      </div>

      {/* TIMELINE */}
      <div className="mb-5">
        <ProgressTimeline currentStageId={candidate.current_stage} />
      </div>

      {/* TABS */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-5">
        <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-50">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition border-b-2 ${
                activeTab === tab.id
                  ? 'border-iera-500 text-iera-700 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          <div className="text-xs text-slate-500 mb-4 italic">
            💡 {TABS.find(t => t.id === activeTab)?.help}
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-5">
              <NextActionCard
                candidate={candidate}
                documents={documents}
                evaluation={evaluation}
                onChange={load}
              />
              <DirectorDecisionPanel
                candidate={candidate}
                evaluation={evaluation}
                onChange={load}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <Card title="🆔 Identification">
                  <Field label="Country" value={candidate.countries?.name} />
                  <Field label="City" value={candidate.city} />
                  <Field label="WhatsApp" value={candidate.whatsapp} />
                </Card>
                <Card title="🛂 Passport">
                  <Field label="Number" value={candidate.passport_number} />
                  <Field label="Expiry" value={candidate.passport_expiry} />
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <Card title="👤 Personal data">
                <Field label="WhatsApp" value={candidate.whatsapp} />
                <Field label="Phone" value={candidate.phone} />
                <Field label="City" value={candidate.city} />
                <Field label="Occupation" value={candidate.occupation} />
                <Field label="Education" value={candidate.education_level} />
              </Card>
              <Card title="🛂 Passport">
                <Field label="Number" value={candidate.passport_number} />
                <Field label="Expiry" value={candidate.passport_expiry} />
                <Field label="Issuing country" value={candidate.passport_country} />
                <Field label="Indonesian embassy" value={candidate.countries?.embassy_location} />
              </Card>
              <Card title="🕌 Islamic profile">
                <Field
                  label="Muslim status"
                  value={
                    candidate.muslim_status === 'born_muslim' ? '🕌 Born Muslim' :
                    candidate.muslim_status === 'new_muslim' ?
                      `☪️ New Muslim${candidate.conversion_month ? ` (since ${candidate.conversion_month})` : ''}` :
                    null
                  }
                />
                <Field label="Reference Sheikh" value={candidate.sheikh_reference_name} />
                <Field label="Sheikh contact" value={candidate.sheikh_reference_contact} />
                <Field label="Islamic center" value={candidate.islamic_center_name} />
                <Field label="Arabic level" value={candidate.arabic_level} />
                <Field label="Other languages" value={candidate.other_languages} />
                <Field label="Courses completed" value={`${(candidate.islamic_courses || []).length} courses`} />
              </Card>
              <Card title="🚨 Emergency contact">
                <Field label="Name" value={candidate.emergency_contact_name} />
                <Field
                  label="Phone"
                  value={candidate.emergency_contact_phone ?
                    `${candidate.emergency_contact_country_code || ''} ${candidate.emergency_contact_phone}` : null
                  }
                />
                <Field label="Relationship" value={candidate.emergency_contact_relation} />
              </Card>
              <div className="card col-span-1 sm:col-span-2">
                <div className="card-header">
                  <h3 className="font-bold">💬 Motivation and experience</h3>
                </div>
                <div className="card-body text-sm">
                  <p className="whitespace-pre-wrap">{candidate.motivation_text || <span className="text-slate-400 italic">No motivation text</span>}</p>
                  {candidate.dawah_activities_current && (
                    <>
                      <h4 className="font-semibold mt-4 mb-1 text-slate-700">Current dawah activities</h4>
                      <p className="whitespace-pre-wrap text-slate-600">{candidate.dawah_activities_current}</p>
                    </>
                  )}
                </div>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <Card title="🏆 Active priority criteria">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {PRIORITY_CRITERIA.map((c) => (
                      <div
                        key={c.key}
                        className={`flex items-center gap-2 p-2 rounded-md text-sm ${
                          candidate[c.key] ? 'bg-iera-50 text-iera-800' : 'bg-slate-50 text-slate-400 line-through'
                        }`}
                      >
                        <span>{candidate[c.key] ? '✓' : '○'}</span>
                        <span className="flex-1">{c.label}</span>
                        <span className="font-bold">+{c.points}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-sm font-bold text-iera-700">
                    Total bonus: +{priorityBonus} pts
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <DocumentsSection candidateId={id} />
          )}

          {activeTab === 'eval' && (
            <EvaluationForm candidate={candidate} onChange={load} />
          )}

          {activeTab === 'reports' && (
            <ReportsSection candidateId={id} candidateName={candidate.full_name} />
          )}

          {activeTab === 'history' && (
            <StageHistory candidateId={id} />
          )}
        </div>
      </div>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="font-bold text-sm">{title}</h3>
      </div>
      <div className="card-body space-y-2">{children}</div>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div className="flex">
      <div className="text-slate-500 w-36 flex-shrink-0 text-xs">{label}:</div>
      <div className="flex-1 font-medium text-sm">{value || <span className="text-slate-400 italic">—</span>}</div>
    </div>
  )
}

// Quick action: open WhatsApp with stage-specific predefined message
function WhatsAppQuickActions({ candidate }) {
  const [open, setOpen] = useState(false)
  const phone = (candidate.whatsapp || '').replace(/[^0-9]/g, '')

  const messages = {
    inscrito: `Assalamu alaikum ${candidate.full_name}, this is the iERA team. We received your application for the Dawah Pioneers Indonesia 2026 Program. I'll contact you soon for next steps. Baraka Allahu feekum.`,
    preseleccionado: `Assalamu alaikum ${candidate.full_name}, we received your application and you meet the basic requirements of the Dawah Pioneers Program. Can we schedule a call to review the required documents?`,
    docs_revision: `Assalamu alaikum ${candidate.full_name}, I'm reaching out to coordinate uploading your program documents: passport, Tazkiyah, criminal background check, availability declaration and photo. Can you send them today/tomorrow?`,
    docs_validados: `Assalamu alaikum ${candidate.full_name}, all your documents are validated ✓. Let's schedule your video interview. Which day works best this week?`,
    entrevista_programada: `Assalamu alaikum ${candidate.full_name}, reminder of our scheduled interview. Please confirm your attendance.`,
    entrevista_realizada: `Assalamu alaikum ${candidate.full_name}, thank you for the interview. Your case now goes to the Continental Director's review. I'll let you know when there's a response.`,
    aprobado_director: `Assalamu alaikum ${candidate.full_name}, congratulations! 🎉 The Continental Director approved your application. We're starting the visa process. We'll need some additional documents — I'll let you know soon.`,
    rechazado: `Assalamu alaikum ${candidate.full_name}, thank you for your interest in the Dawah Pioneers Program. In this round you weren't selected, but we encourage you to apply in future opportunities. May Allah bless you.`,
    lista_espera: `Assalamu alaikum ${candidate.full_name}, you've been placed on the waitlist for the Dawah Pioneers Program. If a spot opens up, you'll be contacted immediately.`
  }

  const defaultMessage = messages[candidate.current_stage] || `Assalamu alaikum ${candidate.full_name}, I'm reaching out from the iERA team — Dawah Pioneers Program.`

  const buildLink = (text) => `https://wa.me/${phone}?text=${encodeURIComponent(text)}`

  if (!phone) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs px-3 py-1.5 rounded-md bg-green-100 hover:bg-green-200 text-green-800 font-semibold inline-flex items-center gap-1.5 transition"
      >
        💬 WhatsApp
        <span className="text-[10px] opacity-70">▾</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1.5 left-0 w-80 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 bg-green-50 border-b border-green-100">
              <div className="text-xs font-bold text-green-800">Templates by current stage</div>
              <div className="text-[10px] text-green-700">Click to open WhatsApp with pre-filled message</div>
            </div>
            <a
              href={buildLink(defaultMessage)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 hover:bg-slate-50 border-b border-slate-100"
            >
              <div className="text-xs font-bold text-slate-800">📋 Suggested message for current stage</div>
              <div className="text-[10px] text-slate-500 mt-1 line-clamp-2">{defaultMessage}</div>
            </a>
            <a
              href={buildLink('')}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 hover:bg-slate-50 text-xs font-semibold text-slate-700"
            >
              💬 Open WhatsApp blank
            </a>
          </div>
        </>
      )}
    </div>
  )
}
