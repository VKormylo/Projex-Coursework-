import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import DashboardLayout from "~/components/dashboard-layout/DashboardLayout";
import Button from "~/components/button/Button";
import Badge from "~/components/badge/Badge";
import {
  ChevronDownIcon,
  PlusIcon,
  SearchIcon,
  CalendarIcon,
} from "~/components/svg/Svg";
import { taskService } from "~/services/task-service";
import { projectService } from "~/services/project-service";
import { sprintService } from "~/services/sprint-service";
import { teamService } from "~/services/team-service";
import { useAuthContext } from "~/context/authContext";
import { useClickOutside } from "~/hooks/useClickOutside";
import CreateTaskDialog, {
  type CreateTaskFormValues,
} from "~/pages/sprints/CreateTaskDialog";
import type { TaskDto, ApiTaskStatus } from "~/types/sprint.types";
import { getTaskCode } from "~/utils/project-key";

const COLUMNS: { id: ApiTaskStatus; label: string }[] = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "blocked", label: "Blocked" },
  { id: "in_review", label: "In Review" },
  { id: "done", label: "Done" },
];

function priorityBadgeVariant(p: string) {
  const map: Record<string, string> = {
    low: "low",
    medium: "medium",
    high: "high",
    critical: "critical",
  };
  return map[p] ?? "medium";
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function formatDate(d: string | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "short",
  });
}

interface KanbanCardProps {
  task: TaskDto;
  index: number;
  onClick: () => void;
}

