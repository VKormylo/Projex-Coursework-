import { URLs } from '~/constants/request'
import type {
  ReleaseDto,
  ReleaseDetailDto,
  CreateReleasePayload,
} from "~/types/release.types";
import { baseService } from './base-service'

interface ReleasesResponse {
  releases: ReleaseDto[]
}
interface ReleaseResponse {
  release: ReleaseDto
}

interface ReleaseDetailResponse {
  release: ReleaseDetailDto;
}

export const releaseService = {
  get: (id: string) =>
    baseService.request<ReleaseDetailResponse>({
      method: "GET",
      url: URLs.releases.byId(id),
    }),

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

  update: (
    id: string,
    data: Partial<CreateReleasePayload> & { status?: "planned" | "completed" },
  ) =>
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
