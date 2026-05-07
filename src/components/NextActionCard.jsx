import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { STAGES, ALL_STAGES, TERMINAL_STAGES, stageLabel } from '../lib/constants'
import { checkGate, nextStage } from '../lib/gates'

const STAGE_INSTRUCTIONS = {
  inscrito: {
    title: 'Newly registered candidate',
    description: 'The candidate completed the initial form. The app will automatically check if they meet the basic requirements.',
    actionLabel: 'Verify automatic requirements'
  },
  preseleccionado: {
    title: 'Auto pre-selected',
    description: 'The candidate passed initial validation. The Country Manager must now review and validate the documents.',
    actionLabel: 'Start document review'
  },
  docs_revision: {
    title: 'Document review in progress',
    description: 'Upload the 5 required documents in the "Documents" tab and mark them as valid one by one.',
    actionLabel: 'Mark documents as validated'
  },
  docs_validados: {
    title: 'Documents complete ✓',
    description: 'All documents are valid. Schedule the video interview with the candidate.',
    actionLabel: 'Schedule interview'
  },
  entrevista_programada: {
    title: 'Interview scheduled',
    description: 'Once the interview is done, fill out the 100-pt evaluation form in the "Evaluation" tab.',
    actionLabel: 'Mark interview as completed'
  },
  entrevista_realizada: {
    title: 'Interview completed',
    description: 'If score is ≥70 and you registered your recommendation, you can send the case to the Continental Director.',
    actionLabel: 'Send to Director review'
  },
  revision_director: {
    title: 'Awaiting Director decision',
    description: 'The Continental Director must review the evaluation and decide whether to approve the candidate. (While the Director role is being built, use Advanced options).',
    actionLabel: 'Approve as Director (override)'
  },
  aprobado_director: {
    title: 'Approved by Director ✓',
    description: 'iERA Central must start the B211A visa process with BIU.',
    actionLabel: 'Start visa process'
  },
  visa_tramite: {
    title: 'Visa in progress',
    description: 'Once the B211A visa arrives, prepare the student contract.',
    actionLabel: 'Move to contract'
  },
  contrato_firmado: {
    title: 'Contract signed',
    description: 'Send the consolidated candidate document to Bonyan International University.',
    actionLabel: 'Send info to BIU'
  },
  info_biu: {
    title: 'Ready for Indonesia',
    description: 'The candidate is ready to travel. Mark when they begin Month 1 of the program.',
    actionLabel: 'Start Month 1 in Indonesia'
  },
  indonesia_m1: { title: 'Month 1 in Indonesia', description: 'BIU will send monthly academic report.', actionLabel: 'Advance to Month 2' },
  indonesia_m2: { title: 'Month 2 in Indonesia', description: 'Process visa extension for the third month.', actionLabel: 'Advance to Month 3' },
  indonesia_m3: { title: 'Month 3 in Indonesia', description: 'Final exams and official BIU recommendation.', actionLabel: 'Mark as graduated' },
  graduado: { title: 'Graduated 🎓', description: 'The student returned to their country. The program is complete. If qualified, they move to employment (separate process).', actionLabel: null }
}

