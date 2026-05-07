// Stage transition rules (gates)
// Defines what requirements must be met to advance from one stage to the next

import { STAGES } from './constants'

// REQUIRED documents to advance to docs_validados
const REQUIRED_DOCS = ['passport', 'tazkiyah', 'background_check', 'availability_decl', 'photo']

/**
 * Determines if a candidate can advance to a specific stage.
 * Returns { allowed: boolean, requirements: [{label, met}], blockingReasons: [string] }
 */
export function checkGate(candidate, documents, evaluation, targetStageId) {
  const requirements = []

  switch (targetStageId) {
    case 'preseleccionado': {
      const ageOk = candidate.birth_date && (() => {
        const age = Math.floor((new Date() - new Date(candidate.birth_date)) / (365.25 * 24 * 60 * 60 * 1000))
        return age >= 18 && age <= 40
      })()
      const passportOk = candidate.passport_expiry && (new Date(candidate.passport_expiry) - new Date()) / (1000 * 60 * 60 * 24) > 180
      requirements.push(
        { label: 'Age between 18 and 40', met: !!ageOk },
        { label: 'Valid passport (≥6 months from program start)', met: !!passportOk },
        { label: 'Confirmed 3-month availability', met: !!candidate.availability_confirmed },
        { label: 'Accepted Program Charter terms', met: !!candidate.accepted_charter },
        { label: 'Email registered', met: !!candidate.email },
        { label: 'WhatsApp registered', met: !!candidate.whatsapp }
      )
      break
    }

    case 'docs_revision': {
      // Only requires being pre-selected — Manager takes ownership
      requirements.push({ label: 'Candidate pre-selected', met: candidate.current_stage === 'preseleccionado' || candidate.current_stage === 'docs_revision' })
      break
    }

    case 'docs_validados': {
      const validDocs = (documents || []).filter((d) => d.status === 'valid')
      for (const docType of REQUIRED_DOCS) {
        const doc = validDocs.find((d) => d.type === docType)
        const labels = {
          passport: 'Valid passport copy',
          tazkiyah: 'Valid Tazkiyah letter',
          background_check: 'Valid criminal background check',
          availability_decl: 'Valid availability declaration',
          photo: 'Valid passport-style photo'
        }
        requirements.push({ label: labels[docType], met: !!doc })
      }
      break
    }

    case 'entrevista_programada': {
      requirements.push({ label: 'Documents validated', met: candidate.current_stage === 'docs_validados' || isAfter(candidate.current_stage, 'docs_validados') })
      break
    }

    case 'entrevista_realizada': {
      requirements.push(
        { label: 'Interview scheduled', met: ['entrevista_programada', 'entrevista_realizada'].includes(candidate.current_stage) || isAfter(candidate.current_stage, 'entrevista_programada') },
        { label: '100-pt evaluation completed', met: !!evaluation && evaluation.total_score !== null }
      )
      break
    }

    case 'revision_director': {
      requirements.push(
        { label: 'Interview completed', met: candidate.current_stage === 'entrevista_realizada' || isAfter(candidate.current_stage, 'entrevista_realizada') },
        { label: 'Evaluation score ≥70', met: !!evaluation && (evaluation.total_score || 0) >= 70 },
        { label: 'Manager recommendation registered', met: !!evaluation?.recommendation }
      )
      break
    }

    case 'aprobado_director': {
      requirements.push({ label: 'Director Continental decision registered', met: candidate.current_stage === 'aprobado_director' || isAfter(candidate.current_stage, 'aprobado_director') })
      break
    }

    default:
      // No defined gates — any transition allowed
      requirements.push({ label: 'No automatic requirements', met: true })
  }

  const blockingReasons = requirements.filter((r) => !r.met).map((r) => r.label)
  return {
    allowed: blockingReasons.length === 0,
    requirements,
    blockingReasons
  }
}

function isAfter(currentStageId, targetStageId) {
  const currIdx = STAGES.findIndex((s) => s.id === currentStageId)
  const targetIdx = STAGES.findIndex((s) => s.id === targetStageId)
  return currIdx > targetIdx && currIdx !== -1 && targetIdx !== -1
}

/**
 * Returns the next logical pipeline stage for a given candidate.
 */
export function nextStage(currentStageId) {
  const idx = STAGES.findIndex((s) => s.id === currentStageId)
  if (idx === -1 || idx === STAGES.length - 1) return null
  return STAGES[idx + 1]
}
