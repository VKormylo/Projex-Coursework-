import { URLs } from '~/constants/request'
import type { ReleaseDto, CreateReleasePayload } from '~/types/release.types'
import { baseService } from './base-service'

interface ReleasesResponse {
  releases: ReleaseDto[]
}
interface ReleaseResponse {
  release: ReleaseDto
}

export const releaseService = {
  list: () =>
    baseService.request<ReleasesResponse>({
      method: 'GET',
      url: URLs.releases.list,
    }),

  create: (data: CreateReleasePayload) =>
    baseService.request<ReleaseResponse>({
      method: 'POST',
      url: URLs.releases.create,
      data,
    }),

  update: (id: string, data: Partial<CreateReleasePayload>) =>
    baseService.request<ReleaseResponse>({
      method: 'PATCH',
      url: URLs.releases.byId(id),
      data,
    }),

  delete: (id: string) =>
    baseService.request<void>({
      method: 'DELETE',
      url: URLs.releases.byId(id),
    }),
}
