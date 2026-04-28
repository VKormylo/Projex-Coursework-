import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuthContext } from '~/context/authContext'
import { useClickOutside } from '~/hooks/useClickOutside'
import {
  AdminIcon,
  AnalyticsIcon,
  BoardIcon,
  LogoIcon,
  MyTasksIcon,
  ProjectsNavIcon,
  ReleasesIcon,
  SprintsIcon,
  UserIcon,
  ChevronRightIcon,
} from '~/components/svg/Svg'
import SidebarLink from './SidebarLink'

const NAV = [
  { to: '/projects', icon: <ProjectsNavIcon />, label: 'Проєкти' },
  { to: '/sprints', icon: <SprintsIcon />, label: 'Спринти' },
  { to: '/board', icon: <BoardIcon />, label: 'Дошка задач' },
  { to: '/my-tasks', icon: <MyTasksIcon />, label: 'Мої задачі' },
  { to: '/releases', icon: <ReleasesIcon />, label: 'Релізи' },
  { to: '/analytics', icon: <AnalyticsIcon />, label: 'Аналітика' },
  { to: '/admin', icon: <AdminIcon />, label: 'Адміністрування' },
]

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export default function Sidebar() {
  const { user, signOut } = useAuthContext()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const close = useCallback(() => setOpen(false), [])
  const containerRef = useClickOutside<HTMLDivElement>(close, open)

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-[#e2e8f0] bg-white">
      <div className="flex h-16 items-center border-b border-[#e2e8f0] px-6">
        <div className="flex items-center gap-2">
          <LogoIcon width={24} height={24} />
          <span className="text-base font-semibold leading-6 text-[#0f172b]">Projex</span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pt-4">
        {NAV.map((item) => (
          <SidebarLink key={item.to} to={item.to} icon={item.icon}>
            {item.label}
          </SidebarLink>
        ))}
      </nav>

      {user ? (
        <div className="relative border-t border-[#e2e8f0] px-4 py-4.25" ref={containerRef}>
          {/* Dropdown menu – rendered above the profile section */}
          {open && (
            <div className="absolute bottom-full left-4 right-4 mb-2 overflow-hidden rounded-lg border border-[#e2e8f0] bg-white shadow-lg">
              <button
                type="button"
                onClick={() => { setOpen(false); navigate('/profile') }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-[#0f172b] hover:bg-[#f8fafc] transition-colors"
              >
                <UserIcon className="h-4 w-4 text-[#62748e]" />
                Сторінка профілю
              </button>
              <div className="h-px bg-[#e2e8f0]" />
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  signOut()
                  navigate('/auth/login', { replace: true })
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-[#fef2f2] transition-colors"
              >
                <ChevronRightIcon className="h-4 w-4 rotate-180" />
                Вийти
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 hover:bg-[#f8fafc] transition-colors"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#dbeafe] text-xs font-medium text-[#1447e6]">
              {initials(user.fullName)}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium leading-5 text-[#0f172b]">{user.fullName}</p>
              <p className="truncate text-xs font-medium leading-4 text-[#62748e]">{user.role?.name ?? ''}</p>
            </div>
            <ChevronRightIcon className={`h-4 w-4 shrink-0 text-[#62748e] transition-transform ${open ? '-rotate-90' : 'rotate-90'}`} />
          </button>
        </div>
      ) : null}
    </aside>
  )
}
