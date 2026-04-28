import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Dialog from '~/components/dialog/Dialog'
import Button from '~/components/button/Button'
import type { ReleaseDto } from '~/types/release.types'
import type { ProjectDto } from '~/types/project.types'
import type { SprintDto } from '~/types/sprint.types'

const schema = z.object({
  version: z.string().trim().min(1, 'Вкажіть версію').max(30),
  name: z.string().trim().min(1, 'Вкажіть назву релізу').max(180),
  releaseDate: z.string().min(1, 'Вкажіть дату релізу'),
  projectId: z.string().min(1, 'Оберіть проєкт'),
  sprintId: z.string().optional(),
  notes: z.string().optional(),
})

export type ReleaseFormValues = z.infer<typeof schema>

const inputClass =
  'h-10 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-1 text-sm text-[#0f172b] outline-none placeholder:text-[#94a3b8] hover:border-[#cbd5e1] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30'
const labelClass = 'text-sm font-medium leading-3.5 text-[#0f172b]'
const selectClass =
  'h-10 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-1 text-sm text-[#0f172b] outline-none hover:border-[#cbd5e1] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 appearance-none cursor-pointer'

type Props = {
  open: boolean
  onClose: () => void
  onSubmit: (data: ReleaseFormValues) => void
  isPending?: boolean
  apiError?: string | null
  release?: ReleaseDto
  projects: ProjectDto[]
  sprints: SprintDto[]
}

export default function CreateReleaseDialog({
  open,
  onClose,
  onSubmit,
  isPending,
  apiError,
  release,
  projects,
  sprints,
}: Props) {
  const isEdit = Boolean(release)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ReleaseFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      version: release?.version ?? '',
      name: release?.name ?? '',
      releaseDate: release?.releaseDate ? release.releaseDate.slice(0, 10) : '',
      projectId: release?.projectId ?? '',
      sprintId: release?.sprintId ?? '',
      notes: release?.notes ?? '',
    },
  })

  const selectedProjectId = watch('projectId')
  const availableSprints = sprints.filter((s) => s.projectId === selectedProjectId)

  useEffect(() => {
    if (open) {
      reset({
        version: release?.version ?? '',
        name: release?.name ?? '',
        releaseDate: release?.releaseDate ? release.releaseDate.slice(0, 10) : '',
        projectId: release?.projectId ?? '',
        sprintId: release?.sprintId ?? '',
        notes: release?.notes ?? '',
      })
    }
  }, [open, release, reset])

  function handleClose() {
    reset()
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Редагувати реліз' : 'Створити реліз'}
      description={
        isEdit ? 'Оновіть інформацію про реліз' : 'Заповніть інформацію про новий реліз'
      }
      footer={
        <>
          <Button variant="outlined" type="button" onClick={handleClose}>
            Скасувати
          </Button>
          <Button type="submit" form="release-form" disabled={isPending}>
            {isPending ? 'Збереження…' : isEdit ? 'Зберегти' : 'Створити'}
          </Button>
        </>
      }
    >
      {apiError ? (
        <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{apiError}</p>
      ) : null}

      <form
        id="release-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
        noValidate
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Версія</label>
            <input
              {...register('version')}
              className={inputClass}
              placeholder="2.1.0"
            />
            {errors.version ? (
              <p className="text-xs text-red-600">{errors.version.message}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Дата релізу</label>
            <input {...register('releaseDate')} type="date" className={inputClass} />
            {errors.releaseDate ? (
              <p className="text-xs text-red-600">{errors.releaseDate.message}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}>Назва релізу</label>
          <input
            {...register('name')}
            className={inputClass}
            placeholder="Payment System Integration"
          />
          {errors.name ? (
            <p className="text-xs text-red-600">{errors.name.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}>Проєкт</label>
          <div className="relative">
            <select {...register('projectId')} className={selectClass}>
              <option value="">Оберіть проєкт</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8]"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M4 6l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          {errors.projectId ? (
            <p className="text-xs text-red-600">{errors.projectId.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}>Спринт</label>
          <div className="relative">
            <select {...register('sprintId')} className={selectClass}>
              <option value="">Оберіть спринт</option>
              {availableSprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8]"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M4 6l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}>Опис релізу</label>
          <textarea
            {...register('notes')}
            rows={3}
            className="w-full resize-none rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172b] outline-none placeholder:text-[#94a3b8] hover:border-[#cbd5e1] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30"
            placeholder="Опишіть основні зміни та нові функції..."
          />
        </div>
      </form>
    </Dialog>
  )
}
