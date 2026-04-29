import { Document, Page, View, Text, Svg, Line, Rect, StyleSheet, Font } from "@react-pdf/renderer";
import type { ReportData, MemberStat, BurndownBlock, VelocityBlock } from "~/services/analytics-service";

// ── Fonts ──────────────────────────────────────────────────────────────────────
Font.register({
  family: "Roboto",
  fonts: [
    { src: "/fonts/Roboto-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/Roboto-Bold.ttf", fontWeight: 700 },
  ],
});
Font.registerHyphenationCallback((w) => [w]);

// ── Palette ────────────────────────────────────────────────────────────────────
const C = {
  blue: "#3b82f6",
  blueDark: "#1d4ed8",
  green: "#10b981",
  red: "#ef4444",
  orange: "#f59e0b",
  gray900: "#0f172b",
  gray700: "#374151",
  gray500: "#64748b",
  gray300: "#cbd5e1",
  gray100: "#f1f5f9",
  white: "#ffffff",
  pageBg: "#f8fafc",
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    backgroundColor: C.pageBg,
    paddingHorizontal: 40,
    paddingTop: 36,
    paddingBottom: 48,
    fontFamily: "Roboto",
    fontSize: 9,
    color: C.gray900,
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: C.blue,
  },
  headerLeft: { flexDirection: "column", gap: 3 },
  headerTitle: { fontSize: 20, fontFamily: "Roboto", fontWeight: 700, color: C.blue },
  headerSub: { fontSize: 10, color: C.gray500 },
  headerRight: { flexDirection: "column", alignItems: "flex-end", gap: 3 },
  headerMeta: { fontSize: 8, color: C.gray500 },
  // Section
  section: {
    backgroundColor: C.white,
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.gray300,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Roboto",
    fontWeight: 700,
    color: C.gray900,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
  },
  sectionTitleAccent: { color: C.blue },
  // KPI row
  kpiRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 2,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: C.pageBg,
    borderRadius: 6,
    padding: 10,
    alignItems: "center",
  },
  kpiValue: { fontSize: 18, fontFamily: "Roboto", fontWeight: 700, color: C.gray900 },
  kpiValueBlue: { color: C.blue },
  kpiValueGreen: { color: C.green },
  kpiValueRed: { color: C.red },
  kpiLabel: { fontSize: 8, color: C.gray500, marginTop: 3, textAlign: "center" },
  // Table
  table: { width: "100%" },
  tableHead: {
    flexDirection: "row",
    backgroundColor: C.pageBg,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.gray100,
  },
  tableRowLast: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  th: { fontSize: 8, fontFamily: "Roboto", fontWeight: 700, color: C.gray500 },
  td: { fontSize: 8.5, color: C.gray700 },
  tdGreen: { color: C.green },
  tdRed: { color: C.red },
  tdBlue: { color: C.blue },
  // Progress bar
  progressTrack: {
    height: 6,
    backgroundColor: C.gray100,
    borderRadius: 3,
    marginTop: 6,
  },
  progressFill: {
    height: 6,
    backgroundColor: C.blue,
    borderRadius: 3,
  },
  // Status badge
  badge: {
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    fontSize: 7,
    fontFamily: "Roboto",
    fontWeight: 700,
  },
  // Misc
  row: { flexDirection: "row", gap: 10 },
  col: { flexDirection: "column" },
  label: { fontSize: 8, color: C.gray500 },
  value: { fontSize: 9, color: C.gray900, fontFamily: "Roboto", fontWeight: 700 },
  spacer: { marginBottom: 8 },
  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7, color: C.gray500 },
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function fmtNow() {
  return new Date().toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// ── SVG Bar Chart (velocity history) ──────────────────────────────────────────

function VelocityBarChart({ velocity }: { velocity: VelocityBlock }) {
  const W = 460,
    H = 80;
  const PAD_L = 24,
    PAD_B = 20,
    PAD_T = 4,
    PAD_R = 8;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const history = velocity.history.slice(-6);
  const maxVal = Math.max(...history.flatMap((h) => [h.plannedSp, h.completedSp]), 1);
  const barW = Math.min(28, chartW / (history.length * 2 + history.length));
  const groupW = chartW / history.length;

  return (
    <Svg width={W} height={H}>
      {/* Y grid lines */}
      {[0, 0.5, 1].map((f, i) => {
        const y = PAD_T + chartH * (1 - f);
        return (
          <Line
            key={i}
            x1={PAD_L}
            y1={y}
            x2={W - PAD_R}
            y2={y}
            strokeWidth={0.5}
            stroke={i === 2 ? C.gray300 : C.gray100}
          />
        );
      })}
      {/* Bars */}
      {history.map((h, i) => {
        const gx = PAD_L + i * groupW + groupW / 2;
        const plannedH = (h.plannedSp / maxVal) * chartH;
        const completedH = (h.completedSp / maxVal) * chartH;
        return (
          <Svg key={i}>
            {/* Planned bar */}
            <Rect
              x={gx - barW - 1}
              y={PAD_T + chartH - plannedH}
              width={barW}
              height={clamp(plannedH, 0, chartH)}
              fill={C.blue}
              rx={2}
              opacity={0.4}
            />
            {/* Completed bar */}
            <Rect
              x={gx + 1}
              y={PAD_T + chartH - completedH}
              width={barW}
              height={clamp(completedH, 0, chartH)}
              fill={C.green}
              rx={2}
            />
          </Svg>
        );
      })}
    </Svg>
  );
}

// Sprint name labels below bars (rendered as Text, not SVG)
function VelocityLabels({ velocity }: { velocity: VelocityBlock }) {
  const history = velocity.history.slice(-6);
  return (
    <View style={{ flexDirection: "row", paddingLeft: 24, paddingRight: 8 }}>
      {history.map((h, i) => (
        <Text key={i} style={{ flex: 1, fontSize: 6.5, color: C.gray500, textAlign: "center" }}>
          {h.sprintName.replace(/sprint\s*/i, "S")}
        </Text>
      ))}
    </View>
  );
}

// ── SVG Burndown Chart ─────────────────────────────────────────────────────────

function BurndownChart({ burndown }: { burndown: BurndownBlock }) {
  const W = 460,
    H = 90;
  const PAD_L = 28,
    PAD_B = 18,
    PAD_T = 4,
    PAD_R = 8;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const pts = burndown.points;
  if (pts.length < 2) return null;

  const maxY = burndown.totalTasks || 1;

  function px(i: number) {
    return PAD_L + (i / (pts.length - 1)) * chartW;
  }
  function py(v: number) {
    return PAD_T + (1 - v / maxY) * chartH;
  }

  return (
    <Svg width={W} height={H}>
      {/* Grid */}
      {[0, 0.5, 1].map((f, i) => {
        const y = PAD_T + chartH * (1 - f);
        return <Line key={i} x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} strokeWidth={0.5} stroke={C.gray100} />;
      })}
      {/* Ideal line */}
      <Svg>
        {pts.slice(0, -1).map((_, i) => (
          <Line
            key={i}
            x1={px(i)}
            y1={py(pts[i].ideal)}
            x2={px(i + 1)}
            y2={py(pts[i + 1].ideal)}
            strokeWidth={1}
            stroke={C.gray300}
            strokeDasharray="3,2"
          />
        ))}
      </Svg>
      {/* Actual line */}
      <Svg>
        {pts.slice(0, -1).map((_, i) => (
          <Line
            key={i}
            x1={px(i)}
            y1={py(pts[i].remaining)}
            x2={px(i + 1)}
            y2={py(pts[i + 1].remaining)}
            strokeWidth={1.5}
            stroke={C.blue}
          />
        ))}
      </Svg>
    </Svg>
  );
}

