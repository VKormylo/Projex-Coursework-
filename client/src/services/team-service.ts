import { URLs } from '~/constants/request'
import { baseService } from './base-service'
import type { TeamDto } from '~/types/project.types'

interface TeamsResponse {
  teams: TeamDto[]
}
interface TeamResponse {
  team: TeamDto
}

export const teamService = {
  list: () =>
    baseService.request<TeamsResponse>({
      method: 'GET',
      url: URLs.teams.list,
    }),

  create: (name: string) =>
    baseService.request<TeamResponse>({
      method: 'POST',
      url: URLs.teams.create,
      data: { name },
    }),

  update: (id: string, name: string) =>
    baseService.request<TeamResponse>({
      method: 'PATCH',
      url: URLs.teams.byId(id),
      data: { name },
    }),

  delete: (id: string) =>
    baseService.request<null>({
      method: 'DELETE',
      url: URLs.teams.byId(id),
    }),

  addMember: (teamId: string, userId: string) =>
    baseService.request<{ member: unknown }>({
      method: 'POST',
      url: URLs.teams.members(teamId),
      data: { userId },
    }),

  removeMember: (teamId: string, userId: string) =>
    baseService.request<null>({
      method: 'DELETE',
      url: URLs.teams.member(teamId, userId),
    }),
}
