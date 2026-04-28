import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export interface DropdownItem {
  label: string
  icon?: ReactNode
  onClick?: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
  title?: string
}

interface Props {
  items: DropdownItem[]
  trigger: ReactNode
  align?: 'left' | 'right'
}

export default function DropdownMenu({
  items,
  trigger,
  align = 'right',
}: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>

      {open ? (
        <div
          className={`absolute z-20 mt-1 min-w-[160px] overflow-hidden rounded-lg border border-[#e2e8f0] bg-white py-1 shadow-lg ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              disabled={item.disabled}
              title={item.title}
              onClick={() => {
                if (item.disabled) return
                setOpen(false)
                item.onClick?.()
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${
                item.disabled
                  ? 'cursor-not-allowed text-[#a0aec0]'
                  : item.variant === 'danger'
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-[#0f172b] hover:bg-[#f8fafc]'
              }`}
            >
              {item.icon ? (
                <span className="shrink-0">{item.icon}</span>
              ) : null}
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
