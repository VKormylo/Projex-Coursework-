import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import DashboardLayout from '~/components/dashboard-layout/DashboardLayout'
import Badge from '~/components/badge/Badge'
import { ChevronDownIcon, CalendarIcon } from '~/components/svg/Svg'
import { taskService } from '~/services/task-service'
import { useAuthContext } from '~/context/authContext'
import { useClickOutside } from '~/hooks/useClickOutside'
import { getProjectKey, getTaskCode } from '~/utils/project-key'
import type { TaskDto, ApiTaskStatus, ApiTaskPriority } from '~/types/sprint.types'

type TabId = 'all' | 'overdue' | 'by-priority'

const STATUS_OPTIONS: { value: ApiTaskStatus | ''; label: string }[] = [
  { value: '', label: 'Всі статуси' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'in_review', label: 'In Review' },
  { value: 'done', label: 'Done' },
  { value: 'blocked', label: 'Blocked' },
]

const PRIORITY_OPTIONS: { value: ApiTaskPriority | ''; label: string }[] = [
  { value: '', label: 'Всі пріоритети' },
  { value: 'critical', label: 'Критичний' },
  { value: 'high', label: 'Високий' },
  { value: 'medium', label: 'Середній' },
  { value: 'low', label: 'Низький' },
]

const PRIORITY_ORDER: ApiTaskPriority[] = ['critical', 'high', 'medium', 'low']

function statusBadge(s: ApiTaskStatus): any {
  const map: Record<ApiTaskStatus, string> = {
    todo: 'planning',
    in_progress: 'active',
    in_review: 'paused',
    done: 'done',
    blocked: 'cancelled',
  }
  return map[s] ?? 'planning'
}

function formatDate(d: string | null | undefined) {
  if (!d) return null
  return new Date(d).toLocaleDateString('uk-UA', { day: '2-digit', month: 'short' })
}

function isOverdue(task: TaskDto) {
  if (!task.dueDate) return false
  if (task.status === 'done') return false
  return new Date(task.dueDate) < new Date()
}

// ── Stat card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string
  count: number
  icon: React.ReactNode
  iconBg: string
}
function StatCard({ label, count, icon, iconBg }: StatCardProps) {
  return (
    <div className="flex flex-1 items-center justify-between rounded-xl border border-[#e2e8f0] bg-white px-5 py-[17px]">
      <div>
        <p className="mb-1 text-sm font-normal text-[#62748e]">{label}</p>
        <p className="text-2xl font-semibold text-[#0f172b]">{count}</p>
      </div>
      <div className={`flex size-12 items-center justify-center rounded-full ${iconBg}`}>
        {icon}
      </div>
    </div>
  )
}

// ── Task table row ────────────────────────────────────────────────────────────
interface TaskRowProps {
  task: TaskDto
  onClick: () => void
}
function TaskRow({ task, onClick }: TaskRowProps) {
  const projectKey = task.project ? getProjectKey(task.project.name) : null
  const taskCode = getTaskCode(task.project?.name, task.id)
  const overdue = isOverdue(task)

  return (
    <tr
      onClick={onClick}
      className="cursor-pointer border-b border-[#f1f5f9] transition-colors hover:bg-[#f8fafc]"
    >
      <td className="px-3 py-2.5">
        <span className="text-sm font-medium text-[#374151]">{taskCode}</span>
      </td>
      <td className="px-3 py-2.5">
        <span
          className="block max-w-[520px] truncate text-sm text-[#0f172b]"
          title={task.title}
        >
          {task.title}
        </span>
      </td>
      <td className="px-3 py-2.5">
        {projectKey ? (
          <span className="inline-flex items-center rounded-md bg-[#eff6ff] px-2 py-0.5 text-xs font-medium text-[#1447e6]">
            {projectKey}
          </span>
        ) : (
          <span className="text-sm text-[#62748e]">—</span>
        )}
      </td>
      <td className="px-3 py-2.5">
        <Badge variant={task.priority as any} />
      </td>
      <td className="px-3 py-2.5">
        <Badge variant={statusBadge(task.status)} />
      </td>
      <td className="px-3 py-2.5">
        {task.dueDate ? (
          <span className={`flex items-center gap-1 text-sm ${overdue ? 'text-red-500' : 'text-[#62748e]'}`}>
            <CalendarIcon />
            {formatDate(task.dueDate)}
          </span>
        ) : (
          <span className="text-sm text-[#62748e]">—</span>
        )}
      </td>
      <td className="px-3 py-2.5 text-right">
        <span className="text-sm text-[#62748e]">
          {task.storyPoint != null ? task.storyPoint : '—'}
        </span>
      </td>
    </tr>
  )
}

