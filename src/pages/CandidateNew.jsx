import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ARABIC_LEVELS, EMERGENCY_RELATIONS, PRIORITY_CRITERIA, MUSLIM_STATUS_OPTIONS, COUNTRY_CODES } from '../lib/constants'

export default function CandidateNew() {
  const navigate = useNavigate()
  const [countries, setCountries] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    whatsapp: '',
    birth_date: '',
    country_id: '',
    city: '',
    occupation: '',
    education_level: '',
    passport_number: '',
    passport_expiry: '',
    passport_country: '',
    sheikh_reference_name: '',
    sheikh_reference_contact: '',
    islamic_center_name: '',
    arabic_level: 'none',
    other_languages: '',
    muslim_status: '',
    conversion_month: '',
    whatsapp_country_code: '+52',
    emergency_contact_country_code: '+52',
    motivation_text: '',
    dawah_activities_current: '',
    has_institution: false,
    active_dawah: false,
    community_network: false,
    iera_referral: false,
    speaks_other_lang: false,
    three_plus_courses: false,
    availability_confirmed: false,
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: 'Mother',
    accepted_charter: false,
    islamic_courses: []
  })

  useEffect(() => {
    supabase.from('countries').select('*').order('name').then(({ data }) => {
      setCountries(data || [])
    })
  }, [])

  const age = form.birth_date
    ? Math.floor((new Date() - new Date(form.birth_date)) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  const ageOk = age !== null && age >= 18 && age <= 40
  const passportOk = form.passport_expiry
    ? (new Date(form.passport_expiry) - new Date()) / (1000 * 60 * 60 * 24) > 180
    : null

  const priorityPoints = PRIORITY_CRITERIA.reduce(
    (sum, c) => sum + (form[c.key] ? c.points : 0),
    0
  )

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const addCourse = () => {
    update('islamic_courses', [...form.islamic_courses, { name: '', institution: '', date: '' }])
  }
  const updateCourse = (i, field, value) => {
    const next = [...form.islamic_courses]
    next[i] = { ...next[i], [field]: value }
    update('islamic_courses', next)
  }
  const removeCourse = (i) => {
    update('islamic_courses', form.islamic_courses.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      if (!form.full_name || !form.email || !form.country_id) {
        throw new Error('Required fields missing: name, email or country')
      }
      if (!form.accepted_charter) {
        throw new Error('You must accept the Program Charter terms')
      }
      if (!form.availability_confirmed) {
        throw new Error('You must confirm 3-month availability')
      }

      const payload = {
        ...form,
        country_id: parseInt(form.country_id),
        birth_date: form.birth_date || null,
        passport_expiry: form.passport_expiry || null,
        muslim_status: form.muslim_status || null,
        conversion_month: form.muslim_status === 'new_muslim' ? form.conversion_month || null : null
      }

      const { data, error: insertError } = await supabase
        .from('candidates')
        .insert(payload)
        .select()
        .single()

      if (insertError) throw insertError

      await supabase.from('stages_history').insert({
        candidate_id: data.id,
        from_stage: null,
        to_stage: 'inscrito',
        changed_by: 'system',
        notes: 'Candidate created'
      })

      navigate('/candidatos')
    } catch (err) {
      console.error(err)
      setError(err.message || 'Error saving')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold">New candidate</h2>
          <p className="text-sm text-slate-500 mt-1">Full form per Manual v1.1 (25 fields)</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/candidatos')}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          ⚠ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* SECTION 1: PERSONAL DATA */}
        <div className="card">
          <div className="card-header flex justify-between">
            <div>
              <h3 className="font-bold text-base">1 · Personal data</h3>
              <p className="text-xs text-slate-500 mt-0.5">Identification information</p>
            </div>
            <span className="px-2.5 py-1 bg-iera-100 text-iera-700 rounded-full text-xs font-semibold self-center">
              8 fields
            </span>
          </div>
          <div className="card-body grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="col-span-1 sm:col-span-3">
              <label className="label-base">Full name <span className="text-red-500">*</span></label>
              <input
                className="input-base"
                value={form.full_name}
                onChange={(e) => update('full_name', e.target.value)}
                placeholder="Ahmad Martinez Garcia"
                required
              />
            </div>
            <div>
              <label className="label-base">
                Date of birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="input-base"
                value={form.birth_date}
                onChange={(e) => update('birth_date', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label-base">
                Age
                {age !== null && (
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      ageOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {ageOk ? '18-40 ✓' : '⚠ out of range'}
                  </span>
                )}
              </label>
              <input
                className="input-base bg-slate-50"
                value={age !== null ? `${age} years` : ''}
                disabled
              />
            </div>
            <div></div>
            <div>
              <label className="label-base">Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                className="input-base"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label-base">WhatsApp <span className="text-red-500">*</span></label>
              <input
                type="tel"
                className="input-base"
                value={form.whatsapp}
                onChange={(e) => update('whatsapp', e.target.value)}
                placeholder="+52 ..."
              />
            </div>
            <div>
              <label className="label-base">Landline</label>
              <input
                type="tel"
                className="input-base"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
              />
            </div>
            <div>
              <label className="label-base">Country of residence <span className="text-red-500">*</span></label>
              <select
                className="input-base"
                value={form.country_id}
                onChange={(e) => update('country_id', e.target.value)}
                required
              >
                <option value="">Select...</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-base">City <span className="text-red-500">*</span></label>
              <input
                className="input-base"
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
              />
            </div>
            <div>
              <label className="label-base">Current occupation</label>
              <input
                className="input-base"
                value={form.occupation}
                onChange={(e) => update('occupation', e.target.value)}
              />
            </div>
            <div>
              <label className="label-base">Education level</label>
              <select
                className="input-base"
                value={form.education_level}
                onChange={(e) => update('education_level', e.target.value)}
              >
                <option value="">Select...</option>
                <option>High school</option>
                <option>Technical</option>
                <option>University</option>
                <option>Postgraduate</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: PASSPORT */}
        <div className="card">
          <div className="card-header flex justify-between">
            <div>
              <h3 className="font-bold text-base">2 · Passport</h3>
              <p className="text-xs text-slate-500 mt-0.5">Auto-validated against program start date</p>
            </div>
            <span className="px-2.5 py-1 bg-iera-100 text-iera-700 rounded-full text-xs font-semibold self-center">
              3 fields
            </span>
          </div>
          <div className="card-body grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label-base">Passport number</label>
              <input
                className="input-base"
                value={form.passport_number}
                onChange={(e) => update('passport_number', e.target.value)}
                placeholder="G12345678"
              />
            </div>
            <div>
              <label className="label-base">
                Expiry
                {passportOk !== null && (
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      passportOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {passportOk ? '6+ months ✓' : '⚠ <6 months'}
                  </span>
                )}
              </label>
              <input
                type="date"
                className="input-base"
                value={form.passport_expiry}
                onChange={(e) => update('passport_expiry', e.target.value)}
              />
            </div>
            <div>
              <label className="label-base">Issuing country</label>
              <input
                className="input-base"
                value={form.passport_country}
                onChange={(e) => update('passport_country', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: ISLAMIC PROFILE */}
        <div className="card">
          <div className="card-header flex justify-between">
            <div>
              <h3 className="font-bold text-base">3 · Islamic profile</h3>
              <p className="text-xs text-slate-500 mt-0.5">Background and references</p>
            </div>
            <span className="px-2.5 py-1 bg-iera-100 text-iera-700 rounded-full text-xs font-semibold self-center">
              5 fields
            </span>
          </div>
          <div className="card-body grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-1 sm:col-span-2 pb-3 border-b border-slate-200">
              <label className="label-base">Muslim status</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {MUSLIM_STATUS_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 p-2.5 border rounded-md cursor-pointer transition text-sm ${
                      form.muslim_status === opt.value
                        ? 'border-iera-500 bg-iera-50'
                        : 'border-slate-200 hover:border-iera-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name="muslim_status_admin"
                      value={opt.value}
                      checked={form.muslim_status === opt.value}
                      onChange={(e) => update('muslim_status', e.target.value)}
                      className="accent-iera-500"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
              {form.muslim_status === 'new_muslim' && (
                <div className="mt-3">
                  <label className="label-base">When did they embrace Islam? (month + year)</label>
                  <input
                    type="month"
                    className="input-base max-w-xs"
                    value={form.conversion_month}
                    onChange={(e) => update('conversion_month', e.target.value)}
                  />
                </div>
              )}
            </div>
            <div>
              <label className="label-base">Reference Sheikh / Center — Name <span className="text-red-500">*</span></label>
              <input
                className="input-base"
                value={form.sheikh_reference_name}
                onChange={(e) => update('sheikh_reference_name', e.target.value)}
              />
            </div>
            <div>
              <label className="label-base">Sheikh — Contact <span className="text-red-500">*</span></label>
              <input
                className="input-base"
                value={form.sheikh_reference_contact}
                onChange={(e) => update('sheikh_reference_contact', e.target.value)}
                placeholder="WhatsApp or email"
              />
            </div>
            <div>
              <label className="label-base">Islamic center</label>
              <input
                className="input-base"
                value={form.islamic_center_name}
                onChange={(e) => update('islamic_center_name', e.target.value)}
              />
            </div>
            <div>
              <label className="label-base">Arabic level</label>
              <select
                className="input-base"
                value={form.arabic_level}
                onChange={(e) => update('arabic_level', e.target.value)}
              >
                {ARABIC_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-1 sm:col-span-2">
              <label className="label-base">
                Other languages
                <span className="text-slate-500 font-normal ml-1">(adds +4 if speaks English or another)</span>
              </label>
              <input
                className="input-base"
                value={form.other_languages}
                onChange={(e) => update('other_languages', e.target.value)}
                placeholder="English, French, Portuguese..."
              />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <label className="label-base">
                Islamic courses completed
                <span className="text-slate-500 font-normal ml-1">(3+ = +4 priority points)</span>
              </label>
              <div className="space-y-2">
                {form.islamic_courses.map((c, i) => (
                  <div key={i} className="grid grid-cols-[1fr,1fr,140px,30px] gap-2 items-center">
                    <input
                      className="input-base text-xs py-1.5"
                      placeholder="Course name"
                      value={c.name}
                      onChange={(e) => updateCourse(i, 'name', e.target.value)}
                    />
                    <input
                      className="input-base text-xs py-1.5"
                      placeholder="Institution"
                      value={c.institution}
                      onChange={(e) => updateCourse(i, 'institution', e.target.value)}
                    />
                    <input
                      type="month"
                      className="input-base text-xs py-1.5"
                      value={c.date}
                      onChange={(e) => updateCourse(i, 'date', e.target.value)}
                    />
                    <button
                      type="button"
                      className="text-slate-400 hover:text-red-500"
                      onClick={() => removeCourse(i)}
                    >×</button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addCourse}
                  className="px-3 py-1.5 bg-iera-50 text-iera-700 rounded-md text-xs font-semibold border border-dashed border-iera-500 hover:bg-iera-100"
                >
                  + Add course
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: MOTIVATION */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-bold text-base">4 · Motivation and experience</h3>
            <p className="text-xs text-slate-500 mt-0.5">Connects to motivation evaluation criteria (25 pts)</p>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="label-base">
                Why do you want to participate? <span className="text-red-500">*</span>
                <span className="text-slate-500 font-normal ml-1">(minimum 150 words)</span>
              </label>
              <textarea
                className="input-base min-h-[100px]"
                value={form.motivation_text}
                onChange={(e) => update('motivation_text', e.target.value)}
                placeholder="Share your motivation, what you hope to learn..."
              />
            </div>
            <div>
              <label className="label-base">Current dawah activities</label>
              <textarea
                className="input-base min-h-[80px]"
                value={form.dawah_activities_current}
                onChange={(e) => update('dawah_activities_current', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: PRIORITY */}
        <div className="card">
          <div className="card-header flex justify-between">
            <div>
              <h3 className="font-bold text-base">5 · Priority criteria</h3>
              <p className="text-xs text-slate-500 mt-0.5">Adds points in evaluation</p>
            </div>
            <span className="px-2.5 py-1 bg-iera-100 text-iera-700 rounded-full text-xs font-semibold self-center">
              +{priorityPoints} pts
            </span>
          </div>
          <div className="card-body grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PRIORITY_CRITERIA.map((c) => (
              <label
                key={c.key}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                  form[c.key] ? 'border-iera-500 bg-iera-50' : 'border-slate-200 hover:border-iera-500'
                }`}
              >
                <input
                  type="checkbox"
                  className="accent-iera-500"
                  checked={form[c.key]}
                  onChange={(e) => update(c.key, e.target.checked)}
                />
                <span className="text-sm flex-1">{c.label}</span>
                <span className="ml-auto bg-iera-100 text-iera-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  +{c.points}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* SECTION 6: AVAILABILITY AND EMERGENCY */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-bold text-base">6 · Availability, emergency and acceptance</h3>
          </div>
          <div className="card-body space-y-4">
            <label className="flex items-start gap-3 cursor-pointer p-3 bg-slate-50 rounded-lg">
              <input
                type="checkbox"
                className="accent-iera-500 mt-0.5"
                checked={form.availability_confirmed}
                onChange={(e) => update('availability_confirmed', e.target.checked)}
              />
              <span className="text-sm">
                <strong>I confirm full availability</strong> for 3 months without work, family or academic interruptions
                <span className="text-red-500 ml-1">*</span>
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label-base">Emergency contact — Name <span className="text-red-500">*</span></label>
                <input
                  className="input-base"
                  value={form.emergency_contact_name}
                  onChange={(e) => update('emergency_contact_name', e.target.value)}
                />
              </div>
              <div>
                <label className="label-base">Phone <span className="text-red-500">*</span></label>
                <div className="flex gap-1.5">
                  <select
                    className="input-base w-20 text-xs"
                    value={form.emergency_contact_country_code}
                    onChange={(e) => update('emergency_contact_country_code', e.target.value)}
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>{c.code}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    className="input-base flex-1"
                    value={form.emergency_contact_phone}
                    onChange={(e) => update('emergency_contact_phone', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="label-base">Relationship <span className="text-red-500">*</span></label>
                <select
                  className="input-base"
                  value={form.emergency_contact_relation}
                  onChange={(e) => update('emergency_contact_relation', e.target.value)}
                >
                  {EMERGENCY_RELATIONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer p-3 bg-amber-50 rounded-lg border border-amber-200">
              <input
                type="checkbox"
                className="accent-iera-500 mt-0.5"
                checked={form.accepted_charter}
                onChange={(e) => update('accepted_charter', e.target.checked)}
              />
              <div className="text-sm">
                <strong>I accept the terms and will sign the Program Charter</strong>
                <span className="text-red-500 ml-1">*</span>
                <p className="text-xs text-slate-600 mt-1">
                  Includes prorated reimbursement clause for the cost invested if I withdraw without justified cause (Manual v1.1 Section 4) and conditional post-graduation employment based on academic performance and BIU recommendation.
                </p>
              </div>
            </label>
          </div>
          <div className="submit-bar flex justify-between items-center px-5 py-4 bg-slate-50 border-t border-slate-200">
            <div className="text-xs text-slate-500">
              ✓ Meets 7 eliminating requirements · ready for pre-selection
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary" onClick={() => navigate('/candidatos')}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save and continue →'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
