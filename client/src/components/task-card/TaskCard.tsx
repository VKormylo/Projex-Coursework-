import Badge from "~/components/badge/Badge";
import { ChevronRightIcon } from "~/components/svg/Svg";
import type { ApiTaskPriority, TaskDto } from "~/types/sprint.types";
import type { PriorityVariant } from "~/components/badge/Badge";

const PRIORITY_MAP: Record<ApiTaskPriority, PriorityVariant> = {
  low: "low",
  medium: "medium",
  high: "high",
  critical: "critical",
};

type Props = {
  task: TaskDto;
  projectKey?: string;
  assigneeName?: string;
  onClick?: (task: TaskDto) => void;
  actionTitle?: string;
};

export default function TaskCard({ task, projectKey = "TASK", assigneeName, onClick, actionTitle }: Props) {
  const priorityVariant = PRIORITY_MAP[task.priority];
  const taskCode = `${projectKey}-${task.id}`;
  const sp = task.storyPoint;
  const interactive = Boolean(onClick);

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      title={interactive ? actionTitle : undefined}
      onClick={interactive ? () => onClick!(task) : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick!(task);
            }
          : undefined
      }
      className={`group flex items-center rounded-lg border border-[#e2e8f0] bg-white px-3 py-3 transition ${
        interactive ? "cursor-pointer hover:border-[#93c5fd] hover:bg-[#f0f7ff]" : "hover:border-[#cbd5e1]"
      }`}
    >
      <div className="flex flex-1 flex-col gap-1.5 min-w-0 pl-1">
        <div className="flex items-center gap-2">
          <span className="text-xs leading-4 text-[#62748e] shrink-0">{taskCode}</span>
          <Badge variant={priorityVariant} />
        </div>
        <p className="text-sm font-medium leading-5 text-[#0f172b] truncate">{task.title}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs leading-4 text-[#62748e]">
            {assigneeName ?? (task.assigneeId ? `#${task.assigneeId}` : "Не призначено")}
          </span>
          <span className="text-xs leading-4 text-[#62748e] shrink-0">{sp != null ? `${sp} SP` : "—"}</span>
        </div>
      </div>
      <ChevronRightIcon
        className={`ml-3 shrink-0 transition ${
          interactive ? "text-[#93c5fd] group-hover:text-[#1447e6]" : "text-[#a0aec0]"
        }`}
      />
    </div>
  );
}
