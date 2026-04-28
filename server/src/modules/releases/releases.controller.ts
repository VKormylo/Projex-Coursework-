import { Request, Response } from "express";

import {
  assertProjectWritable,
  getAccessibleProjectIds,
} from "../../lib/access";
import { asBigInt } from "../../lib/http";
import { prisma } from "../../lib/prisma";
import type { ReleaseStatus } from "@prisma/client";
import { HttpError } from "../../middleware/error-handler";
import {
  createReleaseFromSprintRecord,
  createReleaseRecord,
  deleteReleaseRecord,
  getReleaseByIdDetail,
  getReleasesWhere,
  updateReleaseRecord,
} from "./releases.service";

type ReleaseListRow = Awaited<ReturnType<typeof getReleasesWhere>>[number];

function serializeReleaseLite(release: ReleaseListRow) {
  return {
    ...release,
    id: release.id.toString(),
    projectId: release.projectId.toString(),
    sprintId: release.sprintId?.toString() ?? null,
    sprint: release.sprint
      ? {
          ...release.sprint,
          id: release.sprint.id.toString(),
          tasks: release.sprint.tasks.map((t) => ({
            id: t.id.toString(),
            status: t.status,
          })),
        }
      : null,
    project: {
      ...release.project,
      id: release.project.id.toString(),
    },
  };
}

export async function getRelease(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Not authenticated");
  const projectIds = await getAccessibleProjectIds(
    BigInt(req.user.userId),
    req.user.roles,
  );

  const id = asBigInt(req.params.id);
  const release = await getReleaseByIdDetail(id);
  if (!release) throw new HttpError(404, "Release not found");

  if (
    projectIds !== null &&
    !projectIds.some((pid) => pid === release.projectId)
  ) {
    throw new HttpError(403, "Forbidden");
  }

  const serialized = {
    ...release,
    id: release.id.toString(),
    projectId: release.projectId.toString(),
    sprintId: release.sprintId?.toString() ?? null,
    sprint: release.sprint
      ? {
          id: release.sprint.id.toString(),
          name: release.sprint.name,
          status: release.sprint.status,
          startDate: release.sprint.startDate.toISOString().slice(0, 10),
          endDate: release.sprint.endDate.toISOString().slice(0, 10),
          goal: release.sprint.goal,
          tasks: release.sprint.tasks.map((t) => ({
            id: t.id.toString(),
            title: t.title,
            status: t.status,
            priority: t.priority,
            storyPoint: t.storyPoint,
            assignee: t.assignee
              ? {
                  id: t.assignee.id.toString(),
                  fullName: t.assignee.fullName,
                }
              : null,
          })),
        }
      : null,
    project: {
      ...release.project,
      id: release.project.id.toString(),
    },
  };

  res.status(200).json({ status: "success", data: { release: serialized } });
}

export async function listReleases(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Not authenticated");
  const userId = BigInt(req.user.userId);
  const projectIds = await getAccessibleProjectIds(userId, req.user.roles);
  if (projectIds !== null && projectIds.length === 0) {
    return res.status(200).json({
      status: "success",
      data: { releases: [] },
    });
  }
  const where =
    projectIds === null ? undefined : { projectId: { in: projectIds } };
  const releases = await getReleasesWhere(where);
  const serialized = releases.map((r) => serializeReleaseLite(r));
  res.status(200).json({ status: "success", data: { releases: serialized } });
}

export async function createRelease(req: Request, res: Response) {
  if (!req.user) throw new HttpError(401, "Not authenticated");
  const { version, name, releaseDate, notes, sprintId, projectId } = req.body;

  const projId = asBigInt(projectId);
  await assertProjectWritable(req, projId);

  const release = await createReleaseRecord({
    projectId: projId,
    sprintId: sprintId ? asBigInt(sprintId) : null,
    version,
    name: name ?? "",
    releaseDate: new Date(releaseDate),
    notes: notes ?? null,
  });

  const serialized = {
    ...release,
    id: release.id.toString(),
    projectId: release.projectId.toString(),
    sprintId: release.sprintId?.toString() ?? null,
    sprint: release.sprint
      ? {
          ...release.sprint,
          id: release.sprint.id.toString(),
          tasks: release.sprint.tasks.map((t) => ({
            id: t.id.toString(),
            status: t.status,
          })),
        }
      : null,
    project: {
      ...release.project,
      id: release.project.id.toString(),
    },
  };
  res.status(201).json({ status: "success", data: { release: serialized } });
}

export async function updateRelease(req: Request, res: Response) {
  const id = asBigInt(req.params.id);
  const existing = await prisma.release.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Release not found");
  await assertProjectWritable(req, existing.projectId);

  const { version, name, releaseDate, notes, sprintId, status } = req.body;
  const release = await updateReleaseRecord(id, {
    ...(version !== undefined && { version }),
    ...(name !== undefined && { name }),
    ...(releaseDate !== undefined && { releaseDate: new Date(releaseDate) }),
    ...(notes !== undefined && { notes: notes ?? null }),
    ...(sprintId !== undefined && {
      sprintId: sprintId ? asBigInt(sprintId) : null,
    }),
    ...(status !== undefined && { status: status as ReleaseStatus }),
  });

  const serialized = {
    ...release,
    id: release.id.toString(),
    projectId: release.projectId.toString(),
    sprintId: release.sprintId?.toString() ?? null,
    sprint: release.sprint
      ? {
          ...release.sprint,
          id: release.sprint.id.toString(),
          tasks: release.sprint.tasks.map((t) => ({
            id: t.id.toString(),
            status: t.status,
          })),
        }
      : null,
    project: {
      ...release.project,
      id: release.project.id.toString(),
    },
  };
  res.status(200).json({ status: "success", data: { release: serialized } });
}

export async function deleteRelease(req: Request, res: Response) {
  const id = asBigInt(req.params.id);
  const existing = await prisma.release.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Release not found");
  await assertProjectWritable(req, existing.projectId);
  await deleteReleaseRecord(id);
  res.status(200).json({ status: "success", message: "Release deleted" });
}

export async function createReleaseFromSprint(req: Request, res: Response) {
  const sprintId = asBigInt(req.body.sprintId);
  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
  });
  if (!sprint) throw new HttpError(404, "Sprint not found");
  await assertProjectWritable(req, sprint.projectId);
  const version = req.body.version as string;
  await createReleaseFromSprintRecord(sprintId, version);
  res.status(201).json({
    status: "success",
    message: "Release created",
  });
}
