import { URLs } from "~/constants/request";
import { baseService } from "./base-service";
import type { CreateSprintPayload, SprintDto } from "~/types/sprint.types";

interface SprintsResponse {
  sprints: SprintDto[];
}
interface SprintResponse {
  sprint: SprintDto;
}

export const sprintService = {
  list: () =>
    baseService.request<SprintsResponse>({
      method: "GET",
      url: URLs.sprints.list,
    }),

  create: (payload: CreateSprintPayload) =>
    baseService.request<SprintResponse>({
      method: "POST",
      url: URLs.sprints.create,
      data: payload,
    }),

  update: (
    id: string,
    payload: Partial<Omit<CreateSprintPayload, "projectId">>,
  ) =>
    baseService.request<SprintResponse>({
      method: "PATCH",
      url: URLs.sprints.byId(id),
      data: payload,
    }),

  close: (id: string) =>
    baseService.request<null>({ method: "POST", url: URLs.sprints.close(id) }),

  delete: (id: string) =>
    baseService.request<null>({ method: "DELETE", url: URLs.sprints.byId(id) }),
};
