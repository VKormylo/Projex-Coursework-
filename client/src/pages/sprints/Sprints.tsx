import { useCallback, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "~/components/dashboard-layout/DashboardLayout";
import Button from "~/components/button/Button";
import Badge from "~/components/badge/Badge";
import ConfirmDialog from "~/components/confirm-dialog/ConfirmDialog";
import TaskCard from "~/components/task-card/TaskCard";
import SprintCard from "~/components/sprint-card/SprintCard";
import DropdownMenu from "~/components/dropdown-menu/DropdownMenu";
import { useClickOutside } from "~/hooks/useClickOutside";
import { CalendarIcon, ChevronDownIcon, DotsIcon, EditIcon, PlusIcon } from "~/components/svg/Svg";
import SprintFormDialog, { type SprintFormValues } from "./CreateSprintDialog";
import CreateTaskDialog, { type CreateTaskFormValues } from "./CreateTaskDialog";
import { sprintService } from "~/services/sprint-service";
import { taskService } from "~/services/task-service";
import { projectService } from "~/services/project-service";
import { teamService } from "~/services/team-service";
import { useAuthContext } from "~/context/authContext";
import type { SprintDto } from "~/types/sprint.types";
import { getProjectKey } from "~/utils/project-key";

type Tab = "planning" | "all";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function Sprints() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const isDeveloper = user?.role?.name === "Developer";

  const [tab, setTab] = useState<Tab>("planning");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedPlanningSprintId, setSelectedPlanningSprintId] = useState<string>("");
  const [projectDropOpen, setProjectDropOpen] = useState(false);

  // Create sprint dialog
  const [sprintDialogOpen, setSprintDialogOpen] = useState(false);
  const [sprintError, setSprintError] = useState<string | null>(null);

  // Edit sprint dialog
  const [editSprint, setEditSprint] = useState<SprintDto | null>(null);
  const [editSprintError, setEditSprintError] = useState<string | null>(null);
  const [deleteSprintTarget, setDeleteSprintTarget] = useState<SprintDto | null>(null);

  // Create task dialog
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);

  // Close project dropdown on outside click
  const closeProjectDrop = useCallback(() => setProjectDropOpen(false), []);
  const projectDropRef = useClickOutside<HTMLDivElement>(closeProjectDrop, projectDropOpen);

  // ── Projects list (only active) ──────────────────────────────────────
  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectService.list(),
    staleTime: 60_000,
  });
  const projects = (projectsData?.projects ?? []).filter((p) => p.status === "active");
  const currentProject = projects.find((p) => p.id === selectedProjectId) ?? projects[0];
  const effectiveProjectId = currentProject?.id ?? "";

  // ── Sprints ───────────────────────────────────────────────────────────
  const { data: sprintsData, isLoading: sprintsLoading } = useQuery({
    queryKey: ["sprints"],
    queryFn: () => sprintService.list(),
  });
  const allSprints: SprintDto[] = (sprintsData?.sprints ?? []).filter(
    (s) => !effectiveProjectId || s.projectId === effectiveProjectId,
  );
  const selectableSprints = allSprints.filter((s) => s.status === "planned" || s.status === "active");
  const planningSprint = selectableSprints.find((s) => s.id === selectedPlanningSprintId) ?? null;
  const activeSprint = allSprints.find((s) => s.status === "active") ?? null;
  const hasActiveSprint = activeSprint !== null;

  // ── Tasks ─────────────────────────────────────────────────────────────
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", effectiveProjectId],
    queryFn: () => taskService.list({ projectId: effectiveProjectId || undefined }),
    enabled: Boolean(effectiveProjectId),
  });
  const { data: teamsData } = useQuery({
    queryKey: ["teams"],
    queryFn: () => teamService.list(),
    staleTime: 60_000,
  });
  const allTasks = tasksData?.tasks ?? [];
  const projectTeam = (teamsData?.teams ?? []).find((t) => t.id === currentProject?.teamId);
  const assignees =
    projectTeam?.teamMember
      ?.map((m) => m.user)
      .filter((u) => u.isActive && u.role?.name === "Developer")
      .map((u) => ({ id: u.id, fullName: u.fullName })) ?? [];
  const backlogTasks = allTasks.filter((t) => t.sprintId === null);
  const sprintTasks = planningSprint ? allTasks.filter((t) => t.sprintId === planningSprint.id) : [];
  const totalSP = sprintTasks.reduce((s, t) => s + (t.storyPoint ?? 0), 0);

  useEffect(() => {
    if (selectableSprints.length === 0) {
      setSelectedPlanningSprintId("");
      return;
    }

    const hasSelected = selectableSprints.some((s) => s.id === selectedPlanningSprintId);
    if (hasSelected) return;

    const preferredSprint = selectableSprints.find((s) => s.status === "active") ?? selectableSprints[0];
    setSelectedPlanningSprintId(preferredSprint.id);
  }, [selectableSprints, selectedPlanningSprintId]);

  // ── Mutations ─────────────────────────────────────────────────────────
  const { mutate: createSprint, isPending: isCreatingSprint } = useMutation({
    mutationFn: (vals: SprintFormValues) =>
      sprintService.create({
        projectId: effectiveProjectId,
        name: vals.name,
        goal: vals.goal || undefined,
        startDate: vals.startDate,
        endDate: vals.endDate,
        status: "planned",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
      setSprintDialogOpen(false);
      setSprintError(null);
    },
    onError: (e: Error) => setSprintError(e.message),
  });

  const { mutate: updateSprint, isPending: isUpdatingSprint } = useMutation({
    mutationFn: (vals: SprintFormValues) =>
      sprintService.update(editSprint!.id, {
        name: vals.name,
        goal: vals.goal || undefined,
        startDate: vals.startDate,
        endDate: vals.endDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
      setEditSprint(null);
      setEditSprintError(null);
    },
    onError: (e: Error) => setEditSprintError(e.message),
  });

  // Only allow starting if no active sprint exists for this project
  const { mutate: startSprint } = useMutation({
    mutationFn: (sprint: SprintDto) => sprintService.update(sprint.id, { status: "active" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sprints"] }),
  });

  const { mutate: closeSprint } = useMutation({
    mutationFn: (sprint: SprintDto) => sprintService.close(sprint.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
      queryClient.invalidateQueries({
        queryKey: ["tasks", effectiveProjectId],
      });
    },
  });

  const { mutate: deleteSprint, isPending: isDeletingSprint } = useMutation({
    mutationFn: (sprint: SprintDto) => sprintService.delete(sprint.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
      setDeleteSprintTarget(null);
    },
  });

  const { mutate: moveTask } = useMutation({
    mutationFn: ({ taskId, sprintId }: { taskId: string; sprintId: string | null }) =>
      taskService.update(taskId, { sprintId }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["tasks", effectiveProjectId],
      }),
  });

  const { mutate: createTask, isPending: isCreatingTask } = useMutation({
    mutationFn: (vals: CreateTaskFormValues) =>
      taskService.create({
        projectId: effectiveProjectId,
        sprintId: vals.sprintId || null,
        title: vals.title,
        priority: vals.priority,
        status: "todo",
        storyPoint: vals.storyPoint,
        assigneeId: vals.assigneeId || null,
        dueDate: vals.dueDate || undefined,
        reporterId: user!.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tasks", effectiveProjectId],
      });
      setTaskDialogOpen(false);
      setTaskError(null);
    },
    onError: (e: Error) => setTaskError(e.message),
  });

  // Dots menu for the active sprint panel in Planning tab
  const activeSprintMenuItems = activeSprint
    ? [
        {
          label: "Редагувати",
          icon: <EditIcon />,
          onClick: () => {
            setEditSprintError(null);
            setEditSprint(activeSprint);
          },
        },
        {
          label: "Закрити спринт",
          onClick: () => closeSprint(activeSprint),
        },
      ]
    : [];

  const projectKey = currentProject ? getProjectKey(currentProject.name) : "TASK";

  const isLoading = sprintsLoading || tasksLoading;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* ─── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[30px] font-bold leading-9 text-[#0f172b]">Планування спринтів</h1>
            <p className="mt-1 text-base leading-6 text-[#45556c]">Керуйте беклогом та плануйте спринти</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Project selector */}
            <div ref={projectDropRef} className="relative">
              <button
                type="button"
                onClick={() => setProjectDropOpen((v) => !v)}
                className="flex h-9 items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm text-[#0f172b]"
              >
                <span>{currentProject ? `${currentProject.name} (${projectKey})` : "Оберіть проєкт"}</span>
                <ChevronDownIcon className="text-[#717182]" />
              </button>
              {projectDropOpen ? (
                <div className="absolute right-0 top-10 z-10 min-w-50 overflow-hidden rounded-lg border border-[#e2e8f0] bg-white shadow-md">
                  {projects.length > 0 ? (
                    projects.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedProjectId(p.id);
                          setProjectDropOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-[#f8fafc] ${
                          p.id === effectiveProjectId ? "font-medium text-[#1447e6]" : "text-[#0a0a0a]"
                        }`}
                      >
                        {p.name}
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-2 text-sm text-[#717182]">Немає активних проєктів</p>
                  )}
                </div>
              ) : null}
            </div>

            {!isDeveloper ? (
              <Button
                type="button"
                className="gap-1"
                onClick={() => {
                  setSprintError(null);
                  setSprintDialogOpen(true);
                }}
                disabled={!effectiveProjectId}
              >
                <PlusIcon className="text-white" />
                Створити спринт
              </Button>
            ) : null}

            <Button
              type="button"
              className="gap-1"
              onClick={() => {
                setTaskError(null);
                setTaskDialogOpen(true);
              }}
              disabled={!effectiveProjectId}
            >
              <PlusIcon className="text-white" />
              Створити задачу
            </Button>
          </div>
        </div>

        {/* ─── Tabs ─────────────────────────────────────────────────────────── */}
        <div className="flex gap-1 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-1 w-fit">
          {(["planning", "all"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-md px-4 py-1.25 text-sm font-medium transition ${
                tab === t ? "bg-white text-[#0f172b] shadow-sm" : "text-[#45556c] hover:text-[#0f172b]"
              }`}
            >
              {t === "planning" ? "Планування" : "Всі спринти"}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc]" />
            ))}
          </div>
        ) : !effectiveProjectId ? (
          <div className="flex items-center justify-center rounded-[10px] border border-dashed border-[#e2e8f0] py-16">
            <p className="text-sm text-[#717182]">Оберіть проєкт для перегляду спринтів</p>
          </div>
        ) : tab === "planning" ? (
          // ─── Planning tab ──────────────────────────────────────────────
          <div className="grid grid-cols-2 gap-6 items-start">
            {/* Backlog */}
            <div className="rounded-[10px] border border-[#e2e8f0] bg-white">
              <div className="border-b border-[#e2e8f0] px-4 py-4">
                <h3 className="text-[18px] font-semibold leading-7 text-[#0f172b]">Беклог ({backlogTasks.length})</h3>
              </div>
              <div className="flex flex-col gap-2 p-4">
                {backlogTasks.length > 0 ? (
                  backlogTasks.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      projectKey={projectKey}
                      onClick={
                        planningSprint
                          ? (task) =>
                              moveTask({
                                taskId: task.id,
                                sprintId: planningSprint.id,
                              })
                          : undefined
                      }
                      actionTitle={planningSprint ? `Додати до ${planningSprint.name}` : "Оберіть спринт для додавання"}
                    />
                  ))
                ) : (
                  <p className="py-8 text-center text-sm text-[#717182]">Беклог порожній</p>
                )}
              </div>
            </div>

            {/* Selected sprint */}
            {planningSprint ? (
              <div className="rounded-[10px] border border-[#e2e8f0] bg-white">
                <div className="border-b border-[#e2e8f0] px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <select
                        value={selectedPlanningSprintId}
                        onChange={(e) => setSelectedPlanningSprintId(e.target.value)}
                        className="mb-2 h-9 min-w-64 rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm text-[#0f172b] outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30"
                      >
                        {selectableSprints.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.status === "active" ? "active" : "planned"})
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[18px] font-semibold leading-7 text-[#0f172b]">{planningSprint.name}</h3>
                        <Badge variant={planningSprint.status === "active" ? "active" : "planning"} />
                      </div>
                      {planningSprint.goal ? <p className="text-sm text-[#45556c]">{planningSprint.goal}</p> : null}
                      <p className="flex items-center gap-1.5 text-sm text-[#45556c]">
                        <CalendarIcon className="text-[#a0aec0]" />
                        {fmt(planningSprint.startDate)} – {fmt(planningSprint.endDate)}
                      </p>
                    </div>
                    {!isDeveloper && planningSprint.status === "active" ? (
                      <DropdownMenu
                        items={activeSprintMenuItems}
                        align="right"
                        trigger={
                          <button
                            type="button"
                            className="flex size-9 items-center justify-center rounded-lg text-[#62748e] hover:bg-[#f3f4f6]"
                            aria-label="Дії"
                          >
                            <DotsIcon />
                          </button>
                        }
                      />
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-col gap-2 p-4">
                  {sprintTasks.length > 0 ? (
                    sprintTasks.map((t) => (
                      <TaskCard
                        key={t.id}
                        task={t}
                        projectKey={projectKey}
                        onClick={(task) => moveTask({ taskId: task.id, sprintId: null })}
                        actionTitle="Повернути до беклогу"
                      />
                    ))
                  ) : (
                    <p className="py-8 text-center text-sm text-[#717182]">Немає задач у спринті</p>
                  )}
                </div>
                <div className="flex items-center justify-between border-t border-[#e2e8f0] px-4 py-3">
                  <span className="text-sm text-[#45556c]">Загальна складність:</span>
                  <span className="text-sm font-semibold text-[#0f172b]">{totalSP} SP</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-[10px] border border-dashed border-[#e2e8f0] py-16">
                <p className="text-sm font-medium text-[#45556c]">Немає доступного спринту</p>
                <p className="mt-1 text-xs text-[#717182]">Створіть або розпочніть спринт у вкладці «Всі спринти»</p>
              </div>
            )}
          </div>
        ) : (
          // ─── All sprints tab ────────────────────────────────────────────
          <div className="flex flex-col gap-4">
            {allSprints.length > 0 ? (
              allSprints.map((s) => (
                <SprintCard
                  key={s.id}
                  sprint={s}
                  hasActiveSprint={hasActiveSprint}
                  onStart={startSprint}
                  onEdit={(sprint) => {
                    setEditSprintError(null);
                    setEditSprint(sprint);
                  }}
                  onClose={closeSprint}
                  onDelete={(sprint) => setDeleteSprintTarget(sprint)}
                  showActions={!isDeveloper}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center rounded-[10px] border border-dashed border-[#e2e8f0] py-16">
                <p className="text-sm font-medium text-[#45556c]">Спринтів немає</p>
                <p className="mt-1 text-xs text-[#717182]">Створіть перший спринт для цього проєкту</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create sprint */}
      <SprintFormDialog
        open={sprintDialogOpen}
        onClose={() => setSprintDialogOpen(false)}
        onSubmit={createSprint}
        isPending={isCreatingSprint}
        apiError={sprintError}
      />

      {/* Edit sprint */}
      <SprintFormDialog
        open={Boolean(editSprint)}
        onClose={() => setEditSprint(null)}
        sprint={editSprint ?? undefined}
        onSubmit={updateSprint}
        isPending={isUpdatingSprint}
        apiError={editSprintError}
      />

      {/* Create task */}
      <CreateTaskDialog
        open={taskDialogOpen}
        onClose={() => setTaskDialogOpen(false)}
        onSubmit={createTask}
        isPending={isCreatingTask}
        apiError={taskError}
        assignees={assignees}
        sprints={selectableSprints.map((s) => ({
          id: s.id,
          name: s.name,
          status: s.status,
        }))}
      />

      <ConfirmDialog
        open={Boolean(deleteSprintTarget)}
        onClose={() => setDeleteSprintTarget(null)}
        onCancel={() => setDeleteSprintTarget(null)}
        onConfirm={() => {
          if (deleteSprintTarget) deleteSprint(deleteSprintTarget);
        }}
        isPending={isDeletingSprint}
        title="Видалити спринт?"
        description="Цю дію не можна скасувати."
      >
        <p className="text-sm text-[#45556c]">
          Спринт <span className="font-medium text-[#0f172b]">{deleteSprintTarget?.name}</span> буде видалено назавжди.
        </p>
      </ConfirmDialog>
    </DashboardLayout>
  );
}
