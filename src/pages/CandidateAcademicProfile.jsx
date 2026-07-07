import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { DOCUMENT_TYPES, STORAGE_BUCKET } from '../lib/documentTypes'
import DocFilePreview from '../components/DocFilePreview'

// ---------------------------------------------------------------------------
// Bilingual value maps (structured fields are translated here; free text
// comes from the profile_translations table, editable on this page).
// ---------------------------------------------------------------------------
const EDUCATION_AR = [
  { match: /post|maestr|master|grado/i, en: 'Postgraduate', ar: 'دراسات عليا' },
  { match: /univer/i, en: 'University', ar: 'تعليم جامعي' },
  { match: /tec|tech/i, en: 'Technical education', ar: 'تعليم تقني' },
  { match: /high|bachiller|secund/i, en: 'High school', ar: 'التعليم الثانوي' }
]

const ARABIC_AR = {
  none: { en: 'None', ar: 'لا يوجد' },
  basic: { en: 'Basic', ar: 'مبتدئ' },
  intermediate: { en: 'Intermediate', ar: 'متوسط' },
  advanced: { en: 'Advanced', ar: 'متقدم' }
}

const COUNTRY_AR = {
  Mexico: 'المكسيك', 'México': 'المكسيك', Colombia: 'كولومبيا', Ecuador: 'الإكوادور',
  Venezuela: 'فنزويلا', Paraguay: 'باراغواي', Honduras: 'هندوراس', 'El Salvador': 'السلفادور',
  Peru: 'بيرو', 'Perú': 'بيرو', Chile: 'تشيلي', Argentina: 'الأرجنتين', Brazil: 'البرازيل',
  Guatemala: 'غواتيمالا', Panama: 'بنما', 'Panamá': 'بنما', 'Costa Rica': 'كوستاريكا',
  Spain: 'إسبانيا', 'España': 'إسبانيا'
}

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

const DOC_AR = {
  passport: 'صورة جواز السفر',
  tazkiyah: 'خطاب تزكية',
  background_check: 'شهادة خلو من السوابق',
  availability_decl: 'إقرار التفرغ',
  photo: 'صورة شخصية',
  islamic_courses: 'سجل الدورات الإسلامية',
  contract: 'العقد الموقّع'
}

// Free-text fields stored in profile_translations
const TRANSLATION_FIELDS = [
  { key: 'name_ar', label: 'Name in Arabic', dir: 'rtl', rows: 1 },
  { key: 'summary_en', label: 'Academic summary (EN)', rows: 4 },
  { key: 'summary_ar', label: 'Academic summary (AR)', dir: 'rtl', rows: 4 },
  { key: 'islamic_level_en', label: 'Islamic knowledge level (EN)', rows: 3 },
  { key: 'islamic_level_ar', label: 'Islamic knowledge level (AR)', dir: 'rtl', rows: 3 },
  { key: 'motivation_en', label: 'Motivation (EN)', rows: 6 },
  { key: 'motivation_ar', label: 'Motivation (AR)', dir: 'rtl', rows: 6 },
  { key: 'dawah_en', label: 'Dawah activities (EN)', rows: 2 },
  { key: 'dawah_ar', label: 'Dawah activities (AR)', dir: 'rtl', rows: 2 }
]

function eduLabel(value) {
  if (!value) return null
  const hit = EDUCATION_AR.find((e) => e.match.test(value))
  return hit || { en: value, ar: value }
}

function monthLabel(ym, lang) {
  // "2024-02" → "February 2024" / "فبراير 2024"
  if (!ym || !/^\d{4}-\d{2}/.test(ym)) return ym
  const [y, m] = ym.split('-')
  const names = lang === 'ar' ? MONTHS_AR : MONTHS_EN
  return `${names[parseInt(m, 10) - 1]} ${y}`
}

