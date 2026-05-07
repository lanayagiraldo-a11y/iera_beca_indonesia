import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const FEELING_EMOJIS = { 5: '😄', 4: '🙂', 3: '😐', 2: '😟', 1: '😢' }
const FEELING_LABELS = { 5: 'Very good', 4: 'Good', 3: 'OK', 2: 'Hard', 1: 'Very hard' }

export default function ReportsSection({ candidateId, candidateName }) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [linkCopied, setLinkCopied] = useState(false)

  const reportLink = `${window.location.origin}/reportar/${candidateId}`

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('student_reports')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('submitted_at', { ascending: false })
    setReports(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [candidateId])

  const copyLink = () => {
    navigator.clipboard.writeText(reportLink)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const markReviewed = async (reportId, comment) => {
    await supabase
      .from('student_reports')
      .update({ reviewed_by_manager: true, manager_comment: comment || null })
      .eq('id', reportId)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-iera-50 to-white border border-iera-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🔗</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-iera-800 text-sm">Student monthly link</h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Share this link each month. The student opens it and reports without login.
            </p>
            <div className="mt-3 bg-white border border-slate-200 rounded-md px-2 py-1.5 text-[10px] font-mono break-all text-slate-600">
              {reportLink}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <button
                onClick={copyLink}
                className="text-xs bg-iera-500 hover:bg-iera-700 text-white px-3 py-1.5 rounded-md font-semibold"
              >
                {linkCopied ? '✓ Copied' : '📋 Copy link'}
              </button>
              <a
                href={reportLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-md font-semibold"
              >
                👁 Open form
              </a>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-sm mb-3">📨 Received reports ({reports.length})</h3>
        {loading ? (
          <div className="text-center py-6 text-sm text-slate-400">Loading...</div>
        ) : reports.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center">
            <div className="text-3xl mb-2">📭</div>
            <p className="text-sm text-slate-500">No student reports yet</p>
            <p className="text-xs text-slate-400 mt-1">Share the link above to start receiving them</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => <ReportCard key={r.id} report={r} onMarkReviewed={markReviewed} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function ReportCard({ report, onMarkReviewed }) {
  const [showComment, setShowComment] = useState(false)
  const [comment, setComment] = useState(report.manager_comment || '')
  const submittedDate = new Date(report.submitted_at)

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center gap-3">
        <div className="text-3xl">{FEELING_EMOJIS[report.feeling_score] || '📝'}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm">Month {report.month_number || '—'}</span>
            {report.feeling_score && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                report.feeling_score >= 4 ? 'bg-green-100 text-green-700' :
                report.feeling_score === 3 ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                {FEELING_LABELS[report.feeling_score]}
              </span>
            )}
            {report.reviewed_by_manager && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-iera-100 text-iera-700 font-bold">
                ✓ Reviewed
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500">
            {submittedDate.toLocaleDateString('en', { day: '2-digit', month: 'short', year: 'numeric' })} ·{' '}
            {submittedDate.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
      <div className="p-4 space-y-3 text-sm">
        <div>
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">📚 What I learned</div>
          <p className="text-slate-700 whitespace-pre-wrap">{report.what_learned}</p>
        </div>
        {report.difficulties && (
          <div>
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">⚠️ Difficulties</div>
            <p className="text-slate-700 whitespace-pre-wrap">{report.difficulties}</p>
          </div>
        )}
        {report.feeling && (
          <div>
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">💚 How I feel</div>
            <p className="text-slate-700 whitespace-pre-wrap italic">"{report.feeling}"</p>
          </div>
        )}
      </div>

      <div className="px-4 pb-4 border-t border-slate-100 pt-3">
        {report.manager_comment && !showComment ? (
          <div className="bg-iera-50 rounded-lg p-3 text-xs">
            <div className="font-bold text-iera-700 mb-1">💬 Manager comment:</div>
            <p className="text-slate-700">{report.manager_comment}</p>
            <button onClick={() => setShowComment(true)} className="text-[10px] text-iera-700 font-semibold mt-1.5">
              ✎ Edit
            </button>
          </div>
        ) : showComment ? (
          <div className="space-y-2">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="input-base min-h-[60px] text-xs"
              placeholder="Add comment or feedback for the student (private)"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowComment(false)} className="text-[11px] text-slate-500 hover:text-slate-700">
                Cancel
              </button>
              <button
                onClick={() => { onMarkReviewed(report.id, comment); setShowComment(false) }}
                className="text-xs bg-iera-500 hover:bg-iera-700 text-white px-3 py-1 rounded-md font-semibold"
              >
                ✓ Mark reviewed
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowComment(true)}
            className="text-xs text-iera-700 hover:text-iera-500 font-semibold"
          >
            💬 Add comment and mark reviewed
          </button>
        )}
      </div>
    </div>
  )
}
