export type ReleaseStatusDto = "planned" | "completed";

export interface ReleaseDto {
  id: string;
  projectId: string;
  sprintId: string | null;
  version: string;
  name: string;
  releaseDate: string;
  notes: string | null;
  status: ReleaseStatusDto;
  project: { id: string; name: string };
  sprint: {
    id: string;
    name: string;
    tasks: { id: string; status: string }[];
  } | null;
}

export interface ReleaseDetailTaskDto {
  id: string;
  title: string;
  status: string;
  priority: string;
  storyPoint: number | null;
  assignee: { id: string; fullName: string } | null;
}

export interface ReleaseDetailDto extends Omit<ReleaseDto, "sprint"> {
  sprint: {
    id: string;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
    goal: string | null;
    tasks: ReleaseDetailTaskDto[];
  } | null;
}

export interface CreateReleasePayload {
  projectId: string;
  sprintId: string | null;
  version: string;
  name: string;
  releaseDate: string;
  notes?: string | null;
}
