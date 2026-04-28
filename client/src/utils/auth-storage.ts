const TOKEN_KEY = 'projex_token'
const USER_ID_KEY = 'projex_userId'

export function getStoredToken(): string | null {
  return (
    localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
  )
}

export function saveSession(
  token: string,
  userId: string,
  persistent: boolean,
): void {
  const primary = persistent ? localStorage : sessionStorage
  const secondary = persistent ? sessionStorage : localStorage

  primary.setItem(TOKEN_KEY, token)
  primary.setItem(USER_ID_KEY, userId)
  secondary.removeItem(TOKEN_KEY)
  secondary.removeItem(USER_ID_KEY)
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_ID_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_ID_KEY)
}
