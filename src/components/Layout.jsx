import { Outlet, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'

const navItems = [
  { to: '/dashboard', icon: '▣', label: 'Dashboard' },
  { to: '/candidatos', icon: '◉', label: 'Candidates' },
  { to: '/pipeline', icon: '▤', label: 'Pipeline' }
]

function ShareLink() {
  const [copied, setCopied] = useState(false)
  const publicUrl = `${window.location.origin}/aplicar`

  const copy = () => {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="px-5 mt-6">
      <div className="bg-white/10 rounded-lg p-3 border border-white/20">
        <div className="text-[10px] uppercase tracking-wide opacity-70 font-bold mb-1.5">
          Public application link
        </div>
        <div className="text-[10px] bg-black/20 rounded px-2 py-1.5 mb-2 break-all font-mono">
          {publicUrl}
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={copy}
            className="flex-1 bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold py-1.5 rounded transition"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold py-1.5 rounded text-center transition"
          >
            View
          </a>
        </div>
      </div>
    </div>
  )
}

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false)
  }, [window.location.pathname])

  return (
    <div className="flex min-h-screen">
      {/* Mobile backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          w-60 bg-iera-500 text-white py-6 flex-shrink-0
          fixed inset-y-0 left-0 z-40 transform transition-transform overflow-y-auto
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:transform-none
        `}
      >
        <div className="px-5 pb-4 border-b border-white/15 mb-4 flex justify-between items-start">
          <div className="flex items-center gap-2">
            <img src="/iera-logo-white.png" alt="iERA" className="h-9 w-auto" />
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="md:hidden text-white/60 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="px-5 -mt-2 mb-4">
          <p className="text-[10px] uppercase tracking-widest opacity-60">Dawah Pioneers 2026</p>
          <p className="text-xs font-semibold opacity-90 mt-0.5">Indonesia Scholarships</p>
        </div>
        <div className="text-[11px] uppercase tracking-wide opacity-60 px-5 pt-2 pb-1">
          Main
        </div>
        <nav>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-5 py-2.5 text-sm cursor-pointer transition ${
                  isActive
                    ? 'bg-white/10 border-l-[3px] border-iera-cyan pl-[17px] font-semibold'
                    : 'hover:bg-white/10 border-l-[3px] border-transparent pl-[17px]'
                }`
              }
            >
              <span className="w-4 text-center opacity-90">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <ShareLink />
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-x-hidden min-w-0">
        <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-3.5 flex justify-between items-center sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden text-2xl text-iera-700 leading-none"
              aria-label="Open menu"
            >
              ☰
            </button>
            <div className="text-sm text-slate-500 hidden sm:block">
              <strong className="text-slate-900">iERA Indonesia Scholarships 2026</strong>
            </div>
          </div>
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-100 rounded-full text-sm">
            <div className="w-7 h-7 rounded-full bg-iera-500 text-white flex items-center justify-center font-semibold text-xs">
              LA
            </div>
            <span className="hidden sm:inline">Liliana Anaya · Admin</span>
          </div>
        </header>
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
