import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, ApiError, getToken, setToken } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Hydrate the session on first load using the stored token.
  useEffect(() => {
    let cancelled = false
    async function hydrate() {
      if (!getToken()) {
        setLoading(false)
        return
      }
      try {
        const me = await api('/me')
        if (!cancelled) setUser(me)
      } catch (err) {
        // Only a 401 means the token itself is bad. Transient network errors
        // must NOT wipe a valid session.
        if (!cancelled && err instanceof ApiError && err.status === 401) {
          setToken(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    hydrate()
    return () => {
      cancelled = true
    }
  }, [])

  /**
   * Validates credentials, stores the session token, and returns the user.
   * Does NOT mark the session complete — callers (e.g. the MFA step in
   * SignIn) call completeSignIn(user) once their flow finishes so public
   * pages like /signin don't redirect away mid-flow.
   */
  const signIn = useCallback(async (email, password) => {
    const res = await api('/auth/login', { method: 'POST', body: { email, password } })
    setToken(res.token)
    return res.user
  }, [])

  /** Marks the session complete after any post-credential steps (MFA). */
  const completeSignIn = useCallback((user) => {
    setUser(user)
  }, [])

  const signOut = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const refresh = useCallback(async () => {
    const me = await api('/me')
    setUser(me)
    return me
  }, [])

  const value = useMemo(
    () => ({ user, loading, signIn, completeSignIn, signOut, refresh }),
    [user, loading, signIn, completeSignIn, signOut, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

/**
 * Routes a signed-in user to the correct place for their account status.
 * Mirrors the server-side FirstProjectGateFilter.
 */
export function homePathFor(status) {
  switch (status) {
    case 'PENDING_ADMIN_REVIEW':
      return '/pending-review'
    case 'ACTIVE_FIRST_PROJECT_REQUIRED':
      return '/first-project'
    case 'REJECTED':
      return '/pending-review'
    default:
      return '/dashboard'
  }
}
