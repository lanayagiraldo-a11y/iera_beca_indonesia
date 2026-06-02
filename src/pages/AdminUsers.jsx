// Admin Users management — continental only.
// - Lists all admin_users
// - Invite new admin: sends Supabase magic-link invitation, creates admin_users row
// - Edit role, country assignment, active flag
//
// NOTE: Supabase's inviteUserByEmail() requires the service_role key, which
// must NEVER be exposed to the browser. The clean architecture is to call a
// Supabase Edge Function with the service key. For now we use the "self-serve"
// pattern: continental enters email + role + country and creates an
// admin_users row WITH a placeholder id (a random uuid). When that user signs
// up for the first time via the public magic link they get from email, an
// Edge Function or trigger should link auth.users.id ↔ admin_users.email.
//
// SIMPLER for v1: continental triggers a password-reset email to a new email
// (Supabase will create the auth user if it doesn't exist when "Enable user
// signups" is on, OR continental creates them via Supabase dashboard and then
// this page links the existing auth.user to admin_users by email).
//
// To keep this fully working without backend code, this page:
//   1) Continental enters email + role + country
//   2) UI tells continental to ALSO create the user in Supabase dashboard
//      (Authentication → Users → Invite user) using the same email
//   3) After the new user signs in once, this page's row links automatically
//      (we look up auth.users by email via the admin API — requires Edge Fn,
//       OR the user logging in triggers the linking themselves via a trigger).
//
// For the MVP, we just store email + role + country_code in admin_users with
// a TEMPORARY uuid; an Edge Function `link_admin_user` (out of scope here)
// re-maps the id once the auth.users row exists. See README for that step.

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

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
                    <button
                      onClick={() => toggleActive(u)}
                      disabled={u.id === adminUser?.id}
                      className="text-xs text-slate-600 hover:text-slate-900 disabled:opacity-30"
                    >
                      {u.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
        <strong>ℹ️ How invitations work (v1):</strong>
        <ol className="list-decimal ml-5 mt-2 space-y-1">
          <li>Add the user here (their <code>id</code> stays as a placeholder until they log in for the first time).</li>
          <li>In Supabase dashboard → <em>Authentication → Users → Invite user</em>, send a magic link to the same email.</li>
          <li>When they sign in, the link between <code>auth.users.id</code> and <code>admin_users</code> is created by a database trigger (see migration).</li>
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

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (role === 'country_manager' && !countryCode) return setError('Please select a country.')
    setSubmitting(true)
    try {
      // Insert a placeholder row. The DB trigger (on_auth_user_created) will
      // re-link the id once the auth user signs in for the first time, matching
      // by email.
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
      onCreated()
    } catch (err) {
      setError(err.message || 'Could not create admin.')
    } finally {
      setSubmitting(false)
    }
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
