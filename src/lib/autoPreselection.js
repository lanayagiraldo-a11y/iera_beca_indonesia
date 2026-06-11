// Auto-preselection rules for the public application form
//
// Return shape:
//   {
//     blocking:    [{ code, en, es }]   // hard fails → form must NOT submit
//     needsReview: boolean              // submit OK, coordinator alerted (no age trigger anymore)
//     passed:      boolean              // truly clean (no blocking, no review)
//     suggestedStage: 'preseleccionado' | 'inscrito'
//
//     // legacy fields (kept for back-compat with any caller still reading them)
//     rejectedReasons: string[]
//   }
//
// Submission rules:
//   • blocking.length > 0  → frontend shows blocking modal, does NOT insert
//   • needsReview === true → insert with stage 'inscrito' + [REVISION_COORDINADOR] marker
//   • passed === true      → insert with stage 'preseleccionado'

const MIN_AGE = 18
const PASSPORT_MIN_DAYS = 180

function computeAge(birthDate) {
  if (!birthDate) return null
  const ms = new Date() - new Date(birthDate)
  if (Number.isNaN(ms)) return null
  return Math.floor(ms / (365.25 * 24 * 60 * 60 * 1000))
}

export function evaluateAutoPreselection(formData) {
  const blocking = []
  let needsReview = false

  // ── Age ────────────────────────────────────────────────
  const age = computeAge(formData.birth_date)
  if (age === null) {
    blocking.push({
      code: 'missing_birth_date',
      en: 'Date of birth is required.',
      es: 'La fecha de nacimiento es obligatoria.',
    })
  } else if (age < MIN_AGE) {
    blocking.push({
      code: 'age_below_min',
      en: `You must be at least ${MIN_AGE} years old to apply (you are ${age}).`,
      es: `Debes tener al menos ${MIN_AGE} años para postularte (tienes ${age}).`,
    })
  }
  // No upper age limit — any applicant 18+ is accepted as a clean application.

  // ── Passport ───────────────────────────────────────────
  if (!formData.passport_expiry) {
    blocking.push({
      code: 'missing_passport_expiry',
      en: 'Passport expiry date is required.',
      es: 'La fecha de vencimiento del pasaporte es obligatoria.',
    })
  } else {
    const daysToExpiry = Math.floor(
      (new Date(formData.passport_expiry) - new Date()) / (1000 * 60 * 60 * 24)
    )
    if (daysToExpiry < PASSPORT_MIN_DAYS) {
      blocking.push({
        code: 'passport_expiring_soon',
        en: `Your passport must be valid for at least 6 months (currently ${daysToExpiry} days remaining).`,
        es: `Tu pasaporte debe tener al menos 6 meses de vigencia (actualmente ${daysToExpiry} días).`,
      })
    }
  }

  // ── Essential data ─────────────────────────────────────
  const essentials = [
    ['full_name', 'Full name is required.', 'El nombre completo es obligatorio.'],
    ['email', 'Email is required.', 'El correo es obligatorio.'],
    ['whatsapp', 'WhatsApp number is required.', 'El número de WhatsApp es obligatorio.'],
    ['country_id', 'Country of residence is required.', 'El país de residencia es obligatorio.'],
    ['sheikh_reference_name', 'Reference sheikh or center is required.', 'La referencia (sheikh o centro) es obligatoria.'],
  ]
  for (const [field, en, es] of essentials) {
    if (!formData[field]) blocking.push({ code: `missing_${field}`, en, es })
  }

  const passed = blocking.length === 0 && !needsReview
  return {
    blocking,
    needsReview,
    passed,
    suggestedStage: blocking.length === 0 && !needsReview ? 'preseleccionado' : 'inscrito',
    rejectedReasons: blocking.map((b) => b.en),
  }
}
