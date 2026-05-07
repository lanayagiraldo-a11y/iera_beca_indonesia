import { useSearchParams, Link } from 'react-router-dom'

export default function ApplicationResult() {
  const [params] = useSearchParams()
  const passed = params.get('passed') === 'true'
  const reasons = params.get('reasons')?.split('|') || []

  if (passed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-iera-500 via-black to-iera-500 text-white py-12 px-4 flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-iera-green rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-iera-cyan rounded-full blur-3xl opacity-20"></div>
        <div className="relative max-w-2xl text-center">
          <img src="/iera-logo-white.png" alt="iERA" className="h-10 mx-auto mb-6 opacity-90" />
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-iera-green text-iera-500 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
            <span className="iera-diamond"></span>
            Application accepted
          </div>
          <div className="text-7xl mb-6">🎉</div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
            Welcome aboard.
          </h1>
          <p className="text-lg opacity-90 mb-8">
            You meet the basic requirements. You've moved on to the next phase of the process.
          </p>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-6 text-left">
            <h3 className="font-bold mb-4 flex items-center gap-2 text-iera-yellow">
              ✅ Next steps
            </h3>
            <ol className="space-y-3 text-sm">
              <Step number="1" title="Document review">
                Your iERA Country Manager will review your information and contact you via WhatsApp within the next <strong>3-5 days</strong>.
              </Step>
              <Step number="2" title="Document submission">
                You'll be asked for: passport, Tazkiyah letter, criminal background check, availability declaration and photo.
              </Step>
              <Step number="3" title="Video interview">
                A 30-45 minute interview where we'll evaluate your motivation, Islamic knowledge and character profile.
              </Step>
              <Step number="4" title="Final decision">
                The Continental Director will make the final decision. If selected, we'll start the visa and flights process.
              </Step>
            </ol>
          </div>

          <div className="bg-iera-cyan/20 border border-iera-cyan/40 rounded-xl p-4 text-sm mb-6">
            📱 <strong>Keep your WhatsApp active.</strong> The Country Manager will contact you soon to confirm your information and coordinate the next steps.
          </div>

          <p className="text-xs opacity-70">
            🤲 May Allah make your path easy · Baraka Allahu feekum
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex items-center justify-center">
      <div className="max-w-2xl text-center">
        <img src="/iera-logo.png" alt="iERA" className="h-12 mx-auto mb-6 opacity-80" />
        <div className="text-7xl mb-6">📋</div>
        <h1 className="text-3xl font-extrabold text-slate-800 mb-3">
          Your application was received
        </h1>
        <p className="text-lg text-slate-700 mb-8">
          However, in this round you <strong>do not meet the basic requirements</strong> to proceed.
        </p>

        <div className="bg-white border-2 border-amber-200 rounded-2xl p-6 mb-6 text-left shadow-sm">
          <h3 className="font-bold text-amber-800 mb-4 flex items-center gap-2">
            ℹ️ Reasons
          </h3>
          {reasons.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-600">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-600">Incomplete or incorrect information.</p>
          )}
        </div>

        <div className="bg-slate-100 rounded-xl p-4 text-sm text-slate-700 mb-6 text-left">
          <strong>💡 What can you do?</strong>
          <ul className="mt-2 space-y-1 list-disc list-inside text-xs">
            <li>If it was a data error (e.g. wrong date), <Link to="/aplicar" className="text-iera-700 font-semibold underline">apply again</Link></li>
            <li>If your passport expires soon, renew it and apply in the next round</li>
            <li>If you have questions, message the iERA team via WhatsApp</li>
          </ul>
        </div>

        <p className="text-xs text-slate-500">
          🤲 May Allah bless you · Insha Allah there will be new opportunities
        </p>
      </div>
    </div>
  )
}

function Step({ number, title, children }) {
  return (
    <li className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-iera-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
        {number}
      </div>
      <div className="flex-1">
        <div className="font-bold text-sm">{title}</div>
        <div className="text-xs text-slate-600 mt-0.5">{children}</div>
      </div>
    </li>
  )
}
