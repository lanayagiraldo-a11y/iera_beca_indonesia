// Auto-preselection rules for the public application form
// If candidate meets ALL rules → 'preseleccionado'
// If any fails → 'auto_rechazado' with reason

export function evaluateAutoPreselection(formData) {
  const reasons = []

  // 1. Age 18-40
  if (formData.birth_date) {
    const age = Math.floor((new Date() - new Date(formData.birth_date)) / (365.25 * 24 * 60 * 60 * 1000))
    if (age < 18) reasons.push('Age below 18')
    else if (age > 40) reasons.push('Age above 40')
  } else {
    reasons.push('Missing date of birth')
  }

  // 2. Passport valid ≥6 months (assuming travel within 60 days)
  if (formData.passport_expiry) {
    const daysToExpiry = (new Date(formData.passport_expiry) - new Date()) / (1000 * 60 * 60 * 24)
    if (daysToExpiry < 180) {
      reasons.push('Passport with less than 6 months validity')
    }
  } else {
    reasons.push('Missing passport expiry date')
  }

  // 3. Essential data present (the rest — availability + terms — is validated client-side
  //    before submission, so we never auto-reject for those reasons here)
  if (!formData.email) reasons.push('Missing email')
  if (!formData.whatsapp) reasons.push('Missing WhatsApp')
  if (!formData.full_name) reasons.push('Missing full name')
  if (!formData.country_id) reasons.push('Missing country of residence')
  if (!formData.sheikh_reference_name) reasons.push('Missing reference sheikh or center')

  return {
    passed: reasons.length === 0,
    rejectedReasons: reasons,
    suggestedStage: reasons.length === 0 ? 'preseleccionado' : 'auto_rechazado'
  }
}
