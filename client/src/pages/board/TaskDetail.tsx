import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTaskCode } from "~/utils/project-key";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import DashboardLayout from "~/components/dashboard-layout/DashboardLayout";
import Badge from "~/components/badge/Badge";
import Button from "~/components/button/Button";
import ConfirmDialog from "~/components/confirm-dialog/ConfirmDialog";
import { taskService } from "~/services/task-service";
import { commentService } from "~/services/comment-service";
import { projectService } from "~/services/project-service";
import { teamService } from "~/services/team-service";
import { sprintService } from "~/services/sprint-service";
import { useAuthContext } from "~/context/authContext";
import type { ApiTaskStatus, ApiTaskPriority } from "~/types/sprint.types";
import type { BadgeVariant } from "~/components/badge/Badge";
import {
  ChevronDownIcon,
  EditIcon,
  TrashIcon,
  CalendarIcon,
  GoalIcon,
  MembersIcon,
  ChevronRightIcon,
  FolderIcon,
  UserIcon,
} from "~/components/svg/Svg";

const STATUS_OPTIONS: { value: ApiTaskStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "done", label: "Done" },
  { value: "blocked", label: "Blocked" },
];
const STATUS_LABELS: Record<ApiTaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
  blocked: "Blocked",
};
const PRIORITY_OPTIONS: { value: ApiTaskPriority; label: string }[] = [
  { value: "low", label: "Низький" },
  { value: "medium", label: "Середній" },
  { value: "high", label: "Високий" },
  { value: "critical", label: "Критичний" },
];

function statusBadge(status: ApiTaskStatus) {
  const map: Record<ApiTaskStatus, BadgeVariant> = {
    todo: "planning",
    in_progress: "active",
    in_review: "paused",
    done: "done",
    blocked: "cancelled",
  };
  return map[status] ?? "planning";
}

function priorityBadge(p: ApiTaskPriority): BadgeVariant {
  return p;
}

function statusLabel(status: ApiTaskStatus) {
  return STATUS_LABELS[status] ?? status;
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-3">
      <div className="mb-1 flex items-center gap-2 text-sm text-[#62748e]">
        {icon}
        <span>{label}</span>
      </div>
      <div className="pl-6">{children}</div>
    </div>
  );
}