function KanbanCard({ task, index, onClick }: KanbanCardProps) {
  const assigneeName = task.assignee?.fullName ?? null;

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`cursor-pointer rounded-lg border border-[#e2e8f0] bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${snapshot.isDragging ? "shadow-lg ring-2 ring-[#3b82f6]/30" : ""}`}
        >
          <div className="mb-2 flex items-start justify-between">
            <span className="text-xs font-medium text-[#62748e]">
              {getTaskCode(task.project?.name, task.id)}
            </span>
            <Badge variant={priorityBadgeVariant(task.priority) as any} />
          </div>

          <p className="mb-3 overflow-hidden text-ellipsis break-all text-sm font-medium leading-5 text-[#0f172b] line-clamp-2">
            {task.title}
          </p>

          <div className="flex items-center justify-between">
            {assigneeName ? (
              <div
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#dbeafe] text-[10px] font-semibold text-[#1447e6]"
                title={assigneeName}
              >
                {initials(assigneeName)}
              </div>
            ) : (
              <div className="size-6" />
            )}
            {task.dueDate ? (
              <span className="flex items-center gap-1 text-xs text-[#62748e]">
                <CalendarIcon />
                {formatDate(task.dueDate)}
              </span>
            ) : null}
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default function Board() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [sprintFilter, setSprintFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const [projectOpen, setProjectOpen] = useState(false);
  const [sprintOpen, setSprintOpen] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);

  const closeProject = useCallback(() => setProjectOpen(false), []);
  const closeSprint = useCallback(() => setSprintOpen(false), []);
  const closeAssignee = useCallback(() => setAssigneeOpen(false), []);
  const closePriority = useCallback(() => setPriorityOpen(false), []);
  const projectRef = useClickOutside<HTMLDivElement>(closeProject, projectOpen);
  const sprintRef = useClickOutside<HTMLDivElement>(closeSprint, sprintOpen);
  const assigneeRef = useClickOutside<HTMLDivElement>(
    closeAssignee,
    assigneeOpen,
  );
  const priorityRef = useClickOutside<HTMLDivElement>(
    closePriority,
    priorityOpen,
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [createApiError, setCreateApiError] = useState<string | null>(null);

  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectService.list(),
  });

  const { data: sprintsData } = useQuery({
    queryKey: ["sprints"],
    queryFn: () => sprintService.list(),
  });

  const projects = useMemo(
    () => (projectsData?.projects ?? []).filter((p) => p.status === "active"),
    [projectsData],
  );

  const sprintsForProject = useMemo(
    () =>
      (sprintsData?.sprints ?? []).filter(
        (s) => s.status === "active" && s.projectId === projectFilter,
      ),
    [sprintsData, projectFilter],
  );

  // Default to first active project once list loads
  useEffect(() => {
    if (!projectFilter && projects[0]) {
      setProjectFilter(projects[0].id);
    }
  }, [projectFilter, projects]);

  // Keep sprint in sync with project: pick first sprint in project when project changes or current sprint invalid
  useEffect(() => {
    if (!projectFilter) return;
    if (sprintsForProject.length === 0) {
      if (sprintFilter) setSprintFilter("");
      return;
    }
    if (
      !sprintFilter ||
      !sprintsForProject.some((s) => s.id === sprintFilter)
    ) {
      setSprintFilter(sprintsForProject[0].id);
    }
  }, [projectFilter, sprintsForProject, sprintFilter]);

  const { data: tasksData, isLoading } = useQuery({
    queryKey: [
      "board-tasks",
      projectFilter,
      sprintFilter,
      assigneeFilter,
      priorityFilter,
    ],
    queryFn: () =>
      taskService.list({
        projectId: projectFilter,
        sprintId: sprintFilter,
        assigneeId: assigneeFilter || undefined,
        priority: priorityFilter || undefined,
      }),
    enabled: Boolean(projectFilter && sprintFilter),
  });
  const { data: teamsData } = useQuery({
    queryKey: ["teams"],
    queryFn: () => teamService.list(),
    staleTime: 60_000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApiTaskStatus }) =>
      taskService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-tasks"] });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (payload: Parameters<typeof taskService.create>[0]) =>
      taskService.create(payload),
    onSuccess: () => {
      setCreateOpen(false);
      setCreateApiError(null);
      queryClient.invalidateQueries({ queryKey: ["board-tasks"] });
    },
    onError: (err: any) => {
      setCreateApiError(err?.message ?? "Помилка створення задачі");
    },
  });

  const allTasks = tasksData?.tasks ?? [];
  const currentProject = projects.find((p) => p.id === projectFilter) ?? null;
  const projectTeam = (teamsData?.teams ?? []).find(
    (t) => t.id === currentProject?.teamId,
  );
  const assignees =
    projectTeam?.teamMember
      ?.map((m) => m.user)
      .filter((u) => u.isActive && u.role?.name === "Developer")
      .map((u) => ({ id: u.id, fullName: u.fullName })) ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return allTasks;
    const q = search.toLowerCase();
    return allTasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q),
    );
  }, [allTasks, search]);

  const grouped = useMemo(() => {
    const map: Record<ApiTaskStatus, TaskDto[]> = {
      todo: [],
      in_progress: [],
      in_review: [],
      done: [],
      blocked: [],
    };
    for (const t of filtered) {
      if (t.status in map) map[t.status].push(t);
    }
    return map;
  }, [filtered]);

  function handleDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const newStatus = destination.droppableId as ApiTaskStatus;
    updateStatusMutation.mutate({ id: draggableId, status: newStatus });

    // Optimistic update: mutate the cache immediately so the card jumps
    // columns without waiting for the API response. The key must include all
    // active filter values — React Query uses exact key equality to locate the entry.
    queryClient.setQueryData(
      [
        "board-tasks",
        projectFilter,
        sprintFilter,
        assigneeFilter,
        priorityFilter,
      ],
      (old: typeof tasksData) => {
        if (!old) return old;
        return {
          ...old,
          tasks: old.tasks.map((t) =>
            t.id === draggableId ? { ...t, status: newStatus } : t,
          ),
        };
      },
    );
  }

  function handleCreateTask(data: CreateTaskFormValues) {
    if (!user) return;
    if (!projectFilter || !sprintFilter) {
      setCreateApiError("Оберіть проєкт і активний спринт");
      return;
    }
    setCreateApiError(null);
    createTaskMutation.mutate({
      projectId: projectFilter,
      sprintId: sprintFilter,
      title: data.title,
      priority: data.priority,
      storyPoint: data.storyPoint,
      assigneeId: data.assigneeId || null,
      dueDate: data.dueDate || undefined,
      reporterId: user.id,
      status: "todo",
    });
  }

  const projectLabel =
    projects.find((p) => p.id === projectFilter)?.name ?? "Оберіть проєкт";
  const sprintLabel =
    sprintsForProject.find((s) => s.id === sprintFilter)?.name ??
    (sprintsForProject.length === 0 ? "Немає спринтів" : "Оберіть спринт");

  const PRIORITY_OPTIONS = [
    { value: "", label: "Всі пріоритети" },
    { value: "low", label: "Низький" },
    { value: "medium", label: "Середній" },
    { value: "high", label: "Високий" },
    { value: "critical", label: "Критичний" },
  ];
  const priorityLabel =
    PRIORITY_OPTIONS.find((o) => o.value === priorityFilter)?.label ??
    "Всі пріоритети";

  return (
    <DashboardLayout>
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[30px] font-bold leading-9 text-[#0f172b]">
              Дошка задач
            </h1>
            <p className="mt-1 text-sm text-[#62748e]">
              Керуйте завданнями за допомогою Kanban-дошки
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            disabled={!projectFilter || !sprintFilter}
          >
            <PlusIcon />
            <span className="pl-1">Створити задачу</span>
          </Button>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#62748e]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Пошук задач..."
              className="h-9 w-56 rounded-lg border border-[#e2e8f0] bg-white pl-9 pr-3 text-sm text-[#0f172b] outline-none placeholder:text-[#62748e] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30"
            />
          </div>

          {/* Project filter */}
          <div ref={projectRef} className="relative">
            <button
              onClick={() => setProjectOpen((v) => !v)}
              className="flex h-9 min-w-[10rem] items-center justify-between gap-2 rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm text-[#0f172b]"
            >
              <span className="truncate">{projectLabel}</span>
              <ChevronDownIcon className="shrink-0 text-[#62748e]" />
            </button>
            {projectOpen && (
              <div className="absolute left-0 top-full z-30 mt-1 w-56 max-h-64 overflow-y-auto rounded-xl border border-[#e2e8f0] bg-white py-1 shadow-lg">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setProjectFilter(p.id);
                      setProjectOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-[#f8fafc]"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sprint filter */}
          <div ref={sprintRef} className="relative">
            <button
              onClick={() => setSprintOpen((v) => !v)}
              className="flex h-9 min-w-[10rem] items-center justify-between gap-2 rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm text-[#0f172b]"
            >
              <span className="truncate">{sprintLabel}</span>
              <ChevronDownIcon className="shrink-0 text-[#62748e]" />
            </button>
            {sprintOpen && (
              <div className="absolute left-0 top-full z-30 mt-1 w-56 max-h-64 overflow-y-auto rounded-xl border border-[#e2e8f0] bg-white py-1 shadow-lg">
                {sprintsForProject.length === 0 ? (
                  <p className="px-4 py-2 text-sm text-[#62748e]">
                    Немає активних спринтів
                  </p>
                ) : (
                  sprintsForProject.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSprintFilter(s.id);
                        setSprintOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-[#f8fafc]"
                    >
                      {s.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Priority filter */}
          <div ref={priorityRef} className="relative">
            <button
              onClick={() => setPriorityOpen((v) => !v)}
              className="flex h-9 min-w-[10rem] items-center justify-between gap-2 rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm text-[#0f172b]"
            >
              <span className="truncate">{priorityLabel}</span>
              <ChevronDownIcon className="shrink-0 text-[#62748e]" />
            </button>
            {priorityOpen && (
              <div className="absolute left-0 top-full z-30 mt-1 w-44 rounded-xl border border-[#e2e8f0] bg-white py-1 shadow-lg">
                {PRIORITY_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => {
                      setPriorityFilter(o.value);
                      setPriorityOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-[#f8fafc]"
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Board */}
        {projects.length === 0 ? (
          <div className="mt-12 text-center text-sm text-[#62748e]">
            Немає активних проєктів.
          </div>
        ) : projectFilter && sprintsForProject.length === 0 ? (
          <div className="mt-12 text-center text-sm text-[#62748e]">
            Для цього проєкту немає активних спринтів. Створіть або запустіть
            спринт на сторінці «Спринти».
          </div>
        ) : isLoading ? (
          <div className="mt-12 text-center text-sm text-[#62748e]">
            Завантаження…
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="mt-6 flex flex-1 gap-4 overflow-x-auto pb-4">
              {COLUMNS.map((col) => {
                const cards = grouped[col.id] ?? [];
                return (
                  <div
                    key={col.id}
                    className="flex w-[299px] shrink-0 flex-col rounded-xl border border-[#e2e8f0] bg-[#f8fafc]"
                  >
                    {/* Column header */}
                    <div className="flex items-center justify-between px-4 py-4">
                      <h3 className="text-base font-semibold text-[#0f172b]">
                        {col.label}
                      </h3>
                      <span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-[#e2e8f0] px-1.5 text-xs font-medium text-[#62748e]">
                        {cards.length}
                      </span>
                    </div>

                    {/* Droppable area */}
                    <Droppable droppableId={col.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4 transition-colors ${snapshot.isDraggingOver ? "bg-[#eff6ff]" : ""}`}
                          style={{ minHeight: 80 }}
                        >
                          {cards.map((task, index) => (
                            <KanbanCard
                              key={task.id}
                              task={task}
                              index={index}
                              onClick={() => navigate(`/board/${task.id}`)}
                            />
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        )}
      </div>

      <CreateTaskDialog
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setCreateApiError(null);
        }}
        onSubmit={handleCreateTask}
        isPending={createTaskMutation.isPending}
        apiError={createApiError}
        assignees={assignees}
      />
    </DashboardLayout>
  );
}
