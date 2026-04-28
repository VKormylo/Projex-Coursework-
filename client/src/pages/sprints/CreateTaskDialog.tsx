import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Dialog from "~/components/dialog/Dialog";
import Button from "~/components/button/Button";

const schema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Мінімум 2 символи")
    .max(220, "Максимум 220 символів"),
  priority: z.enum(["low", "medium", "high", "critical"] as const),
  storyPoint: z.number().int().min(0).max(100),
  assigneeId: z.string().trim().optional(),
  dueDate: z.string().optional(),
  sprintId: z.string().trim().optional(),
});

export type CreateTaskFormValues = z.infer<typeof schema>;

const inputClass =
  "h-10 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-1 text-sm text-[#0f172b] outline-none placeholder:text-[#94a3b8] hover:border-[#cbd5e1] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30";
const labelClass = "text-sm font-medium leading-3.5 text-[#0f172b]";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskFormValues) => void;
  isPending?: boolean;
  apiError?: string | null;
  assignees?: { id: string; fullName: string }[];
  sprints?: { id: string; name: string; status: string }[];
};

export default function CreateTaskDialog({
  open,
  onClose,
  onSubmit,
  isPending,
  apiError,
  assignees = [],
  sprints = [],
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      priority: "medium",
      storyPoint: 0,
      assigneeId: "",
      dueDate: "",
      sprintId: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: "",
        priority: "medium",
        storyPoint: 0,
        assigneeId: "",
        dueDate: "",
        sprintId: "",
      });
    }
  }, [open, reset]);

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Створити задачу"
      description="Визначте параметри нової задачі"
      footer={
        <>
          <Button variant="outlined" type="button" onClick={handleClose}>
            Скасувати
          </Button>
          <Button type="submit" form="create-task-form" disabled={isPending}>
            {isPending ? "Збереження…" : "Створити"}
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
        id="create-task-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
        noValidate
      >
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Назва задачі</label>
          <input
            {...register("title")}
            className={inputClass}
            placeholder="Створити систему аутентифікації користувачів"
          />
          {errors.title ? (
            <p className="text-xs text-red-600">{errors.title.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}>Спринт</label>
          <select {...register("sprintId")} className={inputClass}>
            <option value="">Без спринту (беклог)</option>
            {sprints.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.status === "active" ? "active" : "planned"})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}>Пріоритет</label>
          <select {...register("priority")} className={inputClass}>
            <option value="low">Низький</option>
            <option value="medium">Середній</option>
            <option value="high">Високий</option>
            <option value="critical">Критичний</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}>Story Points</label>
          <input
            {...register("storyPoint", { valueAsNumber: true })}
            type="number"
            min={0}
            className={inputClass}
            placeholder="0"
          />
          {errors.storyPoint ? (
            <p className="text-xs text-red-600">{errors.storyPoint.message}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Відповідальний</label>
            <select {...register("assigneeId")} className={inputClass}>
              <option value="">Не призначено</option>
              {assignees.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>Дедлайн</label>
            <input {...register("dueDate")} type="date" className={inputClass} />
          </div>
        </div>
      </form>
    </Dialog>
  );
}
