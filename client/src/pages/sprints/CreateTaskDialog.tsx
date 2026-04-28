import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Dialog from "~/components/dialog/Dialog";
import Button from "~/components/button/Button";
import Select from "~/components/select/Select";
import type { SelectOption } from "~/components/select/Select";

const schema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Мінімум 2 символи")
    .max(220, "Максимум 220 символів"),
  priority: z.enum(["low", "medium", "high", "critical"] as const),
  storyPoint: z.number().int().min(0).max(100).nullable().optional(),
  assigneeId: z.string().trim().optional(),
  dueDate: z
    .string()
    .optional()
    .refine((v) => !v || v >= new Date().toISOString().slice(0, 10), {
      message: "Дата не може бути в минулому",
    }),
  sprintId: z.string().trim().optional(),
});

export type CreateTaskFormValues = z.infer<typeof schema>;

const PRIORITY_OPTIONS: SelectOption[] = [
  { value: "low", label: "Низький", className: "text-[#374151]" },
  { value: "medium", label: "Середній", className: "text-[#1447e6]" },
  { value: "high", label: "Високий", className: "text-[#92400e]" },
  { value: "critical", label: "Критичний", className: "text-[#dc2626]" },
];

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
    control,
    formState: { errors },
  } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      priority: "medium",
      storyPoint: null,
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
        storyPoint: null,
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

  const sprintOptions: SelectOption[] = [
    { value: "", label: "Без спринту (беклог)" },
    ...sprints.map((s) => ({ value: s.id, label: s.name })),
  ];

  const assigneeOptions: SelectOption[] = [
    { value: "", label: "Не призначено" },
    ...assignees.map((u) => ({ value: u.id, label: u.fullName })),
  ];

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
            placeholder="Назва задачі"
          />
          {errors.title ? (
            <p className="text-xs text-red-600">{errors.title.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}>Спринт</label>
          <Controller
            name="sprintId"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value ?? ""}
                onChange={field.onChange}
                options={sprintOptions}
              />
            )}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}>Пріоритет</label>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onChange={field.onChange}
                options={PRIORITY_OPTIONS}
              />
            )}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelClass}>Story Points</label>
          <input
            {...register("storyPoint", {
              setValueAs: (v) =>
                v === "" || v == null ? null : parseInt(v, 10),
            })}
            type="number"
            min={0}
            className={inputClass}
            placeholder="—"
          />
          {errors.storyPoint ? (
            <p className="text-xs text-red-600">{errors.storyPoint.message}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Відповідальний</label>
            <Controller
              name="assigneeId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  options={assigneeOptions}
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>Дедлайн</label>
            <input
              {...register("dueDate")}
              type="date"
              min={new Date().toISOString().slice(0, 10)}
              className={inputClass}
            />
            {errors.dueDate ? (
              <p className="text-xs text-red-600">{errors.dueDate.message}</p>
            ) : null}
          </div>
        </div>
      </form>
    </Dialog>
  );
}
