// Admin Users management — continental only.
// - Lists all admin_users
// - Invite new admin: creates the account with a TEMPORARY password (shown
//   on screen) — NO email is sent, so Supabase's email rate limit is never hit
// - Edit role, country assignment, active flag
//
// Invitation flow (no backend, no SMTP, no email rate limit):
//   1) Continental enters email + role + country → we insert an admin_users
//      row with a placeholder uuid id.
//   2) We generate a strong temporary password and create the auth user via
//      signUp() on an ISOLATED supabase client (persistSession:false) so the
//      continental's own session is NOT replaced. No email is sent because
//      "Confirm email" is disabled in the Supabase Auth settings.
//   3) Creating the auth.users row fires the DB trigger `on_auth_user_link_admin`
//      which re-maps admin_users.id ↔ auth.users.id by matching email.
//   4) We show the email + temporary password on screen; continental delivers
//      them to the person. They log in at /login and can change it later via
//      "Forgot password".
//
// REQUIREMENT: In Supabase → Authentication → Sign In / Providers → Email,
// turn OFF "Confirm email". Otherwise signUp() tries to send a confirmation
// email (rate-limited) and the user can't log in until they confirm.

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

// Isolated client used ONLY to create new auth users. persistSession:false
// means signUp() won't overwrite the logged-in continental admin's session.
const signupClient = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
)

// Strong, human-typeable temporary password (no ambiguous chars like 0/O/1/l).
function generateTempPassword(len = 14) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const arr = new Uint32Array(len)
  crypto.getRandomValues(arr)
  return Array.from(arr, (n) => chars[n % chars.length]).join('')
}

