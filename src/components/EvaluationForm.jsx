import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { PRIORITY_CRITERIA } from '../lib/constants'

const BLOCKS = [
  {
    title: '📖 Islamic Knowledge',
    max: 30,
    fields: [
      { key: 'knowledge_pillars',     label: 'Pillars of Islam and Faith',           sub: '5 pillars + 6 pillars of Iman',          max: 10 },
      { key: 'knowledge_purification', label: 'Purification and prayer',             sub: 'Tahara and correct Salat',                max: 8 },
      { key: 'knowledge_quran',       label: 'Quran knowledge',                      sub: 'Basic recognition, reading',              max: 6 },
      { key: 'knowledge_seerah',      label: 'Prophet Muhammad (S.A.W.) history',    sub: 'General Sirah',                           max: 6 }
    ]
  },
  {
    title: '👤 Personal Profile',
    max: 25,
    fields: [
      { key: 'personal_character',   label: 'Character and reputation',  sub: 'Confirm with Tazkiyah sheikh',  max: 10 },
      { key: 'personal_stability',   label: 'Stability and maturity',    sub: 'Response to hypothetical questions', max: 8 },
      { key: 'personal_adaptation',  label: 'Cultural adaptation',       sub: 'Multicultural ability',         max: 7 }
    ]
  },
  {
    title: '🎯 Dawah Motivation',
    max: 25,
    fields: [
      { key: 'motivation_clarity',    label: 'Clarity of purpose',          sub: 'Why dawah',                 max: 10 },
      { key: 'motivation_experience', label: 'Previous dawah experience',   sub: 'Past Islamic work',         max: 8 },
      { key: 'motivation_vision',     label: 'Future impact vision',        sub: 'Plan upon returning home',  max: 7 }
    ]
  },
  {
    title: '✅ Mandatory Requirements',
    max: 20,
    fields: [
      { key: 'requirements_docs',         label: 'Complete documentation',  sub: '5 required documents valid',          max: 10 },
      { key: 'requirements_availability', label: 'Confirmed availability',  sub: 'No work/family obstacles',            max: 10 }
    ]
  }
]

const ALL_FIELDS = BLOCKS.flatMap((b) => b.fields)

