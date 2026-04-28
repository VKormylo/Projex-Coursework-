import { URLs } from "~/constants/request";
import { baseService } from "./base-service";

// ── Sprint stats types ─────────────────────────────────────────────────────────

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

// ── Report data types ──────────────────────────────────────────────────────────

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

export interface BurndownBlock {
  totalTasks: number;
  points: { date: string; remaining: number; ideal: number }[];
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

// ── Service ────────────────────────────────────────────────────────────────────

interface SprintStatsResponse {
  stats: SprintStats | null;
}

interface ReportDataResponse {
  report: ReportData | null;
}

export const analyticsService = {
  sprintStats: (sprintId?: string) =>
    baseService.request<SprintStatsResponse>({
      method: "GET",
      url: sprintId
        ? `${URLs.analytics.sprintStats}?sprintId=${sprintId}`
        : URLs.analytics.sprintStats,
    }),

  reportData: (sprintId?: string) =>
    baseService.request<ReportDataResponse>({
      method: "GET",
      url: sprintId
        ? `${URLs.analytics.reportData}?sprintId=${sprintId}`
        : URLs.analytics.reportData,
    }),
};
