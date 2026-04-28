import { Router } from "express";

import { authRouter } from "./modules/auth/auth.routes";
import { usersRouter, rolesRouter } from "./modules/users/users.routes";
import { teamsRouter } from "./modules/teams/teams.routes";
import { projectsRouter } from "./modules/projects/projects.routes";
import { sprintsRouter } from "./modules/sprints/sprints.routes";
import { tasksRouter } from "./modules/tasks/tasks.routes";
import { commentsRouter } from "./modules/comments/comments.routes";
import { releasesRouter } from "./modules/releases/releases.routes";
import { analyticsRouter } from "./modules/analytics/analytics.routes";
import { adminRouter } from "./modules/admin/admin.routes";
import { authenticate } from "./middleware/auth";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/roles", authenticate, rolesRouter);
apiRouter.use("/users", authenticate, usersRouter);
apiRouter.use("/teams", authenticate, teamsRouter);
apiRouter.use("/projects", authenticate, projectsRouter);
apiRouter.use("/sprints", authenticate, sprintsRouter);
apiRouter.use("/tasks", authenticate, tasksRouter);
apiRouter.use("/comments", authenticate, commentsRouter);
apiRouter.use("/releases", authenticate, releasesRouter);
apiRouter.use("/analytics", authenticate, analyticsRouter);
apiRouter.use("/admin", authenticate, adminRouter);
