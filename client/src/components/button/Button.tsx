import type { ButtonHTMLAttributes, ReactNode } from 'react'

import type { Variant } from '~/types/common.types'

type Props = {
  children: ReactNode
  variant?: Variant
  stretch?: boolean
} & ButtonHTMLAttributes<HTMLButtonElement>

const base =
  'inline-flex h-9 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]/50'

const variants: Record<Variant, string> = {
  filled: 'bg-[#3b82f6] text-white shadow-sm hover:bg-[#2563eb]',
  outlined:
    'border border-black/10 bg-white text-[#0a0a0a] hover:bg-black/[0.03]',
}

export default function Button({
  children,
  className = '',
  variant = 'filled',
  stretch,
  type = 'submit',
  ...rest
}: Props) {
  const widthClass = stretch ? 'w-full' : ''
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${widthClass} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  )
}