// ── Status / priority badge color ──────────────────────────────────────────────

function statusColor(s: string) {
  const m: Record<string, string> = {
    todo: C.gray500,
    in_progress: C.blue,
    in_review: C.orange,
    done: C.green,
    blocked: C.red,
  };
  return m[s] ?? C.gray500;
}

function priorityColor(p: string) {
  const m: Record<string, string> = {
    low: C.gray500,
    medium: C.blue,
    high: C.orange,
    critical: C.red,
  };
  return m[p] ?? C.gray500;
}

function statusLabel(s: string) {
  const m: Record<string, string> = {
    todo: "До виконання",
    in_progress: "В роботі",
    in_review: "На перевірці",
    done: "Виконано",
    blocked: "Заблоковано",
  };
  return m[s] ?? s;
}

function priorityLabel(p: string) {
  const m: Record<string, string> = {
    low: "Низький",
    medium: "Середній",
    high: "Високий",
    critical: "Критичний",
  };
  return m[p] ?? p;
}

// ── Section 1 — Sprint Productivity ───────────────────────────────────────────

function Section1({ data }: { data: ReportData }) {
  const { velocity, burndown, sprint } = data;
  const completionPct = velocity.completionPct;
  const taskCompletionPct =
    velocity.totalTasks === 0 ? 0 : Math.round((velocity.doneTasks / velocity.totalTasks) * 100);

  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>
        <Text style={s.sectionTitleAccent}>01 </Text>Продуктивність спринту
      </Text>

      {/* KPI row */}
      <View style={s.kpiRow}>
        <View style={s.kpiBox}>
          <Text style={[s.kpiValue, s.kpiValueBlue]}>{velocity.completedSp} SP</Text>
          <Text style={s.kpiLabel}>Velocity (виконано)</Text>
        </View>
        <View style={s.kpiBox}>
          <Text style={[s.kpiValue, s.kpiValueBlue]}>{velocity.plannedSp} SP</Text>
          <Text style={s.kpiLabel}>Заплановано</Text>
        </View>
        <View style={s.kpiBox}>
          <Text
            style={[
              s.kpiValue,
              completionPct >= 80 ? s.kpiValueGreen : completionPct >= 50 ? s.kpiValueBlue : s.kpiValueRed,
            ]}
          >
            {completionPct}%
          </Text>
          <Text style={s.kpiLabel}>Story points виконано</Text>
        </View>
        <View style={s.kpiBox}>
          <Text style={[s.kpiValue, taskCompletionPct >= 80 ? s.kpiValueGreen : s.kpiValueBlue]}>
            {taskCompletionPct}%
          </Text>
          <Text style={s.kpiLabel}>Задачі виконано</Text>
        </View>
        <View style={s.kpiBox}>
          <Text style={[s.kpiValue]}>
            {velocity.doneTasks}/{velocity.totalTasks}
          </Text>
          <Text style={s.kpiLabel}>Виконано / всього</Text>
        </View>
      </View>

      {/* Progress bar for story points */}
      <View style={{ marginTop: 8, marginBottom: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
          <Text style={s.label}>Виконання story points</Text>
          <Text style={[s.label, { color: C.blue }]}>{completionPct}%</Text>
        </View>
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${clamp(completionPct, 0, 100)}%` }]} />
        </View>
      </View>

      {/* Velocity history chart */}
      {velocity.history.length >= 2 && (
        <View style={{ marginBottom: 4 }}>
          <Text style={[s.label, { marginBottom: 4 }]}>Velocity по спринтах (останні 6)</Text>
          <VelocityBarChart velocity={velocity} />
          <VelocityLabels velocity={velocity} />
          <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <View style={{ width: 10, height: 6, backgroundColor: C.blue, opacity: 0.4, borderRadius: 1 }} />
              <Text style={s.label}>Заплановано</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <View style={{ width: 10, height: 6, backgroundColor: C.green, borderRadius: 1 }} />
              <Text style={s.label}>Виконано</Text>
            </View>
          </View>
        </View>
      )}

      {/* Burndown chart */}
      {burndown.points.length >= 2 && (
        <View style={{ marginTop: 10 }}>
          <Text style={[s.label, { marginBottom: 4 }]}>
            Burndown chart ({fmtDate(sprint.startDate)} – {fmtDate(sprint.endDate)})
          </Text>
          <BurndownChart burndown={burndown} />
          <View style={{ flexDirection: "row", gap: 12, marginTop: 2 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <View style={{ width: 14, height: 1, backgroundColor: C.gray300 }} />
              <Text style={s.label}>Ідеальна лінія</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <View style={{ width: 14, height: 2, backgroundColor: C.blue, borderRadius: 1 }} />
              <Text style={s.label}>Фактичний прогрес</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ── Section 2 — Team Members ───────────────────────────────────────────────────

function Section2({ members }: { members: MemberStat[] }) {
  if (members.length === 0) return null;

  const colWidths = ["25%", "11%", "11%", "11%", "14%", "14%", "14%"] as const;

  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>
        <Text style={s.sectionTitleAccent}>02 </Text>Продуктивність команди
      </Text>

      <View style={s.table}>
        {/* Head */}
        <View style={s.tableHead}>
          {["Учасник", "Задачі", "Виконано", "Висок/Крит", "Story Pts", "Сер. тривалість", "% виконання"].map(
            (h, i) => (
              <Text key={i} style={[s.th, { width: colWidths[i] }]}>
                {h}
              </Text>
            ),
          )}
        </View>
        {/* Rows */}
        {members.map((m, i) => {
          const donePct = m.totalTasks === 0 ? 0 : Math.round((m.doneTasks / m.totalTasks) * 100);
          const isLast = i === members.length - 1;
          return (
            <View key={m.userId} style={isLast ? s.tableRowLast : s.tableRow}>
              <Text style={[s.td, { width: colWidths[0] }]}>{m.fullName}</Text>
              <Text style={[s.td, { width: colWidths[1] }]}>{m.totalTasks}</Text>
              <Text style={[s.td, s.tdGreen, { width: colWidths[2] }]}>{m.doneTasks}</Text>
              <Text style={[s.td, { width: colWidths[3], color: m.highPriorityTasks > 0 ? C.orange : C.gray700 }]}>
                {m.highPriorityTasks}
              </Text>
              <Text style={[s.td, { width: colWidths[4] }]}>{m.storyPoints} SP</Text>
              <Text style={[s.td, { width: colWidths[5] }]}>
                {m.avgDurationDays !== null ? `${m.avgDurationDays} дн.` : "—"}
              </Text>
              <View style={{ width: colWidths[6], flexDirection: "column" }}>
                <Text style={[s.td, { color: donePct >= 80 ? C.green : donePct >= 50 ? C.blue : C.orange }]}>
                  {donePct}%
                </Text>
                <View style={[s.progressTrack, { marginTop: 3 }]}>
                  <View
                    style={[
                      s.progressFill,
                      {
                        width: `${donePct}%`,
                        backgroundColor: donePct >= 80 ? C.green : C.blue,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── Section 3 — Quality & Blockers ────────────────────────────────────────────

function Section3({ quality }: { quality: ReportData["quality"] }) {
  const items = [
    {
      label: "Заблоковані задачі",
      sub:
        quality.blockedAvgDays !== null
          ? `Середній час у блокуванні: ${quality.blockedAvgDays} дн.`
          : "Дані про тривалість блокування відсутні",
      value: quality.blockedTasks,
      color: quality.blockedTasks > 0 ? C.red : C.green,
    },
    {
      label: "Непризначені задачі",
      sub: "Сигнал про прогалини в плануванні",
      value: quality.unassignedTasks,
      color: quality.unassignedTasks > 0 ? C.orange : C.green,
    },
    {
      label: "Регресії (на перевірці → в роботі)",
      sub: "Задачі, повернені з перевірки",
      value: quality.regressions,
      color: quality.regressions > 0 ? C.orange : C.green,
    },
    {
      label: "Прострочені задачі",
      sub: "Дедлайн минув, статус не «виконано»",
      value: quality.overdueTasks,
      color: quality.overdueTasks > 0 ? C.red : C.green,
    },
  ];

  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>
        <Text style={s.sectionTitleAccent}>03 </Text>Якість та блокери
      </Text>

      {items.map((item, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: 7,
            borderBottomWidth: i < items.length - 1 ? 1 : 0,
            borderBottomColor: C.gray100,
          }}
        >
          <View>
            <Text style={[s.td, { fontFamily: "Roboto", fontWeight: 700 }]}>{item.label}</Text>
            <Text style={[s.label, { marginTop: 2 }]}>{item.sub}</Text>
          </View>
          <Text style={{ fontSize: 16, fontFamily: "Roboto", fontWeight: 700, color: item.color }}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Section 4 — Project Progress ───────────────────────────────────────────────

function Section4({ project }: { project: ReportData["project"] }) {
  const STATUS_ORDER = ["todo", "in_progress", "in_review", "done", "blocked"];
  const PRIORITY_ORDER = ["critical", "high", "medium", "low"];

  const sortedStatus = [...project.byStatus].sort(
    (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
  );
  const sortedPriority = [...project.byPriority].sort(
    (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority),
  );

  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>
        <Text style={s.sectionTitleAccent}>04 </Text>Прогрес проекту "{project.name}"
      </Text>

      {/* Overall */}
      <View style={s.kpiRow}>
        <View style={s.kpiBox}>
          <Text style={[s.kpiValue, s.kpiValueBlue]}>{project.totalTasks}</Text>
          <Text style={s.kpiLabel}>Всього задач</Text>
        </View>
        <View style={s.kpiBox}>
          <Text style={[s.kpiValue, s.kpiValueGreen]}>{project.doneTasks}</Text>
          <Text style={s.kpiLabel}>Виконано</Text>
        </View>
        <View style={s.kpiBox}>
          <Text style={[s.kpiValue, project.completionPct >= 70 ? s.kpiValueGreen : s.kpiValueBlue]}>
            {project.completionPct}%
          </Text>
          <Text style={s.kpiLabel}>% виконання</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={{ marginVertical: 8 }}>
        <View style={s.progressTrack}>
          <View
            style={[
              s.progressFill,
              {
                width: `${clamp(project.completionPct, 0, 100)}%`,
                backgroundColor: project.completionPct >= 70 ? C.green : C.blue,
              },
            ]}
          />
        </View>
      </View>

      {/* Two column tables */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        {/* By status */}
        <View style={{ flex: 1 }}>
          <Text style={[s.label, { marginBottom: 5, fontFamily: "Roboto", fontWeight: 700 }]}>За статусом</Text>
          {sortedStatus.map((r, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 4,
                borderBottomWidth: 1,
                borderBottomColor: C.gray100,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor(r.status) }} />
                <Text style={s.td}>{statusLabel(r.status)}</Text>
              </View>
              <Text style={[s.td, { color: statusColor(r.status), fontFamily: "Roboto", fontWeight: 700 }]}>
                {r.count}
              </Text>
            </View>
          ))}
        </View>

        {/* By priority */}
        <View style={{ flex: 1 }}>
          <Text style={[s.label, { marginBottom: 5, fontFamily: "Roboto", fontWeight: 700 }]}>За пріоритетом</Text>
          {sortedPriority.map((r, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 4,
                borderBottomWidth: 1,
                borderBottomColor: C.gray100,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: priorityColor(r.priority) }} />
                <Text style={s.td}>{priorityLabel(r.priority)}</Text>
              </View>
              <Text style={[s.td, { color: priorityColor(r.priority), fontFamily: "Roboto", fontWeight: 700 }]}>
                {r.count}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ── Section 5 — Release ────────────────────────────────────────────────────────

function Section5({ data }: { data: ReportData }) {
  const { release, velocity } = data;

  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>
        <Text style={s.sectionTitleAccent}>05 </Text>Реліз
      </Text>

      {release ? (
        <View>
          <View style={s.kpiRow}>
            <View style={s.kpiBox}>
              <Text style={[s.kpiValue, s.kpiValueBlue]}>v{release.version}</Text>
              <Text style={s.kpiLabel}>Версія</Text>
            </View>
            <View style={s.kpiBox}>
              <Text style={[s.kpiValue]}>{fmtDate(release.releaseDate)}</Text>
              <Text style={s.kpiLabel}>Дата релізу</Text>
            </View>
            <View style={s.kpiBox}>
              <Text style={[s.kpiValue, s.kpiValueGreen]}>{velocity.doneTasks}</Text>
              <Text style={s.kpiLabel}>Задач у релізі</Text>
            </View>
            <View style={s.kpiBox}>
              <Text style={[s.kpiValue, s.kpiValueBlue]}>{velocity.completedSp} SP</Text>
              <Text style={s.kpiLabel}>Story Points</Text>
            </View>
          </View>
          {release.name && (
            <View style={{ marginTop: 8 }}>
              <Text style={s.label}>Назва релізу</Text>
              <Text style={[s.td, { marginTop: 2 }]}>{release.name}</Text>
            </View>
          )}
          {release.notes && (
            <View style={{ marginTop: 6 }}>
              <Text style={s.label}>Примітки</Text>
              <Text style={[s.td, { marginTop: 2 }]}>{release.notes}</Text>
            </View>
          )}
        </View>
      ) : (
        <Text style={[s.td, { color: C.gray500 }]}>Для цього спринту реліз ще не створено</Text>
      )}
    </View>
  );
}

// ── Root PDF Document ──────────────────────────────────────────────────────────

export function AnalyticsReportPDF({ data }: { data: ReportData }) {
  const { sprint } = data;
  const statusMap: Record<string, string> = {
    active: "Активний",
    closed: "Закритий",
    planned: "Запланований",
    cancelled: "Скасований",
  };

  return (
    <Document title={`Звіт — ${sprint.name}`} author="Projex" subject="Аналітичний звіт спринту">
      <Page size="A4" style={s.page}>
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.headerTitle}>Projex</Text>
            <Text style={s.headerSub}>Аналітичний звіт спринту: {sprint.name}</Text>
            <Text style={s.headerMeta}>
              Проект: {sprint.projectName} • Статус: {statusMap[sprint.status] ?? sprint.status}
            </Text>
            <Text style={s.headerMeta}>
              {fmtDate(sprint.startDate)} — {fmtDate(sprint.endDate)}
            </Text>
            {sprint.goal ? <Text style={[s.headerMeta, { marginTop: 3 }]}>Мета: {sprint.goal}</Text> : null}
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerMeta}>Сформовано: {fmtNow()}</Text>
          </View>
        </View>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        <Section1 data={data} />
        <Section2 members={data.members} />
        <Section3 quality={data.quality} />
        <Section4 project={data.project} />
        <Section5 data={data} />

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Projex — Аналітичний звіт • {sprint.name} • {sprint.projectName}
          </Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `Сторінка ${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
