import { useCallback, useState } from 'react'
import { useClickOutside } from '~/hooks/useClickOutside'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import DashboardLayout from '~/components/dashboard-layout/DashboardLayout'
import ProjectCard from '~/components/project-card/ProjectCard'
import Button from '~/components/button/Button'
import ConfirmDialog from '~/components/confirm-dialog/ConfirmDialog'
import { ChevronDownIcon, PlusIcon, SearchIcon } from '~/components/svg/Svg'
import ProjectFormDialog, {
  type ProjectFormSubmitData,
} from './CreateProjectDialog'
import { projectService } from '~/services/project-service'
import { useAuthContext } from '~/context/authContext'
import type { ApiProjectStatus, ProjectDto } from '~/types/project.types'

const STATUS_OPTIONS: { value: ApiProjectStatus | ''; label: string }[] = [
  { value: '', label: 'Всі статуси' },
  { value: 'active', label: 'Активний' },
  { value: 'planned', label: 'Планування' },
  { value: 'on_hold', label: 'Призупинено' },
  { value: 'completed', label: 'Завершено' },
  { value: 'archived', label: 'Архів' },
]

export default function Projects() {
  const queryClient = useQueryClient()
  const { user } = useAuthContext()
  const isDeveloper = user?.role?.name === 'Developer'

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ApiProjectStatus | ''>('')
  const [statusOpen, setStatusOpen] = useState(false)
  const closeStatusDrop = useCallback(() => setStatusOpen(false), [])
  const statusDropRef = useClickOutside<HTMLDivElement>(closeStatusDrop, statusOpen)

  const [createOpen, setCreateOpen] = useState(false)
  const [editProject, setEditProject] = useState<ProjectDto | null>(null)
  const [deleteProjectTarget, setDeleteProjectTarget] = useState<ProjectDto | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.list(),
  })

  const { mutate: createProject, isPending: isCreating } = useMutation({
    mutationFn: (payload: ProjectFormSubmitData) =>
      projectService.create({
        name: payload.name,
        description: payload.description,
        teamId: payload.teamId!,
        status: payload.status,
        createdBy: user!.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setCreateOpen(false)
      setApiError(null)
    },
    onError: (err: Error) => setApiError(err.message),
  })

  const { mutate: updateProject, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ProjectFormSubmitData }) =>
      projectService.update(id, {
        name: payload.name,
        description: payload.description,
        status: payload.status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setEditProject(null)
      setApiError(null)
    },
    onError: (err: Error) => setApiError(err.message),
  })

  const { mutate: archiveProject } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApiProjectStatus }) =>
      projectService.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })

  const { mutate: deleteProject, isPending: isDeletingProject } = useMutation({
    mutationFn: (id: string) => projectService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setDeleteProjectTarget(null)
    },
  })

  const projects = data?.projects ?? []

  const filtered = projects.filter((p) => {
    const q = search.trim().toLowerCase()
    const matchSearch = q === '' || p.name.toLowerCase().includes(q)
    const matchStatus = statusFilter === '' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  const selectedStatusLabel =
    STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? 'Всі статуси'

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[30px] font-bold leading-9 text-[#0f172b]">
              Проєкти
            </h1>
            <p className="mt-1 text-base leading-6 text-[#45556c]">
              Керуйте всіма проєктами вашої команди
            </p>
          </div>
          {!isDeveloper ? (
            <Button
              type="button"
              className="gap-1"
              onClick={() => {
                setApiError(null)
                setCreateOpen(true)
              }}
            >
              <PlusIcon className="text-white" />
              Створити проєкт
            </Button>
          ) : null}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-[448px]">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#62748e]">
              <SearchIcon />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Пошук проєктів..."
              className="h-9 w-full rounded-lg border border-[#e2e8f0] bg-white pl-10 pr-3 py-1 text-sm text-[#0f172b] outline-none placeholder:text-[#62748e] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30"
            />
          </div>

          <div ref={statusDropRef} className="relative">
            <button
              type="button"
              onClick={() => setStatusOpen((v) => !v)}
              className="flex h-9 w-[180px] items-center justify-between gap-2 rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm text-[#0f172b]"
            >
              <span>{selectedStatusLabel}</span>
              <ChevronDownIcon className="text-[#717182]" />
            </button>
            {statusOpen ? (
              <div className="absolute left-0 top-10 z-10 w-[180px] overflow-hidden rounded-lg border border-[#e2e8f0] bg-white shadow-md">
                {STATUS_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      setStatusFilter(o.value)
                      setStatusOpen(false)
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-[#f8fafc] ${
                      statusFilter === o.value
                        ? 'font-medium text-[#1447e6]'
                        : 'text-[#0a0a0a]'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[222px] animate-pulse rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc]"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center rounded-[10px] border border-dashed border-red-200 py-16">
            <p className="text-sm text-red-600">
              Не вдалося завантажити проєкти
            </p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-3 gap-6">
            {filtered.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onEdit={(proj) => {
                  setApiError(null)
                  setEditProject(proj)
                }}
                onArchive={(proj) =>
                  archiveProject({ id: proj.id, status: proj.status })
                }
                onDelete={(proj) => setDeleteProjectTarget(proj)}
                showActions={!isDeveloper}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-[10px] border border-dashed border-[#e2e8f0] py-16 text-center">
            <p className="text-sm font-medium text-[#45556c]">
              Проєктів не знайдено
            </p>
            <p className="mt-1 text-xs text-[#717182]">
              Спробуйте змінити фільтри або створіть новий проєкт
            </p>
          </div>
        )}
      </div>

      {/* Create dialog */}
      <ProjectFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={createProject}
        isPending={isCreating}
        apiError={apiError}
      />

      {/* Edit dialog */}
      <ProjectFormDialog
        open={Boolean(editProject)}
        onClose={() => setEditProject(null)}
        project={editProject ?? undefined}
        onSubmit={(data) =>
          updateProject({ id: editProject!.id, payload: data })
        }
        isPending={isUpdating}
        apiError={apiError}
      />

      <ConfirmDialog
        open={Boolean(deleteProjectTarget)}
        onClose={() => setDeleteProjectTarget(null)}
        onCancel={() => setDeleteProjectTarget(null)}
        onConfirm={() => {
          if (deleteProjectTarget) deleteProject(deleteProjectTarget.id)
        }}
        isPending={isDeletingProject}
        title="Видалити проєкт?"
        description="Цю дію не можна скасувати."
      >
        <p className="text-sm text-[#45556c]">
          Проєкт{' '}
          <span className="font-medium text-[#0f172b]">
            {deleteProjectTarget?.name}
          </span>{' '}
          буде видалено назавжди.
        </p>
      </ConfirmDialog>
    </DashboardLayout>
  )
}
