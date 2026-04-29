import Badge from "~/components/badge/Badge";
import DropdownMenu from "~/components/dropdown-menu/DropdownMenu";
import { CalendarIcon, DotsIcon, EditIcon, GoalIcon, TrashIcon } from "~/components/svg/Svg";
import type { ApiSprintStatus, SprintDto } from "~/types/sprint.types";
import type { StatusVariant } from "~/components/badge/Badge";

const STATUS_MAP: Record<ApiSprintStatus, StatusVariant> = {
  planned: "planning",
  active: "active",
  closed: "closed",
  cancelled: "cancelled",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

type Props = {
  sprint: SprintDto;
  hasActiveSprint?: boolean;
  onStart?: (sprint: SprintDto) => void;
  onEdit?: (sprint: SprintDto) => void;
  onClose?: (sprint: SprintDto) => void;
  onDelete?: (sprint: SprintDto) => void;
  showActions?: boolean;
};

export default function SprintCard({
  sprint,
  hasActiveSprint = false,
  onStart,
  onEdit,
  onClose,
  onDelete,
  showActions = true,
}: Props) {
  const badgeVariant = STATUS_MAP[sprint.status];
  const totalSP = sprint.tasks.reduce((s, t) => s + (t.storyPoint ?? 0), 0);
  const taskCount = sprint.tasks.length;

  const menuItems = [
    ...(sprint.status === "planned" && onStart
      ? [
          {
            label: "Розпочати спринт",
            onClick: () => onStart(sprint),
            disabled: hasActiveSprint,
            title: hasActiveSprint ? "Завершіть поточний активний спринт перед початком нового" : undefined,
          },
        ]
      : []),
    ...(onEdit && sprint.status !== "closed"
      ? [{ label: "Редагувати", icon: <EditIcon />, onClick: () => onEdit(sprint) }]
      : []),
    ...(sprint.status === "active" && onClose ? [{ label: "Закрити спринт", onClick: () => onClose(sprint) }] : []),
    ...(onDelete
      ? [
          {
            label: "Видалити",
            icon: <TrashIcon />,
            variant: "danger" as const,
            onClick: () => onDelete(sprint),
            disabled: sprint.status === "active",
            title: sprint.status === "active" ? "Закрийте спринт перед видаленням" : undefined,
          },
        ]
      : []),
  ];

  return (
    <div className="rounded-[10px] border border-[#e2e8f0] bg-white px-6 py-5">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[18px] font-semibold leading-7 text-[#0f172b]">{sprint.name}</h3>
            <Badge variant={badgeVariant} />
          </div>
          {sprint.goal ? (
            <p className="flex items-center gap-1.5 text-sm leading-5 text-[#45556c]">
              <GoalIcon className="shrink-0 text-[#a0aec0]" />
              {sprint.goal}
            </p>
          ) : null}
          <p className="flex items-center gap-1.5 text-sm leading-5 text-[#45556c]">
            <CalendarIcon className="shrink-0 text-[#a0aec0]" />
            {fmt(sprint.startDate)} – {fmt(sprint.endDate)}
          </p>
        </div>

        {showActions ? (
          <DropdownMenu
            items={menuItems}
            align="right"
            trigger={
              <button
                type="button"
                className="flex size-9 items-center justify-center rounded-lg text-[#62748e] transition hover:bg-[#f3f4f6]"
                aria-label="Дії"
              >
                <DotsIcon />
              </button>
            }
          />
        ) : null}
      </div>
      <div className="mt-3 flex items-center gap-6 border-t border-[#f1f5f9] pt-3 text-sm text-[#45556c]">
        <span>
          Задач: <strong className="text-[#0f172b]">{taskCount}</strong>
        </span>
        <span>
          Story Points: <strong className="text-[#0f172b]">{totalSP}</strong>
        </span>
      </div>
    </div>
  );
}
