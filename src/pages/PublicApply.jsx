import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ARABIC_LEVELS, EMERGENCY_RELATIONS, PRIORITY_CRITERIA, MUSLIM_STATUS_OPTIONS, COUNTRY_CODES } from '../lib/constants'
import { evaluateAutoPreselection } from '../lib/autoPreselection'
import BlockingModal from '../components/BlockingModal'

const REVIEW_MARKER = '[REVISION_COORDINADOR]'

const STORAGE_KEY = 'iera-application-draft-v1'

const STEPS = [
  { id: 'personal',   title: 'About you',              subtitle: 'Basic personal information',                 icon: '👤', estimate: '2 min' },
  { id: 'passport',   title: 'Passport',               subtitle: 'Travel document details',                          icon: '🛂', estimate: '1 min' },
  { id: 'islamic',    title: 'Islamic background',       subtitle: 'Reference, background and education',         icon: '🕌', estimate: '2 min' },
  { id: 'motivation', title: 'Motivation',            subtitle: 'Why you want to participate',                   icon: '🎯', estimate: '3 min' },
  { id: 'commitment', title: 'Final commitment',      subtitle: 'Availability, contact and acceptance',       icon: '✓',  estimate: '2 min' }
]

const EMPTY_FORM = {
  full_name: '', email: '', phone: '', whatsapp: '', whatsapp_country_code: '+52', birth_date: '',
  country_id: '', city: '', occupation: '', education_level: '',
  passport_number: '', passport_expiry: '', passport_country: '',
  sheikh_reference_name: '', sheikh_reference_contact: '', islamic_center_name: '',
  arabic_level: 'none', other_languages: '',
  muslim_status: '', conversion_month: '',
  motivation_text: '', dawah_activities_current: '',
  has_institution: false, active_dawah: false, community_network: false,
  iera_referral: false, speaks_other_lang: false, three_plus_courses: false,
  availability_confirmed: false,
  emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_country_code: '+52', emergency_contact_relation: 'Mother',
  accepted_charter: false,
  islamic_courses: []
}

