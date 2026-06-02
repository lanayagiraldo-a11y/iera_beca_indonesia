import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

// CTA component — reused across sections so it always tracks consistently
function ApplyCTA({ size = 'lg', className = '', text = 'Ready to apply' }) {
  const sizes = {
    sm: 'text-sm px-4 py-2',
    md: 'text-base px-6 py-3',
    lg: 'text-lg px-8 py-4',
    xl: 'text-xl px-10 py-5'
  }
  return (
    <Link
      to="/aplicar"
      className={`inline-flex items-center gap-2 bg-iera-500 hover:bg-black text-white font-bold rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition-all ${sizes[size]} ${className}`}
    >
      {text}
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </Link>
  )
}

export default function Landing() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white text-iera-500 overflow-x-hidden">
      {/* ────────────────────────────────────────────
          STICKY NAVIGATION
      ──────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-md py-2' : 'bg-transparent py-4'
      }`}>
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <img
            src="/iera-logo.png"
            alt="iERA"
            className={`transition-all ${scrolled ? 'h-9' : 'h-11'}`}
          />
          <div className="flex items-center gap-3">
            <a href="#requirements" className="hidden sm:block text-sm font-semibold hover:text-iera-cyan transition">
              Requirements
            </a>
            <a href="#faq" className="hidden sm:block text-sm font-semibold hover:text-iera-cyan transition">
              FAQ
            </a>
            <ApplyCTA size="sm" text="Apply" />
          </div>
        </div>
      </nav>

      {/* ────────────────────────────────────────────
          HERO
      ──────────────────────────────────────────── */}
      <section className="relative bg-iera-500 text-white overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-iera-cyan via-iera-green via-iera-yellow to-iera-pink"></div>

        <div className="relative max-w-5xl mx-auto px-4 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-xs font-bold uppercase tracking-widest mb-8">
            <span className="iera-diamond"></span>
            iERA Dawah Pioneers · Indonesia 2026
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
            Indonesia 2026 Full Scholarship
            <br className="hidden sm:block" />
            <span className="text-iera-yellow">for dawah leaders</span>
          </h1>

          <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto mb-3 leading-relaxed">
            Three months of Islamic formation and professional dawah training for Muslims committed to serving Latin America.
          </p>

          {/* Inline stats */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 my-10 text-sm md:text-base">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-iera-yellow">3</div>
              <div className="opacity-80 uppercase tracking-wide text-xs">Months</div>
            </div>
            <div className="w-px bg-white/20 hidden sm:block"></div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-iera-cyan">100%</div>
              <div className="opacity-80 uppercase tracking-wide text-xs">Funded</div>
            </div>
            <div className="w-px bg-white/20 hidden sm:block"></div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-iera-green">7</div>
              <div className="opacity-80 uppercase tracking-wide text-xs">Countries</div>
            </div>
            <div className="w-px bg-white/20 hidden sm:block"></div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-iera-pink">Limited</div>
              <div className="opacity-80 uppercase tracking-wide text-xs">Cupos</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <ApplyCTA size="xl" text="Ready to apply" />
            <a href="#program" className="text-white/80 hover:text-white text-sm font-semibold underline underline-offset-4">
              Explore the program ↓
            </a>
          </div>

          <div className="mt-12 text-xs opacity-70 uppercase tracking-widest">
            In partnership with Bonyan International University · Indonesia
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────
          THE OPPORTUNITY (hook)
      ──────────────────────────────────────────── */}
      <section id="program" className="py-20 md:py-28 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-iera-cyan text-xs font-bold uppercase tracking-widest mb-3">The opportunity</div>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">
            The Muslim community in Latin America is growing.<br className="hidden md:block" />
            <span className="text-iera-pink">Its leaders need to grow with it.</span>
          </h2>
          <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
            Dawah Pioneers identifies, prepares, and supports committed Muslims from 7 countries to strengthen local dawah with knowledge, character, and clear communication methods.
          </p>
        </div>
      </section>

      {/* ────────────────────────────────────────────
          WHAT'S INCLUDED (the offer)
      ──────────────────────────────────────────── */}
      <section className="py-20 md:py-28 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-iera-cyan text-xs font-bold uppercase tracking-widest mb-3">What is included</div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">The essentials are covered.</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              From selection to graduation, iERA covers the main program costs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <BenefitCard
              icon="✈️"
              accent="cyan"
              title="Round-trip flights"
              description="International flights from your country to Indonesia and back, coordinated by iERA."
            />
            <BenefitCard
              icon="🏠"
              accent="green"
              title="Accommodation and tuition"
              description="Three months of accommodation in Indonesia and full tuition at Bonyan International University."
            />
            <BenefitCard
              icon="💵"
              accent="yellow"
              title="Monthly stipend"
              description="Monthly support for personal expenses during the program."
            />
            <BenefitCard
              icon="🎓"
              accent="pink"
              title="Possible employment"
              description="Graduates with strong performance and BIU recommendation may be considered for an Outreach Specialist role."
              note="Employment is not automatic: it depends on performance, BIU recommendation, and iERA operational availability."
            />
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────
          WHO CAN APPLY (eligibility)
      ──────────────────────────────────────────── */}
      <section id="requirements" className="py-20 md:py-28 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-iera-cyan text-xs font-bold uppercase tracking-widest mb-3">Who can apply</div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">Main requirements</h2>
            <p className="text-lg text-slate-600">If you meet these points, you can start your application.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            <Requirement title="Be Muslim" description="Born Muslims and new Muslims are welcome." />
            <Requirement title="Be 18 to 40 years old" description="Age is verified through your passport." />
            <Requirement title="Live in one of the 7 countries" description="Mexico, Colombia, Ecuador, Venezuela, Paraguay, Honduras, or El Salvador." />
            <Requirement title="Valid passport" description="It must be valid for at least 6 months from the travel date." />
            <Requirement title="Full availability for 3 months" description="No work, academic, or family interruptions during the program." />
            <Requirement title="Islamic reference" description="Tazkiyah letter from a recognized sheikh or Islamic center." />
          </div>

          <div className="text-center">
            <ApplyCTA size="lg" text="I meet the requirements" />
            <p className="text-xs text-slate-500 mt-4">Application takes about 10 minutes · Only candidates who meet the mandatory requirements advance</p>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────
          7 COUNTRIES
      ──────────────────────────────────────────── */}
      <section className="py-20 md:py-28 px-4 bg-iera-500 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-iera-yellow text-xs font-bold uppercase tracking-widest mb-3">7 countries · 1 mission</div>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-12">A dawah pioneer for every community.</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { flag: '🇲🇽', name: 'México' },
              { flag: '🇨🇴', name: 'Colombia' },
              { flag: '🇪🇨', name: 'Ecuador' },
              { flag: '🇻🇪', name: 'Venezuela' },
              { flag: '🇵🇾', name: 'Paraguay' },
              { flag: '🇭🇳', name: 'Honduras' },
              { flag: '🇸🇻', name: 'El Salvador' }
            ].map((c) => (
              <div key={c.name} className="flex flex-col items-center gap-2 p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition">
                <div className="text-4xl">{c.flag}</div>
                <div className="text-xs font-semibold opacity-90">{c.name}</div>
              </div>
            ))}
          </div>

          <p className="text-base opacity-80 max-w-2xl mx-auto mt-12 italic">
            "Y quien tiene mejor palabra que quien llama a Allah..."
            <br />
            <span className="text-sm not-italic opacity-70">— Quran 41:33</span>
          </p>
        </div>
      </section>

      {/* ────────────────────────────────────────────
          WHAT YOU'LL LEARN
      ──────────────────────────────────────────── */}
      <section className="py-20 md:py-28 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-iera-cyan text-xs font-bold uppercase tracking-widest mb-3">Curriculum</div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">What you will study</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              An intensive program combining Islamic foundations, dawah methodology, and supervised practice.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SubjectCard icon="📖" title="Quran" description="Recitation, tajweed, and reflection on passages relevant to dawah." />
            <SubjectCard icon="🕌" title="Fiqh" description="Purification, prayer, fasting, zakat, and daily Islamic practice." />
            <SubjectCard icon="📜" title="Sirah" description="The life of Prophet Muhammad (S.A.W.) and lessons for contemporary dawah." />
            <SubjectCard icon="🗣️" title="Dawah methodology" description="Conversation, question handling, and wise communication." />
            <SubjectCard icon="🔤" title="Basic Arabic" description="Vocabulary and basic reading to approach Islamic texts." />
            <SubjectCard icon="🌐" title="Field practice" description="Dawah activities supervised by experienced du'aat." />
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────
          YOUR JOURNEY
      ──────────────────────────────────────────── */}
      <section className="py-20 md:py-28 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-iera-cyan text-xs font-bold uppercase tracking-widest mb-3">Your process</div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">From application to graduation</h2>
          </div>

          <div className="space-y-4">
            <JourneyStep number="1" emoji="📝" color="cyan" title="Application" description="Complete the online form. The system validates basic requirements." />
            <JourneyStep number="2" emoji="📂" color="green" title="Document review" description="Your Country Manager reviews passport, Tazkiyah, background check, availability declaration, and photo." />
            <JourneyStep number="3" emoji="🎤" color="yellow" title="Interview" description="A 30 to 45 minute video call about motivation, Islamic knowledge, and personal profile." />
            <JourneyStep number="4" emoji="👔" color="pink" title="Final decision" description="The Continental Director reviews the case and records the final decision." />
            <JourneyStep number="5" emoji="✈️" color="cyan" title="Pre-travel" description="Contract, B211A visa, LOA/LOI, and flights coordinated by iERA and BIU." />
            <JourneyStep number="6" emoji="🇮🇩" color="green" title="Indonesia · 3 meses" description="Intensive training at Bonyan International University, with monthly follow-up and graduation closure." />
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────
          TRANSPARENCY (objection handling)
      ──────────────────────────────────────────── */}
      <section className="py-20 md:py-28 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-iera-yellow text-xs font-bold uppercase tracking-widest mb-3">Important before applying</div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">Transparency from the start</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              We want every candidate to clearly understand what iERA offers and what commitments they accept.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <TransparencyCard
              icon="🤝"
              title="Real commitment"
              description="You commit to completing the 3 months. If you withdraw without a justified cause approved by iERA's Exceptions Committee, you must reimburse the costs invested up to the withdrawal date."
            />
            <TransparencyCard
              icon="🎯"
              title="Conditional employment"
              description="Employment as Outreach Specialist is not automatic. It depends on your performance, BIU's official recommendation, and iERA's operational and budget availability."
            />
            <TransparencyCard
              icon="📋"
              title="12-month service"
              description="If you receive and accept a formal offer, you commit to serving as Outreach Specialist for at least 12 months."
            />
            <TransparencyCard
              icon="🤲"
              title="iERA commitment"
              description="iERA covers the main costs, coordinates logistics, maintains regular follow-up, and supports the student throughout the process."
            />
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────
          FAQ
      ──────────────────────────────────────────── */}
      <section id="faq" className="py-20 md:py-28 px-4 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-iera-cyan text-xs font-bold uppercase tracking-widest mb-3">Frequently asked questions</div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">What you need to know</h2>
          </div>

          <div className="space-y-3">
            <FAQ q="Does the scholarship cover everything?">
              Yes. iERA covers flights, accommodation, university tuition, and a monthly stipend. The student only covers additional personal expenses.
            </FAQ>
            <FAQ q="What Islamic level do I need?">
              Solid basics: pillars of Islam, correct prayer practice, and genuine interest in dawah. You do not need to be a sheikh or scholar.
            </FAQ>
            <FAQ q="Can I bring my family?">
              No. The program is individual. The student must travel alone and dedicate themselves fully to the 3 months in Indonesia.
            </FAQ>
            <FAQ q="What if I am a new Muslim?">
              New Muslims are welcome. What matters is your commitment to learn, grow, and serve.
            </FAQ>
            <FAQ q="Is employment guaranteed after graduation?">
              No. The scholarship includes the possibility of employment as Outreach Specialist, but it depends on academic performance, BIU recommendation, and iERA's final decision.
            </FAQ>
            <FAQ q="How is the visa processed?">
              iERA and BIU coordinate the B211A E-Visa for Indonesia. The student provides the required documents.
            </FAQ>
            <FAQ q="What happens if I need to leave before finishing?">
              If there is a justified cause, iERA's Exceptions Committee evaluates the case. If there is no approved justified cause, prorated reimbursement of invested costs applies.
            </FAQ>
            <FAQ q="When does the program start?">
              Specific dates are communicated to selected candidates after final approval.
            </FAQ>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────
          FINAL CTA
      ──────────────────────────────────────────── */}
      <section className="py-24 md:py-36 px-4 bg-iera-500 text-white relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-iera-cyan via-iera-green via-iera-yellow to-iera-pink"></div>
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="text-6xl mb-6">🤲</div>
          <h2 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            Are you ready to take<br className="hidden md:block" />
            <span className="text-iera-yellow">the next step?</span>
          </h2>
          <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
            The application takes about 10 minutes. Spots are limited and the team will review each case carefully.
          </p>
          <ApplyCTA size="xl" text="Start application" />
          <p className="text-sm opacity-70 mt-6">7 countries · full scholarship · Indonesia 2026</p>
        </div>
      </section>

      {/* ────────────────────────────────────────────
          FOOTER
      ──────────────────────────────────────────── */}
      <footer className="py-12 px-4 bg-iera-500 text-white border-t border-white/10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm">
          <div className="flex items-center gap-3">
            <img src="/iera-logo-white.png" alt="iERA" className="h-9" />
            <div className="opacity-70 text-xs">
              Islamic Education<br />and Research Academy
            </div>
          </div>
          <div className="opacity-70 text-xs text-center">
            © 2026 iERA · Dawah Pioneers · Indonesia
            <br />
            <a href="https://latin.iera.org" target="_blank" rel="noopener noreferrer" className="text-iera-cyan hover:underline">latin.iera.org</a>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2">
            <ApplyCTA size="sm" text="Apply" />
            <a href="#requirements" className="text-xs opacity-70 hover:opacity-100">See requirements</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ─── Reusable card components ───

