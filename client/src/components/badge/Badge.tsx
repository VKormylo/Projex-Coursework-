type StatusVariant = 'active' | 'planning' | 'done' | 'paused' | 'closed' | 'cancelled'
type PriorityVariant = 'low' | 'medium' | 'high' | 'critical'
export type BadgeVariant = StatusVariant | PriorityVariant

const styles: Record<BadgeVariant, { bg: string; text: string; label: string }> = {
  active:    { bg: 'bg-[#d0fae5]', text: 'text-[#007a55]', label: 'Активний'    },
  planning:  { bg: 'bg-[#fef3c7]', text: 'text-[#92400e]', label: 'Планування'  },
  done:      { bg: 'bg-[#e0e7ff]', text: 'text-[#3730a3]', label: 'Завершено'   },
  paused:    { bg: 'bg-[#f3f4f6]', text: 'text-[#374151]', label: 'Призупинено' },
  closed:    { bg: 'bg-[#e0e7ff]', text: 'text-[#3730a3]', label: 'Завершений'  },
  cancelled: { bg: 'bg-[#fee2e2]', text: 'text-[#991b1b]', label: 'Скасовано'   },
  low:       { bg: 'bg-[#f3f4f6]', text: 'text-[#374151]', label: 'Низький'     },
  medium:    { bg: 'bg-[#dbeafe]', text: 'text-[#1447e6]', label: 'Середній'    },
  high:      { bg: 'bg-[#fef3c7]', text: 'text-[#92400e]', label: 'Високий'     },
  critical:  { bg: 'bg-[#fee2e2]', text: 'text-[#dc2626]', label: 'Критичний'   },
}

type Props = {
  variant: BadgeVariant
  label?: string
}

export default function Badge({ variant, label }: Props) {
  const s = styles[variant]
  return (
    <span
      className={`inline-flex h-[22px] items-center rounded-lg px-2 py-[3px] text-xs font-medium leading-4 ${s.bg} ${s.text}`}
    >
      {label ?? s.label}
    </span>
  )
}

export type { StatusVariant, PriorityVariant }
