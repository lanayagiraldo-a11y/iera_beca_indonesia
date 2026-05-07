import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { STAGES, stageLabel } from '../lib/constants'

const PHASES = [
  { id: 'postulacion', label: '📝 Application', color: 'slate',   stages: ['inscrito', 'preseleccionado'] },
  { id: 'revision',    label: '📂 Review',      color: 'amber',   stages: ['docs_revision', 'docs_validados', 'entrevista_programada', 'entrevista_realizada'] },
  { id: 'aprobacion',  label: '👔 Approval',    color: 'fuchsia', stages: ['revision_director', 'aprobado_director'] },
  { id: 'previaje',    label: '✈️ Pre-travel',  color: 'cyan',    stages: ['visa_tramite', 'contrato_firmado', 'info_biu'] },
  { id: 'indonesia',   label: '🇮🇩 Indonesia',  color: 'orange',  stages: ['indonesia_m1', 'indonesia_m2', 'indonesia_m3', 'graduado'] }
]

const phaseColors = {
  slate:   { bg: 'bg-slate-100', text: 'text-slate-700', accent: 'bg-slate-500', border: 'border-slate-300' },
  amber:   { bg: 'bg-amber-100', text: 'text-amber-800', accent: 'bg-amber-500', border: 'border-amber-300' },
  fuchsia: { bg: 'bg-fuchsia-100', text: 'text-fuchsia-800', accent: 'bg-fuchsia-500', border: 'border-fuchsia-300' },
  cyan:    { bg: 'bg-cyan-100', text: 'text-cyan-800', accent: 'bg-cyan-500', border: 'border-cyan-300' },
  orange:  { bg: 'bg-orange-100', text: 'text-orange-800', accent: 'bg-orange-500', border: 'border-orange-300' },
  green:   { bg: 'bg-green-100', text: 'text-green-800', accent: 'bg-green-500', border: 'border-green-300' }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState([])
  const [countries, setCountries] = useState([])
  const [documents, setDocuments] = useState([])
  const [evaluations, setEvaluations] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [showActivity, setShowActivity] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('candidates').select('*, countries(name, code)'),
      supabase.from('countries').select('*').order('name'),
      supabase.from('documents').select('candidate_id, status, type'),
      supabase.from('evaluations').select('candidate_id, total_score, recommendation'),
      supabase.from('stages_history').select('*, candidates(full_name, countries(name))').order('changed_at', { ascending: false }).limit(10)
    ]).then(([c, p, d, e, h]) => {
      setCandidates(c.data || [])
      setCountries(p.data || [])
      setDocuments(d.data || [])
      setEvaluations(e.data || [])
      setHistory(h.data || [])
      setLoading(false)
    })
  }, [])

  const meta = useMemo(() => {
    const map = {}
    for (const c of candidates) {
      const docs = documents.filter((d) => d.candidate_id === c.id)
      const validRequired = docs.filter((d) => d.status === 'valid' && ['passport', 'tazkiyah', 'background_check', 'availability_decl', 'photo'].includes(d.type)).length
      const evalu = evaluations.find((e) => e.candidate_id === c.id)
      const stageEntries = history.filter((h) => h.candidate_id === c.id && h.to_stage === c.current_stage)
      const lastEntry = stageEntries.sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at))[0]
      const daysInStage = lastEntry ? Math.floor((new Date() - new Date(lastEntry.changed_at)) / (1000 * 60 * 60 * 24)) : null
      map[c.id] = {
        validDocs: validRequired,
        score: evalu?.total_score,
        daysInStage,
        recommendation: evalu?.recommendation
      }
    }
    return map
  }, [candidates, documents, evaluations, history])

  const stats = useMemo(() => {
    const total = candidates.length
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const newThisWeek = candidates.filter((c) => new Date(c.created_at) >= oneWeekAgo).length
    const inIndonesia = candidates.filter((c) => ['indonesia_m1', 'indonesia_m2', 'indonesia_m3'].includes(c.current_stage)).length
    const graduated = candidates.filter((c) => c.current_stage === 'graduado').length
    const rejected = candidates.filter((c) => ['rechazado', 'auto_rechazado', 'abandono_reembolso'].includes(c.current_stage)).length

    const evaluated = evaluations.filter((e) => e.total_score !== null)
    const avgScore = evaluated.length > 0
      ? Math.round(evaluated.reduce((sum, e) => sum + e.total_score, 0) / evaluated.length)
      : null
    const aptos = evaluations.filter((e) => e.total_score >= 70).length
    const aptosPct = evaluated.length > 0 ? Math.round((aptos / evaluated.length) * 100) : null

    const totalActiveOrDone = total - rejected
    const conversionPct = totalActiveOrDone > 0 ? Math.round((graduated / totalActiveOrDone) * 100) : 0

    return { total, newThisWeek, inIndonesia, graduated, rejected, avgScore, aptosPct, evaluated: evaluated.length, conversionPct }
  }, [candidates, evaluations])

  const attention = useMemo(() => {
    const stuck = candidates.filter((c) => meta[c.id]?.daysInStage > 14)
    const docsReview = candidates.filter((c) => c.current_stage === 'docs_revision')
    const directorPending = candidates.filter((c) => c.current_stage === 'revision_director')
    const expiringSoon = candidates.filter((c) => {
      if (!c.passport_expiry) return false
      const daysToExpiry = (new Date(c.passport_expiry) - new Date()) / (1000 * 60 * 60 * 24)
      return daysToExpiry < 180 && daysToExpiry > 0
    })
    return { stuck, docsReview, directorPending, expiringSoon }
  }, [candidates, meta])

  const phaseDistribution = useMemo(() => {
    return PHASES.map((p) => ({
      ...p,
      count: candidates.filter((c) => p.stages.includes(c.current_stage)).length
    }))
  }, [candidates])

  const countryStats = useMemo(() => {
    return countries.map((country) => {
      const candidatesOfCountry = candidates.filter((c) => c.country_id === country.id)
      const phasesCount = PHASES.map((p) => ({
        phaseId: p.id,
        phaseColor: p.color,
        count: candidatesOfCountry.filter((c) => p.stages.includes(c.current_stage)).length
      }))
      return {
        ...country,
        total: candidatesOfCountry.length,
        phases: phasesCount
      }
    }).sort((a, b) => b.total - a.total)
  }, [countries, candidates])

  if (loading) return <div className="text-center py-12 text-slate-400">Loading dashboard...</div>

  return (
    <div>
      {/* HEADER */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">
            Dawah Pioneers Indonesia 2026 Program · {countries.length} active countries
          </p>
        </div>
        <button onClick={() => navigate('/candidatos/nuevo')} className="btn-primary">
          + New candidate
        </button>
      </div>

      {/* HERO KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <KpiCard
          icon="👥"
          label="Total candidates"
          value={stats.total}
          subtitle={stats.newThisWeek > 0 ? `+${stats.newThisWeek} this week` : 'No new candidates'}
          subtitleColor={stats.newThisWeek > 0 ? 'text-green-600' : 'text-slate-400'}
        />
        <KpiCard
          icon="🇮🇩"
          label="In Indonesia"
          value={stats.inIndonesia}
          subtitle="In program"
        />
        <KpiCard
          icon="🎓"
          label="Graduated"
          value={stats.graduated}
          subtitle={`${stats.conversionPct}% conversion`}
          subtitleColor="text-iera-600"
        />
        <KpiCard
          icon="⭐"
          label="Average score"
          value={stats.avgScore !== null ? stats.avgScore : '—'}
          subtitle={stats.evaluated > 0 ? `${stats.aptosPct}% qualified (≥70)` : 'No evaluations yet'}
          subtitleColor={stats.aptosPct >= 70 ? 'text-green-600' : 'text-slate-500'}
        />
        <KpiCard
          icon="✗"
          label="Rejected"
          value={stats.rejected}
          subtitle="Did not advance"
          subtitleColor="text-slate-400"
        />
      </div>

      {/* NEEDS ATTENTION */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              ⚠️ Needs your attention
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Pending actions and at-risk cases</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <AttentionCard
            label="Stuck >14 days"
            count={attention.stuck.length}
            description="Candidates without recent advance"
            color="red"
            onClick={() => navigate('/candidatos?sort=activity')}
          />
          <AttentionCard
            label="Docs to review"
            count={attention.docsReview.length}
            description="Awaiting Manager validation"
            color="amber"
            onClick={() => navigate('/candidatos?phase=revision')}
          />
          <AttentionCard
            label="Director pending"
            count={attention.directorPending.length}
            description="Awaiting Continental Director decision"
            color="fuchsia"
            onClick={() => navigate('/candidatos?phase=aprobacion')}
          />
          <AttentionCard
            label="Passports expiring"
            count={attention.expiringSoon.length}
            description="Expire in less than 6 months"
            color="orange"
            onClick={() => navigate('/candidatos')}
          />
        </div>
      </div>

      {/* CONVERSION FUNNEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="card col-span-2">
          <div className="card-header">
            <h3 className="font-bold">Conversion funnel</h3>
            <p className="text-xs text-slate-500 mt-0.5">Distribution across program phases</p>
          </div>
          <div className="card-body space-y-3">
            {phaseDistribution.map((phase) => {
              const c = phaseColors[phase.color]
              const maxCount = Math.max(...phaseDistribution.map((p) => p.count), 1)
              const widthPct = (phase.count / maxCount) * 100
              const totalPct = stats.total > 0 ? (phase.count / stats.total) * 100 : 0
              return (
                <div key={phase.id}>
                  <div className="flex justify-between items-center mb-1">
                    <div className={`text-sm font-bold ${c.text}`}>{phase.label}</div>
                    <div className="text-xs text-slate-500">
                      <strong className={c.text}>{phase.count}</strong> candidate(s) · {totalPct.toFixed(0)}% of total
                    </div>
                  </div>
                  <div className="h-7 bg-slate-100 rounded-md overflow-hidden flex items-center">
                    <div
                      className={`h-full ${c.accent} transition-all duration-500 flex items-center px-2`}
                      style={{ width: `${widthPct}%`, minWidth: phase.count > 0 ? '60px' : '0' }}
                    >
                      {phase.count > 0 && (
                        <span className="text-white text-xs font-bold">{phase.count}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* QUALITY */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-bold">Pool quality</h3>
            <p className="text-xs text-slate-500 mt-0.5">Evaluation metrics</p>
          </div>
          <div className="card-body space-y-4">
            <div className="text-center">
              <div className="text-5xl font-extrabold text-iera-700">
                {stats.avgScore !== null ? stats.avgScore : '—'}
                <span className="text-lg text-slate-400">/100</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">Average score</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Evaluated candidates</span>
                <strong>{stats.evaluated} of {stats.total}</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span>% Qualified (score ≥70)</span>
                <strong className={stats.aptosPct >= 70 ? 'text-green-600' : 'text-amber-600'}>
                  {stats.aptosPct !== null ? `${stats.aptosPct}%` : '—'}
                </strong>
              </div>
              <div className="flex justify-between text-xs">
                <span>Conversion rate</span>
                <strong className="text-iera-600">{stats.conversionPct}%</strong>
              </div>
            </div>
            {stats.evaluated === 0 && (
              <div className="text-xs text-slate-400 italic text-center pt-2 border-t border-slate-100">
                No evaluations recorded yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* COUNTRIES */}
      <div className="card mb-6">
        <div className="card-header">
          <h3 className="font-bold">By country</h3>
          <p className="text-xs text-slate-500 mt-0.5">Candidate distribution across the 7 program countries</p>
        </div>
        <div className="card-body">
          {countryStats.every((c) => c.total === 0) ? (
            <div className="text-center py-6 text-sm text-slate-400 italic">
              No candidates registered yet
            </div>
          ) : (
            <div className="space-y-2">
              {countryStats.map((country) => (
                <div
                  key={country.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                  onClick={() => navigate(`/candidatos?country=${country.id}`)}
                >
                  <div className="w-32 flex-shrink-0">
                    <div className="text-sm font-semibold">{country.name}</div>
                    <div className="text-[10px] text-slate-500">{country.embassy_location}</div>
                  </div>
                  <div className="flex-1 flex gap-1">
                    {country.phases.map((p) => {
                      const pc = phaseColors[p.phaseColor]
                      if (p.count === 0) return null
                      return (
                        <div
                          key={p.phaseId}
                          className={`${pc.accent} text-white text-xs font-bold px-2 py-0.5 rounded`}
                          title={`${p.phaseId}: ${p.count}`}
                        >
                          {p.count}
                        </div>
                      )
                    })}
                  </div>
                  <div className="text-sm font-bold w-10 text-right">{country.total}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RECENT ACTIVITY — COLLAPSIBLE */}
      <div className="card">
        <button
          onClick={() => setShowActivity(!showActivity)}
          className="w-full card-header flex items-center justify-between hover:bg-slate-100 transition cursor-pointer"
        >
          <div className="text-left">
            <h3 className="font-bold flex items-center gap-2">
              📜 Recent activity
              {history.length > 0 && (
                <span className="bg-iera-100 text-iera-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {history.length}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {showActivity
                ? 'Click to hide'
                : history.length > 0
                ? `Last change: ${timeAgo(history[0].changed_at)} · click to see details`
                : 'No activity recorded yet'}
            </p>
          </div>
          <span className={`text-iera-700 text-lg transition-transform ${showActivity ? 'rotate-180' : ''}`}>
            ⌄
          </span>
        </button>
        {showActivity && (
          <div className="card-body border-t border-slate-200">
            {history.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-400 italic">
                No activity recorded yet
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((entry) => (
                  <Link
                    key={entry.id}
                    to={`/candidatos/${entry.candidate_id}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition border border-slate-100"
                  >
                    <div className="w-9 h-9 rounded-full bg-iera-100 text-iera-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {initials(entry.candidates?.full_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {entry.candidates?.full_name || 'Deleted candidate'}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {entry.from_stage ? (
                          <>{stageLabel(entry.from_stage)} <span className="text-slate-400">→</span> <span className="font-semibold">{stageLabel(entry.to_stage)}</span></>
                        ) : (
                          <>📝 Registered at {stageLabel(entry.to_stage)}</>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-slate-500">
                        {entry.candidates?.countries?.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {timeAgo(entry.changed_at)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function KpiCard({ icon, label, value, subtitle, subtitleColor = 'text-slate-500' }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide font-bold text-slate-600">
        <span>{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div className="text-3xl font-extrabold text-slate-800 mt-2">{value}</div>
      <div className={`text-[11px] mt-1 ${subtitleColor}`}>{subtitle}</div>
    </div>
  )
}

function AttentionCard({ label, count, description, color, onClick }) {
  const colors = {
    red:     { bg: count > 0 ? 'bg-red-50' : 'bg-slate-50',     border: count > 0 ? 'border-red-300' : 'border-slate-200',     text: count > 0 ? 'text-red-700' : 'text-slate-400',     accent: count > 0 ? 'text-red-600' : 'text-slate-300' },
    amber:   { bg: count > 0 ? 'bg-amber-50' : 'bg-slate-50',   border: count > 0 ? 'border-amber-300' : 'border-slate-200',   text: count > 0 ? 'text-amber-800' : 'text-slate-400',   accent: count > 0 ? 'text-amber-600' : 'text-slate-300' },
    fuchsia: { bg: count > 0 ? 'bg-fuchsia-50' : 'bg-slate-50', border: count > 0 ? 'border-fuchsia-300' : 'border-slate-200', text: count > 0 ? 'text-fuchsia-800' : 'text-slate-400', accent: count > 0 ? 'text-fuchsia-600' : 'text-slate-300' },
    orange:  { bg: count > 0 ? 'bg-orange-50' : 'bg-slate-50',  border: count > 0 ? 'border-orange-300' : 'border-slate-200',  text: count > 0 ? 'text-orange-800' : 'text-slate-400',  accent: count > 0 ? 'text-orange-600' : 'text-slate-300' }
  }[color]

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border-2 ${colors.bg} ${colors.border} text-left hover:shadow-md transition`}
    >
      <div className={`text-3xl font-extrabold ${colors.accent}`}>{count}</div>
      <div className={`text-sm font-bold mt-1 ${colors.text}`}>{label}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{description}</div>
      {count > 0 && (
        <div className={`text-[11px] font-semibold mt-2 ${colors.text}`}>
          Click to review →
        </div>
      )}
    </button>
  )
}

function initials(name) {
  return (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('')
}

function timeAgo(dateStr) {
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en', { day: '2-digit', month: 'short' })
}
