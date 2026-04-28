import { URLs } from "~/constants/request";
import { baseService } from "./base-service";
import type {
  CreateTaskPayload,
  TaskDto,
  TaskHistoryDto,
  ApiTaskStatus,
} from "~/types/sprint.types";

interface TasksResponse {
  tasks: TaskDto[];
}
interface TaskResponse {
  task: TaskDto;
}
interface TaskHistoryResponse {
  history: TaskHistoryDto[];
}

export interface TaskListParams {
  projectId?: string;
  sprintId?: string;
  status?: ApiTaskStatus;
  priority?: string;
  assigneeId?: string;
  q?: string;
}

function buildQuery(params: TaskListParams) {
  const qs = new URLSearchParams();
  if (params.projectId) qs.set("projectId", params.projectId);
  if (params.sprintId) qs.set("sprintId", params.sprintId);
  if (params.status) qs.set("status", params.status);
  if (params.priority) qs.set("priority", params.priority);
  if (params.assigneeId) qs.set("assigneeId", params.assigneeId);
  if (params.q) qs.set("q", params.q);
  const str = qs.toString();
  return str ? `${URLs.tasks.list}?${str}` : URLs.tasks.list;
}

export const taskService = {
  list: (params: TaskListParams = {}) =>
    baseService.request<TasksResponse>({
      method: "GET",
      url: buildQuery(params),
    }),

  create: (payload: CreateTaskPayload) =>
    baseService.request<TaskResponse>({
      method: "POST",
      url: URLs.tasks.create,
      data: payload,
    }),

  update: (
    id: string,
    payload: Partial<Omit<CreateTaskPayload, "projectId" | "reporterId">>,
  ) =>
    baseService.request<TaskResponse>({
      method: "PATCH",
      url: URLs.tasks.byId(id),
      data: payload,
    }),

  get: (id: string) =>
    baseService.request<TaskResponse>({
      method: "GET",
      url: URLs.tasks.byId(id),
    }),

  getHistory: (id: string) =>
    baseService.request<TaskHistoryResponse>({
      method: "GET",
      url: URLs.tasks.history(id),
    }),

  updateStatus: (id: string, status: ApiTaskStatus) =>
    baseService.request<TaskResponse>({
      method: "PATCH",
      url: URLs.tasks.status(id),
      data: { status },
    }),

  delete: (id: string) =>
    baseService.request<null>({
      method: "DELETE",
      url: URLs.tasks.byId(id),
    }),
};
