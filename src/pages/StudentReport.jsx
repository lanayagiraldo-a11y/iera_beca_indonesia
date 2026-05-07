import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const FEELING_SCORES = [
  { value: 5, emoji: '😄', label: 'Very good' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 3, emoji: '😐', label: 'OK' },
  { value: 2, emoji: '😟', label: 'Hard' },
  { value: 1, emoji: '😢', label: 'Very hard' }
]

export default function StudentReport() {
  const { candidateId } = useParams()
  const [candidate, setCandidate] = useState(null)
  const [recentReports, setRecentReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    month_number: '',
    what_learned: '',
    difficulties: '',
    feeling: '',
    feeling_score: ''
  })

  useEffect(() => {
    Promise.all([
      supabase.from('candidates').select('full_name, current_stage, countries(name)').eq('id', candidateId).single(),
      supabase.from('student_reports').select('month_number, submitted_at').eq('candidate_id', candidateId).order('submitted_at', { ascending: false }).limit(5)
    ]).then(([c, r]) => {
      setCandidate(c.data)
      setRecentReports(r.data || [])

      const lastMonth = r.data?.[0]?.month_number || 0
      setForm((f) => ({ ...f, month_number: lastMonth + 1 }))
      setLoading(false)
    })
  }, [candidateId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      if (!form.what_learned.trim()) throw new Error('Please tell us what you learned this month')
      if (!form.feeling_score) throw new Error('Please indicate how you feel this month')

      const { error: insertError } = await supabase.from('student_reports').insert({
        candidate_id: candidateId,
        month_number: parseInt(form.month_number) || null,
        what_learned: form.what_learned,
        difficulties: form.difficulties || null,
        feeling: form.feeling || null,
        feeling_score: parseInt(form.feeling_score) || null
      })
      if (insertError) throw insertError
      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Error submitting report')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-iera-50 flex items-center justify-center">
      <div className="text-slate-500">Loading...</div>
    </div>
  }

  if (!candidate) {
    return <div className="min-h-screen bg-iera-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl p-8 text-center max-w-md">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-xl font-bold mb-2">Invalid link</h1>
        <p className="text-sm text-slate-600">This link doesn't match any student. Please contact your Country Manager.</p>
      </div>
    </div>
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 flex items-center justify-center">
        <div className="max-w-lg text-center">
          <img src="/iera-logo.png" alt="iERA" className="h-10 mx-auto mb-4 opacity-80" />
          <div className="text-7xl mb-6">🎉</div>
          <h1 className="text-3xl font-extrabold text-iera-500 mb-3">Report submitted!</h1>
          <p className="text-base text-slate-700 mb-6">
            Thank you <strong>{candidate.full_name}</strong>, your Country Manager will receive your report for month {form.month_number}.
          </p>
          {(parseInt(form.month_number) || 0) < 3 ? (
            <div className="bg-white border border-iera-200 rounded-xl p-5 text-sm text-slate-700">
              <strong className="text-iera-700">Your next report:</strong>
              <p className="mt-1 text-xs">At the start of next month you'll receive a reminder to report month {(parseInt(form.month_number) || 0) + 1}.</p>
            </div>
          ) : (
            <div className="bg-white border border-green-200 rounded-xl p-5 text-sm text-slate-700">
              <strong className="text-green-700">🎓 Final report of the program!</strong>
              <p className="mt-1 text-xs">You've completed the 3 months in Indonesia. May Allah accept your effort and bless your dawah journey.</p>
            </div>
          )}
          <p className="text-xs text-slate-500 mt-6">
            🤲 May Allah bless you · Baraka Allahu feekum
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <img src="/iera-logo.png" alt="iERA" className="h-10 mx-auto mb-3" />
          <div className="text-4xl mb-2">📚</div>
          <h1 className="text-2xl font-extrabold text-iera-500">Monthly report</h1>
          <p className="text-sm text-slate-700 mt-1">
            Hi <strong>{candidate.full_name}</strong> 👋
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Tell us how your month is going in Indonesia · iERA Dawah Pioneers Program
          </p>
        </div>

        {recentReports.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-3 mb-5 text-xs text-slate-600">
            <strong>📜 Previous reports:</strong> {recentReports.map((r) => `Month ${r.month_number}`).join(' · ')}
          </div>
        )}

        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Which month of the program are you reporting?
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="3"
                className="input-base w-20 text-center text-2xl font-bold"
                value={form.month_number}
                onChange={(e) => setForm({ ...form, month_number: e.target.value })}
              />
              <span className="text-sm text-slate-600">of the 3 months of the program</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <label className="block text-sm font-bold text-slate-800 mb-2">
              📚 What did you learn this month? <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-500 mb-3">Share what's most relevant: classes, Quran lessons, fiqh, dawah, what impacted you most.</p>
            <textarea
              className="input-base min-h-[120px]"
              value={form.what_learned}
              onChange={(e) => setForm({ ...form, what_learned: e.target.value })}
              placeholder="This month I went deeper into..."
              required
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <label className="block text-sm font-bold text-slate-800 mb-2">
              ⚠️ Did you have any difficulties?
            </label>
            <p className="text-xs text-slate-500 mb-3">Academic, personal, health, adaptation, language — whatever's relevant. Your Manager can help.</p>
            <textarea
              className="input-base min-h-[100px]"
              value={form.difficulties}
              onChange={(e) => setForm({ ...form, difficulties: e.target.value })}
              placeholder="If everything is fine, leave blank"
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <label className="block text-sm font-bold text-slate-800 mb-2">
              💚 How are you feeling? <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-500 mb-4">Pick the emoji that best describes your month.</p>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {FEELING_SCORES.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setForm({ ...form, feeling_score: f.value })}
                  className={`p-3 rounded-lg border-2 transition text-center ${
                    form.feeling_score == f.value
                      ? 'border-iera-500 bg-iera-50'
                      : 'border-slate-200 hover:border-iera-300'
                  }`}
                >
                  <div className="text-3xl">{f.emoji}</div>
                  <div className="text-[10px] font-semibold mt-1">{f.label}</div>
                </button>
              ))}
            </div>
            <textarea
              className="input-base min-h-[80px] mt-2"
              value={form.feeling}
              onChange={(e) => setForm({ ...form, feeling: e.target.value })}
              placeholder="Optional: tell us why you feel this way"
            />
          </div>

          <div className="flex justify-center pt-2 pb-12">
            <button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-br from-iera-500 to-iera-700 text-white font-bold py-3 px-10 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition disabled:opacity-50"
            >
              {submitting ? '⏳ Sending...' : '📤 Submit report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