export default function AdminUsers() {
  const { adminUser } = useAuth()
  const [users, setUsers] = useState([])
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showInvite, setShowInvite] = useState(false)

  async function load() {
    setLoading(true)
    const [u, c] = await Promise.all([
      supabase.from('admin_users').select('*').order('created_at', { ascending: false }),
      supabase.from('countries').select('id, code, name').order('name'),
    ])
    if (u.error) setError(u.error.message)
    setUsers(u.data || [])
    setCountries(c.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function toggleActive(user) {
    const { error } = await supabase
      .from('admin_users').update({ active: !user.active }).eq('id', user.id)
    if (error) return setError(error.message)
    await load()
  }

  async function deleteUser(user) {
    if (user.id === adminUser?.id) return
    const ok = window.confirm(
      `Delete admin ${user.email}? They will lose access to the panel immediately. ` +
      `This removes their admin record (their Supabase login itself is not deleted).`
    )
    if (!ok) return
    const { error } = await supabase.from('admin_users').delete().eq('id', user.id)
    if (error) return setError(error.message)
    await load()
  }

  async function updateRole(user, role, country_code) {
    const { error } = await supabase
      .from('admin_users')
      .update({ role, country_code: role === 'continental' ? null : country_code })
      .eq('id', user.id)
    if (error) return setError(error.message)
    await load()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin users</h1>
          <p className="text-sm text-slate-500">Manage who can access the admin panel and what they see.</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="bg-iera-500 hover:bg-iera-600 text-white font-bold px-4 py-2 rounded-lg text-sm"
        >
          + Invite admin
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {showInvite && (
        <InviteAdminModal
          countries={countries}
          onClose={() => setShowInvite(false)}
          onCreated={() => { setShowInvite(false); load() }}
        />
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading…</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No admin users yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="text-left px-4 py-2.5">Email</th>
                <th className="text-left px-4 py-2.5">Name</th>
                <th className="text-left px-4 py-2.5">Role</th>
                <th className="text-left px-4 py-2.5">Country</th>
                <th className="text-left px-4 py-2.5">Status</th>
                <th className="text-right px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{u.email}</td>
                  <td className="px-4 py-3 text-slate-600">{u.full_name || '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      disabled={u.id === adminUser?.id}
                      onChange={(e) => updateRole(u, e.target.value, u.country_code)}
                      className="text-xs border border-slate-300 rounded px-2 py-1"
                    >
                      <option value="continental">Continental</option>
                      <option value="country_manager">Country Manager</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {u.role === 'country_manager' ? (
                      <select
                        value={u.country_code || ''}
                        onChange={(e) => updateRole(u, 'country_manager', e.target.value)}
                        className="text-xs border border-slate-300 rounded px-2 py-1"
                      >
                        <option value="">— select —</option>
                        {countries.map((c) => <option key={c.id} value={c.code}>{c.name}</option>)}
                      </select>
                    ) : (
                      <span className="text-slate-400 text-xs">All countries</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${u.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {u.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => toggleActive(u)}
                        disabled={u.id === adminUser?.id}
                        className="text-xs text-slate-600 hover:text-slate-900 disabled:opacity-30"
                      >
                        {u.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => deleteUser(u)}
                        disabled={u.id === adminUser?.id}
                        className="text-xs text-red-600 hover:text-red-800 disabled:opacity-30"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
        <strong>ℹ️ How invitations work:</strong>
        <ol className="list-decimal ml-5 mt-2 space-y-1">
          <li>Fill in email, role and country — the account is created with a temporary password (no email is sent).</li>
          <li>Copy the email + temporary password shown and send them to the new admin (WhatsApp, email, etc.).</li>
          <li>They log in at <em>/login</em> and can change the password anytime via <em>“Forgot password”</em>.</li>
        </ol>
      </div>
    </div>
  )
}

function InviteAdminModal({ countries, onClose, onCreated }) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('country_manager')
  const [countryCode, setCountryCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [created, setCreated] = useState(null) // { email, password }
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (role === 'country_manager' && !countryCode) return setError('Please select a country.')
    setSubmitting(true)
    try {
      // Insert the admin_users row FIRST with a placeholder id. Creating the
      // auth user below fires the DB trigger (on_auth_user_link_admin) which
      // re-links this row's id by matching email.
      const placeholderId = crypto.randomUUID()
      const { error: insErr } = await supabase.from('admin_users').insert({
        id: placeholderId,
        email,
        full_name: fullName || null,
        role,
        country_code: role === 'continental' ? null : countryCode,
        active: true,
      })
      if (insErr) throw insErr

      // Create the auth user with a temporary password. No email is sent
      // ("Confirm email" is off), so the email rate limit is never hit. We use
      // an isolated client so this does NOT replace the continental's session.
      const tempPassword = generateTempPassword()
      const { error: signUpErr } = await signupClient.auth.signUp({
        email,
        password: tempPassword,
      })
      if (signUpErr) {
        setError(`Admin row created, but creating the login failed: ${signUpErr.message}`)
        return
      }

      setCreated({ email, password: tempPassword })
    } catch (err) {
      setError(err.message || 'Could not create admin.')
    } finally {
      setSubmitting(false)
    }
  }

  if (created) {
    const credText = `Email: ${created.email}\nTemporary password: ${created.password}`
    return (
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="text-4xl mb-3">🔑</div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Account created</h2>
            <p className="text-sm text-slate-600 mb-4">
              Send these credentials to the new admin. They log in at <strong>/login</strong> and
              can change the password later via “Forgot password”.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm font-mono space-y-1">
            <div><span className="text-slate-500">Email:</span> {created.email}</div>
            <div><span className="text-slate-500">Password:</span> <strong>{created.password}</strong></div>
          </div>
          <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
            ⚠️ This password is shown only once. Copy it now.
          </div>
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => { navigator.clipboard?.writeText(credText); setCopied(true) }}
              className="flex-1 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700"
            >
              {copied ? 'Copied ✓' : 'Copy credentials'}
            </button>
            <button
              onClick={onCreated}
              className="flex-1 py-2 bg-iera-500 hover:bg-iera-600 text-white rounded-lg text-sm font-bold"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Invite new admin</h2>
        {error && (
          <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full name</label>
            <input
              type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Role *</label>
            <select
              value={role} onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="country_manager">Country Manager (sees only one country)</option>
              <option value="continental">Continental (sees everything)</option>
            </select>
          </div>
          {role === 'country_manager' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Country *</label>
              <select
                value={countryCode} onChange={(e) => setCountryCode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="">— select country —</option>
                {countries.map((c) => <option key={c.id} value={c.code}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-600">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="flex-1 py-2 bg-iera-500 hover:bg-iera-600 text-white rounded-lg text-sm font-bold disabled:opacity-50">
              {submitting ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
