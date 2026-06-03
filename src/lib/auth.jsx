// Auth helpers — session + admin profile (role + country)
//
// Usage:
//   const { session, adminUser, loading } = useAuth()
//   if (!adminUser) → redirect to /login
//   adminUser.role === 'continental' → sees everything
//   adminUser.role === 'country_manager' → restricted to adminUser.country_code
//
// RLS enforces the country restriction server-side; the client uses the role
// only to render the right UI (hide buttons, scope the dropdown, etc.).

import { useEffect, useState, createContext, useContext } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext({ session: null, adminUser: null, loading: true, refresh: () => {} })

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [adminUser, setAdminUser] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadAdminUser(userId) {
    if (!userId) {
      setAdminUser(null)
      return
    }
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, email, full_name, role, country_code, active')
      .eq('id', userId)
      .maybeSingle()
    if (error) {
      console.error('Error loading admin profile:', error.message)
      setAdminUser(null)
      return
    }
    // Only honor active rows
    setAdminUser(data && data.active ? data : null)
  }

  async function refresh() {
    const { data } = await supabase.auth.getSession()
    setSession(data.session)
    await loadAdminUser(data.session?.user?.id)
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      setSession(data.session)
      await loadAdminUser(data.session?.user?.id)
      setLoading(false)
    })()

    // IMPORTANT: do NOT call other supabase functions (e.g. DB queries) directly
    // inside this callback. It runs while holding the auth lock, and awaiting
    // another supabase call that needs the same lock deadlocks the client —
    // every subsequent query then hangs forever. Defer with setTimeout(0) so the
    // lock is released before loadAdminUser() runs.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setTimeout(() => {
        if (!mounted) return
        loadAdminUser(newSession?.user?.id)
      }, 0)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ session, adminUser, loading, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export async function signOut() {
  await supabase.auth.signOut()
  window.location.href = '/login'
}
