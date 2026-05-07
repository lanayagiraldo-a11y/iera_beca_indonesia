// Pipeline v3 — 15 stages. The program ends when the student graduates
// and returns to their country. NO post-program tracking (eligible graduates move to employment).
export const STAGES = [
  { id: 'inscrito',             label: '1. Registered',                  shortLabel: 'Registered',         owner: 'applicant',     color: 'slate' },
  { id: 'preseleccionado',      label: '2. Pre-selected (auto)',      shortLabel: 'Pre-selected',    owner: 'system',        color: 'blue' },
  { id: 'docs_revision',        label: '3. Documents under review',      shortLabel: 'Docs review',   owner: 'manager',       color: 'amber' },
  { id: 'docs_validados',       label: '4. Documents validated',        shortLabel: 'Docs validated',     owner: 'manager',       color: 'cyan' },
  { id: 'entrevista_programada', label: '5. Interview scheduled',      shortLabel: 'Interview scheduled', owner: 'manager',       color: 'indigo' },
  { id: 'entrevista_realizada', label: '6. Interview completed',       shortLabel: 'Interview done',   owner: 'manager',       color: 'purple' },
  { id: 'revision_director',    label: '7. Director review',       shortLabel: 'Director review',  owner: 'director',      color: 'fuchsia' },
  { id: 'aprobado_director',    label: '8. Approved by Director',      shortLabel: 'Approved',           owner: 'director',      color: 'teal' },
  { id: 'visa_tramite',         label: '9. Visa in progress',             shortLabel: 'Visa',               owner: 'iera_central',  color: 'green' },
  { id: 'contrato_firmado',     label: '10. Contract signed',           shortLabel: 'Contract',           owner: 'iera_central',  color: 'emerald' },
  { id: 'info_biu',             label: '11. Info sent to BIU',         shortLabel: 'Info to BIU',         owner: 'iera_central',  color: 'lime' },
  { id: 'indonesia_m1',         label: '12. Indonesia - Mes 1',          shortLabel: 'Indonesia M1',       owner: 'biu',           color: 'orange' },
  { id: 'indonesia_m2',         label: '13. Indonesia - Mes 2',          shortLabel: 'Indonesia M2',       owner: 'biu',           color: 'orange' },
  { id: 'indonesia_m3',         label: '14. Indonesia - Mes 3',          shortLabel: 'Indonesia M3',       owner: 'biu',           color: 'orange' },
  { id: 'graduado',             label: '15. Graduated · Program complete', shortLabel: 'Graduated',        owner: 'biu',           color: 'yellow' }
]

// Terminal stages (outside the linear flow)
export const TERMINAL_STAGES = [
  { id: 'auto_rechazado',         label: 'Auto-rejected (does not meet requirements)', color: 'red' },
  { id: 'rechazado',              label: 'Rejected',                             color: 'red' },
  { id: 'lista_espera',           label: 'Waitlist',                       color: 'gray' },
  { id: 'abandono_justificado',   label: 'Justified withdrawal',                    color: 'orange' },
  { id: 'abandono_reembolso',     label: 'Withdrawal with reimbursement',                  color: 'red' }
]

export const ALL_STAGES = [...STAGES, ...TERMINAL_STAGES]

export const stageLabel = (id) => ALL_STAGES.find((s) => s.id === id)?.label || id
export const stageShort = (id) => ALL_STAGES.find((s) => s.id === id)?.shortLabel || id

export const ARABIC_LEVELS = [
  { value: 'none',         label: 'None' },
  { value: 'basic',        label: 'Basic' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced',     label: 'Advanced' }
]

export const EMERGENCY_RELATIONS = ['Mother', 'Father', 'Spouse', 'Sibling', 'Child', 'Other']

export const MUSLIM_STATUS_OPTIONS = [
  { value: 'born_muslim', label: 'Born Muslim', description: 'Muslim from birth' },
  { value: 'new_muslim',  label: 'New Muslim (revert)', description: 'Embraced Islam later in life' }
]

// Country codes (program countries + common LATAM/world)
export const COUNTRY_CODES = [
  { code: '+52',  name: 'Mexico' },
  { code: '+57',  name: 'Colombia' },
  { code: '+593', name: 'Ecuador' },
  { code: '+58',  name: 'Venezuela' },
  { code: '+595', name: 'Paraguay' },
  { code: '+504', name: 'Honduras' },
  { code: '+503', name: 'El Salvador' },
  { code: '+1',   name: 'USA / Canada' },
  { code: '+34',  name: 'Spain' },
  { code: '+54',  name: 'Argentina' },
  { code: '+55',  name: 'Brazil' },
  { code: '+56',  name: 'Chile' },
  { code: '+51',  name: 'Peru' },
  { code: '+507', name: 'Panama' },
  { code: '+506', name: 'Costa Rica' },
  { code: '+502', name: 'Guatemala' },
  { code: '+1809', name: 'Dominican Rep.' },
  { code: '+44',  name: 'United Kingdom' },
  { code: '+966', name: 'Saudi Arabia' },
  { code: '+971', name: 'UAE' },
  { code: '+62',  name: 'Indonesia' }
]

export const PRIORITY_CRITERIA = [
  { key: 'has_institution',    label: 'Has or leads an Islamic institution', points: 10 },
  { key: 'active_dawah',       label: 'Currently engaged in active dawah',   points: 8 },
  { key: 'community_network',  label: 'Broad community network',       points: 6 },
  { key: 'iera_referral',      label: 'Referred by an iERA sheikh', points: 5 },
  { key: 'speaks_other_lang',  label: 'Speaks English or another language',    points: 4 },
  { key: 'three_plus_courses', label: '3+ formal Islamic courses',            points: 4 }
]
