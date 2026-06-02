// Bilingual modal shown when the candidate cannot submit because they fail
// one or more hard requirements (age < 18, age > 45, passport <6mo, missing essentials).
// Allows the candidate to close the modal and fix their data before resubmitting.

export default function BlockingModal({ open, lang = 'en', reasons = [], onClose }) {
  if (!open) return null

  const t = lang === 'es'
    ? {
        title: 'No puedes continuar',
        intro: 'Tu postulación no cumple con uno o más requisitos mínimos:',
        outro: 'Si crees que es un error, corrige tus datos y vuelve a enviar el formulario.',
        cta: 'Corregir mis datos',
      }
    : {
        title: 'You cannot continue',
        intro: 'Your application does not meet one or more minimum requirements:',
        outro: 'If you think this is a mistake, correct your information and submit again.',
        cta: 'Fix my information',
      }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="blocking-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start gap-3 mb-4">
          <div className="text-3xl" aria-hidden>⚠️</div>
          <h2 id="blocking-modal-title" className="text-xl md:text-2xl font-bold text-slate-900">
            {t.title}
          </h2>
        </div>

        <p className="text-slate-700 mb-3">{t.intro}</p>

        <ul className="space-y-2 mb-5">
          {reasons.map((r, i) => (
            <li
              key={r.code || i}
              className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800"
            >
              <span className="text-red-500 mt-0.5" aria-hidden>•</span>
              <span>{lang === 'es' ? r.es : r.en}</span>
            </li>
          ))}
        </ul>

        <p className="text-sm text-slate-600 mb-6">{t.outro}</p>

        <button
          type="button"
          onClick={onClose}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition"
        >
          {t.cta}
        </button>
      </div>
    </div>
  )
}
