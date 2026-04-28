export type AppRole = "Admin" | "Project Manager" | "Developer";

export interface JwtPayload {
  userId: string;
  email: string;
  roles: AppRole[];
}