export default function PublicApply() {
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

  // Restore draft from localStorage on mount
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

  // Auto-save draft on every change
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

  // Validate current step BEFORE allowing next
  const validateCurrentStep = () => {
    const errors = []
    const step = STEPS[currentStep].id

    if (step === 'personal') {
      if (!form.full_name?.trim()) errors.push('Full name')
      if (!form.email?.trim()) errors.push('Email')
      if (!/^\S+@\S+\.\S+$/.test(form.email || '')) errors.push('Valid email format')
      if (!form.whatsapp?.trim()) errors.push('WhatsApp number')
      if (!form.birth_date) errors.push('Date of birth')
      if (age !== null && (age < 18 || age > 40)) errors.push('Age must be between 18 and 40')
      if (!form.country_id) errors.push('Country of residence')
      if (!form.city?.trim()) errors.push('City')
    }

    if (step === 'passport') {
      if (!form.passport_number?.trim()) errors.push('Passport number')
      if (!form.passport_expiry) errors.push('Passport expiry date')
      if (form.passport_expiry) {
        const days = (new Date(form.passport_expiry) - new Date()) / (1000 * 60 * 60 * 24)
        if (days < 180) errors.push('Passport must be valid for at least 6 months')
      }
    }

    if (step === 'islamic') {
      if (!form.muslim_status) errors.push('Muslim status')
      if (form.muslim_status === 'new_muslim' && !form.conversion_month) errors.push('Approximate month you embraced Islam')
      if (!form.sheikh_reference_name?.trim()) errors.push('Sheikh or Islamic center reference')
      if (!form.sheikh_reference_contact?.trim()) errors.push('Reference contact')
    }

    if (step === 'motivation') {
      if (!form.motivation_text?.trim() || motivationWords < 150) {
        errors.push('Motivation (minimum 150 words)')
      }
    }

    if (step === 'commitment') {
      if (!form.availability_confirmed) errors.push('Confirm 3-month availability')
      if (!form.accepted_charter) errors.push('Accept program terms')
      if (!form.emergency_contact_name?.trim()) errors.push('Emergency contact name')
      if (!form.emergency_contact_phone?.trim()) errors.push('Emergency contact phone')
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
    // Evaluate BEFORE doing anything else. If there are blocking reasons,
    // show the modal and let the candidate correct their data — do NOT insert.
    const evaluation = evaluateAutoPreselection(form)
    if (evaluation.blocking.length > 0) {
      setBlockingReasons(evaluation.blocking)
      return
    }

    setSaving(true)
    setError(null)
    try {
      const baseNote = evaluation.needsReview
        ? `${REVIEW_MARKER} Edad fuera del rango estándar (41-45). Revisar antes de avanzar de etapa.`
        : 'Preseleccion automatica via formulario publico'
      const payload = {
        ...form,
        country_id: parseInt(form.country_id),
        birth_date: form.birth_date || null,
        passport_expiry: form.passport_expiry || null,
        muslim_status: form.muslim_status || null,
        conversion_month: form.muslim_status === 'new_muslim' ? form.conversion_month || null : null,
        current_stage: evaluation.suggestedStage,
        notes: baseNote
      }
      const { data, error: insertError } = await supabase.from('candidates').insert(payload).select().single()
      if (insertError) throw insertError

      await supabase.from('stages_history').insert({
        candidate_id: data.id, from_stage: null, to_stage: 'inscrito',
        changed_by: 'system', notes: 'Registro via formulario publico'
      })
      if (evaluation.passed) {
        await supabase.from('stages_history').insert({
          candidate_id: data.id, from_stage: 'inscrito', to_stage: 'preseleccionado',
          changed_by: 'system', notes: 'Preseleccion automatica aprobada'
        })
      } else if (evaluation.needsReview) {
        await supabase.from('stages_history').insert({
          candidate_id: data.id, from_stage: 'inscrito', to_stage: 'inscrito',
          changed_by: 'system', notes: `${REVIEW_MARKER} Coordinador debe revisar (edad 41-45)`
        })
      }

      // Clear draft on successful submit
      localStorage.removeItem(STORAGE_KEY)

      navigate(`/aplicar/resultado?passed=true&id=${data.id}${evaluation.needsReview ? '&review=1' : ''}`)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Error submitting application')
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
        lang="en"
        reasons={blockingReasons}
        onClose={() => setBlockingReasons([])}
      />
      {/* ─── Sticky compact header ─── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/iera-logo.png" alt="iERA" className="h-8" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-500 hidden sm:block">
              Step {currentStep + 1} of {STEPS.length} · ~{stepDef.estimate}
            </div>
            <Link to="/aplicar/es" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition">
              🌐 Español
            </Link>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-iera-cyan via-iera-green to-iera-yellow transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8" ref={formTopRef}>
        {/* ─── Step indicator (visual journey) ─── */}
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

        {/* ─── Step header ─── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-iera-500 text-white rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
            <span className="iera-diamond"></span>
            Step {currentStep + 1} of {STEPS.length}
          </div>
          <div className="text-5xl mb-3">{stepDef.icon}</div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-iera-500 mb-2">{stepDef.title}</h1>
          <p className="text-slate-600">{stepDef.subtitle}</p>
        </div>

        {/* ─── Restored notice ─── */}
        {restored && currentStep === 0 && (
          <div className="mb-5 p-3 bg-iera-cyan/10 border border-iera-cyan/30 rounded-lg text-sm text-slate-700 flex items-start gap-2">
            <span>💾</span>
            <div className="flex-1">
              <strong>Draft restored.</strong> We saved your previous progress. You can continue where you left off.
              <button
                type="button"
                onClick={() => { setForm(EMPTY_FORM); localStorage.removeItem(STORAGE_KEY); setRestored(false) }}
                className="ml-2 underline hover:no-underline text-xs"
              >
                Start fresh
              </button>
            </div>
          </div>
        )}

        {/* ─── Validation errors ─── */}
        {stepErrors.length > 0 && (
          <div className="mb-5 p-4 bg-amber-50 border-2 border-amber-300 text-amber-900 rounded-lg text-sm">
            <div className="font-bold mb-2">Please complete these before continuing:</div>
            <ul className="list-disc list-insiof space-y-0.5 ml-1">
              {stepErrors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}

        {error && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            ⚠ {error}
          </div>
        )}

        {/* ─── Form content (per step) ─── */}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8">

          {/* STEP 1: Personal info */}
          {stepDef.id === 'personal' && (
            <div className="space-y-5">
              <FullField label="Full name" required>
                <input className="input-base" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} placeholder="As it appears on your passport" autoFocus />
              </FullField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Date of birth" required>
                  <input type="date" className="input-base" value={form.birth_date} onChange={(e) => update('birth_date', e.target.value)} />
                </Field>
                <Field label="Age">
                  <div className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                    age === null ? 'bg-slate-50 text-slate-400' :
                    age >= 18 && age <= 40 ? 'bg-iera-green/10 text-iera-green' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {age === null ? '-' : age >= 18 && age <= 40 ? `${age} years · Eligible` : `${age} years · out of range (18-40)`}
                  </div>
                </Field>

                <FullField label="Email" required hint="We will send updates here">
                  <input type="email" className="input-base" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="name@email.com" />
                </FullField>

                <FullField label="WhatsApp" required hint="Your Country Manager will contact you here">
                  <div className="flex gap-2">
                    <select className="input-base w-28" value={form.whatsapp_country_code} onChange={(e) => update('whatsapp_country_code', e.target.value)}>
                      {COUNTRY_CODES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
                    </select>
                    <input type="tel" className="input-base flex-1" value={form.whatsapp} onChange={(e) => update('whatsapp', e.target.value)} placeholder="phone number" />
                  </div>
                </FullField>

                <Field label="Country of residence" required>
                  <select className="input-base" value={form.country_id} onChange={(e) => update('country_id', e.target.value)}>
                    <option value="">Select...</option>
                    {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="City" required>
                  <input className="input-base" value={form.city} onChange={(e) => update('city', e.target.value)} />
                </Field>

                <Field label="Current occupation" hint="What you do today">
                  <input className="input-base" value={form.occupation} onChange={(e) => update('occupation', e.target.value)} placeholder="e.g. student, merchant" />
                </Field>
                <Field label="Education level">
                  <select className="input-base" value={form.education_level} onChange={(e) => update('education_level', e.target.value)}>
                    <option value="">Select...</option>
                    <option>High school</option>
                    <option>Technical</option>
                    <option>University</option>
                    <option>Postgraduate</option>
                  </select>
                </Field>
              </div>
            </div>
          )}

          {/* STEP 2: Passport */}
          {stepDef.id === 'passport' && (
            <div className="space-y-5">
              <div className="bg-iera-cyan/10 border border-iera-cyan/30 rounded-lg p-3 text-sm text-slate-700">
                <strong className="text-iera-500">Your passport must be valid for at least 6 months</strong> from the travel date. If it expires sooner, renew it before applying.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FullField label="Passport number" required>
                  <input className="input-base" value={form.passport_number} onChange={(e) => update('passport_number', e.target.value)} placeholder="e.g. G12345678" autoFocus />
                </FullField>
                <Field label="Expiry date" required>
                  <input type="date" className="input-base" value={form.passport_expiry} onChange={(e) => update('passport_expiry', e.target.value)} />
                </Field>
                <Field label="Issuing country">
                  <input className="input-base" value={form.passport_country} onChange={(e) => update('passport_country', e.target.value)} placeholder="Country of issue" />
                </Field>
              </div>

              {form.passport_expiry && (
                <div className={`p-3 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                  (new Date(form.passport_expiry) - new Date()) / (1000 * 60 * 60 * 24) > 180
                    ? 'bg-iera-green/10 text-iera-green'
                    : 'bg-red-50 text-red-600'
                }`}>
                  {(new Date(form.passport_expiry) - new Date()) / (1000 * 60 * 60 * 24) > 180
                    ? 'Your passport meets the 6-month requirement'
                    : 'Your passport expires soon. Renew it before applying'}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Islamic */}
          {stepDef.id === 'islamic' && (
            <div className="space-y-6">
              {/* Muslim status */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-3">Muslim status <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {MUSLIM_STATUS_OPTIONS.map((opt) => (
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
                      When did you embrace Islam? <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-slate-500 mb-2">Approximate month and year. We do not need the exact day.</p>
                    <input type="month" className="input-base max-w-xs" value={form.conversion_month} onChange={(e) => update('conversion_month', e.target.value)} />
                  </div>
                )}
              </div>

              {/* Sheikh reference */}
              <div className="pt-5 border-t border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-3">Sheikh or Islamic center reference</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Reference name" required>
                    <input className="input-base" value={form.sheikh_reference_name} onChange={(e) => update('sheikh_reference_name', e.target.value)} placeholder="Sheikh or center name" />
                  </Field>
                  <Field label="Reference contact" required hint="WhatsApp or email">
                    <input className="input-base" value={form.sheikh_reference_contact} onChange={(e) => update('sheikh_reference_contact', e.target.value)} placeholder="+52... or email@..." />
                  </Field>
                  <FullField label="Islamic center you attend">
                    <input className="input-base" value={form.islamic_center_name} onChange={(e) => update('islamic_center_name', e.target.value)} placeholder="Optional" />
                  </FullField>
                </div>
              </div>

              {/* Languages */}
              <div className="pt-5 border-t border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-3">Languages</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Arabic level">
                    <select className="input-base" value={form.arabic_level} onChange={(e) => update('arabic_level', e.target.value)}>
                      {ARABIC_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Other languages you speak" hint="English, French, Portuguese, etc.">
                    <input className="input-base" value={form.other_languages} onChange={(e) => update('other_languages', e.target.value)} placeholder="Optional" />
                  </Field>
                </div>
              </div>

              {/* Islamic courses */}
              <div className="pt-5 border-t border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-1">Islamic courses completed</h3>
                <p className="text-xs text-slate-500 mb-3">Optional. Add the courses you have taken.</p>
                <div className="space-y-2">
                  {form.islamic_courses.map((c, i) => (
                    <div key={i} className="grid grid-cols-[1fr,1fr,140px,30px] gap-2 items-center">
                      <input className="input-base text-xs py-1.5" placeholder="Course name" value={c.name} onChange={(e) => updateCourse(i, 'name', e.target.value)} />
                      <input className="input-base text-xs py-1.5" placeholder="Institution" value={c.institution} onChange={(e) => updateCourse(i, 'institution', e.target.value)} />
                      <input type="month" className="input-base text-xs py-1.5" value={c.date} onChange={(e) => updateCourse(i, 'date', e.target.value)} />
                      <button type="button" className="text-slate-400 hover:text-red-500" onClick={() => removeCourse(i)}>×</button>
                    </div>
                  ))}
                  <button type="button" onClick={addCourse} className="px-3 py-1.5 bg-iera-cyan/10 text-iera-cyan rounded-md text-xs font-semibold border border-dashed border-iera-cyan hover:bg-iera-cyan/20">
                    + Add course
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Motivation */}
          {stepDef.id === 'motivation' && (
            <div className="space-y-6">
              <FullField label="Why do you want to participate in this program?" required hint="Be specific: what motivates you, what you hope to learn, and how you would apply it when you return. Minimum 150 words.">
                <textarea
                  className="input-base min-h-[180px]"
                  value={form.motivation_text}
                  onChange={(e) => update('motivation_text', e.target.value)}
                  placeholder="My motivation to participate is..."
                  autoFocus
                />
                <div className={`text-xs mt-1.5 ${
                  motivationWords < 150 ? 'text-amber-600' :
                  motivationWords < 220 ? 'text-iera-cyan' :
                  'text-iera-green'
                }`}>
                  {motivationWords} words
                  {motivationWords < 150 && ` · missing ${150 - motivationWords}`}
                  {motivationWords >= 150 && motivationWords < 220 && ' · sufficient, you can strengthen it if you want'}
                  {motivationWords >= 220 && ' · very good length'}
                </div>
              </FullField>

              <FullField label="What dawah activities are you currently involved in?" hint="Optional, but it helps us understand your commitment">
                <textarea className="input-base min-h-[100px]" value={form.dawah_activities_current} onChange={(e) => update('dawah_activities_current', e.target.value)} placeholder="Examples: weekly Quran circle, mosque volunteering, social media, classes..." />
              </FullField>

              {/* Profile / priority criteria */}
              <div className="pt-5 border-t border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-1">Your profile</h3>
                <p className="text-xs text-slate-500 mb-3">Optional. These criteria add bonus points in the evaluation.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRIORITY_CRITERIA.map((c) => (
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

          {/* STEP 5: Commitment */}
          {stepDef.id === 'commitment' && (
            <div className="space-y-5">
              {/* Availability */}
              <label className={`flex items-start gap-3 cursor-pointer p-5 rounded-xl border-2 transition ${
                form.availability_confirmed ? 'border-iera-green bg-iera-green/5' : 'border-slate-200 hover:border-iera-cyan/50'
              }`}>
                <input
                  type="checkbox" className="accent-iera-green mt-0.5 w-5 h-5"
                  checked={form.availability_confirmed}
                  onChange={(e) => update('availability_confirmed', e.target.checked)}
                />
                <div className="text-sm">
                  <div className="font-bold mb-1">I confirm full availability for 3 months <span className="text-red-500">*</span></div>
                  <p className="text-slate-600 text-xs">No work, family, or academic interruptions during the program.</p>
                </div>
              </label>

              {/* Emergency contact */}
              <div className="pt-3">
                <h3 className="text-sm font-bold text-slate-800 mb-3">Emergency contact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Name" required>
                    <input className="input-base" value={form.emergency_contact_name} onChange={(e) => update('emergency_contact_name', e.target.value)} />
                  </Field>
                  <Field label="Relationship" required>
                    <select className="input-base" value={form.emergency_contact_relation} onChange={(e) => update('emergency_contact_relation', e.target.value)}>
                      {EMERGENCY_RELATIONS.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </Field>
                  <FullField label="Phone (with country code)" required>
                    <div className="flex gap-2">
                      <select className="input-base w-32" value={form.emergency_contact_country_code} onChange={(e) => update('emergency_contact_country_code', e.target.value)}>
                        {COUNTRY_CODES.map((c) => <option key={c.code} value={c.code}>{c.code} · {c.name}</option>)}
                      </select>
                      <input type="tel" className="input-base flex-1" value={form.emergency_contact_phone} onChange={(e) => update('emergency_contact_phone', e.target.value)} placeholder="phone number" />
                    </div>
                  </FullField>
                </div>
              </div>

              {/* Charter acceptance */}
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
                    <div className="font-bold mb-2">I accept the Dawah Pioneers Program terms <span className="text-red-500">*</span></div>
                    <p className="text-slate-700 text-xs leading-relaxed">
                      I understand that:
                      <br />
                      <strong>(a)</strong> if I withdraw without justified cause approved by iERA, I must reimburse the costs invested in me up to the withdrawal date;
                      <br />
                      <strong>(b)</strong> post-graduation employment is <strong>conditional</strong> on academic performance and BIU recommendation; <strong>not automatic</strong>;
                      <br />
                      <strong>(c)</strong> if I receive and accept a formal offer, I commit to serving as Outreach Specialist for at least 12 months.
                    </p>
                  </div>
                </label>
              </div>

              {/* Trust signals near submit */}
              <div className="pt-3 grid grid-cols-3 gap-3 text-center">
                <div className="text-xs text-slate-500">
                  <div className="text-2xl mb-1">🔒</div>
                  Data protected
                </div>
                <div className="text-xs text-slate-500">
                  <div className="text-2xl mb-1">⏱</div>
                  Review in 3-5 days
                </div>
                <div className="text-xs text-slate-500">
                  <div className="text-2xl mb-1">📱</div>
                  WhatsApp contact
                </div>
              </div>
            </div>
          )}

          {/* ─── Navigation ─── */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
            {currentStep > 0 ? (
              <button type="button" onClick={goBack} className="text-sm font-semibold text-slate-600 hover:text-iera-500 flex items-center gap-1">
                ← Back
              </button>
            ) : <div />}

            {!isLastStep ? (
              <button
                type="button"
                onClick={goNext}
                className="bg-iera-500 hover:bg-black text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition flex items-center gap-2"
              >
                Continue
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
                {saving ? (<>Sending...</>) : (<>Submit application</>)}
              </button>
            )}
          </div>
        </form>

        {/* ─── Footer ─── */}
        <div className="text-center text-xs text-slate-500 mt-8 pt-4 flex flex-col items-center gap-2">
          <img src="/iera-logo.png" alt="iERA" className="h-7 opacity-60" />
          <div>
            iERA · Islamic Education and Research Academy
            <br />
            <span className="text-slate-400">Dawah Pioneers Indonesia 2026 · Your progress is auto-saved</span>
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
