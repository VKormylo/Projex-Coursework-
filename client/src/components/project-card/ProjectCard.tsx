import Badge from "~/components/badge/Badge";
import DropdownMenu from "~/components/dropdown-menu/DropdownMenu";
import { ArchiveIcon, DotsIcon, EditIcon, FolderIcon, TrashIcon } from "~/components/svg/Svg";
import type { StatusVariant } from "~/components/badge/Badge";
import type { ApiProjectStatus, ProjectDto } from "~/types/project.types";

const STATUS_MAP: Record<ApiProjectStatus, StatusVariant> = {
  planned: "planning",
  active: "active",
  on_hold: "paused",
  completed: "done",
  archived: "archived",
};

function projectKey(name: string) {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 3);
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

type Props = {
  project: ProjectDto;
  onEdit: (project: ProjectDto) => void;
  onArchive: (project: ProjectDto) => void;
  onDelete: (project: ProjectDto) => void;
  showActions?: boolean;
};

export default function ProjectCard({ project, onEdit, onArchive, onDelete, showActions = true }: Props) {
  const badgeVariant = STATUS_MAP[project.status];
  const key = projectKey(project.name);
  const taskCount = project.tasks.length;
  const due = formatDate(project.endDate);
  const isArchived = project.status === "archived";

  const menuItems = [
    {
      label: "Редагувати",
      icon: <EditIcon />,
      onClick: () => onEdit(project),
    },
    {
      label: isArchived ? "Розархівувати" : "Архівувати",
      icon: <ArchiveIcon />,
      onClick: () => onArchive({ ...project, status: isArchived ? "on_hold" : "archived" }),
    },
    {
      label: "Видалити",
      icon: <TrashIcon />,
      variant: "danger" as const,
      onClick: () => onDelete(project),
    },
  ];

  return (
    <article className="flex flex-col gap-4 rounded-[10px] border border-[#e2e8f0] bg-white px-6 pt-6 pb-px">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#dbeafe]">
            <span className="text-sm font-bold leading-5 text-[#1447e6]">{key}</span>
          </div>
          <div>
            <p className="text-[18px] font-semibold leading-[27px] text-[#0f172b]">{project.name}</p>
            <Badge variant={badgeVariant} />
          </div>
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

      <p className="line-clamp-2 min-h-[40px] text-sm leading-5 text-[#45556c]">{project.description ?? "—"}</p>

      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1 text-sm leading-5 text-[#45556c]">
          <FolderIcon />
          {taskCount} задач
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-[#e2e8f0] py-[17px]">
        {due ? <span className="text-xs leading-4 text-[#62748e]">Дедлайн: {due}</span> : <span />}
        <span className="text-xs leading-4 text-[#62748e]">#{project.id}</span>
      </div>
    </article>
  );
}
