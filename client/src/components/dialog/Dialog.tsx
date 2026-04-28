import { useEffect, type ReactNode } from 'react'
import { XIcon } from '~/components/svg/Svg'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}

export default function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative w-[512px] rounded-[10px] border border-black/10 bg-white shadow-[0_10px_15px_rgba(0,0,0,0.1),0_4px_6px_rgba(0,0,0,0.1)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
        aria-labelledby="dialog-title"
      >
        <div className="flex flex-col gap-2 px-6 pt-6">
          <h2
            id="dialog-title"
            className="text-[18px] font-semibold leading-[18px] text-[#0a0a0a]"
          >
            {title}
          </h2>
          {description ? (
            <p className="text-sm leading-5 text-[#717182]">{description}</p>
          ) : null}
        </div>

        <div className="px-6 pt-4">{children}</div>

        {footer ? (
          <div className="flex items-center justify-end gap-2 px-6 pb-6 pt-6">
            {footer}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onClose}
          aria-label="Закрити"
          className="absolute right-4 top-4 rounded p-0.5 text-[#717182]/70 transition hover:text-[#0a0a0a]"
        >
          <XIcon />
        </button>
      </div>
    </div>
  )
}
