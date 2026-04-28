import { URLs } from '~/constants/request'
import { baseService } from './base-service'
import type {
  CreateProjectPayload,
  UpdateProjectPayload,
  ProjectDto,
} from '~/types/project.types'

interface ProjectsResponse {
  projects: ProjectDto[]
}

interface ProjectResponse {
  project: ProjectDto
}

export const projectService = {
  list: () =>
    baseService.request<ProjectsResponse>({
      method: 'GET',
      url: URLs.projects.list,
    }),

  create: (payload: CreateProjectPayload) =>
    baseService.request<ProjectResponse>({
      method: 'POST',
      url: URLs.projects.create,
      data: payload,
    }),

  update: (id: string, payload: UpdateProjectPayload) =>
    baseService.request<ProjectResponse>({
      method: 'PATCH',
      url: URLs.projects.byId(id),
      data: payload,
    }),

  delete: (id: string) =>
    baseService.request<null>({
      method: 'DELETE',
      url: URLs.projects.delete(id),
    }),
}
