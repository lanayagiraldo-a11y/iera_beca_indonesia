import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { STAGES, stageLabel } from '../lib/constants'

const PHASES = [
  { id: 'postulacion', label: 'Application',  color: 'slate',   stages: ['inscrito', 'preseleccionado'] },
  { id: 'revision',    label: 'Review',     color: 'amber',   stages: ['docs_revision', 'docs_validados', 'entrevista_programada', 'entrevista_realizada'] },
  { id: 'aprobacion',  label: 'Approval',   color: 'fuchsia', stages: ['revision_director', 'aprobado_director'] },
  { id: 'previaje',    label: 'Pre-travel',    color: 'cyan',    stages: ['visa_tramite', 'contrato_firmado', 'info_biu'] },
  { id: 'indonesia',   label: '🇮🇩 Indonesia',   color: 'orange',  stages: ['indonesia_m1', 'indonesia_m2', 'indonesia_m3', 'graduado'] }
]

const phaseColors = {
  slate:   'bg-slate-100 text-slate-700 border-slate-300',
  amber:   'bg-amber-100 text-amber-800 border-amber-300',
  fuchsia: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300',
  cyan:    'bg-cyan-100 text-cyan-800 border-cyan-300',
  orange:  'bg-orange-100 text-orange-800 border-orange-300',
  green:   'bg-green-100 text-green-800 border-green-300'
}

const phaseOf = (stageId) => PHASES.find((p) => p.stages.includes(stageId))

