import { prisma } from "../../lib/prisma";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ReportData {
  sprint: SprintInfo;
  velocity: VelocityBlock;
  burndown: BurndownBlock;
  members: MemberStat[];
  quality: QualityBlock;
  project: ProjectBlock;
  release: ReleaseInfo | null;
}

export interface SprintInfo {
  id: number;
  name: string;
  goal: string | null;
  startDate: string;
  endDate: string;
  status: string;
  projectId: number;
  projectName: string;
}

export interface VelocityBlock {
  plannedSp: number;
  completedSp: number;
  completionPct: number;
  totalTasks: number;
  doneTasks: number;
  history: { sprintName: string; plannedSp: number; completedSp: number }[];
}

export interface BurndownPoint {
  date: string;
  remaining: number;
  ideal: number;
}

export interface BurndownBlock {
  totalTasks: number;
  points: BurndownPoint[];
}

export interface MemberStat {
  userId: number;
  fullName: string;
  totalTasks: number;
  doneTasks: number;
  highPriorityTasks: number;
  storyPoints: number;
  avgDurationDays: number | null;
}

export interface QualityBlock {
  blockedTasks: number;
  blockedAvgDays: number | null;
  unassignedTasks: number;
  regressions: number;
  overdueTasks: number;
}

export interface ProjectBlock {
  id: number;
  name: string;
  totalTasks: number;
  doneTasks: number;
  completionPct: number;
  byStatus: { status: string; count: number }[];
  byPriority: { priority: string; count: number }[];
}

export interface ReleaseInfo {
  id: number;
  version: string;
  name: string;
  releaseDate: string;
  notes: string | null;
}

// ── Main function ──────────────────────────────────────────────────────────────

