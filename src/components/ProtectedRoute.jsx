// Wraps admin routes. Redirects to /login when there is no authenticated
// admin_users record. Optional `requireContinental` flag for super-admin pages.

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function ProtectedRoute({ children, requireContinental = false }) {
  const { session, adminUser, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 text-sm">Loading…</div>
      </div>
    )
  }

  // Not logged in OR logged in but not in admin_users (or inactive)
  if (!session || !adminUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (requireContinental && adminUser.role !== 'continental') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md text-center bg-white p-8 rounded-2xl border border-slate-200 shadow">
          <div className="text-4xl mb-3">🔒</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access restricted</h2>
          <p className="text-sm text-slate-600">
            This section is only available to continental administrators.
          </p>
        </div>
      </div>
    )
  }

  return children
}
