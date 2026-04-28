import { redirect } from 'react-router-dom'

import { authService } from '~/services/auth-service'
import { clearSession, getStoredToken } from '~/utils/auth-storage'

export const authCheck = async () => {
  if (!getStoredToken()) {
    throw redirect('/auth/login')
  }

  try {
    await authService.me()
    return null
  } catch {
    clearSession()
    throw redirect('/auth/login')
  }
}

export const guestOnly = async () => {
  if (!getStoredToken()) return null

  try {
    await authService.me()
    throw redirect('/')
  } catch (error) {
    if (error instanceof Response) throw error
    clearSession()
    return null
  }
}
