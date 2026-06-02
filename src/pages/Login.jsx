import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { session, adminUser, loading } = useAuth()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [resetMode, setResetMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  // If already logged in (and registered admin), redirect.
  useEffect(() => {
    if (!loading && session && adminUser) {
      const dest = location.state?.from || '/pipeline'
      navigate(dest, { replace: true })
    }
  }, [loading, session, adminUser, navigate, location.state])

  async function handleLogin(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError

      // Verify admin_users row exists & active
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile, error: profErr } = await supabase
        .from('admin_users')
        .select('id, active')
        .eq('id', user.id)
        .maybeSingle()
      if (profErr) throw profErr
      if (!profile || !profile.active) {
        await supabase.auth.signOut()
        throw new Error('Your account is not authorized to access the admin panel.')
      }
      // onAuthStateChange in AuthProvider will pick up; useEffect above will redirect.
    } catch (err) {
      setError(err.message || 'Login failed.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (resetErr) throw resetErr
      setResetSent(true)
    } catch (err) {
      setError(err.message || 'Could not send reset email.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
        <div className="text-center mb-6">
          <img src="/iera-logo.png" alt="iERA" className="h-10 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-slate-900">Admin sign in</h1>
          <p className="text-sm text-slate-500 mt-1">Dawah Pioneers Indonesia 2026</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {resetSent ? (
          <div className="text-center">
            <div className="text-3xl mb-3">📧</div>
            <p className="text-sm text-slate-700 mb-4">
              We sent a reset link to <strong>{email}</strong>. Check your inbox.
            </p>
            <button
              onClick={() => { setResetMode(false); setResetSent(false) }}
              className="text-sm text-iera-700 hover:underline"
            >
              ← Back to sign in
            </button>
          </div>
        ) : resetMode ? (
          <form onSubmit={handleReset} className="space-y-4">
            <p className="text-sm text-slate-600">Enter your email and we'll send a reset link.</p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-iera-500 outline-none"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit" disabled={submitting}
              className="w-full bg-iera-500 hover:bg-iera-600 text-white font-bold py-2.5 rounded-lg transition disabled:opacity-50"
            >
              {submitting ? 'Sending…' : 'Send reset link'}
            </button>
            <button
              type="button" onClick={() => setResetMode(false)}
              className="w-full text-sm text-slate-500 hover:text-slate-700"
            >
              ← Back to sign in
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-iera-500 outline-none"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-iera-500 outline-none"
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit" disabled={submitting}
              className="w-full bg-iera-500 hover:bg-iera-600 text-white font-bold py-2.5 rounded-lg transition disabled:opacity-50"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
            <button
              type="button" onClick={() => setResetMode(true)}
              className="w-full text-sm text-slate-500 hover:text-iera-700"
            >
              Forgot your password?
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-slate-200 text-center">
          <Link to="/" className="text-xs text-slate-400 hover:text-slate-600">← Back to home</Link>
        </div>
      </div>
    </div>
  )
}