// ── Tasks table ───────────────────────────────────────────────────────────────
const TABLE_HEADERS = ['Ключ', 'Назва', 'Проєкт', 'Пріоритет', 'Статус', 'Дедлайн', 'SP']

function TasksTable({ tasks, onRowClick }: { tasks: TaskDto[]; onRowClick: (t: TaskDto) => void }) {
  if (tasks.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-[#62748e]">Задачі не знайдено</div>
    )
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-[#e2e8f0] bg-white">
      <table className="w-full text-left">
        <thead className="border-b border-[#e2e8f0] bg-[#f8fafc]">
          <tr>
            {TABLE_HEADERS.map((h) => (
              <th
                key={h}
                className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-[#62748e] ${h === 'SP' ? 'text-right' : ''}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <TaskRow key={t.id} task={t} onClick={() => onRowClick(t)} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── By-priority view ──────────────────────────────────────────────────────────
function ByPriorityView({ tasks, onRowClick }: { tasks: TaskDto[]; onRowClick: (t: TaskDto) => void }) {
  const groups = useMemo(() => {
    const map = new Map<ApiTaskPriority, TaskDto[]>()
    for (const p of PRIORITY_ORDER) map.set(p, [])
    for (const t of tasks) {
      const arr = map.get(t.priority)
      if (arr) arr.push(t)
    }
    return PRIORITY_ORDER.map((p) => ({ priority: p, tasks: map.get(p)! })).filter(
      (g) => g.tasks.length > 0,
    )
  }, [tasks])

  if (groups.length === 0) {
    return <div className="py-12 text-center text-sm text-[#62748e]">Задачі не знайдено</div>
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map(({ priority, tasks: groupTasks }) => (
        <div key={priority}>
          <div className="mb-3 flex items-center gap-2">
            <Badge variant={priority as any} />
            <span className="text-base font-semibold text-[#62748e]">({groupTasks.length})</span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-[#e2e8f0] bg-white">
            <table className="w-full text-left">
              <thead className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                <tr>
                  {TABLE_HEADERS.map((h) => (
                    <th
                      key={h}
                      className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-[#62748e] ${h === 'SP' ? 'text-right' : ''}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupTasks.map((t) => (
                  <TaskRow key={t.id} task={t} onClick={() => onRowClick(t)} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MyTasks() {
  const navigate = useNavigate()
  const { user } = useAuthContext()

  const [tab, setTab] = useState<TabId>('all')
  const [statusFilter, setStatusFilter] = useState<ApiTaskStatus | ''>('')
  const [priorityFilter, setPriorityFilter] = useState<ApiTaskPriority | ''>('')
  const [statusOpen, setStatusOpen] = useState(false)
  const [priorityOpen, setPriorityOpen] = useState(false)

  const closeStatus = useCallback(() => setStatusOpen(false), [])
  const closePriority = useCallback(() => setPriorityOpen(false), [])
  const statusRef = useClickOutside<HTMLDivElement>(closeStatus, statusOpen)
  const priorityRef = useClickOutside<HTMLDivElement>(closePriority, priorityOpen)

  const { data, isLoading } = useQuery({
    queryKey: ['my-tasks', user?.id],
    queryFn: () => taskService.list({ assigneeId: user!.id }),
    enabled: Boolean(user),
  })

  const allMyTasks = data?.tasks ?? []

  const filtered = useMemo(() => {
    return allMyTasks.filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false
      if (priorityFilter && t.priority !== priorityFilter) return false
      return true
    })
  }, [allMyTasks, statusFilter, priorityFilter])

  const now = new Date()
  const overdueTasks = filtered.filter(isOverdue)

  const displayTasks = useMemo(() => {
    if (tab === 'overdue') return overdueTasks
    return filtered
  }, [tab, filtered, overdueTasks])

  // Stats (from all tasks, no filter)
  const todoCount = allMyTasks.filter((t) => t.status === 'todo').length
  const inProgressCount = allMyTasks.filter((t) => t.status === 'in_progress').length
  const overdueCount = allMyTasks.filter(isOverdue).length
  const doneCount = allMyTasks.filter((t) => t.status === 'done').length

  const statusLabel = STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? 'Всі статуси'
  const priorityLabel = PRIORITY_OPTIONS.find((o) => o.value === priorityFilter)?.label ?? 'Всі пріоритети'

  const TABS: { id: TabId; label: string; count?: number }[] = [
    { id: 'all', label: 'Всі задачі', count: filtered.length },
    { id: 'overdue', label: 'Прострочені', count: overdueTasks.length },
    { id: 'by-priority', label: 'За пріоритетом' },
  ]

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold leading-9 text-[#0f172b]">Мої задачі</h1>
        <p className="mt-1 text-sm text-[#62748e]">Всі задачі, призначені вам</p>
      </div>

      {/* Stat cards */}
      <div className="mb-6 flex gap-4">
        <StatCard
          label="To Do"
          count={todoCount}
          iconBg="bg-[#f1f5f9]"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 11l2 2 4-4M5 5h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" stroke="#62748e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        />
        <StatCard
          label="In Progress"
          count={inProgressCount}
          iconBg="bg-[#eff6ff]"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="8" stroke="#3b82f6" strokeWidth="1.5"/>
              <path d="M12 8v4l3 3" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          }
        />
        <StatCard
          label="Прострочені"
          count={overdueCount}
          iconBg="bg-[#fef2f2]"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="8" stroke="#ef4444" strokeWidth="1.5"/>
              <path d="M12 8v4M12 16h.01" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          }
        />
        <StatCard
          label="Завершені"
          count={doneCount}
          iconBg="bg-[#f0fdf4]"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="8" stroke="#22c55e" strokeWidth="1.5"/>
              <path d="M8.5 12l2.5 2.5 5-5" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        />
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <div ref={statusRef} className="relative">
          <button
            onClick={() => setStatusOpen((v) => !v)}
            className="flex h-9 min-w-[11rem] items-center justify-between gap-2 rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm text-[#0f172b]"
          >
            <span>{statusLabel}</span>
            <ChevronDownIcon className="shrink-0 text-[#62748e]" />
          </button>
          {statusOpen && (
            <div className="absolute left-0 top-full z-30 mt-1 w-44 rounded-xl border border-[#e2e8f0] bg-white py-1 shadow-lg">
              {STATUS_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => { setStatusFilter(o.value as ApiTaskStatus | ''); setStatusOpen(false) }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-[#f8fafc] ${statusFilter === o.value ? 'font-medium text-[#3b82f6]' : 'text-[#0f172b]'}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div ref={priorityRef} className="relative">
          <button
            onClick={() => setPriorityOpen((v) => !v)}
            className="flex h-9 min-w-[11rem] items-center justify-between gap-2 rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm text-[#0f172b]"
          >
            <span>{priorityLabel}</span>
            <ChevronDownIcon className="shrink-0 text-[#62748e]" />
          </button>
          {priorityOpen && (
            <div className="absolute left-0 top-full z-30 mt-1 w-44 rounded-xl border border-[#e2e8f0] bg-white py-1 shadow-lg">
              {PRIORITY_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => { setPriorityFilter(o.value as ApiTaskPriority | ''); setPriorityOpen(false) }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-[#f8fafc] ${priorityFilter === o.value ? 'font-medium text-[#3b82f6]' : 'text-[#0f172b]'}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-white text-[#0f172b] shadow-sm'
                : 'text-[#62748e] hover:text-[#0f172b]'
            }`}
          >
            {t.label}
            {t.count !== undefined ? ` (${t.count})` : ''}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-[#62748e]">Завантаження…</div>
      ) : tab === 'by-priority' ? (
        <ByPriorityView
          tasks={filtered}
          onRowClick={(t) => navigate(`/board/${t.id}`)}
        />
      ) : (
        <TasksTable
          tasks={displayTasks}
          onRowClick={(t) => navigate(`/board/${t.id}`)}
        />
      )}
    </DashboardLayout>
  )
}
