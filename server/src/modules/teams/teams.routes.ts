import { Router } from "express";
import { z } from "zod";

import { authorize } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { addTeamMember, createTeam, deleteTeam, deleteTeamMember, listTeams, updateTeam } from "./teams.controller";

const createTeamSchema = z.object({
  name: z.string().min(2).max(120),
});

const addMemberSchema = z.object({
  userId: z.string().regex(/^\d+$/),
});

const updateTeamSchema = z.object({
  name: z.string().min(2).max(120),
});

export const teamsRouter = Router();

teamsRouter.get("/", listTeams);

teamsRouter.post("/", authorize("Admin", "Project Manager"), validateBody(createTeamSchema), createTeam);

teamsRouter.patch("/:id", authorize("Admin", "Project Manager"), validateBody(updateTeamSchema), updateTeam);

teamsRouter.post("/:id/members", authorize("Admin", "Project Manager"), validateBody(addMemberSchema), addTeamMember);

teamsRouter.delete("/:id", authorize("Admin", "Project Manager"), deleteTeam);

teamsRouter.delete("/:id/members/:userId", authorize("Admin", "Project Manager"), deleteTeamMember);
