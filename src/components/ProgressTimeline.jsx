import { STAGES, TERMINAL_STAGES } from '../lib/constants'

const PHASE_GROUPS = [
  {
    label: '📝 Application',
    description: 'Registration & pre-selection',
    stages: ['inscrito', 'preseleccionado']
  },
  {
    label: '📂 Review',
    description: 'Documents & interview',
    stages: ['docs_revision', 'docs_validados', 'entrevista_programada', 'entrevista_realizada']
  },
  {
    label: '👔 Approval',
    description: 'Continental Director',
    stages: ['revision_director', 'aprobado_director']
  },
  {
    label: '✈️ Pre-travel',
    description: 'Visa & contract',
    stages: ['visa_tramite', 'contrato_firmado', 'info_biu']
  },
  {
    label: '🇮🇩 Indonesia',
    description: '3 months + graduation',
    stages: ['indonesia_m1', 'indonesia_m2', 'indonesia_m3', 'graduado']
  }
]

export default function ProgressTimeline({ currentStageId }) {
  const currentIdx = STAGES.findIndex((s) => s.id === currentStageId)
  const isTerminal = TERMINAL_STAGES.some((s) => s.id === currentStageId)

  if (isTerminal) {
    const terminal = TERMINAL_STAGES.find((s) => s.id === currentStageId)
    const colorClass = {
      red: 'bg-red-50 border-red-300 text-red-800',
      gray: 'bg-slate-50 border-slate-300 text-slate-700',
      orange: 'bg-orange-50 border-orange-300 text-orange-800',
      green: 'bg-green-50 border-green-300 text-green-800'
    }[terminal.color] || 'bg-slate-50 border-slate-300'
    return (
      <div className={`p-4 rounded-xl border-2 ${colorClass} text-center`}>
        <div className="text-xs uppercase tracking-wide font-bold opacity-70">Terminal status</div>
        <div className="text-lg font-bold mt-1">{terminal.label}</div>
      </div>
    )
  }

  const totalSteps = STAGES.length
  const progressPct = currentIdx >= 0 ? ((currentIdx + 1) / totalSteps) * 100 : 0

  const currentGroup = PHASE_GROUPS.findIndex((g) => g.stages.includes(currentStageId))

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
          <div className="text-xs uppercase tracking-wide font-bold text-slate-500">
            Candidate progress
          </div>
          <div className="text-sm font-bold text-iera-700">
            Step {currentIdx + 1} of {totalSteps} · {Math.round(progressPct)}%
          </div>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-iera-500 to-iera-700 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {PHASE_GROUPS.map((group, gIdx) => {
          const isActive = gIdx === currentGroup
          const isPast = gIdx < currentGroup
          return (
            <div
              key={group.label}
              className={`relative p-3 rounded-lg border-2 transition ${
                isActive
                  ? 'bg-iera-500 border-iera-500 text-white shadow-md scale-105'
                  : isPast
                  ? 'bg-iera-50 border-iera-200 text-iera-700'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="text-[11px] font-bold leading-tight">{group.label}</div>
              <div className={`text-[10px] mt-1 ${isActive ? 'opacity-90' : 'opacity-70'}`}>
                {group.description}
              </div>
              {isPast && (
                <div className="absolute top-1 right-1 text-[10px] bg-white text-iera-700 rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  ✓
                </div>
              )}
            </div>
          )
        })}
      </div>

      {currentIdx >= 0 && (
        <div className="mt-4 p-3 bg-iera-50 border border-iera-200 rounded-lg flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-iera-500 text-white flex items-center justify-center font-bold text-sm">
            {currentIdx + 1}
          </div>
          <div className="flex-1">
            <div className="text-xs text-iera-600 uppercase tracking-wide font-bold">Current stage</div>
            <div className="text-base font-bold text-iera-900">{STAGES[currentIdx].label}</div>
          </div>
        </div>
      )}
    </div>
  )
}
