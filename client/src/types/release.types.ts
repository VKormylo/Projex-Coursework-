export interface ReleaseDto {
  id: string
  projectId: string
  sprintId: string | null
  version: string
  name: string
  releaseDate: string
  notes: string | null
  project: { id: string; name: string }
  sprint: {
    id: string
    name: string
    tasks: { id: string; status: string }[]
  } | null
}

export interface CreateReleasePayload {
  projectId: string
  sprintId: string | null
  version: string
  name: string
  releaseDate: string
  notes?: string | null
}
