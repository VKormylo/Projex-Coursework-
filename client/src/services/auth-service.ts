import { URLs } from "~/constants/request";
import { baseService } from "./base-service";
import type { UserLogin, UserSignup } from "~/schemas/auth";
import type { AccessTokenResponse, LoginResponse, UserResponse } from "~/types/auth.types";

export const authService = {
  signup: (user: UserSignup) => {
    return baseService.request<AccessTokenResponse>({
      data: user,
      method: "POST",
      url: URLs.auth.signup,
    });
  },
  login: (user: Pick<UserLogin, "email" | "password">) => {
    return baseService.request<LoginResponse>({
      data: user,
      method: "POST",
      url: URLs.auth.login,
    });
  },
  me: () => {
    return baseService.request<UserResponse>({
      method: "GET",
      url: URLs.auth.me,
    });
  },
  updateMe: (data: { fullName?: string; email?: string; position?: string }) => {
    return baseService.request<UserResponse>({
      method: "PATCH",
      url: URLs.auth.updateMe,
      data,
    });
  },
};
