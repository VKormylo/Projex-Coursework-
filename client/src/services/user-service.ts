import { URLs } from "~/constants/request";
import { baseService } from "./base-service";
import type { AdminUserDto, RoleDto } from "~/types/project.types";

interface UsersResponse {
  users: AdminUserDto[];
}
interface UserResponse {
  user: AdminUserDto;
}
interface RolesResponse {
  roles: RoleDto[];
}

export const userService = {
  list: () =>
    baseService.request<UsersResponse>({
      method: "GET",
      url: URLs.users.list,
    }),

  create: (data: {
    fullName: string;
    email: string;
    password: string;
    position: string;
  }) =>
    baseService.request<UserResponse>({
      method: "POST",
      url: URLs.users.create,
      data,
    }),

  update: (
    id: string,
    data: {
      fullName?: string;
      position?: string;
      email?: string;
      isActive?: boolean;
    },
  ) =>
    baseService.request<UserResponse>({
      method: "PATCH",
      url: URLs.users.byId(id),
      data,
    }),

  assignRole: (id: string, roleId: number) =>
    baseService.request<UserResponse>({
      method: "POST",
      url: URLs.users.roles(id),
      data: { roleId },
    }),

  clearRole: (id: string) =>
    baseService.request<UserResponse>({
      method: "DELETE",
      url: URLs.users.roles(id),
    }),

  findByEmail: (email: string) =>
    baseService.request<UserResponse>({
      method: "GET",
      url: `${URLs.users.byEmail}?email=${encodeURIComponent(email)}`,
    }),

  listRoles: () =>
    baseService.request<RolesResponse>({
      method: "GET",
      url: URLs.roles.list,
    }),
};