export default function TaskDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  const [commentBody, setCommentBody] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const { data: taskData, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => taskService.get(taskId!),
    enabled: Boolean(taskId),
  });

  const { data: historyData } = useQuery({
    queryKey: ["task-history", taskId],
    queryFn: () => taskService.getHistory(taskId!),
    enabled: Boolean(taskId),
  });

  const { data: commentsData } = useQuery({
    queryKey: ["task-comments", taskId],
    queryFn: () => commentService.listByTask(taskId!),
    enabled: Boolean(taskId),
  });
  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectService.list(),
  });
  const { data: teamsData } = useQuery({
    queryKey: ["teams"],
    queryFn: () => teamService.list(),
  });
  const { data: sprintsData } = useQuery({
    queryKey: ["sprints"],
    queryFn: () => sprintService.list(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: ApiTaskStatus) =>
      taskService.updateStatus(taskId!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["task-history", taskId] });
      queryClient.invalidateQueries({ queryKey: ["board-tasks"] });
      setStatusOpen(false);
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: (body: string) => commentService.create(taskId!, body),
    onSuccess: () => {
      setCommentBody("");
      queryClient.invalidateQueries({ queryKey: ["task-comments", taskId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => taskService.delete(taskId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-tasks"] });
      setDeleteConfirmOpen(false);
      navigate("/board");
    },
  });
  const updateDetailsMutation = useMutation({
    mutationFn: (payload: {
      assigneeId?: string | null;
      dueDate?: string | null;
      priority?: ApiTaskPriority;
      storyPoint?: number | null;
      sprintId?: string | null;
    }) => taskService.update(taskId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["board-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
  const updateTaskMutation = useMutation({
    mutationFn: (payload: { title: string; description: string | null }) =>
      taskService.update(taskId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["board-tasks"] });
      setIsEditingTask(false);
      setEditError(null);
    },
    onError: (e: Error) => setEditError(e.message),
  });

  const task = taskData?.task;
  const history = historyData?.history ?? [];
  const comments = commentsData?.comments ?? [];
  const projects = projectsData?.projects ?? [];
  const teams = teamsData?.teams ?? [];
  const sprints = sprintsData?.sprints ?? [];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="mt-20 text-center text-sm text-[#62748e]">
          Завантаження…
        </div>
      </DashboardLayout>
    );
  }

  if (!task) {
    return (
      <DashboardLayout>
        <div className="mt-20 text-center text-sm text-red-500">
          Задачу не знайдено
        </div>
      </DashboardLayout>
    );
  }

  const taskCode = getTaskCode(task.project?.name, task.id);
  const taskProject = projects.find((p) => p.id === task.projectId);
  const projectTeam = teams.find((t) => t.id === taskProject?.teamId);
  const projectSprints = sprints.filter((s) => s.projectId === task.projectId);
  const developerAssignees =
    projectTeam?.teamMember
      ?.map((m) => m.user)
      .filter((u) => u.isActive && u.role?.name === "Developer")
      .map((u) => ({ id: u.id, fullName: u.fullName })) ?? [];

  function startEditTask() {
    setEditTitle(task.title);
    setEditDescription(task.description ?? "");
    setEditError(null);
    setIsEditingTask(true);
  }

  function cancelEditTask() {
    setIsEditingTask(false);
    setEditError(null);
  }

  function saveTaskMainFields() {
    const title = editTitle.trim();
    if (title.length < 2) {
      setEditError("Назва задачі має містити мінімум 2 символи");
      return;
    }
    updateTaskMutation.mutate({
      title,
      description: editDescription.trim() ? editDescription.trim() : null,
    });
  }

  return (
    <DashboardLayout>
      <div className="flex h-full flex-col overflow-hidden">
        {/* Back button */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/board")}
            className="flex items-center gap-2 text-sm font-medium text-[#62748e] transition-colors hover:text-[#0f172b]"
          >
            <ChevronRightIcon className="rotate-180" />
            Назад до дошки
          </button>
        </div>

        <div className="flex flex-1 gap-6 overflow-hidden">
          {/* Left column */}
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto">
            {/* Title section */}
            <div className="rounded-xl border border-[#e2e8f0] bg-white p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-[#62748e]">
                    {taskCode}
                  </span>
                  <Badge variant={statusBadge(task.status)} />
                  <Badge variant={priorityBadge(task.priority)} />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      isEditingTask ? cancelEditTask() : startEditTask()
                    }
                    className="flex size-8 items-center justify-center rounded-lg border border-[#e2e8f0] text-[#62748e] transition-colors hover:bg-[#f8fafc] hover:text-[#0f172b]"
                    title={
                      isEditingTask ? "Скасувати редагування" : "Редагувати"
                    }
                  >
                    <EditIcon />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="flex size-8 items-center justify-center rounded-lg border border-[#e2e8f0] text-[#62748e] transition-colors hover:bg-red-50 hover:text-red-500"
                    title="Видалити"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>

              {isEditingTask ? (
                <div className="mt-1 flex flex-col gap-3">
                  {editError ? (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                      {editError}
                    </p>
                  ) : null}
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-10 w-full rounded-lg border border-[#e2e8f0] px-3 text-base font-semibold text-[#0f172b] outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30"
                    placeholder="Назва задачі"
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={4}
                    className="w-full resize-none rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm text-[#374151] outline-none placeholder:text-[#62748e] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30"
                    placeholder="Додайте опис задачі..."
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={saveTaskMainFields}
                      disabled={updateTaskMutation.isPending}
                    >
                      {updateTaskMutation.isPending
                        ? "Збереження…"
                        : "Зберегти"}
                    </Button>
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={cancelEditTask}
                      disabled={updateTaskMutation.isPending}
                    >
                      Скасувати
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h1
                    className="overflow-hidden text-ellipsis break-all text-2xl font-semibold leading-8 text-[#0f172b] line-clamp-2"
                    title={task.title}
                  >
                    {task.title}
                  </h1>

                  {task.description ? (
                    <div className="mt-4">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#62748e]">
                        Опис
                      </p>
                      <p className="text-sm leading-6 text-[#374151]">
                        {task.description}
                      </p>
                    </div>
                  ) : null}
                </>
              )}
            </div>

            {/* Comments */}
            <div className="rounded-xl border border-[#e2e8f0] bg-white p-6">
              <h3 className="mb-5 flex items-center gap-2 text-base font-semibold text-[#0f172b]">
                <GoalIcon />
                Коментарі ({comments.length})
              </h3>

              {comments.length > 0 ? (
                <div className="mb-6 flex flex-col gap-5">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#dbeafe] text-xs font-semibold text-[#1447e6]">
                        {c.author ? initials(c.author.fullName) : "?"}
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 flex items-baseline gap-2">
                          <span className="text-sm font-medium text-[#0f172b]">
                            {c.author?.fullName ?? "Користувач"}
                          </span>
                          <span className="text-xs text-[#62748e]">
                            {formatDateTime(c.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-[#374151]">{c.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="border-t border-[#e2e8f0] pt-5">
                <div className="flex gap-3">
                  {user ? (
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#dbeafe] text-xs font-semibold text-[#1447e6]">
                      {initials(user.fullName)}
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col gap-3">
                    <textarea
                      value={commentBody}
                      onChange={(e) => setCommentBody(e.target.value)}
                      placeholder="Додати коментар..."
                      rows={3}
                      className="w-full resize-none rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm text-[#0f172b] outline-none placeholder:text-[#62748e] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30"
                    />
                    <div>
                      <Button
                        onClick={() => {
                          if (commentBody.trim())
                            addCommentMutation.mutate(commentBody.trim());
                        }}
                        disabled={
                          !commentBody.trim() || addCommentMutation.isPending
                        }
                      >
                        Відправити
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* History */}
            {history.length > 0 ? (
              <div className="rounded-xl border border-[#e2e8f0] bg-white p-6">
                <h3 className="mb-5 flex items-center gap-2 text-base font-semibold text-[#0f172b]">
                  <CalendarIcon width={20} height={20} />
                  Історія змін
                </h3>
                <div className="flex flex-col gap-4">
                  {history.map((h) => (
                    <div key={h.id} className="flex gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#e2e8f0] bg-[#f8fafc] text-[#62748e]">
                        <CalendarIcon width={14} height={14} />
                      </div>
                      <div>
                        <p className="text-sm text-[#374151]">
                          <span className="font-medium text-[#0f172b]">
                            {h.user?.fullName ?? "Система"}
                          </span>{" "}
                          {"змінив статус:"}
                          <span
                            className={`mx-1 inline-flex h-[22px] items-center rounded-lg px-2 py-[3px] text-xs font-medium leading-4 ${
                              h.oldStatus === "done"
                                ? "bg-[#e0e7ff] text-[#3730a3]"
                                : h.oldStatus === "in_progress"
                                  ? "bg-[#d0fae5] text-[#007a55]"
                                  : h.oldStatus === "in_review"
                                    ? "bg-[#f3f4f6] text-[#374151]"
                                    : h.oldStatus === "blocked"
                                      ? "bg-[#fee2e2] text-[#991b1b]"
                                      : "bg-[#fef3c7] text-[#92400e]"
                            }`}
                          >
                            {statusLabel(h.oldStatus)}
                          </span>
                          {"→"}
                          <span
                            className={`ml-1 inline-flex h-[22px] items-center rounded-lg px-2 py-[3px] text-xs font-medium leading-4 ${
                              h.newStatus === "done"
                                ? "bg-[#e0e7ff] text-[#3730a3]"
                                : h.newStatus === "in_progress"
                                  ? "bg-[#d0fae5] text-[#007a55]"
                                  : h.newStatus === "in_review"
                                    ? "bg-[#f3f4f6] text-[#374151]"
                                    : h.newStatus === "blocked"
                                      ? "bg-[#fee2e2] text-[#991b1b]"
                                      : "bg-[#fef3c7] text-[#92400e]"
                            }`}
                          >
                            {statusLabel(h.newStatus)}
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-[#62748e]">
                          {formatDateTime(h.changedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Right sidebar */}
          <div className="w-[394px] shrink-0 overflow-y-auto">
            <div className="flex flex-col gap-4">
              {/* Status */}
              <div className="rounded-xl border border-[#e2e8f0] bg-white p-4">
                <h3 className="mb-3 text-base font-semibold text-[#0f172b]">
                  Статус
                </h3>
                <div className="relative">
                  <button
                    onClick={() => setStatusOpen((v) => !v)}
                    className="flex h-9 w-full items-center justify-between rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm text-[#0f172b] hover:bg-[#f8fafc]"
                  >
                    <span>
                      {STATUS_OPTIONS.find((o) => o.value === task.status)
                        ?.label ?? task.status}
                    </span>
                    <ChevronDownIcon className="text-[#62748e]" />
                  </button>
                  {statusOpen ? (
                    <div className="absolute left-0 top-full z-30 mt-1 w-full rounded-xl border border-[#e2e8f0] bg-white py-1 shadow-lg">
                      {STATUS_OPTIONS.map((o) => (
                        <button
                          key={o.value}
                          onClick={() => updateStatusMutation.mutate(o.value)}
                          className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[#f8fafc] ${task.status === o.value ? "font-medium text-[#3b82f6]" : "text-[#0f172b]"}`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Details */}
              <div className="rounded-xl border border-[#e2e8f0] bg-white p-4">
                <h3 className="mb-2 text-base font-semibold text-[#0f172b]">
                  Деталі
                </h3>

                <div className="divide-y divide-[#f1f5f9]">
                  <DetailRow icon={<MembersIcon />} label="Виконавець">
                    <select
                      value={task.assigneeId ?? ""}
                      onChange={(e) =>
                        updateDetailsMutation.mutate({
                          assigneeId: e.target.value || null,
                        })
                      }
                      className="h-9 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm text-[#0f172b] outline-none hover:border-[#cbd5e1] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30"
                    >
                      <option value="">Не призначено</option>
                      {developerAssignees.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName}
                        </option>
                      ))}
                    </select>
                  </DetailRow>

                  <DetailRow icon={<UserIcon />} label="Репортер">
                    {task.reporter ? (
                      <div className="flex items-center gap-2">
                        <div className="flex size-6 items-center justify-center rounded-full bg-[#dcfce7] text-[10px] font-semibold text-[#16a34a]">
                          {initials(task.reporter.fullName)}
                        </div>
                        <span className="text-sm text-[#0f172b]">
                          {task.reporter.fullName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-[#62748e]">—</span>
                    )}
                  </DetailRow>

                  <DetailRow icon={<GoalIcon />} label="Пріоритет">
                    <select
                      value={task.priority}
                      onChange={(e) =>
                        updateDetailsMutation.mutate({
                          priority: e.target.value as ApiTaskPriority,
                        })
                      }
                      className="h-9 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm text-[#0f172b] outline-none hover:border-[#cbd5e1] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30"
                    >
                      {PRIORITY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </DetailRow>

                  <DetailRow
                    icon={<CalendarIcon width={16} height={16} />}
                    label="Дедлайн"
                  >
                    <input
                      type="date"
                      value={task.dueDate ? task.dueDate.slice(0, 10) : ""}
                      onChange={(e) =>
                        updateDetailsMutation.mutate({
                          dueDate: e.target.value || null,
                        })
                      }
                      className="h-9 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm text-[#0f172b] outline-none hover:border-[#cbd5e1] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30"
                    />
                  </DetailRow>

                  <DetailRow icon={<ChevronRightIcon />} label="Story Points">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      defaultValue={task.storyPoint ?? ""}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        const parsed = val === "" ? null : Number(val);
                        if (
                          val !== "" &&
                          (!Number.isInteger(parsed) || parsed < 0)
                        )
                          return;
                        const current = task.storyPoint ?? null;
                        if (parsed === current) return;
                        updateDetailsMutation.mutate({ storyPoint: parsed });
                      }}
                      className="h-9 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm text-[#0f172b] outline-none hover:border-[#cbd5e1] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30"
                      placeholder="Не вказано"
                    />
                  </DetailRow>

                  {task.project ? (
                    <DetailRow icon={<FolderIcon />} label="Проєкт">
                      <span className="text-sm text-[#0f172b]">
                        {task.project.name}
                      </span>
                    </DetailRow>
                  ) : null}

                  <DetailRow icon={<GoalIcon />} label="Спринт">
                    <select
                      value={task.sprintId ?? ""}
                      onChange={(e) =>
                        updateDetailsMutation.mutate({
                          sprintId: e.target.value || null,
                        })
                      }
                      className="h-9 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm text-[#0f172b] outline-none hover:border-[#cbd5e1] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30"
                    >
                      <option value="">Без спринту (беклог)</option>
                      {projectSprints.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </DetailRow>

                  {task.createdAt ? (
                    <DetailRow
                      icon={<CalendarIcon width={16} height={16} />}
                      label="Створено"
                    >
                      <span className="text-sm text-[#0f172b]">
                        {formatDate(task.createdAt)}
                      </span>
                    </DetailRow>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Видалити задачу?"
        description="Цю дію не можна скасувати."
        isPending={deleteMutation.isPending}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
      >
        <p className="text-sm text-[#45556c]">
          Після видалення задачу неможливо буде відновити.
        </p>
      </ConfirmDialog>
    </DashboardLayout>
  );
}
