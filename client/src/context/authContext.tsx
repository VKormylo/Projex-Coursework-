import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from 'react'

import { axiosClient } from '~/plugins/axiosClient'
import { authService } from '~/services/auth-service'
import {
  clearSession,
  getStoredToken,
  saveSession,
} from '~/utils/auth-storage'
import type { UserDto } from '~/types/auth.types'

interface AuthContextParams {
  accessToken: string | null
  user: UserDto | null
  isAuthenticated: boolean
  signIn: (token: string, userId: string, persistent: boolean) => void
  signOut: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextParams | null>(null)

function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    getStoredToken(),
  )
  const [user, setUser] = useState<UserDto | null>(null)
  const isAuthenticated = Boolean(accessToken)

  useEffect(() => {
    if (!accessToken) {
      setUser(null)
      return
    }

    let cancelled = false
    authService
      .me()
      .then((res) => {
        if (!cancelled) {
          setUser(res.user)
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearSession()
          setAccessToken(null)
          setUser(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [accessToken])

  useLayoutEffect(() => {
    const id = axiosClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error?.response?.status === 401) {
          clearSession()
          setAccessToken(null)
          setUser(null)
        }
        return Promise.reject(error)
      },
    )

    return () => {
      axiosClient.interceptors.response.eject(id)
    }
  }, [])

  const signIn = useCallback(
    (token: string, userId: string, persistent: boolean) => {
      saveSession(token, userId, persistent)
      setAccessToken(token)
    },
    [],
  )

  const signOut = useCallback(() => {
    clearSession()
    setAccessToken(null)
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const res = await authService.me()
      setUser(res.user)
    } catch {
      // ignore
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{ accessToken, user, isAuthenticated, signIn, signOut, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return ctx
}

export { AuthProvider, useAuthContext }
