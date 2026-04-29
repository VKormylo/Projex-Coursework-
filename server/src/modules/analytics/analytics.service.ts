import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma";

export async function fetchProjectTaskSummary(projectIds: bigint[] | null) {
  if (projectIds !== null && projectIds.length === 0) return [];
  if (projectIds === null) {
    return prisma.$queryRaw<Record<string, unknown>[]>`SELECT * FROM vw_project_task_summary`;
  }

  return prisma.$queryRaw<
    Record<string, unknown>[]
  >`SELECT * FROM vw_project_task_summary WHERE project_id IN (${Prisma.join(projectIds)})`;
}

export async function fetchSprintVelocity(projectIds: bigint[] | null) {
  if (projectIds !== null && projectIds.length === 0) return [];
  if (projectIds === null) {
    return prisma.$queryRaw<Record<string, unknown>[]>`SELECT * FROM vw_sprint_velocity`;
  }

  return prisma.$queryRaw<
    Record<string, unknown>[]
  >`SELECT * FROM vw_sprint_velocity WHERE project_id IN (${Prisma.join(projectIds)})`;
}

export interface SprintStats {
  sprintId: number;
  sprintName: string;
  projectId: number;
  startDate: string;
  endDate: string;
  status: string;
  plannedSp: number;
  completedSp: number;
  completionPercentage: number;
  totalTasks: number;
  doneTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  inReviewTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  activeMembers: number;
  velocityHistory: VelocityPoint[];
  workload: WorkloadEntry[];
  avgTaskDurationDays: number | null;
  daysToEnd: number;
}

export interface VelocityPoint {
  sprintId: number;
  sprintName: string;
  plannedSp: number;
  completedSp: number;
}

export interface WorkloadEntry {
  userId: number;
  fullName: string;
  taskCount: number;
  storyPoints: number;
}

