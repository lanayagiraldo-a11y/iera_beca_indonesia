import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { STAGES, ALL_STAGES, TERMINAL_STAGES, stageLabel } from '../lib/constants'
import { checkGate, nextStage } from '../lib/gates'

export default function StageAdvancer({ candidate, documents, evaluation, onChange }) {
  const [updating, setUpdating] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [overrideStage, setOverrideStage] = useState(candidate.current_stage)

  const next = nextStage(candidate.current_stage)
  const gate = next ? checkGate(candidate, documents, evaluation, next.id) : null

  const advance = async () => {
    if (!next || !gate?.allowed) return
    await changeStage(next.id, 'Avance automático: gates cumplidos')
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
      console.error(err)
      alert('Error al cambiar etapa: ' + err.message)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="font-bold">Avance del proceso</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Etapa actual: <strong className="text-iera-700">{stageLabel(candidate.current_stage)}</strong>
        </p>
      </div>
      <div className="card-body">
        {next ? (
          <>
            <div className="mb-4">
              <div className="text-xs text-slate-500 uppercase tracking-wide font-bold mb-2">
                Siguiente etapa
              </div>
              <div className="text-lg font-bold text-slate-900">{next.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                Responsable: <span className="capitalize">{next.owner.replace('_', ' ')}</span>
              </div>
            </div>

            {gate && (
              <>
                <div className="text-xs text-slate-500 uppercase tracking-wide font-bold mb-2">
                  Requisitos para avanzar
                </div>
                <div className="space-y-1.5 mb-4">
                  {gate.requirements.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className={r.met ? 'text-green-600' : 'text-red-500'}>
                        {r.met ? '✓' : '✗'}
                      </span>
                      <span className={r.met ? 'text-slate-700' : 'text-slate-500'}>{r.label}</span>
                    </div>
                  ))}
                </div>

                {gate.allowed ? (
                  <button
                    onClick={advance}
                    disabled={updating}
                    className="btn-primary w-full"
                  >
                    {updating ? 'Avanzando...' : `→ Avanzar a ${next.shortLabel}`}
                  </button>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                    ⚠ Faltan {gate.blockingReasons.length} requisito(s) para avanzar.
                    Completa lo marcado en rojo arriba para habilitar el botón.
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
            🎓 Candidato en etapa final del flujo regular.
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-slate-200">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-slate-500 hover:text-slate-700 font-semibold"
          >
            {showAdvanced ? '↑ Ocultar opciones avanzadas' : '⚙ Opciones avanzadas (override / rechazo / lista de espera)'}
          </button>
          {showAdvanced && (
            <div className="mt-3 space-y-2">
              <label className="label-base">Cambiar etapa manualmente (admin)</label>
              <div className="flex gap-2">
                <select
                  className="input-base flex-1"
                  value={overrideStage}
                  onChange={(e) => setOverrideStage(e.target.value)}
                >
                  <optgroup label="Pipeline regular">
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Estados terminales">
                    {TERMINAL_STAGES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </optgroup>
                </select>
                <button
                  onClick={() => changeStage(overrideStage, 'Override manual')}
                  disabled={updating || overrideStage === candidate.current_stage}
                  className="btn-secondary"
                >
                  Aplicar
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                ⚠ El override salta los gates de validación. Úsalo solo para correcciones administrativas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
