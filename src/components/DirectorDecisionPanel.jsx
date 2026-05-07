import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { DIRECTOR_NAME } from '../lib/team'

export default function DirectorDecisionPanel({ candidate, evaluation, onChange }) {
  const [decisions, setDecisions] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ decision: '', notes: '', director_name: DIRECTOR_NAME })

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('director_decisions')
      .select('*')
      .eq('candidate_id', candidate.id)
      .order('decided_at', { ascending: false })
    setDecisions(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [candidate.id])

  const submit = async () => {
    if (!form.decision || !form.director_name) {
      alert('You must select a decision and enter your name')
      return
    }
    setSubmitting(true)
    try {
      const { error: insertError } = await supabase.from('director_decisions').insert({
        candidate_id: candidate.id,
        decision: form.decision,
        director_name: form.director_name,
        notes: form.notes || null
      })
      if (insertError) throw insertError

      const newStage = {
        approved: 'aprobado_director',
        rejected: 'rechazado',
        waitlist: 'lista_espera'
      }[form.decision]

      await supabase.from('candidates').update({ current_stage: newStage }).eq('id', candidate.id)
      await supabase.from('stages_history').insert({
        candidate_id: candidate.id,
        from_stage: candidate.current_stage,
        to_stage: newStage,
        changed_by: form.director_name + ' (Director)',
        notes: `Decision: ${form.decision}${form.notes ? ' · ' + form.notes : ''}`
      })

      setShowForm(false)
      setForm({ decision: '', notes: '', director_name: DIRECTOR_NAME })
      onChange?.()
    } catch (err) {
      alert('Error saving decision: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const isInDirectorReview = candidate.current_stage === 'revision_director'
  const hasDecision = decisions.length > 0

  if (!isInDirectorReview && !hasDecision) return null

  return (
    <div className="bg-gradient-to-br from-fuchsia-50 to-purple-50 border-2 border-fuchsia-200 rounded-xl overflow-hidden">
      <div className="p-5 border-b border-fuchsia-200">
        <div className="flex items-center gap-3">
          <div className="text-3xl">👔</div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-fuchsia-900">Continental Director Decision</h3>
            <p className="text-sm text-fuchsia-700">
              {isInDirectorReview
                ? 'This candidate is awaiting your final decision.'
                : 'History of Director decisions.'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5">
        {isInDirectorReview && evaluation && (
          <div className="mb-4 p-4 bg-white rounded-lg border border-fuchsia-100">
            <div className="text-xs uppercase tracking-wide font-bold text-slate-500 mb-2">
              Decision summary
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-slate-500">Evaluation score</div>
                <div className="text-2xl font-extrabold text-fuchsia-700">
                  {evaluation.total_score}<span className="text-sm text-slate-400">/100</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Priority bonus</div>
                <div className="text-2xl font-extrabold text-fuchsia-700">
                  +{evaluation.priority_bonus || 0}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Manager recommendation</div>
                <div className="text-base font-bold text-fuchsia-700 mt-1">
                  {evaluation.recommendation === 'selected' && '✓ Selected'}
                  {evaluation.recommendation === 'waitlist' && '⏱ Waitlist'}
                  {evaluation.recommendation === 'rejected' && '✗ Not selected'}
                  {!evaluation.recommendation && <span className="text-slate-400 text-sm italic">Not registered</span>}
                </div>
              </div>
            </div>
            {evaluation.comments && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="text-xs text-slate-500 mb-1">Manager comments:</div>
                <p className="text-sm text-slate-700 italic">"{evaluation.comments}"</p>
              </div>
            )}
          </div>
        )}

        {hasDecision && (
          <div className="mb-4">
            <div className="text-xs uppercase tracking-wide font-bold text-slate-500 mb-2">
              Recorded decisions
            </div>
            <div className="space-y-2">
              {decisions.map((d) => (
                <DecisionCard key={d.id} decision={d} />
              ))}
            </div>
          </div>
        )}

        {isInDirectorReview && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-3 rounded-lg transition"
          >
            ⚖ Make decision as Director
          </button>
        )}

        {showForm && (
          <div className="bg-white rounded-lg p-5 border-2 border-fuchsia-300 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Your name (Continental Director) <span className="text-red-500">*</span>
              </label>
              <input
                className="input-base"
                value={form.director_name}
                onChange={(e) => setForm({ ...form, director_name: e.target.value })}
                placeholder="e.g. Sheikh Abdullah"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Decision <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <DecisionRadio
                  value="approved"
                  current={form.decision}
                  onChange={(v) => setForm({ ...form, decision: v })}
                  label="✓ APPROVE"
                  detail="Move to visa process"
                  color="green"
                />
                <DecisionRadio
                  value="waitlist"
                  current={form.decision}
                  onChange={(v) => setForm({ ...form, decision: v })}
                  label="⏱ WAITLIST"
                  detail="Not in this cohort"
                  color="amber"
                />
                <DecisionRadio
                  value="rejected"
                  current={form.decision}
                  onChange={(v) => setForm({ ...form, decision: v })}
                  label="✗ REJECT"
                  detail="Does not advance"
                  color="red"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Justification / Comments
              </label>
              <textarea
                className="input-base min-h-[80px]"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Briefly explain the reason for your decision (recorded for auditing)"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setShowForm(false)} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={submitting || !form.decision || !form.director_name}
                className="bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-sm"
              >
                {submitting ? 'Saving...' : 'Confirm decision'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DecisionCard({ decision }) {
  const config = {
    approved: { label: '✓ APPROVED', color: 'bg-green-100 text-green-800 border-green-300' },
    rejected: { label: '✗ REJECTED', color: 'bg-red-100 text-red-800 border-red-300' },
    waitlist: { label: '⏱ WAITLIST', color: 'bg-amber-100 text-amber-800 border-amber-300' }
  }[decision.decision]

  return (
    <div className={`p-3 rounded-lg border ${config.color}`}>
      <div className="flex justify-between items-start mb-1">
        <div className="font-bold text-sm">{config.label}</div>
        <div className="text-[10px] opacity-70">
          {new Date(decision.decided_at).toLocaleString('en', { dateStyle: 'short', timeStyle: 'short' })}
        </div>
      </div>
      <div className="text-xs opacity-80">by {decision.director_name}</div>
      {decision.notes && (
        <div className="text-xs italic mt-2 pt-2 border-t border-current/10">
          "{decision.notes}"
        </div>
      )}
    </div>
  )
}

function DecisionRadio({ value, current, onChange, label, detail, color }) {
  const colors = {
    green: 'border-green-500 bg-green-50 text-green-700',
    amber: 'border-amber-500 bg-amber-50 text-amber-700',
    red:   'border-red-500 bg-red-50 text-red-700'
  }
  const isActive = current === value
  return (
    <label
      onClick={() => onChange(value)}
      className={`p-3 border-2 rounded-lg text-center cursor-pointer transition ${
        isActive
          ? colors[color]
          : 'border-slate-200 hover:border-slate-400'
      }`}
    >
      <div className="font-bold text-sm">{label}</div>
      <div className="text-[10px] opacity-80 mt-0.5">{detail}</div>
    </label>
  )
}
