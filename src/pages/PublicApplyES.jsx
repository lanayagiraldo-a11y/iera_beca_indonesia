import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ARABIC_LEVELS, EMERGENCY_RELATIONS, PRIORITY_CRITERIA, MUSLIM_STATUS_OPTIONS, COUNTRY_CODES } from '../lib/constants'
import { evaluateAutoPreselection } from '../lib/autoPreselection'
import BlockingModal from '../components/BlockingModal'

const REVIEW_MARKER = '[REVISION_COORDINADOR]'

const STORAGE_KEY = 'iera-application-draft-es-v1'

const STEPS = [
  { id: 'personal',   title: 'Sobre ti',              subtitle: 'Información personal básica',                   icon: '👤', estimate: '2 min' },
  { id: 'passport',   title: 'Pasaporte',              subtitle: 'Detalles del documento de viaje',              icon: '🛂', estimate: '1 min' },
  { id: 'islamic',    title: 'Perfil islámico',        subtitle: 'Referencia, antecedentes y formación',         icon: '🕌', estimate: '2 min' },
  { id: 'motivation', title: 'Motivación',             subtitle: 'Por qué quieres participar',                   icon: '🎯', estimate: '3 min' },
  { id: 'commitment', title: 'Compromiso final',       subtitle: 'Disponibilidad, contacto y aceptación',        icon: '✓',  estimate: '2 min' }
]

