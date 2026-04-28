import { Router } from "express";

import { authenticate } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { login, me, patchMe, register } from "./auth.controller";
import {
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from "./auth.schemas";

export const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), register);
authRouter.post("/login", validateBody(loginSchema), login);
authRouter.get("/me", authenticate, me);
authRouter.patch(
  "/me",
  authenticate,
  validateBody(updateProfileSchema),
  patchMe,
);
