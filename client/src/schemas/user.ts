import z from 'zod'

export const UserSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Ім’я повинне містити щонайменше 2 символи')
    .max(150, 'Ім’я не може перевищувати 150 символів'),
  email: z.email('Некоректна email-адреса'),
  password: z
    .string()
    .min(8, 'Пароль має містити щонайменше 8 символів')
    .max(128, 'Пароль занадто довгий'),
  confirmPassword: z.string().min(8, 'Підтвердіть пароль'),
  role: z.enum(['Admin', 'Project Manager', 'Developer']),
  rememberMe: z.boolean(),
})

export type User = z.infer<typeof UserSchema>