const ARABIC_LEVELS_ES = [
  { value: 'none',         label: 'Ninguno' },
  { value: 'basic',        label: 'Básico' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced',     label: 'Avanzado' }
]

const EMERGENCY_RELATIONS_ES = ['Madre', 'Padre', 'Cónyuge', 'Hermano/a', 'Hijo/a', 'Otro']

const MUSLIM_STATUS_OPTIONS_ES = [
  { value: 'born_muslim', label: 'Muslim de nacimiento', description: 'Muslim desde el nacimiento' },
  { value: 'new_muslim',  label: 'Nuevo Muslim (revertido)', description: 'Abrazó el Islam en etapas posteriores de la vida' }
]

const PRIORITY_CRITERIA_ES = [
  { key: 'has_institution',    label: 'Tiene o lidera una institución islámica',    points: 10 },
  { key: 'active_dawah',       label: 'Actualmente realiza dawah activa',            points: 8 },
  { key: 'community_network',  label: 'Red comunitaria amplia',                      points: 6 },
  { key: 'iera_referral',      label: 'Referido por un sheikh de iERA',              points: 5 },
  { key: 'speaks_other_lang',  label: 'Habla inglés u otro idioma adicional',        points: 4 },
  { key: 'three_plus_courses', label: '3 o más cursos islámicos formales',           points: 4 }
]

const EMPTY_FORM = {
  full_name: '', email: '', phone: '', whatsapp: '', whatsapp_country_code: '+57', birth_date: '',
  country_id: '', city: '', occupation: '', education_level: '',
  passport_number: '', passport_expiry: '', passport_country: '',
  sheikh_reference_name: '', sheikh_reference_contact: '', islamic_center_name: '',
  arabic_level: 'none', other_languages: '',
  muslim_status: '', conversion_month: '',
  motivation_text: '', dawah_activities_current: '',
  has_institution: false, active_dawah: false, community_network: false,
  iera_referral: false, speaks_other_lang: false, three_plus_courses: false,
  availability_confirmed: false,
  emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_country_code: '+57', emergency_contact_relation: 'Madre',
  accepted_charter: false,
  islamic_courses: []
}

export default function PublicApplyES() {
  const navigate = useNavigate()
  const [countries, setCountries] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [stepErrors, setStepErrors] = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [form, setForm] = useState(EMPTY_FORM)
  const [restored, setRestored] = useState(false)
  const [blockingReasons, setBlockingReasons] = useState([])
  const formTopRef = useRef(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setForm({ ...EMPTY_FORM, ...parsed })
        setRestored(true)
      }
    } catch {}
    supabase.from('countries').select('*').order('name').then(({ data }) => setCountries(data || []))
  }, [])

  useEffect(() => {
    if (form.full_name || form.email) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form))
    }
  }, [form])

  const age = form.birth_date
    ? Math.floor((new Date() - new Date(form.birth_date)) / (365.25 * 24 * 60 * 60 * 1000))
    : null
  const motivationWords = form.motivation_text.trim()
    ? form.motivation_text.trim().split(/\s+/).length
    : 0

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const addCourse = () => update('islamic_courses', [...form.islamic_courses, { name: '', institution: '', date: '' }])
  const updateCourse = (i, field, value) => {
    const next = [...form.islamic_courses]
    next[i] = { ...next[i], [field]: value }
    update('islamic_courses', next)
  }
  const removeCourse = (i) => update('islamic_courses', form.islamic_courses.filter((_, idx) => idx !== i))

  const validateCurrentStep = () => {
    const errors = []
    const step = STEPS[currentStep].id

    if (step === 'personal') {
      if (!form.full_name?.trim()) errors.push('Nombre completo')
      if (!form.email?.trim()) errors.push('Correo electrónico')
      if (!/^\S+@\S+\.\S+$/.test(form.email || '')) errors.push('Formato de correo válido')
      if (!form.whatsapp?.trim()) errors.push('Número de WhatsApp')
      if (!form.birth_date) errors.push('Fecha de nacimiento')
      if (age !== null && age < 18) errors.push('Debes tener al menos 18 años')
      if (!form.country_id) errors.push('País de residencia')
      if (!form.city?.trim()) errors.push('Ciudad')
    }

    if (step === 'passport') {
      if (!form.passport_number?.trim()) errors.push('Número de pasaporte')
      if (!form.passport_expiry) errors.push('Fecha de vencimiento del pasaporte')
      if (form.passport_expiry) {
        const days = (new Date(form.passport_expiry) - new Date()) / (1000 * 60 * 60 * 24)
        if (days < 180) errors.push('El pasaporte debe ser válido por al menos 6 meses')
      }
    }

    if (step === 'islamic') {
      if (!form.muslim_status) errors.push('Estado Muslim')
      if (form.muslim_status === 'new_muslim' && !form.conversion_month) errors.push('Mes aproximado en que abrazaste el Islam')
      if (!form.sheikh_reference_name?.trim()) errors.push('Referencia de sheikh o centro islámico')
      if (!form.sheikh_reference_contact?.trim()) errors.push('Contacto de referencia')
    }

    if (step === 'motivation') {
      if (!form.motivation_text?.trim() || motivationWords < 150) {
        errors.push('Motivación (mínimo 150 palabras)')
      }
    }

    if (step === 'commitment') {
      if (!form.availability_confirmed) errors.push('Confirmar disponibilidad de 3 meses')
      if (!form.accepted_charter) errors.push('Aceptar los términos del programa')
      if (!form.emergency_contact_name?.trim()) errors.push('Nombre del contacto de emergencia')
      if (!form.emergency_contact_phone?.trim()) errors.push('Teléfono del contacto de emergencia')
    }

    return errors
  }

  const goNext = () => {
    const errors = validateCurrentStep()
    if (errors.length > 0) {
      setStepErrors(errors)
      formTopRef.current?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    setStepErrors([])
    setCurrentStep((s) => Math.min(STEPS.length - 1, s + 1))
    formTopRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  const goBack = () => {
    setStepErrors([])
    setCurrentStep((s) => Math.max(0, s - 1))
    formTopRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = validateCurrentStep()
    if (errors.length > 0) {
      setStepErrors(errors)
      return
    }
    const evaluation = evaluateAutoPreselection(form)
    if (evaluation.blocking.length > 0) {
      setBlockingReasons(evaluation.blocking)
      return
    }

    setSaving(true)
    setError(null)
    try {
      const baseNote = evaluation.needsReview
        ? `${REVIEW_MARKER} Edad fuera del rango estándar (41-45). Revisar antes de avanzar de etapa. (ES)`
        : 'Preselección automática vía formulario público (ES)'
      // Generate the id client-side so we don't need a SELECT RLS policy for anon
      const candidateId = crypto.randomUUID()
      const payload = {
        id: candidateId,
        ...form,
        country_id: parseInt(form.country_id),
        birth_date: form.birth_date || null,
        passport_expiry: form.passport_expiry || null,
        muslim_status: form.muslim_status || null,
        conversion_month: form.muslim_status === 'new_muslim' ? form.conversion_month || null : null,
        current_stage: evaluation.suggestedStage,
        notes: baseNote
      }
      const { error: insertError } = await supabase.from('candidates').insert(payload)
      if (insertError) throw insertError

      await supabase.from('stages_history').insert({
        candidate_id: candidateId, from_stage: null, to_stage: 'inscrito',
        changed_by: 'system', notes: 'Registro vía formulario público (español)'
      })
      if (evaluation.passed) {
        await supabase.from('stages_history').insert({
          candidate_id: candidateId, from_stage: 'inscrito', to_stage: 'preseleccionado',
          changed_by: 'system', notes: 'Preselección automática aprobada'
        })
      } else if (evaluation.needsReview) {
        await supabase.from('stages_history').insert({
          candidate_id: candidateId, from_stage: 'inscrito', to_stage: 'inscrito',
          changed_by: 'system', notes: `${REVIEW_MARKER} Coordinador debe revisar (edad 41-45)`
        })
      }

      localStorage.removeItem(STORAGE_KEY)

      navigate(`/aplicar/resultado?passed=true&id=${candidateId}&lang=es${evaluation.needsReview ? '&review=1' : ''}`)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Error al enviar la solicitud')
      setSaving(false)
    }
  }

  const isLastStep = currentStep === STEPS.length - 1
  const stepDef = STEPS[currentStep]
  const progressPct = ((currentStep + 1) / STEPS.length) * 100

  return (
    <div className="min-h-screen bg-slate-50">
      <BlockingModal
        open={blockingReasons.length > 0}
        lang="es"
        reasons={blockingReasons}
        onClose={() => setBlockingReasons([])}
      />
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/iera-logo.png" alt="iERA" className="h-8" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-500 hidden sm:block">
              Paso {currentStep + 1} de {STEPS.length} · ~{stepDef.estimate}
            </div>
            <Link to="/aplicar" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition">
              🌐 English
            </Link>
          </div>
        </div>
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-iera-cyan via-iera-green to-iera-yellow transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8" ref={formTopRef}>
        <div className="flex justify-center gap-1.5 mb-8">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`h-1.5 rounded-full transition-all ${
                i < currentStep ? 'bg-iera-green w-8' :
                i === currentStep ? 'bg-iera-cyan w-12' :
                'bg-slate-200 w-8'
              }`}
              title={s.title}
            />
          ))}
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-iera-500 text-white rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
            <span className="iera-diamond"></span>
            Paso {currentStep + 1} de {STEPS.length}
          </div>
          <div className="text-5xl mb-3">{stepDef.icon}</div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-iera-500 mb-2">{stepDef.title}</h1>
          <p className="text-slate-600">{stepDef.subtitle}</p>
        </div>

        {restored && currentStep === 0 && (
          <div className="mb-5 p-3 bg-iera-cyan/10 border border-iera-cyan/30 rounded-lg text-sm text-slate-700 flex items-start gap-2">
            <span>💾</span>
            <div className="flex-1">
              <strong>Borrador restaurado.</strong> Guardamos tu progreso anterior. Puedes continuar desde donde lo dejaste.
              <button
                type="button"
                onClick={() => { setForm(EMPTY_FORM); localStorage.removeItem(STORAGE_KEY); setRestored(false) }}
                className="ml-2 underline hover:no-underline text-xs"
              >
                Empezar de nuevo
              </button>
            </div>
          </div>
        )}

        {stepErrors.length > 0 && (
          <div className="mb-5 p-4 bg-amber-50 border-2 border-amber-300 text-amber-900 rounded-lg text-sm">
            <div className="font-bold mb-2">Por favor completa estos campos antes de continuar:</div>
            <ul className="list-disc list-inside space-y-0.5 ml-1">
              {stepErrors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}

        {error && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8">

          {/* PASO 1: Datos personales */}
          {stepDef.id === 'personal' && (
            <div className="space-y-5">
              <FullField label="Nombre completo" required>
                <input className="input-base" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} placeholder="Tal como aparece en tu pasaporte" autoFocus />
              </FullField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Fecha de nacimiento" required>
                  <input type="date" className="input-base" value={form.birth_date} onChange={(e) => update('birth_date', e.target.value)} />
                </Field>
                <Field label="Edad">
                  <div className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                    age === null ? 'bg-slate-50 text-slate-400' :
                    age >= 18 ? 'bg-iera-green/10 text-iera-green' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {age === null ? '-' : age >= 18 ? `${age} años · Elegible` : `${age} años · Debes tener al menos 18 años`}
                  </div>
                </Field>

                <FullField label="Correo electrónico" required hint="Aquí enviaremos las actualizaciones">
                  <input type="email" className="input-base" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="nombre@correo.com" />
                </FullField>

                <FullField label="WhatsApp" required hint="Tu Country Manager te contactará por aquí">
                  <div className="flex gap-2">
                    <select className="input-base w-28" value={form.whatsapp_country_code} onChange={(e) => update('whatsapp_country_code', e.target.value)}>
                      {COUNTRY_CODES.map((c) => <option key={c.code} value={c.code}>{c.code} · {c.name}</option>)}
                    </select>
                    <input type="tel" className="input-base flex-1" value={form.whatsapp} onChange={(e) => update('whatsapp', e.target.value)} placeholder="número de teléfono" />
                  </div>
                </FullField>

                <Field label="País de residencia" required>
                  <select className="input-base" value={form.country_id} onChange={(e) => update('country_id', e.target.value)}>
                    <option value="">Selecciona...</option>
                    {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Ciudad" required>
                  <input className="input-base" value={form.city} onChange={(e) => update('city', e.target.value)} />
                </Field>

                <Field label="Ocupación actual" hint="¿A qué te dedicas hoy?">
                  <input className="input-base" value={form.occupation} onChange={(e) => update('occupation', e.target.value)} placeholder="p.ej. estudiante, comerciante" />
                </Field>
                <Field label="Nivel de educación">
                  <select className="input-base" value={form.education_level} onChange={(e) => update('education_level', e.target.value)}>
                    <option value="">Selecciona...</option>
                    <option>Bachillerato</option>
                    <option>Técnico</option>
                    <option>Universidad</option>
                    <option>Posgrado</option>
                  </select>
                </Field>
              </div>
            </div>
          )}

          {/* PASO 2: Pasaporte */}
          {stepDef.id === 'passport' && (
            <div className="space-y-5">
              <div className="bg-iera-cyan/10 border border-iera-cyan/30 rounded-lg p-3 text-sm text-slate-700">
                <strong className="text-iera-500">Tu pasaporte debe tener vigencia de al menos 6 meses</strong> desde la fecha de viaje. Si vence antes, renuévalo antes de aplicar.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FullField label="Número de pasaporte" required>
                  <input className="input-base" value={form.passport_number} onChange={(e) => update('passport_number', e.target.value)} placeholder="p.ej. G12345678" autoFocus />
                </FullField>
                <Field label="Fecha de vencimiento" required>
                  <input type="date" className="input-base" value={form.passport_expiry} onChange={(e) => update('passport_expiry', e.target.value)} />
                </Field>
                <Field label="País de emisión">
                  <input className="input-base" value={form.passport_country} onChange={(e) => update('passport_country', e.target.value)} placeholder="País que emitió el pasaporte" />
                </Field>
              </div>

              {form.passport_expiry && (
                <div className={`p-3 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                  (new Date(form.passport_expiry) - new Date()) / (1000 * 60 * 60 * 24) > 180
                    ? 'bg-iera-green/10 text-iera-green'
                    : 'bg-red-50 text-red-600'
                }`}>
                  {(new Date(form.passport_expiry) - new Date()) / (1000 * 60 * 60 * 24) > 180
                    ? 'Tu pasaporte cumple el requisito de 6 meses'
                    : 'Tu pasaporte vence pronto. Renuévalo antes de aplicar'}
                </div>
              )}
            </div>
          )}

          {/* PASO 3: Perfil islámico */}
          {stepDef.id === 'islamic' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-3">Estado Muslim <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {MUSLIM_STATUS_OPTIONS_ES.map((opt) => (
                    <label
                      key={opt.value}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition ${
                        form.muslim_status === opt.value
                          ? 'border-iera-cyan bg-iera-cyan/5 shadow-sm'
                          : 'border-slate-200 hover:border-iera-cyan/50'
                      }`}
                    >
                      <input
                        type="radio" name="muslim_status" value={opt.value}
                        checked={form.muslim_status === opt.value}
                        onChange={(e) => update('muslim_status', e.target.value)}
                        className="sr-only"
                      />
                      <div className="font-bold text-base mb-0.5">{opt.label}</div>
                      <div className="text-xs text-slate-500">{opt.description}</div>
                    </label>
                  ))}
                </div>

                {form.muslim_status === 'new_muslim' && (
                  <div className="mt-4 p-4 bg-iera-cyan/5 border border-iera-cyan/20 rounded-lg">
                    <label className="block text-sm font-bold text-slate-800 mb-2">
                      ¿Cuándo abrazaste el Islam? <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-slate-500 mb-2">Mes y año aproximado. No necesitamos el día exacto.</p>
                    <input type="month" className="input-base max-w-xs" value={form.conversion_month} onChange={(e) => update('conversion_month', e.target.value)} />
                  </div>
                )}
              </div>

              <div className="pt-5 border-t border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-3">Referencia de sheikh o centro islámico</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Nombre de referencia" required>
                    <input className="input-base" value={form.sheikh_reference_name} onChange={(e) => update('sheikh_reference_name', e.target.value)} placeholder="Nombre del sheikh o centro" />
                  </Field>
                  <Field label="Contacto de referencia" required hint="WhatsApp o correo electrónico">
                    <input className="input-base" value={form.sheikh_reference_contact} onChange={(e) => update('sheikh_reference_contact', e.target.value)} placeholder="+57... o correo@..." />
                  </Field>
                  <FullField label="Centro islámico al que asistes">
                    <input className="input-base" value={form.islamic_center_name} onChange={(e) => update('islamic_center_name', e.target.value)} placeholder="Opcional" />
                  </FullField>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-3">Idiomas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Nivel de árabe">
                    <select className="input-base" value={form.arabic_level} onChange={(e) => update('arabic_level', e.target.value)}>
                      {ARABIC_LEVELS_ES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Otros idiomas que hablas" hint="Inglés, francés, portugués, etc.">
                    <input className="input-base" value={form.other_languages} onChange={(e) => update('other_languages', e.target.value)} placeholder="Opcional" />
                  </Field>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-1">Cursos islámicos completados</h3>
                <p className="text-xs text-slate-500 mb-3">Opcional. Agrega los cursos que hayas tomado.</p>
                <div className="space-y-2">
                  {form.islamic_courses.map((c, i) => (
                    <div key={i} className="grid grid-cols-[1fr,1fr,140px,30px] gap-2 items-center">
                      <input className="input-base text-xs py-1.5" placeholder="Nombre del curso" value={c.name} onChange={(e) => updateCourse(i, 'name', e.target.value)} />
                      <input className="input-base text-xs py-1.5" placeholder="Institución" value={c.institution} onChange={(e) => updateCourse(i, 'institution', e.target.value)} />
                      <input type="month" className="input-base text-xs py-1.5" value={c.date} onChange={(e) => updateCourse(i, 'date', e.target.value)} />
                      <button type="button" className="text-slate-400 hover:text-red-500" onClick={() => removeCourse(i)}>×</button>
                    </div>
                  ))}
                  <button type="button" onClick={addCourse} className="px-3 py-1.5 bg-iera-cyan/10 text-iera-cyan rounded-md text-xs font-semibold border border-dashed border-iera-cyan hover:bg-iera-cyan/20">
                    + Agregar curso
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PASO 4: Motivación */}
          {stepDef.id === 'motivation' && (
            <div className="space-y-6">
              <FullField label="¿Por qué quieres participar en este programa?" required hint="Sé específico: qué te motiva, qué esperas aprender y cómo lo aplicarías al regresar. Mínimo 150 palabras.">
                <textarea
                  className="input-base min-h-[180px]"
                  value={form.motivation_text}
                  onChange={(e) => update('motivation_text', e.target.value)}
                  placeholder="Mi motivación para participar es..."
                  autoFocus
                />
                <div className={`text-xs mt-1.5 ${
                  motivationWords < 150 ? 'text-amber-600' :
                  motivationWords < 220 ? 'text-iera-cyan' :
                  'text-iera-green'
                }`}>
                  {motivationWords} palabras
                  {motivationWords < 150 && ` · faltan ${150 - motivationWords}`}
                  {motivationWords >= 150 && motivationWords < 220 && ' · suficiente, puedes reforzarlo si lo deseas'}
                  {motivationWords >= 220 && ' · muy buena extensión'}
                </div>
              </FullField>

              <FullField label="¿En qué actividades de dawah estás involucrado actualmente?" hint="Opcional, pero nos ayuda a entender tu compromiso">
                <textarea className="input-base min-h-[100px]" value={form.dawah_activities_current} onChange={(e) => update('dawah_activities_current', e.target.value)} placeholder="Ejemplos: círculo semanal de Corán, voluntariado en mezquita, redes sociales, clases..." />
              </FullField>

              <div className="pt-5 border-t border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-1">Tu perfil</h3>
                <p className="text-xs text-slate-500 mb-3">Opcional. Estos criterios suman puntos en la evaluación.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRIORITY_CRITERIA_ES.map((c) => (
                    <label key={c.key} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                      form[c.key] ? 'border-iera-cyan bg-iera-cyan/5' : 'border-slate-200 hover:border-iera-cyan/50'
                    }`}>
                      <input type="checkbox" className="accent-iera-cyan" checked={form[c.key]} onChange={(e) => update(c.key, e.target.checked)} />
                      <span className="text-sm flex-1">{c.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PASO 5: Compromiso */}
          {stepDef.id === 'commitment' && (
            <div className="space-y-5">
              <label className={`flex items-start gap-3 cursor-pointer p-5 rounded-xl border-2 transition ${
                form.availability_confirmed ? 'border-iera-green bg-iera-green/5' : 'border-slate-200 hover:border-iera-cyan/50'
              }`}>
                <input
                  type="checkbox" className="accent-iera-green mt-0.5 w-5 h-5"
                  checked={form.availability_confirmed}
                  onChange={(e) => update('availability_confirmed', e.target.checked)}
                />
                <div className="text-sm">
                  <div className="font-bold mb-1">Confirmo disponibilidad completa por 3 meses <span className="text-red-500">*</span></div>
                  <p className="text-slate-600 text-xs">Sin interrupciones laborales, familiares ni académicas durante el programa.</p>
                </div>
              </label>

              <div className="pt-3">
                <h3 className="text-sm font-bold text-slate-800 mb-3">Contacto de emergencia</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Nombre" required>
                    <input className="input-base" value={form.emergency_contact_name} onChange={(e) => update('emergency_contact_name', e.target.value)} />
                  </Field>
                  <Field label="Relación" required>
                    <select className="input-base" value={form.emergency_contact_relation} onChange={(e) => update('emergency_contact_relation', e.target.value)}>
                      {EMERGENCY_RELATIONS_ES.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </Field>
                  <FullField label="Teléfono (con código de país)" required>
                    <div className="flex gap-2">
                      <select className="input-base w-32" value={form.emergency_contact_country_code} onChange={(e) => update('emergency_contact_country_code', e.target.value)}>
                        {COUNTRY_CODES.map((c) => <option key={c.code} value={c.code}>{c.code} · {c.name}</option>)}
                      </select>
                      <input type="tel" className="input-base flex-1" value={form.emergency_contact_phone} onChange={(e) => update('emergency_contact_phone', e.target.value)} placeholder="número de teléfono" />
                    </div>
                  </FullField>
                </div>
              </div>

              <div className="pt-3">
                <label className={`flex items-start gap-3 cursor-pointer p-5 rounded-xl border-2 transition ${
                  form.accepted_charter ? 'border-iera-green bg-iera-green/5' : 'border-amber-300 bg-amber-50/50 hover:border-iera-cyan'
                }`}>
                  <input
                    type="checkbox" className="accent-iera-green mt-0.5 w-5 h-5"
                    checked={form.accepted_charter}
                    onChange={(e) => update('accepted_charter', e.target.checked)}
                  />
                  <div className="text-sm">
                    <div className="font-bold mb-2">Acepto los términos del Programa Dawah Pioneers <span className="text-red-500">*</span></div>
                    <p className="text-slate-700 text-xs leading-relaxed">
                      Entiendo que:
                      <br />
                      <strong>(a)</strong> si me retiro sin causa justificada aprobada por iERA, debo reembolsar los costos invertidos en mí hasta la fecha de retiro;
                      <br />
                      <strong>(b)</strong> el empleo post-graduación es <strong>condicional</strong> al rendimiento académico y recomendación de BIU; <strong>no automático</strong>;
                      <br />
                      <strong>(c)</strong> si recibo y acepto una oferta formal, me comprometo a servir como Outreach Specialist por al menos 12 meses.
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-3 grid grid-cols-3 gap-3 text-center">
                <div className="text-xs text-slate-500">
                  <div className="text-2xl mb-1">🔒</div>
                  Datos protegidos
                </div>
                <div className="text-xs text-slate-500">
                  <div className="text-2xl mb-1">⏱</div>
                  Revisión en 3-5 días
                </div>
                <div className="text-xs text-slate-500">
                  <div className="text-2xl mb-1">📱</div>
                  Contacto por WhatsApp
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
            {currentStep > 0 ? (
              <button type="button" onClick={goBack} className="text-sm font-semibold text-slate-600 hover:text-iera-500 flex items-center gap-1">
                ← Volver
              </button>
            ) : <div />}

            {!isLastStep ? (
              <button
                type="button"
                onClick={goNext}
                className="bg-iera-500 hover:bg-black text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition flex items-center gap-2"
              >
                Continuar
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                disabled={saving}
                className="bg-iera-500 hover:bg-black text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (<>Enviando...</>) : (<>Enviar solicitud</>)}
              </button>
            )}
          </div>
        </form>

        <div className="text-center text-xs text-slate-500 mt-8 pt-4 flex flex-col items-center gap-2">
          <img src="/iera-logo.png" alt="iERA" className="h-7 opacity-60" />
          <div>
            iERA · Islamic Education and Research Academy
            <br />
            <span className="text-slate-400">Dawah Pioneers Indonesia 2026 · Tu progreso se guarda automáticamente</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
    </div>
  )
}

function FullField({ label, required, hint, children }) {
  return (
    <div className="col-span-full sm:col-span-2">
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
    </div>
  )
}