export default function Candidates() {
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState([])
  const [countries, setCountries] = useState([])
  const [documents, setDocuments] = useState([])
  const [evaluations, setEvaluations] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [countryFilter, setCountryFilter] = useState('all')
  const [phaseFilter, setPhaseFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [viewMoof, setViewMoof] = useState('table')

  const load = async () => {
    setLoading(true)
    const [{ data: c }, { data: p }, { data: d }, { data: e }, { data: h }] = await Promise.all([
      supabase.from('candidates').select('*, countries(name, code)').order('created_at', { ascending: false }),
      supabase.from('countries').select('*').order('name'),
      supabase.from('documents').select('candidate_id, status, type'),
      supabase.from('evaluations').select('candidate_id, total_score, recommendation'),
      supabase.from('stages_history').select('candidate_id, to_stage, changed_at')
    ])
    setCandidates(c || [])
    setCountries(p || [])
    setDocuments(d || [])
    setEvaluations(e || [])
    setHistory(h || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const candidateMeta = useMemo(() => {
    const meta = {}
    for (const c of candidates) {
      const docs = documents.filter((d) => d.candidate_id === c.id)
      const validRequired = docs.filter((d) => d.status === 'valid' && ['passport', 'tazkiyah', 'background_check', 'availability_ofcl', 'photo'].includes(d.type)).length
      const evalu = evaluations.find((e) => e.candidate_id === c.id)
      const stageEntries = history.filter((h) => h.candidate_id === c.id && h.to_stage === c.current_stage)
      const lastEntry = stageEntries.sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at))[0]
      const daysInStage = lastEntry ? Math.floor((new Date() - new Date(lastEntry.changed_at)) / (1000 * 60 * 60 * 24)) : null
      meta[c.id] = {
        validDocs: validRequired,
        score: evalu?.total_score,
        daysInStage,
        recommendation: evalu?.recommendation,
        phase: phaseOf(c.current_stage),
        nextAction: nextActionFor(c, validRequired, evalu, daysInStage)
      }
    }
    return meta
  }, [candidates, documents, evaluations, history])

  const filtered = useMemo(() => {
    let result = candidates.filter((c) => {
      if (countryFilter !== 'all' && c.country_id !== parseInt(countryFilter)) return false
      if (phaseFilter !== 'all') {
        const phase = PHASES.find((p) => p.id === phaseFilter)
        if (!phase || !phase.stages.includes(c.current_stage)) return false
      }
      if (search) {
        const q = search.toLowerCase()
        const matches =
          c.full_name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.whatsapp || '').toLowerCase().includes(q) ||
          (c.passport_number || '').toLowerCase().includes(q)
        if (!matches) return false
      }
      return true
    })

    const sortFn = {
      recent: (a, b) => new Date(b.created_at) - new Date(a.created_at),
      name: (a, b) => a.full_name.localeCompare(b.full_name),
      country: (a, b) => (a.countries?.name || '').localeCompare(b.countries?.name || ''),
      stage: (a, b) => STAGES.findIndex((s) => s.id === a.current_stage) - STAGES.findIndex((s) => s.id === b.current_stage),
      activity: (a, b) => (candidateMeta[b.id]?.daysInStage ?? 999) - (candidateMeta[a.id]?.daysInStage ?? 999)
    }[sortBy]
    return [...result].sort(sortFn)
  }, [candidates, countryFilter, phaseFilter, search, sortBy, candidateMeta])

  const kpis = useMemo(() => {
    const total = candidates.length
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const newThisWeek = candidates.filter((c) => new Date(c.created_at) >= oneWeekAgo).length
    const needsReview = candidates.filter((c) => ['docs_revision', 'entrevista_realizada', 'revision_director'].includes(c.current_stage)).length
    const atRisk = candidates.filter((c) => {
      const m = candidateMeta[c.id]
      return m?.daysInStage > 14
    }).length
    return { total, newThisWeek, needsReview, atRisk }
  }, [candidates, candidateMeta])

  const phaseChipCounts = useMemo(() => {
    const counts = { all: candidates.length }
    for (const p of PHASES) {
      counts[p.id] = candidates.filter((c) => p.stages.includes(c.current_stage)).length
    }
    return counts
  }, [candidates])

  const exportCSV = () => {
    const rows = [
      ['Name', 'Email', 'WhatsApp', 'Country', 'Stage', 'Phase', 'Valid docs', 'Score', 'Days in stage', 'Recommendation', 'Created']
    ]
    for (const c of filtered) {
      const m = candidateMeta[c.id] || {}
      rows.push([
        c.full_name,
        c.email,
        c.whatsapp || '',
        c.countries?.name || '',
        stageLabel(c.current_stage),
        m.phase?.label || '',
        m.validDocs ?? '',
        m.score ?? '',
        m.daysInStage ?? '',
        m.recommendation || '',
        new Date(c.created_at).toLocaleDateString('en')
      ])
    }
    const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `candidates_iera_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="text-center py-12 text-slate-400">Loading candidates...</div>

  return (
    <div>
      <div className="mb-5 rounded-xl border border-iera-cyan/30 bg-iera-cyan/10 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-iera-cyan mb-1">
              Reviewed manager version
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">Candidate workbench</h1>
            <p className="text-sm text-slate-600 mt-1">
              Prioritize cases by pending action, documents, time stuck, and actual program stage.
            </p>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-full bg-white border border-iera-cyan/30 font-semibold text-slate-700">Manual v1.1</span>
            <span className="px-3 py-1.5 rounded-full bg-white border border-iera-cyan/30 font-semibold text-slate-700">New UX</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-start mb-5">
        <div>
          <h2 className="text-2xl font-bold">Candidates</h2>
          <p className="text-sm text-slate-500 mt-1">
            {filtered.length} of {candidates.length} candidates
            {(countryFilter !== 'all' || phaseFilter !== 'all' || search) && ' (filtered)'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-secondary">
            Export CSV
          </button>
          <button onClick={() => navigate('/candidatos/nuevo')} className="btn-primary">
            + New candidate
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Kpi label="Total" value={kpis.total} icon="●" />
        <Kpi label="New this week" value={kpis.newThisWeek} icon="+" highlight={kpis.newThisWeek > 0 ? 'green' : null} />
        <Kpi label="Need review" value={kpis.needsReview} icon="!" highlight={kpis.needsReview > 0 ? 'amber' : null} />
        <Kpi label="Stuck >14d" value={kpis.atRisk} icon="!" highlight={kpis.atRisk > 0 ? 'red' : null} />
      </div>

      <ActionQueue candidates={filtered} meta={candidateMeta} />

      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-[1fr,180px,180px,auto] gap-3 items-center">
          <input
            type="search"
            placeholder="Search by name, email, WhatsApp or passport..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base"
          />
          <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} className="input-base">
            <option value="all">All countries</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-base">
            <option value="recent">Most recent</option>
            <option value="name">Name A-Z</option>
            <option value="country">By country</option>
            <option value="stage">By stage</option>
            <option value="activity">Longest in stage</option>
          </select>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMoof('table')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                viewMoof === 'table' ? 'bg-white text-iera-700 shadow-sm' : 'text-slate-500'
              }`}
              title="Table view"
            >
              📋
            </button>
            <button
              onClick={() => setViewMoof('cards')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                viewMoof === 'cards' ? 'bg-white text-iera-700 shadow-sm' : 'text-slate-500'
              }`}
              title="Cards view"
            >
              ▦
            </button>
          </div>
        </div>

        <div className="flex gap-1.5 flex-wrap pt-1 border-t border-slate-100">
          <PhaseChip
            active={phaseFilter === 'all'}
            onClick={() => setPhaseFilter('all')}
              label="All"
            count={phaseChipCounts.all}
          />
          {PHASES.map((p) => (
            <PhaseChip
              key={p.id}
              active={phaseFilter === p.id}
              onClick={() => setPhaseFilter(p.id)}
              label={p.label}
              count={phaseChipCounts[p.id]}
              color={p.color}
            />
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center">
          <div className="text-4xl mb-3">{candidates.length === 0 ? '📋' : '🔍'}</div>
          <h3 className="font-bold text-slate-700">
            {candidates.length === 0 ? 'No candidates yet' : 'No results'}
          </h3>
          <p className="text-sm text-slate-500 mt-1 mb-4">
            {candidates.length === 0
              ? 'Start by creating the first program candidate'
              : 'Adjust filters or clear the search'}
          </p>
          {candidates.length === 0 ? (
            <button onClick={() => navigate('/candidatos/nuevo')} className="btn-primary">
              + Create first candidate
            </button>
          ) : (
            <button onClick={() => { setSearch(''); setCountryFilter('all'); setPhaseFilter('all') }} className="btn-secondary">
              Clear filters
            </button>
          )}
        </div>
      ) : viewMoof === 'table' ? (
        <TableView candidates={filtered} meta={candidateMeta} />
      ) : (
        <CardsView candidates={filtered} meta={candidateMeta} />
      )}
    </div>
  )
}

function Kpi({ label, value, icon, highlight }) {
  const highlightStyle = {
    green: 'border-green-300 bg-green-50',
    amber: 'border-amber-300 bg-amber-50',
    red: 'border-red-300 bg-red-50'
  }[highlight] || 'border-slate-200 bg-white'

  return (
    <div className={`p-4 rounded-xl border-2 ${highlightStyle}`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wiof font-bold text-slate-600">
        <span className="text-lg">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="text-3xl font-extrabold text-slate-800 mt-2">{value}</div>
    </div>
  )
}

function nextActionFor(candidate, validDocs, evaluation, daysInStage) {
  if (daysInStage > 14) return 'Review blocker: stuck in this stage for more than 14 days'
  if (candidate.current_stage === 'preseleccionado') return 'Request required documents'
  if (candidate.current_stage === 'docs_revision' && validDocs < 5) return `Validate missing documents (${validDocs}/5 complete)`
  if (candidate.current_stage === 'docs_validados') return 'Schedule interview with Country Manager'
  if (candidate.current_stage === 'entrevista_programada') return 'Conduct interview and record evaluation'
  if (candidate.current_stage === 'entrevista_realizada' && !evaluation) return 'Complete 100-point evaluation'
  if (candidate.current_stage === 'entrevista_realizada' && evaluation) return 'Send to Director review'
  if (candidate.current_stage === 'revision_director') return 'Register Continental Director decision'
  if (candidate.current_stage === 'aprobado_director') return 'Start B211A visa and pre-travel preparation'
  if (candidate.current_stage === 'visa_tramite') return 'Confirm visa and contract progress'
  if (candidate.current_stage === 'contrato_firmado') return 'Prepare information submission to BIU'
  if (candidate.current_stage === 'info_biu') return 'Confirm LOA/LOI and travel plan'
  if (candidate.current_stage?.startsWith('indonesia_')) return 'Review student monthly report'
  return 'Review next step'
}

function ActionQueue({ candidates, meta }) {
  const items = candidates
    .map((candidate) => ({ candidate, meta: meta[candidate.id] || {} }))
    .filter(({ meta }) => meta.nextAction)
    .sort((a, b) => {
      const aDays = a.meta.daysInStage ?? 0
      const bDays = b.meta.daysInStage ?? 0
      return bDays - aDays
    })
    .slice(0, 5)

  if (items.length === 0) return null

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Recommended actions</h3>
          <p className="text-xs text-slate-500">The cases worth reviewing first.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {items.map(({ candidate, meta }) => (
          <Link
            key={candidate.id}
            to={`/candidatos/${candidate.id}`}
            className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:border-iera-cyan hover:bg-slate-50 transition"
          >
            <div className={`mt-0.5 w-2 h-2 rounded-full ${meta.daysInStage > 14 ? 'bg-red-500' : 'bg-iera-cyan'}`} />
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate">{candidate.full_name}</div>
              <div className="text-xs text-slate-600">{meta.nextAction}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{candidate.countries?.name || 'No country'} · {stageLabel(candidate.current_stage)}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function PhaseChip({ active, onClick, label, count, color }) {
  const activeStyle = color
    ? phaseColors[color]
    : 'bg-iera-500 text-white border-iera-500'
  const baseStyle = active
    ? activeStyle
    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${baseStyle}`}
    >
      <span>{label}</span>
      <span className={`px-1.5 rounded-full text-[10px] font-bold min-w-[18px] text-center ${
        active ? 'bg-white/30 text-current' : 'bg-slate-100 text-slate-700'
      }`}>
        {count}
      </span>
    </button>
  )
}

