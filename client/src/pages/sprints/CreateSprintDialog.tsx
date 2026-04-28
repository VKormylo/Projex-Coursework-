import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Dialog from '~/components/dialog/Dialog'
import Button from '~/components/button/Button'
import type { SprintDto } from '~/types/sprint.types'

const schema = z
  .object({
    name: z.string().trim().min(2, 'Мінімум 2 символи').max(120, 'Максимум 120 символів'),
    goal: z.string().max(500).optional(),
    startDate: z.string().min(1, 'Вкажіть дату початку'),
    endDate: z.string().min(1, 'Вкажіть дату завершення'),
  })
  .refine((d) => new Date(d.endDate) >= new Date(d.startDate), {
    message: 'Дата завершення має бути пізніше дати початку',
    path: ['endDate'],
  })

export type SprintFormValues = z.infer<typeof schema>

const inputClass =
  'h-10 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-1 text-sm text-[#0f172b] outline-none placeholder:text-[#94a3b8] hover:border-[#cbd5e1] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30'
const labelClass = 'text-sm font-medium leading-3.5 text-[#0f172b]'

function toDateInput(iso: string) {
  return iso ? iso.slice(0, 10) : ''
}

/** Pass `sprint` to enable edit mode; omit for create mode. */
type Props = {
  open: boolean
  onClose: () => void
  onSubmit: (data: SprintFormValues) => void
  isPending?: boolean
  apiError?: string | null
  sprint?: SprintDto
}

export default function SprintFormDialog({
  open,
  onClose,
  onSubmit,
  isPending,
  apiError,
  sprint,
}: Props) {
  const isEdit = Boolean(sprint)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SprintFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: sprint?.name ?? '',
      goal: sprint?.goal ?? '',
      startDate: toDateInput(sprint?.startDate ?? ''),
      endDate: toDateInput(sprint?.endDate ?? ''),
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: sprint?.name ?? '',
        goal: sprint?.goal ?? '',
        startDate: toDateInput(sprint?.startDate ?? ''),
        endDate: toDateInput(sprint?.endDate ?? ''),
      })
    }
  }, [open, sprint, reset])

  function handleClose() {
    reset()
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Редагувати спринт' : 'Створити спринт'}
      description={isEdit ? 'Оновіть параметри спринту' : 'Визначте параметри нового спринту'}
      footer={
        <>
          <Button variant="outlined" type="button" onClick={handleClose}>
            Скасувати
          </Button>
          <Button type="submit" form="sprint-form" disabled={isPending}>
            {isPending ? 'Збереження…' : isEdit ? 'Зберегти' : 'Створити'}
          </Button>
        </>
      }
    >
      {apiError ? (
        <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{apiError}</p>
      ) : null}

      <form
        id="sprint-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
        noValidate
      >
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Назва спринту</label>
          <input {...register('name')} className={inputClass} placeholder="Sprint 13" />
          {errors.name ? <p className="text-xs text-red-600">{errors.name.message}</p> : null}
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}>Ціль спринту</label>
          <textarea
            {...register('goal')}
            rows={3}
            className="w-full resize-none rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172b] outline-none placeholder:text-[#94a3b8] hover:border-[#cbd5e1] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30"
            placeholder="Опишіть основну ціль цього спринту..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Дата початку</label>
            <input {...register('startDate')} type="date" className={inputClass} />
            {errors.startDate ? <p className="text-xs text-red-600">{errors.startDate.message}</p> : null}
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Дата завершення</label>
            <input {...register('endDate')} type="date" className={inputClass} />
            {errors.endDate ? <p className="text-xs text-red-600">{errors.endDate.message}</p> : null}
          </div>
        </div>
      </form>
    </Dialog>
  )
}
