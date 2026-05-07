import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { STAGES, stageLabel } from '../lib/constants'

const PHASES = [
  {
    id: 'postulacion',
    label: 'Application',
    description: 'Registration and automatic pre-selection',
    color: 'slate',
    stages: ['inscrito', 'preseleccionado']
  },
  {
    id: 'revision',
    label: 'Review',
    description: 'Documents and interview by Manager',
    color: 'amber',
    stages: ['docs_revision', 'docs_validados', 'entrevista_programada', 'entrevista_realizada']
  },
  {
    id: 'aprobacion',
    label: 'Approval',
    description: 'Continental Director decision',
    color: 'fuchsia',
    stages: ['revision_director', 'aprobado_director']
  },
  {
    id: 'previaje',
    label: 'Pre-travel',
    description: 'Visa, contract and BIU info',
    color: 'cyan',
    stages: ['visa_tramite', 'contrato_firmado', 'info_biu']
  },
  {
    id: 'indonesia',
    label: '🇮🇩 Indonesia',
    description: '3 months and graduation',
    color: 'orange',
    stages: ['indonesia_m1', 'indonesia_m2', 'indonesia_m3', 'graduado']
  }
]

const phaseColors = {
  slate:   { bg: 'bg-slate-50',   border: 'border-slate-300',   text: 'text-slate-700',   accent: 'bg-slate-500' },
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-300',   text: 'text-amber-800',   accent: 'bg-amber-500' },
  fuchsia: { bg: 'bg-fuchsia-50', border: 'border-fuchsia-300', text: 'text-fuchsia-800', accent: 'bg-fuchsia-500' },
  cyan:    { bg: 'bg-cyan-50',    border: 'border-cyan-300',    text: 'text-cyan-800',    accent: 'bg-cyan-500' },
  orange:  { bg: 'bg-orange-50',  border: 'border-orange-300',  text: 'text-orange-800',  accent: 'bg-orange-500' },
  green:   { bg: 'bg-green-50',   border: 'border-green-300',   text: 'text-green-800',   accent: 'bg-green-500' }
}

