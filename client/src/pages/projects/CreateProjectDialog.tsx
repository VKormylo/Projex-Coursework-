import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import Dialog from '~/components/dialog/Dialog'
import Button from '~/components/button/Button'
import { teamService } from '~/services/team-service'
import type { ApiProjectStatus, ProjectDto } from '~/types/project.types'

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Мінімум 2 символи')
    .max(180, 'Максимум 180 символів'),
  key: z
    .string()
    .trim()
    .min(2, 'Мінімум 2 символи')
    .max(5, 'Максимум 5 символів')
    .regex(/^[A-Z0-9]+$/, 'Лише великі літери та цифри'),
  description: z.string().max(500, 'Максимум 500 символів').optional(),
  teamId: z.string().optional(),
  status: z.enum([
    'planned',
    'active',
    'on_hold',
    'completed',
    'archived',
  ] as const),
})

type FormValues = z.infer<typeof schema>

export interface ProjectFormSubmitData {
  name: string
  description?: string
  teamId?: string
  status: ApiProjectStatus
}

const inputClass =
  'h-10 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-1 text-sm text-[#0f172b] outline-none placeholder:text-[#94a3b8] hover:border-[#cbd5e1] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30'
const labelClass = 'text-sm font-medium leading-3.5 text-[#0f172b]'
const errorClass = 'text-xs text-red-600'

/** Pass `project` to enable edit mode; omit for create mode. */
type Props = {
  open: boolean
  onClose: () => void
  onSubmit: (data: ProjectFormSubmitData) => void
  isPending?: boolean
  apiError?: string | null
  project?: ProjectDto
}

function projectKey(name: string) {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 5)
}

export default function ProjectFormDialog({
  open,
  onClose,
  onSubmit,
  isPending,
  apiError,
  project,
}: Props) {
  const isEdit = Boolean(project)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: project?.name ?? '',
      key: projectKey(project?.name ?? ''),
      description: project?.description ?? '',
      teamId: project?.teamId ?? '',
      status: project?.status ?? 'planned',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: project?.name ?? '',
        key: projectKey(project?.name ?? ''),
        description: project?.description ?? '',
        teamId: project?.teamId ?? '',
        status: project?.status ?? 'planned',
      })
    }
  }, [open, project, reset])

  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamService.list(),
    enabled: open && !isEdit,
  })
  const teams = teamsData?.teams ?? []

  useEffect(() => {
    if (!isEdit && teams.length > 0) {
      setValue('teamId', teams[0].id, { shouldValidate: false })
    }
  }, [isEdit, teams, setValue])

  const nameValue = watch('name')
  useEffect(() => {
    if (isEdit) return
    setValue('key', projectKey(nameValue), { shouldValidate: false })
  }, [isEdit, nameValue, setValue])

  function handleClose() {
    reset()
    onClose()
  }

  function handleValid(values: FormValues) {
    onSubmit({
      name: values.name,
      description: values.description || undefined,
      teamId: values.teamId || undefined,
      status: values.status,
    })
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Редагувати проєкт' : 'Створити проєкт'}
      description={
        isEdit
          ? 'Оновіть інформацію про проєкт'
          : 'Заповніть інформацію про проєкт'
      }
      footer={
        <>
          <Button variant="outlined" type="button" onClick={handleClose}>
            Скасувати
          </Button>
          <Button
            type="submit"
            form="project-form"
            disabled={isPending || (!isEdit && teamsLoading)}
          >
            {isPending ? 'Збереження…' : isEdit ? 'Зберегти' : 'Створити'}
          </Button>
        </>
      }
    >
      {apiError ? (
        <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {apiError}
        </p>
      ) : null}

      <form
        id="project-form"
        onSubmit={handleSubmit(handleValid)}
        className="flex flex-col gap-4"
        noValidate
      >
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Назва проєкту</label>
          <input
            {...register('name')}
            className={inputClass}
            placeholder="E-Commerce Platform"
          />
          {errors.name ? (
            <p className={errorClass} role="alert">
              {errors.name.message}
            </p>
          ) : null}
        </div>

        {!isEdit ? (
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Ключ проєкту</label>
            <input
              {...register('key')}
              className={inputClass}
              placeholder="ECP"
            />
            <p className="text-xs leading-4 text-[#62748e]">
              Короткий ідентифікатор (2-5 символів)
            </p>
            {errors.key ? (
              <p className={errorClass} role="alert">
                {errors.key.message}
              </p>
            ) : null}
          </div>
        ) : null}

        {!isEdit ? (
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Команда</label>
            {teamsLoading ? (
              <div className={`${inputClass} flex items-center text-[#62748e]`}>
                Завантаження…
              </div>
            ) : teams.length === 0 ? (
              <p className="text-xs text-amber-600">
                У вас немає команд. Спочатку створіть команду.
              </p>
            ) : (
              <select {...register('teamId')} className={inputClass}>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
            {errors.teamId ? (
              <p className={errorClass} role="alert">
                {errors.teamId.message}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <label className={labelClass}>Статус</label>
          <select {...register('status')} className={inputClass}>
            <option value="planned">Планування</option>
            <option value="active">Активний</option>
            <option value="on_hold">Призупинено</option>
            <option value="completed">Завершено</option>
            <option value="archived">Архів</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}>Опис</label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full resize-none rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172b] outline-none placeholder:text-[#94a3b8] hover:border-[#cbd5e1] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30"
            placeholder="Опишіть мету та цілі проєкту..."
          />
          {errors.description ? (
            <p className={errorClass} role="alert">
              {errors.description.message}
            </p>
          ) : null}
        </div>
      </form>
    </Dialog>
  )
}