export async function fetchSprintStats(sprintId: bigint, projectIds: bigint[] | null): Promise<SprintStats | null> {
  type SprintRow = {
    sprint_id: bigint;
    sprint_name: string;
    project_id: bigint;
    start_date: Date;
    end_date: Date;
    status: string;
    planned_sp: bigint;
    completed_sp: bigint;
    total_tasks: bigint;
    done_tasks: bigint;
    todo_tasks: bigint;
    in_progress_tasks: bigint;
    in_review_tasks: bigint;
    blocked_tasks: bigint;
    overdue_tasks: bigint;
    active_members: bigint;
  };

  const [sprintRow] = await prisma.$queryRaw<SprintRow[]>`
    SELECT
      s.id                                                                          AS sprint_id,
      s.name                                                                        AS sprint_name,
      s.project_id,
      s.start_date,
      s.end_date,
      s.status,
      COALESCE(SUM(t.story_point), 0)                                              AS planned_sp,
      COALESCE(SUM(t.story_point) FILTER (WHERE t.status = 'done'), 0)            AS completed_sp,
      COUNT(t.id)                                                                   AS total_tasks,
      COUNT(t.id) FILTER (WHERE t.status = 'done')                                 AS done_tasks,
      COUNT(t.id) FILTER (WHERE t.status = 'todo')                                 AS todo_tasks,
      COUNT(t.id) FILTER (WHERE t.status = 'in_progress')                          AS in_progress_tasks,
      COUNT(t.id) FILTER (WHERE t.status = 'in_review')                            AS in_review_tasks,
      COUNT(t.id) FILTER (WHERE t.status = 'blocked')                              AS blocked_tasks,
      COUNT(t.id) FILTER (WHERE t.due_date < NOW() AND t.status <> 'done')        AS overdue_tasks,
      COUNT(DISTINCT t.assignee_id)                                                 AS active_members
    FROM sprints s
    LEFT JOIN tasks t ON t.sprint_id = s.id
    WHERE s.id = ${sprintId}
    GROUP BY s.id
  `;

  if (!sprintRow) return null;

  // Verify the sprint belongs to an accessible project
  if (projectIds !== null && !projectIds.some((id) => id === sprintRow.project_id)) {
    return null;
  }

  // Velocity history: last 5 sprints in same project ordered by end_date
  type VelocityRow = {
    sprint_id: bigint;
    sprint_name: string;
    planned_sp: bigint;
    completed_sp: bigint;
  };
  const velocityRows = await prisma.$queryRaw<VelocityRow[]>`
    SELECT
      sprint_id,
      sprint_name,
      planned_story_points  AS planned_sp,
      completed_story_points AS completed_sp
    FROM vw_sprint_velocity
    WHERE project_id = ${sprintRow.project_id}
      AND status IN ('active', 'closed')
    ORDER BY end_date
    LIMIT 5
  `;

  // Workload by member
  type WorkloadRow = {
    user_id: bigint;
    full_name: string;
    task_count: bigint;
    story_points: bigint;
  };
  const workloadRows = await prisma.$queryRaw<WorkloadRow[]>`
    SELECT
      u.id          AS user_id,
      u.full_name,
      COUNT(t.id)   AS task_count,
      COALESCE(SUM(t.story_point), 0) AS story_points
    FROM tasks t
    JOIN users u ON u.id = t.assignee_id
    WHERE t.sprint_id = ${sprintId}
    GROUP BY u.id, u.full_name
    ORDER BY story_points DESC
  `;

  // Avg task duration: time from first 'in_progress' to last 'done' in task_history
  type DurationRow = { avg_days: string | null };
  const [durationRow] = await prisma.$queryRaw<DurationRow[]>`
    SELECT
      ROUND(AVG(
        EXTRACT(EPOCH FROM (done_time - start_time)) / 86400
      )::numeric, 1)::text AS avg_days
    FROM (
      SELECT
        t.id,
        MIN(th.changed_at) FILTER (WHERE th.new_status = 'in_progress') AS start_time,
        MAX(th.changed_at) FILTER (WHERE th.new_status = 'done')        AS done_time
      FROM tasks t
      LEFT JOIN task_history th ON th.task_id = t.id
      WHERE t.sprint_id = ${sprintId} AND t.status = 'done'
      GROUP BY t.id
      HAVING
        MIN(th.changed_at) FILTER (WHERE th.new_status = 'in_progress') IS NOT NULL
        AND MAX(th.changed_at) FILTER (WHERE th.new_status = 'done')   IS NOT NULL
    ) sub
  `;

  const n = Number;
  const plannedSp = n(sprintRow.planned_sp);
  const completedSp = n(sprintRow.completed_sp);
  const daysToEnd = Math.max(0, Math.ceil((new Date(sprintRow.end_date).getTime() - Date.now()) / 86_400_000));

  return {
    sprintId: n(sprintRow.sprint_id),
    sprintName: sprintRow.sprint_name,
    projectId: n(sprintRow.project_id),
    startDate: sprintRow.start_date.toISOString().slice(0, 10),
    endDate: sprintRow.end_date.toISOString().slice(0, 10),
    status: sprintRow.status,
    plannedSp,
    completedSp,
    completionPercentage: plannedSp === 0 ? 0 : Math.round((completedSp / plannedSp) * 100),
    totalTasks: n(sprintRow.total_tasks),
    doneTasks: n(sprintRow.done_tasks),
    todoTasks: n(sprintRow.todo_tasks),
    inProgressTasks: n(sprintRow.in_progress_tasks),
    inReviewTasks: n(sprintRow.in_review_tasks),
    blockedTasks: n(sprintRow.blocked_tasks),
    overdueTasks: n(sprintRow.overdue_tasks),
    activeMembers: n(sprintRow.active_members),
    velocityHistory: velocityRows.map((r) => ({
      sprintId: n(r.sprint_id),
      sprintName: r.sprint_name,
      plannedSp: n(r.planned_sp),
      completedSp: n(r.completed_sp),
    })),
    workload: workloadRows.map((r) => ({
      userId: n(r.user_id),
      fullName: r.full_name,
      taskCount: n(r.task_count),
      storyPoints: n(r.story_points),
    })),
    avgTaskDurationDays: durationRow.avg_days ? parseFloat(durationRow.avg_days) : null,
    daysToEnd,
  };
}

export async function findDefaultSprintId(projectIds: bigint[] | null): Promise<bigint | null> {
  type Row = { id: bigint };

  if (projectIds !== null && projectIds.length === 0) return null;

  if (projectIds === null) {
    const [row] = await prisma.$queryRaw<Row[]>`
      SELECT id FROM sprints WHERE status = 'active' ORDER BY end_date LIMIT 1
    `;
    return row?.id ?? null;
  }

  const [row] = await prisma.$queryRaw<Row[]>`
    SELECT id FROM sprints
    WHERE status = 'active'
      AND project_id IN (${Prisma.join(projectIds)})
    ORDER BY end_date
    LIMIT 1
  `;
  return row?.id ?? null;
}