export default function EvaluationForm({ candidate, onChange }) {
  const [evaluation, setEvaluation] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState(null)

  const priorityBonus = PRIORITY_CRITERIA.reduce(
    (sum, c) => sum + (candidate[c.key] ? c.points : 0),
    0
  )

  useEffect(() => {
    supabase
      .from('evaluations')
      .select('*')
      .eq('candidate_id', candidate.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setEvaluation(data)
          setForm(data)
          setEditing(false)
        } else {
          setEditing(true)
          setForm({
            evaluator_name: '',
            interview_date: new Date().toISOString().split('T')[0],
            recommendation: '',
            comments: '',
            ...Object.fromEntries(ALL_FIELDS.map((f) => [f.key, 0]))
          })
        }
      })
  }, [candidate.id])

  const totalScore = ALL_FIELDS.reduce((sum, f) => sum + (parseInt(form[f.key]) || 0), 0)
  const finalScore = totalScore + priorityBonus

  const verdict =
    totalScore >= 70 ? { label: '✓ QUALIFIED FOR SELECTION', detail: 'Score ≥70 · Recommended for Continental Director', color: 'green' } :
    totalScore >= 60 ? { label: '⚠ REVIEW REQUIRED', detail: 'Score 60-69 · Needs second opinion', color: 'amber' } :
                       { label: '✗ NOT QUALIFIED', detail: 'Score <60 · Does not advance', color: 'red' }

  const verdictStyles = {
    green: 'bg-green-50 border-green-200 text-green-800',
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    red: 'bg-red-50 border-red-200 text-red-800'
  }

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const blockTotal = (block) => block.fields.reduce((sum, f) => sum + (parseInt(form[f.key]) || 0), 0)

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        candidate_id: candidate.id,
        evaluator_name: form.evaluator_name || null,
        interview_date: form.interview_date || null,
        recommendation: form.recommendation || null,
        comments: form.comments || null,
        priority_bonus: priorityBonus,
        ...Object.fromEntries(ALL_FIELDS.map((f) => [f.key, parseInt(form[f.key]) || 0]))
      }
      if (evaluation) {
        const { error: e } = await supabase.from('evaluations').update(payload).eq('id', evaluation.id)
        if (e) throw e
      } else {
        const { error: e } = await supabase.from('evaluations').insert(payload)
        if (e) throw e
      }
      const { data } = await supabase
        .from('evaluations')
        .select('*')
        .eq('candidate_id', candidate.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      setEvaluation(data)
      setEditing(false)
      onChange?.()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Error saving')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card">
      <div className="card-header flex justify-between items-center">
        <div>
          <h3 className="font-bold">Evaluation form · 100 pts</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {evaluation ? `Last update: ${new Date(evaluation.updated_at).toLocaleString('en')}` : 'No previous evaluation'}
          </p>
        </div>
        {evaluation && !editing && (
          <button onClick={() => setEditing(true)} className="btn-secondary text-xs">
            ✎ Edit
          </button>
        )}
      </div>
      <div className="card-body">
        <div className={`mb-5 p-4 rounded-xl border-2 ${verdictStyles[verdict.color]}`}>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs uppercase tracking-wider opacity-80 font-bold">Total score</div>
              <div className="text-4xl font-extrabold mt-1">
                {totalScore}<span className="text-xl opacity-60">/100</span>
              </div>
              <div className="text-xs mt-1 opacity-80">
                + Priority bonus: <strong>+{priorityBonus}</strong> · Final total: <strong>{finalScore}</strong>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-base">{verdict.label}</div>
              <div className="text-xs opacity-80 mt-0.5">{verdict.detail}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="label-base">Evaluator / Manager</label>
            <input
              className="input-base"
              value={form.evaluator_name || ''}
              onChange={(e) => update('evaluator_name', e.target.value)}
              disabled={!editing}
              placeholder="Country Manager name"
            />
          </div>
          <div>
            <label className="label-base">Interview date</label>
            <input
              type="date"
              className="input-base"
              value={form.interview_date || ''}
              onChange={(e) => update('interview_date', e.target.value)}
              disabled={!editing}
            />
          </div>
        </div>

        {BLOCKS.map((block) => (
          <div key={block.title} className="mb-5">
            <div className="flex justify-between items-center pb-2 border-b-2 border-iera-500 mb-2">
              <h4 className="font-bold text-iera-700">{block.title}</h4>
              <span className="bg-iera-100 text-iera-700 px-3 py-1 rounded-full text-xs font-bold">
                {blockTotal(block)} / {block.max}
              </span>
            </div>
            {block.fields.map((field) => {
              const val = parseInt(form[field.key]) || 0
              const pct = (val / field.max) * 100
              return (
                <div key={field.key} className="grid grid-cols-[2fr,80px,1fr] gap-3 items-center py-2 border-b border-slate-100">
                  <div>
                    <div className="text-sm font-medium">{field.label}</div>
                    <div className="text-[11px] text-slate-500">{field.sub}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max={field.max}
                      value={val}
                      onChange={(e) => update(field.key, Math.min(field.max, Math.max(0, parseInt(e.target.value) || 0)))}
                      disabled={!editing}
                      className="w-14 px-2 py-1 text-center border border-slate-300 rounded-md text-sm font-bold disabled:bg-slate-50"
                    />
                    <span className="text-slate-500 text-xs">/{field.max}</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-iera-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        ))}

        <div className="bg-slate-50 rounded-lg p-4">
          <label className="label-base">Manager final recommendation</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
            {[
              { value: 'selected', label: '✓ SELECTED', color: 'green' },
              { value: 'waitlist', label: '⏱ WAITLIST', color: 'amber' },
              { value: 'rejected', label: '✗ NOT SELECTED', color: 'red' }
            ].map((opt) => (
              <label
                key={opt.value}
                className={`p-3 border-2 rounded-lg text-center cursor-pointer text-sm font-semibold transition ${
                  form.recommendation === opt.value
                    ? `border-${opt.color}-500 bg-${opt.color}-50 text-${opt.color}-700`
                    : 'border-slate-200 hover:border-iera-500'
                } ${!editing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="recommendation"
                  value={opt.value}
                  checked={form.recommendation === opt.value}
                  onChange={(e) => update('recommendation', e.target.value)}
                  disabled={!editing}
                  className="hidden"
                />
                {opt.label}
              </label>
            ))}
          </div>

          <label className="label-base">Comments and observations</label>
          <textarea
            className="input-base min-h-[80px]"
            value={form.comments || ''}
            onChange={(e) => update('comments', e.target.value)}
            disabled={!editing}
            placeholder="Interview notes, strengths, areas to improve, special context..."
          />
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            ⚠ {error}
          </div>
        )}

        {editing && (
          <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-slate-200">
            {evaluation && (
              <button onClick={() => { setEditing(false); setForm(evaluation) }} className="btn-secondary">
                Cancel
              </button>
            )}
            <button onClick={save} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : evaluation ? 'Update evaluation' : 'Save evaluation'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
