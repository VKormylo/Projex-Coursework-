type StatusVariant =
  | "active"
  | "planning"
  | "paused"
  | "archived"
  | "done"
  | "review"
  | "closed"
  | "cancelled"
  | "blocked";

type PriorityVariant = "low" | "medium" | "high" | "critical";
export type BadgeVariant = StatusVariant | PriorityVariant;

const styles: Record<BadgeVariant, { bg: string; text: string; label: string }> = {
  active: { bg: "bg-[#d0fae5]", text: "text-[#007a55]", label: "Активний" },
  planning: { bg: "bg-[#fef3c7]", text: "text-[#92400e]", label: "Планування" },
  paused: { bg: "bg-[#f3f4f6]", text: "text-[#374151]", label: "На паузі" },
  archived: {
    bg: "bg-[#e2e8f0]",
    text: "text-[#475569]",
    label: "Заархівовано",
  },
  done: { bg: "bg-[#e0e7ff]", text: "text-[#3730a3]", label: "Завершено" },
  review: { bg: "bg-[#f3f4f6]", text: "text-[#374151]", label: "На рев'ю" },
  closed: { bg: "bg-[#e0e7ff]", text: "text-[#3730a3]", label: "Завершений" },
  cancelled: { bg: "bg-[#fee2e2]", text: "text-[#991b1b]", label: "Скасовано" },
  blocked: { bg: "bg-[#fee2e2]", text: "text-[#991b1b]", label: "Заблоковано" },
  low: { bg: "bg-[#f3f4f6]", text: "text-[#374151]", label: "Низький" },
  medium: { bg: "bg-[#dbeafe]", text: "text-[#1447e6]", label: "Середній" },
  high: { bg: "bg-[#fef3c7]", text: "text-[#92400e]", label: "Високий" },
  critical: { bg: "bg-[#fee2e2]", text: "text-[#dc2626]", label: "Критичний" },
};

type Props = {
  variant: BadgeVariant;
  label?: string;
};

export default function Badge({ variant, label }: Props) {
  const s = styles[variant] ?? styles.planning;

  return (
    <span
      className={`inline-flex h-[22px] items-center rounded-lg px-2 py-[3px] text-xs font-medium leading-4 ${s.bg} ${s.text}`}
    >
      {label ?? s.label}
    </span>
  );
}

export type { StatusVariant, PriorityVariant };
