import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

type Props = {
  to: string
  icon: ReactNode
  children: ReactNode
}

export default function SidebarLink({ to, icon, children }: Props) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex h-9 w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
          isActive
            ? 'bg-[#eff6ff] text-[#1447e6]'
            : 'text-[#314158] hover:bg-[#f8fafc]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`flex shrink-0 items-center justify-center ${
              isActive ? 'text-[#1447e6]' : 'text-[#314158]'
            }`}
          >
            {icon}
          </span>
          <span className="leading-5">{children}</span>
        </>
      )}
    </NavLink>
  )
}
