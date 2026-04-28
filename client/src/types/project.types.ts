export type ApiProjectStatus =
  | 'planned'
  | 'active'
  | 'on_hold'
  | 'completed'
  | 'archived'

export interface ProjectDto {
  id: string
  teamId: string
  name: string
  description: string | null
  startDate: string | null
  endDate: string | null
  status: ApiProjectStatus
  createdBy: string
  tasks: { id: string }[]
  sprints: { id: string }[]
}

export interface CreateProjectPayload {
  teamId: string
  name: string
  description?: string
  startDate?: string
  endDate?: string
  status: ApiProjectStatus
  createdBy: string
}

export interface UpdateProjectPayload {
  name?: string
  description?: string
  status?: ApiProjectStatus
  endDate?: string
}

export interface TeamDto {
  id: string
  name: string
  createdAt?: string
  teamMember?: TeamMemberDto[]
}

export interface TeamMemberDto {
  teamId: string
  userId: string
  joinedAt?: string
  user: {
    id: string
    fullName: string
    email: string
    position?: string
    isActive: boolean
    role: { id: number; name: string } | null
  }
}

export interface RoleDto {
  id: number
  name: string
  description?: string | null
}

export interface AdminUserDto {
  id: string
  fullName: string
  email: string
  position: string
  isActive: boolean
  createdAt: string
  role: RoleDto | null
  _count: { assigned: number }
}
