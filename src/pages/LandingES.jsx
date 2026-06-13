import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

function ApplyCTA({ size = 'lg', className = '', text = 'Quiero aplicar' }) {
  const sizes = {
    sm: 'text-sm px-4 py-2',
    md: 'text-base px-6 py-3',
    lg: 'text-lg px-8 py-4',
    xl: 'text-xl px-10 py-5'
  }
  return (
    <Link
      to="/aplicar/es"
      className={`inline-flex items-center gap-2 bg-iera-500 hover:bg-black text-white font-bold rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition-all ${sizes[size]} ${className}`}
    >
      {text}
      <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </Link>
  )
}

export default function LandingES() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white text-iera-500 overflow-x-hidden">
      {/* NAVEGACIÓN */}
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
            <a href="#requisitos" className="hidden sm:block text-sm font-semibold hover:text-iera-cyan transition">
              Requisitos
            </a>
            <a href="#faq" className="hidden sm:block text-sm font-semibold hover:text-iera-cyan transition">
              Preguntas
            </a>
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              🌐 English
            </Link>
            <ApplyCTA size="sm" text="Aplicar" />
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative bg-iera-500 text-white overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-iera-cyan via-iera-green via-iera-yellow to-iera-pink"></div>

        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            <span className="iera-diamond"></span>
            iERA Dawah Pioneers · Indonesia 2026
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-iera-yellow text-iera-500 rounded-full text-xs font-extrabold uppercase tracking-widest mb-8 shadow-lg">
            📅 El programa inicia el 1 de agosto de 2026
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
            Beca completa Indonesia 2026
            <br className="hidden sm:block" />
            <span className="text-iera-yellow">para líderes de dawah</span>
          </h1>

          <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto mb-3 leading-relaxed">
            Tres meses de formación islámica y entrenamiento profesional en dawah para musulmanes comprometidos con servir a América Latina.
          </p>

          <div className="flex flex-wrap justify-center gap-6 md:gap-10 my-10 text-sm md:text-base">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-iera-yellow">3</div>
              <div className="opacity-80 uppercase tracking-wide text-xs">Meses</div>
            </div>
            <div className="w-px bg-white/20 hidden sm:block"></div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-iera-cyan">100%</div>
              <div className="opacity-80 uppercase tracking-wide text-xs">Financiada</div>
            </div>
            <div className="w-px bg-white/20 hidden sm:block"></div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-iera-green">7</div>
              <div className="opacity-80 uppercase tracking-wide text-xs">Países</div>
            </div>
            <div className="w-px bg-white/20 hidden sm:block"></div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-iera-pink">Limitados</div>
              <div className="opacity-80 uppercase tracking-wide text-xs">Cupos</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <ApplyCTA size="xl" text="Quiero aplicar" />
            <a href="#programa" className="text-white/80 hover:text-white text-sm font-semibold underline underline-offset-4">
              Conocer el programa ↓
            </a>
          </div>

          <div className="mt-12 text-xs opacity-70 uppercase tracking-widest">
            En alianza con Bonyan International University · Indonesia
          </div>
        </div>
      </section>

      {/* LA OPORTUNIDAD */}
      <section id="programa" className="py-20 md:py-28 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-iera-cyan text-xs font-bold uppercase tracking-widest mb-3">La oportunidad</div>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">
            La comunidad musulmana en América Latina está creciendo.<br className="hidden md:block" />
            <span className="text-iera-pink">Sus líderes necesitan crecer con ella.</span>
          </h2>
          <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
            Dawah Pioneers identifica, prepara y acompaña a musulmanes comprometidos de 7 países para fortalecer la dawah local con conocimiento, carácter y métodos claros de comunicación.
          </p>
        </div>
      </section>

      {/* QUÉ INCLUYE */}
      <section className="py-20 md:py-28 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-iera-cyan text-xs font-bold uppercase tracking-widest mb-3">Qué incluye</div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">Lo esencial está cubierto.</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Desde la selección hasta la graduación, iERA cubre los costos principales del programa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <BenefitCard
              icon="✈️"
              accent="cyan"
              title="Tiquetes de ida y vuelta"
              description="Vuelos internacionales desde tu país hasta Indonesia y de regreso, coordinados por iERA."
            />
            <BenefitCard
              icon="🏠"
              accent="green"
              title="Alojamiento y matrícula"
              description="Tres meses de alojamiento en Indonesia y matrícula completa en Bonyan International University."
            />
            <BenefitCard
              icon="💵"
              accent="yellow"
              title="Estipendio mensual"
              description="Apoyo mensual para gastos personales durante el programa."
            />
            <BenefitCard
              icon="🎓"
              accent="pink"
              title="Posible empleo"
              description="Los graduados con buen desempeño y recomendación de BIU pueden ser considerados para un rol de Outreach Specialist."
              note="El empleo no es automático: depende del desempeño, la recomendación de BIU y la disponibilidad operativa de iERA."
            />
          </div>
        </div>
      </section>

      {/* QUIÉN PUEDE APLICAR */}
      <section id="requisitos" className="py-20 md:py-28 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-iera-cyan text-xs font-bold uppercase tracking-widest mb-3">Quién puede aplicar</div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">Requisitos principales</h2>
            <p className="text-lg text-slate-600">Si cumples estos puntos, puedes iniciar tu aplicación.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            <Requirement title="Ser musulmán/a" description="Musulmanes de nacimiento y nuevos musulmanes son bienvenidos." />
            <Requirement title="Tener entre 18 y 40 años" description="La edad se verifica con el pasaporte." />
            <Requirement title="Vivir en uno de los 7 países" description="México, Colombia, Ecuador, Venezuela, Paraguay, Honduras o El Salvador." />
            <Requirement title="Pasaporte vigente" description="Debe tener validez mínima de 6 meses desde la fecha de viaje." />
            <Requirement title="Disponibilidad total por 3 meses" description="Sin interrupciones laborales, académicas ni familiares durante el programa." />
            <Requirement title="Referencia islámica" description="Carta de Tazkiyah de un sheikh reconocido o centro islámico." />
          </div>

          <div className="bg-iera-yellow/10 border-2 border-iera-yellow rounded-2xl p-6 md:p-8 mb-10">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🛂</div>
              <div className="flex-1">
                <h3 className="text-lg md:text-xl font-extrabold text-iera-500 mb-2">Documentos para la visa que debes preparar</h3>
                <p className="text-sm text-slate-600 mb-4">Estos son necesarios para tramitar tu visa de estudiante indonesa:</p>
                <ul className="space-y-2 text-sm text-slate-800">
                  <li className="flex items-start gap-2">
                    <span className="text-iera-green font-bold mt-0.5">✓</span>
                    <span><strong>Primera y segunda página del pasaporte en la misma fotocopia</strong> (escaneo claro, ambos lados visibles)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-iera-green font-bold mt-0.5">✓</span>
                    <span><strong>Foto personal clara</strong> (reciente, buena iluminación, fondo neutro)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center">
            <ApplyCTA size="lg" text="Cumplo los requisitos" />
            <p className="text-xs text-slate-500 mt-4">La aplicación toma aproximadamente 10 minutos · Solo avanzan los candidatos que cumplen los requisitos obligatorios</p>
          </div>
        </div>
      </section>

      {/* 7 PAÍSES */}
      <section className="py-20 md:py-28 px-4 bg-iera-500 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-iera-yellow text-xs font-bold uppercase tracking-widest mb-3">7 países · 1 misión</div>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-12">Un pionero de dawah para cada comunidad.</h2>

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
            "¿Y quién tiene mejor palabra que quien llama a Allah...?"
            <br />
            <span className="text-sm not-italic opacity-70">— Corán 41:33</span>
          </p>
        </div>
      </section>

      {/* QUÉ ESTUDIARÁS */}
      <section className="py-20 md:py-28 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-iera-cyan text-xs font-bold uppercase tracking-widest mb-3">Currículo</div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">Qué estudiarás</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Un programa intensivo que combina fundamentos islámicos, metodología de dawah y práctica supervisada.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SubjectCard icon="📖" title="Corán" description="Recitación, tajweed y reflexión sobre pasajes relevantes para la dawah." />
            <SubjectCard icon="🕌" title="Fiqh" description="Purificación, oración, ayuno, zakat y práctica islámica diaria." />
            <SubjectCard icon="📜" title="Sirah" description="La vida del Profeta Muhammad (S.A.W.) y lecciones para la dawah contemporánea." />
            <SubjectCard icon="🗣️" title="Metodología de dawah" description="Conversación, manejo de preguntas y comunicación sabia." />
            <SubjectCard icon="🔤" title="Árabe básico" description="Vocabulario y lectura básica para acercarse a los textos islámicos." />
            <SubjectCard icon="🌐" title="Práctica de campo" description="Actividades de dawah supervisadas por du'aat con experiencia." />
          </div>
        </div>
      </section>

      {/* TU PROCESO */}
      <section className="py-20 md:py-28 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-iera-cyan text-xs font-bold uppercase tracking-widest mb-3">Tu proceso</div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">Desde la aplicación hasta la graduación</h2>
          </div>

          <div className="space-y-4">
            <JourneyStep number="1" emoji="📝" color="cyan" title="Aplicación" description="Completa el formulario en línea. El sistema valida los requisitos básicos." />
            <JourneyStep number="2" emoji="📂" color="green" title="Revisión de documentos" description="Tu Country Manager revisa pasaporte, Tazkiyah, antecedentes, declaración de disponibilidad y foto." />
            <JourneyStep number="3" emoji="🎤" color="yellow" title="Entrevista" description="Videollamada de 30 a 45 minutos sobre motivación, conocimiento islámico y perfil personal." />
            <JourneyStep number="4" emoji="👔" color="pink" title="Decisión final" description="El Director Continental revisa el caso y registra la decisión final." />
            <JourneyStep number="5" emoji="✈️" color="cyan" title="Pre-viaje" description="Contrato, visa B211A, LOA/LOI y vuelos coordinados por iERA y BIU." />
            <JourneyStep number="6" emoji="🇮🇩" color="green" title="Indonesia · 3 meses" description="Formación intensiva en Bonyan International University, con seguimiento mensual y cierre de graduación." />
          </div>
        </div>
      </section>

      {/* TRANSPARENCIA */}
      <section className="py-20 md:py-28 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-iera-yellow text-xs font-bold uppercase tracking-widest mb-3">Importante antes de aplicar</div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">Transparencia desde el inicio</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Queremos que cada candidato entienda claramente qué ofrece iERA y qué compromisos acepta.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <TransparencyCard
              icon="🤝"
              title="Compromiso real"
              description="Te comprometes a completar los 3 meses. Si te retiras sin una causa justificada aprobada por el Comité de Excepciones de iERA, debes reembolsar los costos invertidos hasta la fecha de retiro."
            />
            <TransparencyCard
              icon="🎯"
              title="Empleo condicional"
              description="El empleo como Outreach Specialist no es automático. Depende de tu desempeño, la recomendación oficial de BIU y la disponibilidad operativa y presupuestaria de iERA."
            />
            <TransparencyCard
              icon="📋"
              title="Servicio de 12 meses"
              description="Si recibes y aceptas una oferta formal, te comprometes a servir como Outreach Specialist por al menos 12 meses."
            />
            <TransparencyCard
              icon="🤲"
              title="Compromiso de iERA"
              description="iERA cubre los costos principales, coordina la logística, mantiene seguimiento regular y acompaña al estudiante durante todo el proceso."
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 md:py-28 px-4 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-iera-cyan text-xs font-bold uppercase tracking-widest mb-3">Preguntas frecuentes</div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">Lo que necesitas saber</h2>
          </div>

          <div className="space-y-3">
            <FAQ q="¿La beca cubre todo?">
              Sí. iERA cubre vuelos, alojamiento, matrícula universitaria y un estipendio mensual. El estudiante solo cubre gastos personales adicionales.
            </FAQ>
            <FAQ q="¿Qué nivel islámico necesito?">
              Bases sólidas: pilares del Islam, práctica correcta de la oración e interés genuino en la dawah. No necesitas ser sheikh ni académico.
            </FAQ>
            <FAQ q="¿Puedo llevar a mi familia?">
              No. El programa es individual. El estudiante debe viajar solo y dedicarse completamente a los 3 meses en Indonesia.
            </FAQ>
            <FAQ q="¿Qué pasa si soy nuevo musulmán?">
              Los nuevos musulmanes son bienvenidos. Lo que importa es tu compromiso con aprender, crecer y servir.
            </FAQ>
            <FAQ q="¿El empleo está garantizado después de graduarse?">
              No. La beca incluye la posibilidad de empleo como Outreach Specialist, pero depende del desempeño académico, la recomendación de BIU y la decisión final de iERA.
            </FAQ>
            <FAQ q="¿Cómo se tramita la visa?">
              iERA y BIU coordinan la E-Visa B211A para Indonesia. El estudiante aporta los documentos requeridos.
            </FAQ>
            <FAQ q="¿Qué pasa si necesito retirarme antes de terminar?">
              Si hay una causa justificada, el Comité de Excepciones de iERA evalúa el caso. Sin causa justificada aprobada, aplica el reembolso prorrateado de los costos invertidos.
            </FAQ>
            <FAQ q="¿Cuándo inicia el programa?">
              Las fechas específicas se comunican a los candidatos seleccionados tras la aprobación final.
            </FAQ>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 md:py-36 px-4 bg-iera-500 text-white relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-iera-cyan via-iera-green via-iera-yellow to-iera-pink"></div>
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="text-6xl mb-6">🤲</div>
          <h2 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            ¿Estás listo para dar<br className="hidden md:block" />
            <span className="text-iera-yellow">el siguiente paso?</span>
          </h2>
          <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
            La aplicación toma aproximadamente 10 minutos. Los cupos son limitados y el equipo revisará cada caso con cuidado.
          </p>
          <ApplyCTA size="xl" text="Iniciar aplicación" />
          <p className="text-sm opacity-70 mt-6">7 países · beca completa · Indonesia 2026</p>
        </div>
      </section>

      {/* FOOTER */}
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
            <ApplyCTA size="sm" text="Aplicar" />
            <a href="#requisitos" className="text-xs opacity-70 hover:opacity-100">Ver requisitos</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ─── Componentes reutilizables ───

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