function BenefitCard({ icon, accent, title, description, note }) {
  const accentBorder = {
    cyan: 'border-l-iera-cyan',
    green: 'border-l-iera-green',
    yellow: 'border-l-iera-yellow',
    pink: 'border-l-iera-pink'
  }[accent] || 'border-l-slate-300'
  return (
    <div className={`bg-white border-l-[6px] ${accentBorder} border-r border-t border-b border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all`}>
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
      {note && <p className="text-xs text-slate-500 italic mt-2">{note}</p>}
    </div>
  )
}

function Requirement({ title, description }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-iera-cyan transition">
      <div className="w-7 h-7 rounded-full bg-iera-green text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">
        ✓
      </div>
      <div>
        <div className="font-bold">{title}</div>
        <div className="text-sm text-slate-600 mt-0.5">{description}</div>
      </div>
    </div>
  )
}

function SubjectCard({ icon, title, description }) {
  return (
    <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-xl">
      <div className="text-3xl flex-shrink-0">{icon}</div>
      <div>
        <h3 className="font-bold mb-1">{title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

function JourneyStep({ number, emoji, color, title, description }) {
  const colorClass = {
    cyan: 'bg-iera-cyan',
    green: 'bg-iera-green',
    yellow: 'bg-iera-yellow',
    pink: 'bg-iera-pink'
  }[color] || 'bg-iera-500'
  return (
    <div className="flex items-start gap-4 p-5 bg-white rounded-xl border border-slate-200 hover:shadow-md transition">
      <div className={`w-12 h-12 rounded-full ${colorClass} text-white flex items-center justify-center flex-shrink-0 font-extrabold text-lg`}>
        {number}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{emoji}</span>
          <h3 className="font-bold text-lg">{title}</h3>
        </div>
        <p className="text-slate-600 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

function TransparencyCard({ icon, title, description }) {
  return (
    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-sm text-slate-700 leading-relaxed">{description}</p>
    </div>
  )
}

function FAQ({ q, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-5 py-4 flex justify-between items-center hover:bg-slate-50 transition"
      >
        <span className="font-bold pr-4">{q}</span>
        <span className={`text-iera-cyan text-2xl flex-shrink-0 transition-transform ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {open && (
        <div className="px-5 pb-4 text-slate-600 leading-relaxed text-sm border-t border-slate-100">
          {children}
        </div>
      )}
    </div>
  )
}