export default function NextActionCard({ candidate, documents, evaluation, onChange }) {
  const [updating, setUpdating] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [overrideStage, setOverrideStage] = useState(candidate.current_stage)

  const next = nextStage(candidate.current_stage)
  const gate = next ? checkGate(candidate, documents, evaluation, next.id) : null
  const instruction = STAGE_INSTRUCTIONS[candidate.current_stage] || {}

  const advance = async () => {
    if (!next || !gate?.allowed) return
    await changeStage(next.id, 'Auto-advance: gates met')
  }

  const changeStage = async (newStage, notes = '') => {
    setUpdating(true)
    try {
      await supabase.from('candidates').update({ current_stage: newStage }).eq('id', candidate.id)
      await supabase.from('stages_history').insert({
        candidate_id: candidate.id,
        from_stage: candidate.current_stage,
        to_stage: newStage,
        changed_by: 'admin',
        notes
      })
      onChange?.()
    } catch (err) {
      alert('Error changing stage: ' + err.message)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-iera-500 to-iera-700 text-white rounded-xl p-5 shadow-lg">
      <div className="flex items-start gap-4">
        <div className="text-4xl">{getStageEmoji(candidate.current_stage)}</div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-wider opacity-80 font-bold mb-1">
            What's next?
          </div>
          <h3 className="text-xl font-bold mb-1.5">{instruction.title || stageLabel(candidate.current_stage)}</h3>
          <p className="text-sm opacity-90 leading-relaxed">{instruction.description}</p>
        </div>
      </div>

      {next && gate && (
        <div className="mt-5 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-wide font-bold opacity-80">
              Next: {next.shortLabel}
            </div>
            {gate.allowed && (
              <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-bold">
                ✓ Ready
              </span>
            )}
          </div>

          <div className="space-y-1.5 mb-4">
            {gate.requirements.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className={r.met ? 'text-green-300' : 'text-amber-200'}>
                  {r.met ? '✓' : '○'}
                </span>
                <span className={r.met ? 'opacity-100' : 'opacity-70'}>{r.label}</span>
              </div>
            ))}
          </div>

          {gate.allowed ? (
            <button
              onClick={advance}
              disabled={updating}
              className="w-full bg-white text-iera-700 hover:bg-iera-50 font-bold py-2.5 rounded-lg transition disabled:opacity-50"
            >
              {updating ? 'Processing...' : `→ ${instruction.actionLabel || `Advance to ${next.shortLabel}`}`}
            </button>
          ) : (
            <div className="text-sm bg-amber-500/20 border border-amber-400/40 rounded-lg p-2.5 text-amber-100">
              💡 Complete the pending items (○) to enable advance.
            </div>
          )}
        </div>
      )}

      {!next && (
        <div className="mt-4 bg-white/10 rounded-lg p-3 text-sm">
          🎓 Candidate at the final stage of the regular program flow.
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-white/20">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs opacity-70 hover:opacity-100 font-semibold transition"
        >
          {showAdvanced ? '↑ Hide advanced options' : '⚙ Advanced options (override / reject / waitlist)'}
        </button>
        {showAdvanced && (
          <div className="mt-3 bg-white/10 rounded-lg p-3 space-y-2">
            <p className="text-xs opacity-90">
              ⚠ This skips validation gates. Use only for administrative corrections or testing.
            </p>
            <div className="flex gap-2">
              <select
                value={overrideStage}
                onChange={(e) => setOverrideStage(e.target.value)}
                className="flex-1 bg-white/90 text-slate-900 rounded-md px-3 py-2 text-sm"
              >
                <optgroup label="Regular pipeline">
                  {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </optgroup>
                <optgroup label="Terminal stages">
                  {TERMINAL_STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </optgroup>
              </select>
              <button
                onClick={() => changeStage(overrideStage, 'Manual override')}
                disabled={updating || overrideStage === candidate.current_stage}
                className="bg-white/90 text-iera-700 hover:bg-white font-bold px-4 rounded-md text-sm disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function getStageEmoji(stageId) {
  const emojiMap = {
    inscrito: '📝',
    preseleccionado: '✨',
    docs_revision: '📋',
    docs_validados: '✅',
    entrevista_programada: '📅',
    entrevista_realizada: '🎤',
    revision_director: '👔',
    aprobado_director: '🎯',
    visa_tramite: '🛂',
    contrato_firmado: '📜',
    info_biu: '📤',
    indonesia_m1: '🇮🇩',
    indonesia_m2: '🇮🇩',
    indonesia_m3: '🇮🇩',
    graduado: '🎓'
  }
  return emojiMap[stageId] || '📍'
}
