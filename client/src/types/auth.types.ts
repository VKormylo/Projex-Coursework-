export const AuthActionEnum = {
  signup: 'signup',
  login: 'login',
} as const

export type AuthAction =
  (typeof AuthActionEnum)[keyof typeof AuthActionEnum]

export type AppRole = 'Admin' | 'Project Manager' | 'Developer'

export interface Role {
  id: string | number
  name: AppRole
  description?: string | null
}

export interface UserDto {
  id: string
  fullName: string
  email: string
  position: string
  isActive: boolean
  createdAt: string
  role: Role | null
}

export interface UserResponse {
  user: UserDto
}

export interface AccessTokenResponse {
  token: string
  userId: string
}

export interface LoginResponse extends AccessTokenResponse {}
