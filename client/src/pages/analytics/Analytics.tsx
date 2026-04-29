import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { pdf } from "@react-pdf/renderer";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

import DashboardLayout from "~/components/dashboard-layout/DashboardLayout";
import { analyticsService, type SprintStats } from "~/services/analytics-service";
import { projectService } from "~/services/project-service";
import { sprintService } from "~/services/sprint-service";
import { ChevronDownIcon } from "~/components/svg/Svg";
import { useClickOutside } from "~/hooks/useClickOutside";
import { AnalyticsReportPDF } from "./AnalyticsReport";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  todo: "#64748b",
  in_progress: "#3b82f6",
  in_review: "#f59e0b",
  done: "#10b981",
  blocked: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
  blocked: "Blocked",
};

// ── KPI card ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function KpiCard({ title, icon, children }: KpiCardProps) {
  return (
    <div className="flex flex-1 flex-col gap-6 rounded-[14px] border border-black/10 bg-white p-6">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#45556c]">{title}</span>
        <span className="text-[#45556c]">{icon}</span>
      </div>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

// ── Chart card ────────────────────────────────────────────────────────────────

function ChartCard({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col rounded-[14px] border border-black/10 bg-white ${className}`}>
      <div className="border-b border-transparent px-6 pt-6 pb-4">
        <p className="text-base font-medium text-[#0a0a0a]">{title}</p>
        <p className="mt-0.5 text-sm text-[#717182]">{description}</p>
      </div>
      <div className="flex-1 p-6 pt-4">{children}</div>
    </div>
  );
}

// ── Velocity line chart ────────────────────────────────────────────────────────

function VelocityChart({ stats }: { stats: SprintStats }) {
  const data = stats.velocityHistory.map((v) => ({
    name: v.sprintName,
    Заплановано: v.plannedSp,
    Виконано: v.completedSp,
  }));

  if (data.length === 0) {
    return <div className="flex h-[260px] items-center justify-center text-sm text-[#64748b]">Дані відсутні</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            fontSize: 13,
          }}
          labelStyle={{ color: "#0f172b", fontWeight: 600 }}
        />
        <Legend
          wrapperStyle={{ fontSize: 14, paddingTop: 8 }}
          formatter={(value) => <span style={{ color: value === "Заплановано" ? "#3b82f6" : "#10b981" }}>{value}</span>}
        />
        <Line
          type="monotone"
          dataKey="Заплановано"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 4, fill: "#3b82f6" }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="Виконано"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 4, fill: "#10b981" }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Pie chart (task distribution) ─────────────────────────────────────────────

function TaskDistChart({ stats }: { stats: SprintStats }) {
  const data = [
    { name: STATUS_LABELS.todo, value: stats.todoTasks, key: "todo" },
    {
      name: STATUS_LABELS.in_progress,
      value: stats.inProgressTasks,
      key: "in_progress",
    },
    {
      name: STATUS_LABELS.in_review,
      value: stats.inReviewTasks,
      key: "in_review",
    },
    { name: STATUS_LABELS.done, value: stats.doneTasks, key: "done" },
    { name: STATUS_LABELS.blocked, value: stats.blockedTasks, key: "blocked" },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-[#64748b]">Немає задач у спринті</div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="46%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name}: ${Math.round(percent * 100)}%`}
          labelLine={false}
        >
          {data.map((entry) => (
            <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [value, name]}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            fontSize: 13,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── Bar chart (workload) ───────────────────────────────────────────────────────

function WorkloadChart({ stats }: { stats: SprintStats }) {
  const data = stats.workload.map((w) => ({
    name: w.fullName
      .split(" ")
      .map((p) => p[0] + ".")
      .join(""),
    fullName: w.fullName,
    "Story Points": w.storyPoints,
    Задачі: w.taskCount,
  }));

  if (data.length === 0) {
    return <div className="flex h-[260px] items-center justify-center text-sm text-[#64748b]">Дані відсутні</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            fontSize: 13,
          }}
          labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ""}
        />
        <Legend wrapperStyle={{ fontSize: 14, paddingTop: 8 }} />
        <Bar dataKey="Story Points" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Key metrics ───────────────────────────────────────────────────────────────

interface MetricRowProps {
  label: string;
  sublabel: string;
  value: string | number;
  unit: string;
  valueColor?: string;
  last?: boolean;
}

function MetricRow({ label, sublabel, value, unit, valueColor = "#0f172b", last }: MetricRowProps) {
  return (
    <div className={`flex items-center justify-between py-5 ${last ? "" : "border-b border-[#e2e8f0]"}`}>
      <div>
        <p className="text-base font-medium text-[#0f172b]">{label}</p>
        <p className="mt-0.5 text-sm text-[#45556c]">{sublabel}</p>
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold" style={{ color: valueColor }}>
          {value}
        </p>
        <p className="text-sm text-[#45556c]">{unit}</p>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mb-4 text-[#e2e8f0]">
        <rect x="4" y="4" width="40" height="40" rx="8" stroke="currentColor" strokeWidth="2.5" />
        <path d="M14 34V22M22 34V14M30 34V26M38 34V18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <p className="text-base font-medium text-[#0f172b]">Немає даних для відображення</p>
      <p className="mt-1 text-sm text-[#62748e]">Створіть активний спринт із задачами</p>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function Analytics() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const [selectedSprintId, setSelectedSprintId] = useState<string | undefined>();
  const [projectOpen, setProjectOpen] = useState(false);
  const [sprintOpen, setSprintOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const closeProject = useCallback(() => setProjectOpen(false), []);
  const closeSprint = useCallback(() => setSprintOpen(false), []);
  const projectRef = useClickOutside<HTMLDivElement>(closeProject, projectOpen);
  const sprintRef = useClickOutside<HTMLDivElement>(closeSprint, sprintOpen);

  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectService.list(),
  });

  const { data: sprintsData } = useQuery({
    queryKey: ["sprints"],
    queryFn: () => sprintService.list(),
  });

  const { data: statsData, isLoading } = useQuery({
    queryKey: ["analytics-sprint-stats", selectedSprintId],
    queryFn: () => analyticsService.sprintStats(selectedSprintId),
  });

  const projects = (projectsData?.projects ?? []).filter((p) => p.status !== "archived");
  const sprints = sprintsData?.sprints ?? [];
  const projectSprints = sprints.filter((s) => !selectedProjectId || s.projectId === selectedProjectId);
  const stats: SprintStats | null = statsData?.stats ?? null;

  // Auto-select the first project once the list loads, and clear the
  // selection if the currently selected project is removed (e.g. archived).
  useEffect(() => {
    if (projects.length === 0) {
      if (selectedProjectId !== undefined) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedProjectId(undefined);
      }
      return;
    }

    const exists = projects.some((p) => p.id === selectedProjectId);
    if (!exists) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Whenever the project changes, pick a sprint automatically.
  // Priority: active sprint first, then the first in the list.
  useEffect(() => {
    if (!selectedProjectId) {
      if (selectedSprintId !== undefined) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedSprintId(undefined);
      }
      return;
    }

    if (projectSprints.length === 0) {
      if (selectedSprintId !== undefined) {
        setSelectedSprintId(undefined);
      }
      return;
    }

    const exists = projectSprints.some((s) => s.id === selectedSprintId);
    if (!exists) {
      const activeSprint = projectSprints.find((s) => s.status === "active");
      setSelectedSprintId(activeSprint?.id ?? projectSprints[0].id);
    }
  }, [selectedProjectId, projectSprints, selectedSprintId]);

  const handleProjectSelect = (id: string) => {
    setSelectedProjectId(id);
    setProjectOpen(false);
  };
  const handleSprintSelect = (id: string) => {
    setSelectedSprintId(id);
    setSprintOpen(false);
  };

  const projectLabel = projects.find((p) => p.id === selectedProjectId)?.name ?? "Оберіть проєкт";
  const sprintLabel =
    projectSprints.find((s) => s.id === selectedSprintId)?.name ??
    (projectSprints.length === 0 ? "Немає спринтів" : "Оберіть спринт");

  async function handleExportPdf() {
    try {
      setIsExporting(true);
      setExportError(null);

      const { report } = await analyticsService.reportData(selectedSprintId);
      if (!report) {
        setExportError("Немає даних для формування PDF звіту.");
        return;
      }

      // @react-pdf/renderer runs entirely in-browser (web worker).
      // We get a Blob, turn it into a temporary blob: URL, attach a hidden
      // <a> and click it — the only reliable cross-browser way to trigger a
      // named file download without a server round-trip.
      // revokeObjectURL frees the blob from memory once the download starts.
      const blob = await pdf(<AnalyticsReportPDF data={report} />).toBlob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fileDate = new Date().toISOString().slice(0, 10);
      link.href = blobUrl;
      link.download = `analytics-report-${report.sprint.name}-${fileDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Не вдалося згенерувати PDF звіт.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[30px] font-bold leading-9 text-[#0f172b]">Аналітика</h1>
          <p className="mt-1 text-base text-[#45556c]">Огляд метрик та ефективності команди</p>
        </div>
        <div className="flex items-center gap-3">
          <div ref={projectRef} className="relative">
            <button
              type="button"
              onClick={() => setProjectOpen((v) => !v)}
              className="flex h-10 min-w-56 items-center justify-between gap-2 rounded-lg border border-[#e2e8f0] bg-white px-4 text-sm text-[#0f172b] hover:border-[#cbd5e1]"
            >
              <span className="truncate">{projectLabel}</span>
              <ChevronDownIcon className="shrink-0 text-[#62748e]" />
            </button>
            {projectOpen ? (
              <div className="absolute left-0 top-full z-30 mt-1 w-full max-h-64 overflow-y-auto rounded-xl border border-[#e2e8f0] bg-white py-1 shadow-lg">
                {projects.length === 0 ? (
                  <p className="px-4 py-2 text-sm text-[#62748e]">Немає проєктів</p>
                ) : (
                  projects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleProjectSelect(p.id)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-[#f8fafc] ${
                        p.id === selectedProjectId ? "font-medium text-[#3b82f6]" : "text-[#0f172b]"
                      }`}
                    >
                      {p.name}
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>

          <div ref={sprintRef} className="relative">
            <button
              type="button"
              onClick={() => {
                if (!selectedProjectId || projectSprints.length === 0) return;
                setSprintOpen((v) => !v);
              }}
              className="flex h-10 min-w-56 items-center justify-between gap-2 rounded-lg border border-[#e2e8f0] bg-white px-4 text-sm text-[#0f172b] hover:border-[#cbd5e1] disabled:bg-[#f8fafc] disabled:text-[#94a3b8]"
              disabled={!selectedProjectId || projectSprints.length === 0}
            >
              <span className="truncate">{sprintLabel}</span>
              <ChevronDownIcon className="shrink-0 text-[#62748e]" />
            </button>
            {sprintOpen ? (
              <div className="absolute left-0 top-full z-30 mt-1 w-full max-h-64 overflow-y-auto rounded-xl border border-[#e2e8f0] bg-white py-1 shadow-lg">
                {projectSprints.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSprintSelect(s.id)}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-[#f8fafc] ${
                      s.id === selectedSprintId ? "font-medium text-[#3b82f6]" : "text-[#0f172b]"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExporting || !selectedSprintId}
            className="flex h-9 items-center cursor-pointer gap-2 rounded-lg bg-[#3b82f6] px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            title={!selectedSprintId ? "Оберіть спринт" : undefined}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 2v8M4 7l4 4 4-4M2 12h12"
                stroke="white"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {isExporting ? "Експорт..." : "Експорт PDF"}
          </button>
        </div>
      </div>
      {exportError ? <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{exportError}</p> : null}

      {isLoading ? (
        <div className="py-24 text-center text-sm text-[#62748e]">Завантаження…</div>
      ) : !stats ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-6">
          {/* KPI cards */}
          <div className="flex gap-6">
            {/* Velocity */}
            <KpiCard
              title="Velocity"
              icon={
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M2 12 6 8l3 3 5-7"
                    stroke="#3b82f6"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              }
            >
              <p className="text-[30px] font-bold text-[#0f172b]">{stats.completedSp} SP</p>
              {(() => {
                // Locate the current sprint in the shared history array (which
                // spans all sprints) so we can grab the entry directly before
                // it. currIdx === 0 means it's the first sprint ever — no
                // previous to compare against, so delta stays null.
                // delta is also null when prev === 0 to avoid dividing by zero.
                const hist = stats.velocityHistory;
                const currIdx = hist.findIndex((v) => v.sprintId === stats.sprintId);
                const prevEntry = currIdx > 0 ? hist[currIdx - 1] : null;
                const prev = prevEntry?.completedSp ?? 0;
                const curr = stats.completedSp;
                const delta = !prevEntry || prev === 0 ? null : Math.round(((curr - prev) / prev) * 100);
                return delta !== null ? (
                  <p className="text-xs font-medium">
                    <span className={delta >= 0 ? "text-[#009966]" : "text-red-500"}>
                      {delta >= 0 ? "+" : ""}
                      {delta}%
                    </span>{" "}
                    <span className="font-normal text-[#45556c]">від попереднього спринту</span>
                  </p>
                ) : null;
              })()}
            </KpiCard>

            {/* Sprint completion */}
            <KpiCard
              title="Виконання спринту"
              icon={
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="#10b981" strokeWidth="1.4" />
                  <path
                    d="M5 8.5l2 2 4-4"
                    stroke="#10b981"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              }
            >
              <p className="text-[30px] font-bold text-[#0f172b]">{stats.completionPercentage}%</p>
              <p className="text-xs text-[#45556c]">
                {stats.completedSp} з {stats.plannedSp} story points
              </p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
                <div
                  className="h-2 rounded-full bg-[#155dfc] transition-all"
                  style={{
                    width: `${Math.min(stats.completionPercentage, 100)}%`,
                  }}
                />
              </div>
            </KpiCard>

            {/* Overdue */}
            <KpiCard
              title="Прострочені задачі"
              icon={
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="#ef4444" strokeWidth="1.4" />
                  <path d="M8 5v3M8 10.5h.01" stroke="#ef4444" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              }
            >
              <p className="text-[30px] font-bold text-[#82181a]">{stats.overdueTasks}</p>
              <p className="text-xs text-[#45556c]">Потребують уваги</p>
            </KpiCard>

            {/* Active members */}
            <KpiCard
              title="Активні учасники"
              icon={
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M11 14v-1.5A2.5 2.5 0 0 0 8.5 10h-5A2.5 2.5 0 0 0 1 12.5V14"
                    stroke="#3b82f6"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                  <circle cx="6" cy="5.5" r="2.5" stroke="#3b82f6" strokeWidth="1.3" />
                  <path
                    d="M13 14v-1.5A2.5 2.5 0 0 0 11 10M10.5 3a2.5 2.5 0 0 1 0 5"
                    stroke="#3b82f6"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </svg>
              }
            >
              <p className="text-[30px] font-bold text-[#0f172b]">{stats.activeMembers}</p>
              <p className="text-xs text-[#45556c]">
                {stats.workload.length > 0
                  ? `Середня кількість задач: ${(stats.totalTasks / Math.max(stats.activeMembers, 1)).toFixed(1)} на учасника`
                  : "Учасники у спринті"}
              </p>
            </KpiCard>
          </div>

          {/* Charts row */}
          <div className="flex gap-6">
            <ChartCard
              title="Velocity по спринтах"
              description="Порівняння запланованих та виконаних story points"
              className="flex-1"
            >
              <VelocityChart stats={stats} />
            </ChartCard>

            <ChartCard
              title="Розподіл задач за статусом"
              description="Поточний стан задач у спринті"
              className="flex-1"
            >
              <TaskDistChart stats={stats} />
            </ChartCard>
          </div>

          {/* Workload bar chart */}
          <ChartCard
            title="Завантаження команди"
            description="Кількість задач та сторі поінтів на виконавця в поточному спринті"
          >
            <WorkloadChart stats={stats} />
          </ChartCard>

          {/* Key sprint metrics */}
          <div className="rounded-[14px] border border-black/10 bg-white px-6">
            <div className="border-b border-[#e2e8f0] pb-4 pt-6">
              <p className="text-base font-medium text-[#0a0a0a]">Ключові метрики спринту</p>
              <p className="mt-0.5 text-sm text-[#717182]">Детальна інформація по поточному спринту</p>
            </div>
            <MetricRow
              label="Середня тривалість задачі"
              sublabel="Від взяття в роботу до завершення"
              value={stats.avgTaskDurationDays !== null ? stats.avgTaskDurationDays : "—"}
              unit="дні"
            />
            <MetricRow
              label="Задач на код-рев'ю"
              sublabel="Очікують перевірки"
              value={stats.inReviewTasks}
              unit="задач"
              valueColor="#e17100"
            />
            <MetricRow
              label="Блокуючі задачі"
              sublabel="Заблоковані залежностями"
              value={stats.blockedTasks}
              unit="задачі"
              valueColor="#e7000b"
            />
            <MetricRow
              label="Днів до завершення спринту"
              sublabel="Залишилось до дедлайну"
              value={stats.daysToEnd}
              unit="днів"
              valueColor="#155dfc"
              last
            />
          </div>

          {/* Export section */}
          <div className="flex items-center justify-between rounded-[14px] border border-[#bedbff] bg-[#eff6ff] px-6 py-5">
            <div>
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M10 2v10M6 9l4 4 4-4M3 14v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="text-base font-medium text-[#0a0a0a]">Звіт по спринту</p>
              </div>
              <p className="mt-1 text-sm text-[#717182]">Експортуйте детальний звіт з усіма метриками та графіками</p>
              <p className="mt-3 text-sm text-[#45556c]">Формат звіту: PDF • Включає всі графіки та таблиці</p>
            </div>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting || !selectedSprintId}
              className="flex h-9 items-center gap-2 rounded-lg bg-[#3b82f6] px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              title={!selectedSprintId ? "Оберіть спринт" : undefined}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 2v8M4 7l4 4 4-4M2 12h12"
                  stroke="white"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {isExporting ? "Формування..." : "Завантажити звіт"}
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