function TableView({ candidates, meta }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left px-4 py-3 font-semibold text-slate-700">Candidate</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-700">Country</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-700">Current stage</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-700">Next action</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-700">Time</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c) => {
            const m = meta[c.id] || {}
            const stage = STAGES.find((s) => s.id === c.current_stage)
            const phaseColorClass = m.phase ? phaseColors[m.phase.color] : 'bg-slate-100 text-slate-700'
            return (
              <tr
                key={c.id}
                className="border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer"
                onClick={() => window.location.href = `/candidatos/${c.id}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-iera-100 text-iera-700 flex items-center justify-center font-bold text-xs">
                      {initials(c.full_name)}
                    </div>
                    <div>
                      <div className="font-semibold">{c.full_name}</div>
                      <div className="text-xs text-slate-500">{c.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{c.countries?.name || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-1 rounded-md text-xs font-semibold border ${phaseColorClass}`}>
                    {stage?.shortLabel || c.current_stage}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs font-semibold text-slate-700 mb-1">{m.nextAction}</div>
                  <div className="flex gap-1.5 flex-wrap">
                    <Badge
                      label={`Docs ${m.validDocs ?? 0}/5`}
                      color={m.validDocs === 5 ? 'green' : m.validDocs >= 3 ? 'amber' : 'red'}
                      title="Validated documents"
                    />
                    {m.score !== undefined && m.score !== null && (
                      <Badge
                        label={`Score ${m.score}`}
                        color={m.score >= 70 ? 'green' : m.score >= 60 ? 'amber' : 'red'}
                        title="Evaluation score"
                      />
                    )}
                    {m.recommendation && (
                      <Badge
                        label={
                          m.recommendation === 'selected' ? '✓' :
                          m.recommendation === 'waitlist' ? '⏱' : '✗'
                        }
                        color={
                          m.recommendation === 'selected' ? 'green' :
                          m.recommendation === 'waitlist' ? 'amber' : 'red'
                        }
                      />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {m.daysInStage !== null && m.daysInStage !== undefined && (
                    <Badge
                      label={`${m.daysInStage}d`}
                      color={m.daysInStage > 14 ? 'red' : m.daysInStage > 7 ? 'amber' : 'gray'}
                      title="Days in this stage"
                    />
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to={`/candidatos/${c.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-iera-700 hover:text-iera-500 font-semibold text-xs"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function CardsView({ candidates, meta }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {candidates.map((c) => {
        const m = meta[c.id] || {}
        const stage = STAGES.find((s) => s.id === c.current_stage)
        const phaseColorClass = m.phase ? phaseColors[m.phase.color] : 'bg-slate-100 text-slate-700'
        return (
          <Link
            key={c.id}
            to={`/candidatos/${c.id}`}
            className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-iera-300 transition"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-iera-100 text-iera-700 flex items-center justify-center font-bold">
                {initials(c.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{c.full_name}</div>
                <div className="text-xs text-slate-500 truncate">{c.email}</div>
                <div className="text-xs text-slate-500">📍 {c.countries?.name}</div>
              </div>
            </div>
            <div className="mb-3">
              <span className={`inline-block px-2 py-1 rounded-md text-xs font-semibold border ${phaseColorClass}`}>
                {stage?.shortLabel}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
              <div className="w-full text-xs font-semibold text-slate-700 mb-1">{m.nextAction}</div>
              <Badge label={`Docs ${m.validDocs ?? 0}/5`} color={m.validDocs === 5 ? 'green' : m.validDocs >= 3 ? 'amber' : 'red'} />
              {m.score !== undefined && m.score !== null && (
                <Badge label={`Score ${m.score}/100`} color={m.score >= 70 ? 'green' : m.score >= 60 ? 'amber' : 'red'} />
              )}
              {m.daysInStage !== null && m.daysInStage !== undefined && (
                <Badge label={`${m.daysInStage}d in stage`} color={m.daysInStage > 14 ? 'red' : m.daysInStage > 7 ? 'amber' : 'gray'} />
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}

function Badge({ label, color = 'gray', title }) {
  const colors = {
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
    gray: 'bg-slate-100 text-slate-600',
    blue: 'bg-blue-100 text-blue-700'
  }
  return (
    <span title={title} className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${colors[color]}`}>
      {label}
    </span>
  )
}

function initials(name) {
  return (name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('')
}
