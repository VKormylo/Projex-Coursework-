import type { ReactNode } from 'react'

export default function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="w-[448px] shrink-0 rounded-[14px] border border-black/10 bg-white">
      <div className="flex flex-col gap-6 p-px">{children}</div>
    </div>
  )
}
