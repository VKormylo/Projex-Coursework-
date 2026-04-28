import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="box-border flex min-h-dvh w-full items-center justify-center overflow-x-hidden bg-[#f8fafc] px-6 py-10 font-sans">
      {children}
    </div>
  )
}