export default function CandidateAcademicProfile() {
  const { id } = useParams()
  const [candidate, setCandidate] = useState(null)
  const [documents, setDocuments] = useState([])
  const [translation, setTranslation] = useState(null)
  const [signedUrls, setSignedUrls] = useState({})
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('candidates').select('*, countries(name, code)').eq('id', id).single(),
      supabase.from('documents').select('*').eq('candidate_id', id).order('uploaded_at', { ascending: false }),
      supabase.from('profile_translations').select('*').eq('candidate_id', id).maybeSingle()
    ]).then(async ([c, d, t]) => {
      setCandidate(c.data)
      setDocuments(d.data || [])
      setTranslation(t.data)
      setDraft(t.data || {})

      const paths = (d.data || []).map((doc) => doc.file_url).filter(Boolean)
      if (paths.length) {
        const { data: signed } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrls(paths, 60 * 30)
        const map = {}
        for (const s of signed || []) {
          if (s.signedUrl && !s.error) map[s.path] = s.signedUrl
        }
        setSignedUrls(map)
      }
      setLoading(false)
    })
  }, [id])

  const saveTranslations = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const row = { candidate_id: id, updated_at: new Date().toISOString(), updated_by: user?.id }
    for (const f of TRANSLATION_FIELDS) row[f.key] = draft[f.key] || null
    const { data, error } = await supabase
      .from('profile_translations')
      .upsert(row, { onConflict: 'candidate_id' })
      .select()
      .single()
    setSaving(false)
    if (error) {
      alert(`Could not save translations: ${error.message}`)
      return
    }
    setTranslation(data)
    setEditing(false)
  }

  if (loading) return <div className="text-center py-12 text-slate-400">Loading...</div>
  if (!candidate) return <div>Candidate not found</div>

  const t = translation || {}
  const age = candidate.birth_date
    ? Math.floor((new Date() - new Date(candidate.birth_date)) / (365.25 * 24 * 60 * 60 * 1000))
    : null
  const edu = eduLabel(candidate.education_level)
  const arabic = ARABIC_AR[candidate.arabic_level] || { en: candidate.arabic_level, ar: candidate.arabic_level }
  const countryEn = candidate.countries?.name
  const countryAr = COUNTRY_AR[countryEn] || countryEn

  const muslimEn = candidate.muslim_status === 'born_muslim'
    ? 'Born Muslim'
    : `New Muslim${candidate.conversion_month ? ` since ${monthLabel(candidate.conversion_month, 'en')}` : ''}`
  const muslimAr = candidate.muslim_status === 'born_muslim'
    ? 'مسلم منذ الولادة'
    : `مسلم جديد${candidate.conversion_month ? ` منذ ${monthLabel(candidate.conversion_month, 'ar')}` : ''}`

  const courses = candidate.islamic_courses || []
  const attachedDocs = documents.filter((d) => d.file_url)

  return (
    <div className="export-wrapper bg-slate-100 min-h-screen py-6 print:bg-white print:py-0">
      {/* Toolbar (not printed) */}
      <div className="max-w-[210mm] mx-auto mb-4 px-4 print:hidden">
        <div className="bg-white border border-slate-200 rounded-lg p-3 flex justify-between items-center gap-2 flex-wrap">
          <Link to={`/candidatos/${id}`} className="text-sm text-slate-600 hover:text-iera-700">
            ← Back to candidate
          </Link>
          <div className="flex gap-2">
            <button
              onClick={() => setEditing((v) => !v)}
              className="border border-iera-500 text-iera-700 hover:bg-iera-50 font-bold px-4 py-2 rounded-lg text-sm"
            >
              {editing ? 'Close editor' : '✎ Edit translations'}
            </button>
            <button
              onClick={() => window.print()}
              className="bg-iera-500 hover:bg-iera-700 text-white font-bold px-5 py-2 rounded-lg text-sm"
            >
              🖨 Print / Save as PDF
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2 px-1">
          💡 When printing, choose <strong>"Save as PDF"</strong>. Structured fields are translated automatically;
          the free texts (summary, knowledge level, motivation, dawah) come from the translation editor.
        </p>

        {/* TRANSLATION EDITOR */}
        {editing && (
          <div className="bg-white border border-iera-200 rounded-lg p-4 mt-3">
            <h3 className="text-sm font-bold text-iera-900 mb-3">Profile translations (EN / AR)</h3>
            <div className="grid gap-3">
              {TRANSLATION_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">{f.label}</label>
                  <textarea
                    dir={f.dir || 'ltr'}
                    rows={f.rows}
                    value={draft[f.key] || ''}
                    onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                    className="w-full mt-1 border border-slate-300 rounded p-2 text-sm focus:border-iera-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={saveTranslations}
              disabled={saving}
              className="mt-3 bg-iera-500 hover:bg-iera-700 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-lg text-sm"
            >
              {saving ? 'Saving…' : 'Save translations'}
            </button>
          </div>
        )}
      </div>

      {/* A4 DOCUMENT */}
      <div className="export-doc-page max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none p-12 text-sm">
        {/* HEADER */}
        <div className="flex justify-between items-start pb-4 border-b-4 border-iera-500">
          <div>
            <img src="/iera-logo.png" alt="iERA" className="h-12 mb-1" />
            <div className="text-[10px] text-slate-600 italic">Islamic Education and Research Academy</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Student Academic Profile</div>
            <div className="text-[11px] text-slate-700" dir="rtl">الملف الأكاديمي للطالب</div>
            <div className="text-[10px] text-slate-500 mt-1">
              Generated: {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* ======================= ENGLISH ======================= */}
        <LangHeader title={candidate.full_name} note="English" />
        {t.summary_en && (
          <p className="text-xs leading-relaxed text-justify mb-4">
            <strong>Academic profile.</strong> {t.summary_en}
          </p>
        )}
        <InfoTable rows={[
          ['Date of birth / Age', candidate.birth_date ? `${candidate.birth_date}${age ? ` (${age} years old)` : ''}` : null],
          ['Country / City', [countryEn, candidate.city].filter(Boolean).join(' — ')],
          ['Education level', edu?.en],
          ['Current occupation', candidate.occupation],
          ['Languages', [candidate.other_languages, `Arabic: ${arabic.en}`].filter(Boolean).join('; ')],
          ['Muslim status', muslimEn],
          ['Islamic center', candidate.islamic_center_name],
          ['Reference (tazkiyah)', candidate.sheikh_reference_name]
        ]} />
        <ProfileSection title="Islamic courses completed">
          {courses.length ? (
            <ul className="text-xs space-y-1 ml-4 list-disc">
              {courses.map((c, i) => (
                <li key={i}><strong>{c.name}</strong>{c.institution && ` — ${c.institution}`}{c.date && ` (${c.date})`}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic">No formal Islamic courses completed yet.</p>
          )}
        </ProfileSection>
        <ProfileSection title="Current level of Islamic knowledge">
          <TextOrPending text={t.islamic_level_en} />
        </ProfileSection>
        <ProfileSection title="Motivation — in his own words">
          <Quote text={t.motivation_en || candidate.motivation_text} />
        </ProfileSection>
        <ProfileSection title="Current dawah activities">
          <TextOrPending text={t.dawah_en || candidate.dawah_activities_current} />
        </ProfileSection>

        {/* ======================= ARABIC ======================= */}
        <div dir="rtl" lang="ar" className="mt-8 break-before-page">
          <LangHeader title={t.name_ar || candidate.full_name} note="العربية" />
          {t.summary_ar && (
            <p className="text-xs leading-relaxed text-justify mb-4">
              <strong>الملف الأكاديمي.</strong> {t.summary_ar}
            </p>
          )}
          <InfoTable rows={[
            ['تاريخ الميلاد / العمر', candidate.birth_date ? `${candidate.birth_date}${age ? ` (${age} عامًا)` : ''}` : null],
            ['البلد / المدينة', [countryAr, candidate.city].filter(Boolean).join(' — ')],
            ['المستوى التعليمي', edu?.ar],
            ['المهنة الحالية', candidate.occupation],
            ['اللغات', [candidate.other_languages, `العربية: ${arabic.ar}`].filter(Boolean).join('؛ ')],
            ['الحالة الإسلامية', muslimAr],
            ['المركز الإسلامي', candidate.islamic_center_name],
            ['المزكّي (التزكية)', candidate.sheikh_reference_name]
          ]} />
          <ProfileSection title="الدورات الإسلامية المنجزة">
            {courses.length ? (
              <ul className="text-xs space-y-1 mr-4 list-disc">
                {courses.map((c, i) => (
                  <li key={i}><strong>{c.name}</strong>{c.institution && ` — ${c.institution}`}{c.date && ` (${c.date})`}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 italic">لم يُكمل بعد دورات إسلامية رسمية.</p>
            )}
          </ProfileSection>
          <ProfileSection title="المستوى الحالي من المعرفة الإسلامية">
            <TextOrPending text={t.islamic_level_ar} pending="الترجمة غير متوفرة بعد — استخدم محرر الترجمات." />
          </ProfileSection>
          <ProfileSection title="الدافع — بكلماته الخاصة">
            {t.motivation_ar
              ? <Quote text={t.motivation_ar} rtl />
              : <TextOrPending text={null} pending="الترجمة غير متوفرة بعد — استخدم محرر الترجمات." />}
          </ProfileSection>
          <ProfileSection title="أنشطة الدعوة الحالية">
            <TextOrPending text={t.dawah_ar} pending="الترجمة غير متوفرة بعد — استخدم محرر الترجمات." />
          </ProfileSection>
        </div>

        {/* ======================= DOCUMENTS ======================= */}
        {attachedDocs.length > 0 && (
          <div className="mt-8 break-before-page">
            <div className="flex items-center justify-between pb-1 border-b-2 border-iera-200 mb-3">
              <h3 className="text-sm font-bold text-iera-900">Supporting documents</h3>
              <span className="text-sm font-bold text-iera-900" dir="rtl">المستندات الداعمة</span>
            </div>
            <div className="space-y-5">
              {attachedDocs.map((doc) => {
                const dt = DOCUMENT_TYPES.find((x) => x.type === doc.type)
                return (
                  <div key={doc.id} className="break-inside-avoid">
                    <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-200">
                      <span className="text-xs font-bold text-slate-700">
                        {dt?.icon || '📄'} {dt?.label || doc.type}
                        <span className="font-normal text-slate-500 ml-2">{doc.file_name}</span>
                      </span>
                      <span className="text-xs text-slate-700" dir="rtl">{DOC_AR[doc.type] || ''}</span>
                    </div>
                    <DocFilePreview doc={doc} url={signedUrls[doc.file_url]} />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="mt-10 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-500">
          iERA Latin America — Indonesia Scholarship Program · Student Academic Profile (EN/AR)
          <br />
          Candidate ID: {id} · Generated: {new Date().toISOString()}
        </div>
      </div>
    </div>
  )
}

function LangHeader({ title, note }) {
  return (
    <div className="flex justify-between items-baseline border-b-2 border-iera-500 pb-2 mt-6 mb-4">
      <h2 className="text-xl font-extrabold text-iera-900">{title}</h2>
      <span className="text-xs text-slate-500">{note}</span>
    </div>
  )
}

function InfoTable({ rows }) {
  return (
    <table className="w-full text-xs border-collapse mb-4">
      <tbody>
        {rows.filter(([, v]) => v).map(([label, value]) => (
          <tr key={label} className="border border-slate-200">
            <td className="w-1/3 bg-iera-50 font-bold text-iera-900 px-3 py-1.5 border border-slate-200">{label}</td>
            <td className="px-3 py-1.5 border border-slate-200">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function ProfileSection({ title, children }) {
  return (
    <div className="mb-4 break-inside-avoid">
      <h4 className="text-[11px] font-bold text-iera-700 uppercase tracking-wide mb-1.5">{title}</h4>
      {children}
    </div>
  )
}

function TextOrPending({ text, pending = 'Not available yet — use the translation editor.' }) {
  if (!text) return <p className="text-xs text-slate-400 italic">{pending}</p>
  return <p className="text-xs leading-relaxed text-justify whitespace-pre-wrap">{text}</p>
}

function Quote({ text, rtl }) {
  if (!text) return <p className="text-xs text-slate-400 italic">—</p>
  return (
    <div className={`bg-slate-50 p-3 text-xs leading-relaxed text-justify whitespace-pre-wrap ${rtl ? 'border-r-2' : 'border-l-2 italic'} border-iera-500`}>
      "{text}"
    </div>
  )
}
