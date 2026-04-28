import { Router } from "express";
import { Request, Response } from "express";

import { authorize } from "../../middleware/auth";
import { seedDatabase } from "./admin.seed.service";
import { clearDatabase } from "./admin.clear.service";
import { HttpError } from "../../middleware/error-handler";

export const adminRouter = Router();

adminRouter.post("/seed", authorize("Admin"), async (_req: Request, res: Response) => {
  const result = await seedDatabase();
  res.status(201).json({ status: "success", data: result });
});

adminRouter.post("/clear", authorize("Admin"), async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, "Not authenticated");
  await clearDatabase(BigInt(req.user.userId));
  res.status(200).json({ status: "success", data: { cleared: true } });
});
