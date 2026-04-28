import z from 'zod'

import { UserSchema } from './user'

export const UserLoginSchema = UserSchema.pick({
  email: true,
  password: true,
  rememberMe: true,
})

export const UserSignupSchema = UserSchema.omit({ rememberMe: true }).refine(
  (d) => d.password === d.confirmPassword,
  {
    message: 'Паролі не збігаються',
    path: ['confirmPassword'],
  },
)

export type UserLogin = z.infer<typeof UserLoginSchema>
export type UserSignup = z.infer<typeof UserSignupSchema>
