import { z } from "zod";

const appRole = z.enum(["Admin", "Project Manager", "Developer"]);

export const registerSchema = z
  .object({
    fullName: z.string().min(2).max(150),
    email: z.string().email().max(255),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
    role: appRole,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const updateProfileSchema = z
  .object({
    fullName: z.string().min(2).max(150).optional(),
    position: z.string().max(100).optional(),
  })
  .refine((d) => d.fullName !== undefined || d.position !== undefined, {
    message: "At least one of fullName, position is required",
  });