export async function fetchReportData(
  sprintId: bigint,
  projectIds: bigint[] | null,
): Promise<ReportData | null> {
  const n = Number;

  // ── Sprint + project info ────────────────────────────────────────────────

  type SprintRow = {
    sprint_id: bigint;
    sprint_name: string;
    sprint_goal: string | null;
    start_date: Date;
    end_date: Date;
    sprint_status: string;
    project_id: bigint;
    project_name: string;
  };

  const [sprintRow] = await prisma.$queryRaw<SprintRow[]>`
    SELECT
      s.id          AS sprint_id,
      s.name        AS sprint_name,
      s.goal        AS sprint_goal,
      s.start_date,
      s.end_date,
      s.status      AS sprint_status,
      p.id          AS project_id,
      p.name        AS project_name
    FROM sprints s
    JOIN projects p ON p.id = s.project_id
    WHERE s.id = ${sprintId}
  `;

  if (!sprintRow) return null;
  if (
    projectIds !== null &&
    !projectIds.some((id) => id === sprintRow.project_id)
  ) {
    return null;
  }

  // ── Velocity block ───────────────────────────────────────────────────────

  type VelocityRow = {
    sprint_id: bigint;
    sprint_name: string;
    planned_sp: bigint;
    completed_sp: bigint;
    total_tasks: bigint;
    done_tasks: bigint;
  };

  const velocityRows = await prisma.$queryRaw<VelocityRow[]>`
    SELECT
      sprint_id,
      sprint_name,
      planned_story_points   AS planned_sp,
      completed_story_points AS completed_sp,
      total_tasks,
      completed_tasks        AS done_tasks
    FROM vw_sprint_velocity
    WHERE project_id = ${sprintRow.project_id}
      AND status IN ('active', 'closed')
    ORDER BY end_date
    LIMIT 6
  `;

  const currentVel =
    velocityRows.find((r) => r.sprint_id === sprintId) ??
    velocityRows[velocityRows.length - 1];

  const plannedSp = n(currentVel?.planned_sp ?? 0);
  const completedSp = n(currentVel?.completed_sp ?? 0);

  // ── Burndown ─────────────────────────────────────────────────────────────

  type TaskDoneRow = { task_id: bigint; done_at: Date | null };

  const taskDoneRows = await prisma.$queryRaw<TaskDoneRow[]>`
    SELECT
      t.id AS task_id,
      MIN(th.changed_at) FILTER (WHERE th.new_status = 'done') AS done_at
    FROM tasks t
    LEFT JOIN task_history th ON th.task_id = t.id
    WHERE t.sprint_id = ${sprintId}
    GROUP BY t.id
  `;

  const totalTasks = taskDoneRows.length;
  const sprintStart = sprintRow.start_date;
  const sprintEnd = sprintRow.end_date;
  const sprintDays =
    Math.ceil((sprintEnd.getTime() - sprintStart.getTime()) / 86_400_000) + 1;

  const burndownPoints: BurndownPoint[] = [];
  for (let i = 0; i < sprintDays; i++) {
    const day = new Date(sprintStart);
    day.setDate(day.getDate() + i);
    const dayStr = day.toISOString().slice(0, 10);
    const doneByDay = taskDoneRows.filter(
      (r) => r.done_at !== null && r.done_at <= day,
    ).length;
    burndownPoints.push({
      date: dayStr,
      remaining: totalTasks - doneByDay,
      ideal: Math.round(totalTasks * (1 - i / Math.max(sprintDays - 1, 1))),
    });
  }

  // ── Member stats ─────────────────────────────────────────────────────────

  type MemberRow = {
    user_id: bigint;
    full_name: string;
    total_tasks: bigint;
    done_tasks: bigint;
    high_priority_tasks: bigint;
    story_points: bigint;
  };

  const memberRows = await prisma.$queryRaw<MemberRow[]>`
    SELECT
      u.id                                                                          AS user_id,
      u.full_name,
      COUNT(t.id)                                                                   AS total_tasks,
      COUNT(t.id) FILTER (WHERE t.status = 'done')                                 AS done_tasks,
      COUNT(t.id) FILTER (WHERE t.priority IN ('critical', 'high'))               AS high_priority_tasks,
      COALESCE(SUM(t.story_point), 0)                                              AS story_points
    FROM tasks t
    JOIN users u ON u.id = t.assignee_id
    WHERE t.sprint_id = ${sprintId}
    GROUP BY u.id, u.full_name
    ORDER BY done_tasks DESC
  `;

  // Avg duration per member (in_progress → done from task_history)
  type DurationRow = { user_id: bigint; avg_days: string | null };
  const durationRows = await prisma.$queryRaw<DurationRow[]>`
    SELECT
      sub.assignee_id AS user_id,
      ROUND(AVG(
        EXTRACT(EPOCH FROM (done_time - start_time)) / 86400
      )::numeric, 1)::text AS avg_days
    FROM (
      SELECT
        t.id,
        t.assignee_id,
        MIN(th.changed_at) FILTER (WHERE th.new_status = 'in_progress') AS start_time,
        MAX(th.changed_at) FILTER (WHERE th.new_status = 'done')        AS done_time
      FROM tasks t
      LEFT JOIN task_history th ON th.task_id = t.id
      WHERE t.sprint_id = ${sprintId} AND t.status = 'done'
      GROUP BY t.id, t.assignee_id
      HAVING
        MIN(th.changed_at) FILTER (WHERE th.new_status = 'in_progress') IS NOT NULL
        AND MAX(th.changed_at) FILTER (WHERE th.new_status = 'done')   IS NOT NULL
    ) sub
    GROUP BY sub.assignee_id
  `;

  const durationMap = new Map(durationRows.map((r) => [r.user_id, r.avg_days]));

  const members: MemberStat[] = memberRows.map((r) => ({
    userId: n(r.user_id),
    fullName: r.full_name,
    totalTasks: n(r.total_tasks),
    doneTasks: n(r.done_tasks),
    highPriorityTasks: n(r.high_priority_tasks),
    storyPoints: n(r.story_points),
    avgDurationDays: durationMap.has(r.user_id)
      ? parseFloat(durationMap.get(r.user_id)!)
      : null,
  }));

  // ── Quality block ─────────────────────────────────────────────────────────

  type QualityRow = {
    blocked_tasks: bigint;
    blocked_avg_days: string | null;
    unassigned_tasks: bigint;
    regressions: bigint;
    overdue_tasks: bigint;
  };

  const [qualityRow] = await prisma.$queryRaw<QualityRow[]>`
    SELECT
      COUNT(t.id) FILTER (WHERE t.status = 'blocked')                              AS blocked_tasks,
      (
        SELECT ROUND(AVG(task_blocked.days_blocked)::numeric, 1)::text
        FROM (
          SELECT
            EXTRACT(EPOCH FROM (
              COALESCE(
                MIN(th2.changed_at) FILTER (WHERE th2.old_status = 'blocked'),
                NOW()
              ) - MIN(th1.changed_at) FILTER (WHERE th1.new_status = 'blocked')
            )) / 86400 AS days_blocked
          FROM tasks t2
          LEFT JOIN task_history th1 ON th1.task_id = t2.id
          LEFT JOIN task_history th2 ON th2.task_id = t2.id
          WHERE t2.sprint_id = ${sprintId}
          GROUP BY t2.id
          HAVING MIN(th1.changed_at) FILTER (WHERE th1.new_status = 'blocked') IS NOT NULL
        ) task_blocked
      )                                                                             AS blocked_avg_days,
      COUNT(t.id) FILTER (WHERE t.assignee_id IS NULL)                             AS unassigned_tasks,
      (
        SELECT COUNT(*)
        FROM task_history th
        JOIN tasks t3 ON t3.id = th.task_id
        WHERE t3.sprint_id = ${sprintId}
          AND th.old_status = 'in_review'
          AND th.new_status = 'in_progress'
      )                                                                             AS regressions,
      COUNT(t.id) FILTER (WHERE t.due_date < NOW() AND t.status <> 'done')        AS overdue_tasks
    FROM tasks t
    WHERE t.sprint_id = ${sprintId}
  `;

  // ── Project block ─────────────────────────────────────────────────────────

  type ProjectStatusRow = { status: string; cnt: bigint };
  type ProjectPriorityRow = { priority: string; cnt: bigint };

  const [projectStatusRows, projectPriorityRows] = await Promise.all([
    prisma.$queryRaw<ProjectStatusRow[]>`
      SELECT status, COUNT(*) AS cnt
      FROM tasks
      WHERE project_id = ${sprintRow.project_id}
      GROUP BY status
    `,
    prisma.$queryRaw<ProjectPriorityRow[]>`
      SELECT priority, COUNT(*) AS cnt
      FROM tasks
      WHERE project_id = ${sprintRow.project_id}
      GROUP BY priority
    `,
  ]);

  const projectTotal = projectStatusRows.reduce((s, r) => s + n(r.cnt), 0);
  const projectDone = n(
    projectStatusRows.find((r) => r.status === "done")?.cnt ?? 0,
  );

  // ── Release block ─────────────────────────────────────────────────────────

  type ReleaseRow = {
    id: bigint;
    version: string;
    name: string;
    release_date: Date;
    notes: string | null;
  };

  const [releaseRow] = await prisma.$queryRaw<ReleaseRow[]>`
    SELECT id, version, name, release_date, notes
    FROM releases
    WHERE sprint_id = ${sprintId}
    LIMIT 1
  `;

  // ── Assemble ──────────────────────────────────────────────────────────────

  return {
    sprint: {
      id: n(sprintRow.sprint_id),
      name: sprintRow.sprint_name,
      goal: sprintRow.sprint_goal,
      startDate: sprintRow.start_date.toISOString().slice(0, 10),
      endDate: sprintRow.end_date.toISOString().slice(0, 10),
      status: sprintRow.sprint_status,
      projectId: n(sprintRow.project_id),
      projectName: sprintRow.project_name,
    },
    velocity: {
      plannedSp,
      completedSp,
      completionPct:
        plannedSp === 0 ? 0 : Math.round((completedSp / plannedSp) * 100),
      totalTasks: n(currentVel?.total_tasks ?? 0),
      doneTasks: n(currentVel?.done_tasks ?? 0),
      history: velocityRows.map((r) => ({
        sprintName: r.sprint_name,
        plannedSp: n(r.planned_sp),
        completedSp: n(r.completed_sp),
      })),
    },
    burndown: {
      totalTasks,
      points: burndownPoints,
    },
    members,
    quality: {
      blockedTasks: n(qualityRow?.blocked_tasks ?? 0),
      blockedAvgDays: qualityRow?.blocked_avg_days
        ? parseFloat(qualityRow.blocked_avg_days)
        : null,
      unassignedTasks: n(qualityRow?.unassigned_tasks ?? 0),
      regressions: n(qualityRow?.regressions ?? 0),
      overdueTasks: n(qualityRow?.overdue_tasks ?? 0),
    },
    project: {
      id: n(sprintRow.project_id),
      name: sprintRow.project_name,
      totalTasks: projectTotal,
      doneTasks: projectDone,
      completionPct:
        projectTotal === 0 ? 0 : Math.round((projectDone / projectTotal) * 100),
      byStatus: projectStatusRows.map((r) => ({
        status: r.status,
        count: n(r.cnt),
      })),
      byPriority: projectPriorityRows.map((r) => ({
        priority: r.priority,
        count: n(r.cnt),
      })),
    },
    release: releaseRow
      ? {
          id: n(releaseRow.id),
          version: releaseRow.version,
          name: releaseRow.name,
          releaseDate: releaseRow.release_date.toISOString().slice(0, 10),
          notes: releaseRow.notes,
        }
      : null,
  };
}