export default function Pipeline() {
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState([])
  const [countries, setCountries] = useState([])
  const [documents, setDocuments] = useState([])
  const [evaluations, setEvaluations] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [countryFilter, setCountryFilter] = useState('all')
  const [hideEmpty, setHideEmpty] = useState(false)
  const [viewMode, setViewMode] = useState('phases')

  useEffect(() => {
    Promise.all([
      supabase.from('candidates').select('*, countries(name, code)'),
      supabase.from('countries').select('*').order('name'),
      supabase.from('documents').select('candidate_id, status, type'),
      supabase.from('evaluations').select('candidate_id, total_score, recommendation'),
      supabase.from('stages_history').select('candidate_id, to_stage, changed_at')
    ]).then(([c, p, d, e, h]) => {
      setCandidates(c.data || [])
      setCountries(p.data || [])
      setDocuments(d.data || [])
      setEvaluations(e.data || [])
      setHistory(h.data || [])
      setLoading(false)
    })
  }, [])

  const candidateMeta = useMemo(() => {
    const meta = {}
    for (const c of candidates) {
      const docs = documents.filter((d) => d.candidate_id === c.id)
      const validRequired = docs.filter((d) => d.status === 'valid' && ['passport', 'tazkiyah', 'background_check', 'availability_decl', 'photo'].includes(d.type)).length
      const evalu = evaluations.find((e) => e.candidate_id === c.id)
      const stageEntries = history.filter((h) => h.candidate_id === c.id && h.to_stage === c.current_stage)
      const lastEntry = stageEntries.sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at))[0]
      const daysInStage = lastEntry ? Math.floor((new Date() - new Date(lastEntry.changed_at)) / (1000 * 60 * 60 * 24)) : null
      meta[c.id] = {
        validDocs: validRequired,
        score: evalu?.total_score,
        daysInStage,
        recommendation: evalu?.recommendation,
        nextAction: nextActionFor(c, validRequired, evalu, daysInStage)
      }
    }
    return meta
  }, [candidates, documents, evaluations, history])

  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      if (countryFilter !== 'all' && c.country_id !== parseInt(countryFilter)) return false
      if (search && !c.full_name.toLowerCase().includes(search.toLowerCase()) && !c.email.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [candidates, countryFilter, search])

  const phaseStats = useMemo(() => {
    return PHASES.map((p) => ({
      ...p,
      count: filtered.filter((c) => p.stages.includes(c.current_stage)).length
    }))
  }, [filtered])

  if (loading) return <div className="text-center py-12 text-slate-400">Cargando pipeline...</div>

  return (
    <div>
      <div className="mb-5 rounded-xl border border-iera-pink/30 bg-fuchsia-50 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-iera-pink mb-1">
              Reviewed operational pipeline
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">Program flow by blocker and next step</h1>
            <p className="text-sm text-slate-600 mt-1">
              This view separates application, review, approval, pre-travel, and Indonesia so the team does not depend only on status.
            </p>
          </div>
          <Link to="/candidatos" className="btn-secondary text-center">
            View candidate workbench
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold">Pipeline</h2>
        <p className="text-sm text-slate-500 mt-1">
          {filtered.length} candidate{filtered.length !== 1 && 's'} in flow · 15 stages in 5 phases
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 grid grid-cols-1 md:grid-cols-[1fr,200px,auto,auto] gap-3 items-center">
        <input
          type="search"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-base"
        />
        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="input-base"
        >
          <option value="all">All countries</option>
          {countries.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap">
          <input
            type="checkbox"
            checked={hideEmpty}
            onChange={(e) => setHideEmpty(e.target.checked)}
            className="accent-iera-500"
          />
          Hide empty
        </label>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('phases')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              viewMode === 'phases' ? 'bg-white text-iera-700 shadow-sm' : 'text-slate-500'
            }`}
          >
            Phases
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              viewMode === 'kanban' ? 'bg-white text-iera-700 shadow-sm' : 'text-slate-500'
            }`}
          >
            Kanban
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {phaseStats.map((p) => {
          const c = phaseColors[p.color]
          return (
            <div
              key={p.id}
              className={`p-3 rounded-xl border-2 ${c.bg} ${c.border}`}
            >
              <div className={`text-xs font-bold ${c.text}`}>{p.label}</div>
              <div className={`text-2xl font-extrabold mt-1 ${c.text}`}>{p.count}</div>
              <div className={`text-[10px] mt-0.5 opacity-70 ${c.text}`}>
                {p.stages.length} stage{p.stages.length > 1 && 's'}
              </div>
            </div>
          )
        })}
      </div>

      {viewMode === 'kanban' && (
        <div className="space-y-5">
          {PHASES.map((phase) => {
            const phaseStages = phase.stages
              .map((sid) => STAGES.find((s) => s.id === sid))
              .filter(Boolean)
              .map((s) => ({
                ...s,
                candidates: filtered.filter((c) => c.current_stage === s.id)
              }))

            const visibleStages = hideEmpty ? phaseStages.filter((s) => s.candidates.length > 0) : phaseStages
            if (visibleStages.length === 0) return null

            const c = phaseColors[phase.color]
            return (
              <div key={phase.id}>
                <div className={`flex items-center gap-3 mb-2 px-1`}>
                  <div className={`w-1 h-6 rounded-full ${c.accent}`} />
                  <div>
                    <h3 className={`text-sm font-bold ${c.text}`}>{phase.label}</h3>
                    <p className="text-[11px] text-slate-500">{phase.description}</p>
                  </div>
                  <div className="ml-auto text-xs text-slate-500">
                    {visibleStages.reduce((sum, s) => sum + s.candidates.length, 0)} candidate(s) in this phase
                  </div>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {visibleStages.map((stage) => (
                    <div
                      key={stage.id}
                      className={`flex-shrink-0 w-60 rounded-xl p-3 ${c.bg} border ${c.border}`}
                    >
                      <div className="flex justify-between items-center mb-2.5">
                        <div className={`text-xs font-bold ${c.text} truncate`}>
                          {stage.shortLabel}
                        </div>
                        <div className={`bg-white px-2 py-0.5 rounded-full text-xs font-bold ${c.text}`}>
                          {stage.candidates.length}
                        </div>
                      </div>
                      <div className="space-y-2">
                        {stage.candidates.length === 0 ? (
                          <div className="text-center py-4 text-[11px] text-slate-400 italic">No candidates</div>
                        ) : (
                          stage.candidates.map((cand) => (
                            <CandidateCard
                              key={cand.id}
                              candidate={cand}
                              meta={candidateMeta[cand.id]}
                              onClick={() => navigate(`/candidatos/${cand.id}`)}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {viewMode === 'phases' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PHASES.map((phase) => {
            const phaseCandidates = filtered.filter((c) => phase.stages.includes(c.current_stage))
            const c = phaseColors[phase.color]

            const stagesInPhase = phase.stages
              .map((sid) => STAGES.find((s) => s.id === sid))
              .filter(Boolean)
              .map((s) => ({
                ...s,
                count: filtered.filter((cand) => cand.current_stage === s.id).length
              }))

            return (
              <div key={phase.id} className={`rounded-xl border-2 ${c.bg} ${c.border} overflow-hidden`}>
                <div className="p-4 border-b border-current/10">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className={`font-bold ${c.text}`}>{phase.label}</h3>
                      <p className="text-xs text-slate-600 mt-0.5">{phase.description}</p>
                    </div>
                    <div className={`text-3xl font-extrabold ${c.text}`}>{phaseCandidates.length}</div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {stagesInPhase.map((s) => (
                      <span
                        key={s.id}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold border ${
                          s.count > 0
                            ? `bg-white ${c.border} ${c.text}`
                            : 'bg-white/60 border-slate-200 text-slate-400'
                        }`}
                        title={s.label}
                      >
                        <span>{s.shortLabel}</span>
                        <span className={`${s.count > 0 ? c.accent : 'bg-slate-300'} text-white text-[10px] font-bold px-1.5 rounded-full min-w-[18px] text-center`}>
                          {s.count}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-white/60 max-h-64 overflow-y-auto">
                  {phaseCandidates.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400 italic">
                      No candidates in this phase
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {phaseCandidates.map((cand) => {
                        const stage = STAGES.find((s) => s.id === cand.current_stage)
                        return (
                          <Link
                            key={cand.id}
                            to={`/candidatos/${cand.id}`}
                            className="flex items-center gap-3 p-2 bg-white rounded-lg hover:bg-slate-50 transition border border-slate-200"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold truncate">{cand.full_name}</div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {cand.countries?.name} · <span className="font-semibold">{stage?.shortLabel}</span>
                              </div>
                            </div>
                            <CandidateMiniStats meta={candidateMeta[cand.id]} />
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center mt-5">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="font-bold text-slate-700">No matching candidates</h3>
          <p className="text-sm text-slate-500 mt-1">Adjust filters or create a new candidate</p>
        </div>
      )}
    </div>
  )
}

function nextActionFor(candidate, validDocs, evaluation, daysInStage) {
  if (daysInStage > 14) return 'Bloqueado mas de 14 dias'
  if (candidate.current_stage === 'preseleccionado') return 'Request documents'
  if (candidate.current_stage === 'docs_revision' && validDocs < 5) return `Missing docs (${validDocs}/5)`
  if (candidate.current_stage === 'docs_validados') return 'Schedule interview'
  if (candidate.current_stage === 'entrevista_programada') return 'Conduct interview'
  if (candidate.current_stage === 'entrevista_realizada' && !evaluation) return 'Complete evaluation'
  if (candidate.current_stage === 'entrevista_realizada' && evaluation) return 'Send to Director'
  if (candidate.current_stage === 'revision_director') return 'Decision pending'
  if (candidate.current_stage === 'aprobado_director') return 'Start pre-travel'
  if (candidate.current_stage === 'visa_tramite') return 'Visa follow-up'
  if (candidate.current_stage === 'contrato_firmado') return 'Send info to BIU'
  if (candidate.current_stage === 'info_biu') return 'Confirm LOA/LOI'
  if (candidate.current_stage?.startsWith('indonesia_')) return 'Review monthly report'
  return stageLabel(candidate.current_stage)
}

function CandidateCard({ candidate, meta = {}, onClick }) {
  const { validDocs, score, daysInStage, recommendation } = meta
  const isStuck = daysInStage > 14
  const recommendationColor = {
    selected: 'bg-green-100 text-green-700',
    waitlist: 'bg-amber-100 text-amber-700',
    rejected: 'bg-red-100 text-red-700'
  }[recommendation]

  return (
    <div
      onClick={onClick}
      className="bg-white p-2.5 rounded-lg border-l-[3px] border-iera-500 hover:shadow-md transition cursor-pointer"
    >
      <div className="text-xs font-semibold mb-1 truncate">{candidate.full_name}</div>
      <div className="text-[10px] text-slate-500 mb-2">{candidate.countries?.name}</div>
      <div className="text-[10px] font-semibold text-slate-700 mb-2">{meta.nextAction}</div>

      <div className="flex flex-wrap gap-1">
        {validDocs !== undefined && (
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
              validDocs === 5 ? 'bg-green-100 text-green-700' :
              validDocs >= 3 ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-600'
            }`}
            title="Valid documents / 5 requeridos"
          >
            Docs {validDocs}/5
          </span>
        )}
        {score !== undefined && score !== null && (
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
              score >= 70 ? 'bg-green-100 text-green-700' :
              score >= 60 ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-600'
            }`}
            title="Evaluation score / 100"
          >
            Score {score}
          </span>
        )}
        {recommendationColor && (
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${recommendationColor}`}
          >
            {recommendation === 'selected' && '✓'}
            {recommendation === 'waitlist' && '⏱'}
            {recommendation === 'rejected' && '✗'}
          </span>
        )}
        {daysInStage !== null && daysInStage !== undefined && (
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
              isStuck ? 'bg-red-100 text-red-600 animate-pulse' :
              daysInStage > 7 ? 'bg-amber-100 text-amber-700' :
              'bg-slate-100 text-slate-600'
            }`}
            title="Days in this stage"
          >
            {daysInStage}d
          </span>
        )}
      </div>
    </div>
  )
}

function CandidateMiniStats({ meta = {} }) {
  const { validDocs, score, daysInStage } = meta
  const isStuck = daysInStage > 14
  return (
    <div className="flex gap-1 flex-shrink-0">
      {validDocs !== undefined && validDocs > 0 && (
        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
          validDocs === 5 ? 'bg-green-100 text-green-700' :
          'bg-amber-100 text-amber-700'
        }`}>
          Docs {validDocs}/5
        </span>
      )}
      {score !== undefined && score !== null && (
        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
          score >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
        }`}>
          Score {score}
        </span>
      )}
      {isStuck && (
        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-red-100 text-red-600">
          ⚠
        </span>
      )}
    </div>
  )
}
