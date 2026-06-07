'use client'

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  AuthResult,
  LoginInput,
  PublicUser,
  SignupInput,
  clearAuthSession,
  getCurrentUser,
  getStoredAuthSession,
  login,
  refreshAuth,
  saveAuthSession,
  signup,
} from '@/lib/auth'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

type AuthContextValue = {
  user: PublicUser | null
  status: AuthStatus
  accessToken: string | null
  refreshToken: string | null
  login: (input: LoginInput) => Promise<AuthResult>
  signup: (input: SignupInput) => Promise<AuthResult>
  logout: () => void
  refreshSession: () => Promise<AuthResult | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const emptySession = {
  user: null,
  accessToken: null,
  refreshToken: null,
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [session, setSession] = useState<{
    user: PublicUser | null
    accessToken: string | null
    refreshToken: string | null
  }>(emptySession)

  const applySession = useCallback((nextSession: AuthResult) => {
    saveAuthSession(nextSession)
    setSession(nextSession)
    setStatus('authenticated')
  }, [])

  const logout = useCallback(() => {
    clearAuthSession()
    setSession(emptySession)
    setStatus('unauthenticated')
  }, [])

  const refreshSession = useCallback(async () => {
    const storedSession = getStoredAuthSession()

    if (!storedSession) {
      logout()
      return null
    }

    try {
      const nextSession = await refreshAuth(storedSession.refreshToken)
      applySession(nextSession)
      return nextSession
    } catch {
      logout()
      return null
    }
  }, [applySession, logout])

  useEffect(() => {
    let isMounted = true

    const restoreSession = async () => {
      const storedSession = getStoredAuthSession()

      if (!storedSession) {
        if (isMounted) {
          setStatus('unauthenticated')
        }
        return
      }

      try {
        const { user } = await getCurrentUser(storedSession.accessToken)

        if (isMounted) {
          setSession({ ...storedSession, user })
          setStatus('authenticated')
        }
      } catch {
        try {
          const nextSession = await refreshAuth(storedSession.refreshToken)

          if (isMounted) {
            saveAuthSession(nextSession)
            setSession(nextSession)
            setStatus('authenticated')
          }
        } catch {
          if (isMounted) {
            clearAuthSession()
            setSession(emptySession)
            setStatus('unauthenticated')
          }
        }
      }
    }

    void restoreSession()

    return () => {
      isMounted = false
    }
  }, [])

  const loginUser = useCallback(
    async (input: LoginInput) => {
      const nextSession = await login(input)
      applySession(nextSession)
      return nextSession
    },
    [applySession],
  )

  const signupUser = useCallback(
    async (input: SignupInput) => {
      const nextSession = await signup(input)
      applySession(nextSession)
      return nextSession
    },
    [applySession],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session.user,
      status,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      login: loginUser,
      signup: signupUser,
      logout,
      refreshSession,
    }),
    [session, status, loginUser, signupUser, logout, refreshSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.')
  }

  return context
}
