import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { stageLabel } from '../lib/constants'

export default function StageHistory({ candidateId }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('stages_history')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('changed_at', { ascending: false })
      .then(({ data }) => {
        setHistory(data || [])
        setLoading(false)
      })
  }, [candidateId])

  if (loading) {
    return <div className="text-center py-8 text-slate-400 text-sm">Loading history...</div>
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 bg-slate-50 rounded-xl">
        <div className="text-3xl mb-2">📭</div>
        <div className="text-sm text-slate-500">No changes recorded yet</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-slate-600 mb-3">
        Every stage change is automatically recorded for auditing.
      </div>
      {history.map((entry, idx) => (
        <div key={entry.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              idx === 0 ? 'bg-iera-500 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {history.length - idx}
            </div>
            {idx < history.length - 1 && (
              <div className="w-0.5 flex-1 bg-slate-200 mt-1" />
            )}
          </div>
          <div className="flex-1 pb-4">
            <div className="bg-white border border-slate-200 rounded-lg p-3">
              <div className="flex justify-between items-start gap-2 mb-1">
                <div className="text-sm font-bold">
                  {entry.from_stage ? (
                    <>
                      <span className="text-slate-500 font-normal">{stageLabel(entry.from_stage)}</span>
                      <span className="mx-2 text-slate-400">→</span>
                      <span className="text-iera-700">{stageLabel(entry.to_stage)}</span>
                    </>
                  ) : (
                    <span className="text-iera-700">📝 {stageLabel(entry.to_stage)}</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 whitespace-nowrap">
                  {new Date(entry.changed_at).toLocaleString('en', { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </div>
              {entry.notes && (
                <div className="text-xs text-slate-600 mt-1 italic">"{entry.notes}"</div>
              )}
              {entry.changed_by && (
                <div className="text-[10px] text-slate-400 mt-1">by {entry.changed_by}</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
