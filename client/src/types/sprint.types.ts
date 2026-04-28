export type ApiSprintStatus = 'planned' | 'active' | 'closed' | 'cancelled'
export type ApiTaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type ApiTaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked'

export interface CommentDto {
  id: string
  taskId: string
  authorId: string
  body: string
  createdAt: string
  author?: { id: string; fullName: string }
}

export interface TaskHistoryDto {
  id: string
  taskId: string
  changedBy: string
  oldStatus: ApiTaskStatus
  newStatus: ApiTaskStatus
  changedAt: string
  user?: { id: string; fullName: string }
}

export interface TaskDto {
  id: string
  projectId: string
  sprintId: string | null
  title: string
  description: string | null
  priority: ApiTaskPriority
  status: ApiTaskStatus
  storyPoint: number | null
  assigneeId: string | null
  reporterId: string
  dueDate: string | null
  createdAt?: string
  comments?: CommentDto[]
  assignee?: { id: string; fullName: string } | null
  reporter?: { id: string; fullName: string } | null
  sprint?: { id: string; name: string } | null
  project?: { id: string; name: string } | null
}

export interface SprintDto {
  id: string
  projectId: string
  name: string
  goal: string | null
  startDate: string
  endDate: string
  status: ApiSprintStatus
  tasks: TaskDto[]
}

export interface CreateSprintPayload {
  projectId: string
  name: string
  goal?: string
  startDate: string
  endDate: string
  status: ApiSprintStatus
}

export interface CreateTaskPayload {
  projectId: string
  sprintId?: string | null
  title: string
  description?: string
  priority: ApiTaskPriority
  status: ApiTaskStatus
  storyPoint?: number
  assigneeId?: string | null
  reporterId: string
  dueDate?: string
}
