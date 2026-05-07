// The 7 required documents per Manual v1.1 section 3.2
export const DOCUMENT_TYPES = [
  {
    type: 'passport',
    icon: '📄',
    label: 'Passport copy',
    description: 'PDF or JPG · validity ≥6 months',
    required: true
  },
  {
    type: 'tazkiyah',
    icon: '📜',
    label: 'Tazkiyah letter',
    description: 'Signed and stamped by sheikh / Islamic center',
    required: true
  },
  {
    type: 'background_check',
    icon: '⚖️',
    label: 'Criminal background check',
    description: 'Valid official document',
    required: true
  },
  {
    type: 'availability_decl',
    icon: '✍️',
    label: 'Availability declaration',
    description: 'Signed by candidate',
    required: true
  },
  {
    type: 'photo',
    icon: '📷',
    label: 'Passport-style photo',
    description: 'Recent, white background',
    required: true
  },
  {
    type: 'islamic_courses',
    icon: '🎓',
    label: 'Islamic courses history',
    description: 'Optional · adds priority points',
    required: false
  },
  {
    type: 'contract',
    icon: '📋',
    label: 'Signed contract',
    description: 'Uploaded after e-signature',
    required: false
  }
]

export const DOCUMENT_STATUS = {
  pending: { label: 'Pending', color: 'amber' },
  valid: { label: 'Valid', color: 'green' },
  expired: { label: 'Expired', color: 'orange' },
  rejected: { label: 'Rejected', color: 'red' }
}

export const STORAGE_BUCKET = 'candidate-documents'
