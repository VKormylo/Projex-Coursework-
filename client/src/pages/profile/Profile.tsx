import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import DashboardLayout from "~/components/dashboard-layout/DashboardLayout";
import {
  CalendarIcon,
  EditIcon,
  MailIcon,
  MembersIcon,
  UserIcon,
  XIcon,
} from "~/components/svg/Svg";
import { useAuthContext } from "~/context/authContext";
import { projectService } from "~/services/project-service";
import { taskService } from "~/services/task-service";
import { teamService } from "~/services/team-service";
import { authService } from "~/services/auth-service";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function fmtJoinDate(iso: string) {
  return new Date(iso).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const editSchema = z.object({
  fullName: z.string().min(2, "Мінімум 2 символи"),
  email: z.string().email("Невірний email"),
  position: z.string().min(1, "Вкажіть посаду"),
});
type EditForm = z.infer<typeof editSchema>;

export default function Profile() {
  const { user, refreshUser } = useAuthContext();
  const [editing, setEditing] = useState(false);

  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectService.list(),
    enabled: Boolean(user),
  });
  const { data: tasksData } = useQuery({
    queryKey: ["tasks", "profile"],
    queryFn: () => taskService.list(),
    enabled: Boolean(user),
  });
  const { data: teamsData } = useQuery({
    queryKey: ["teams"],
    queryFn: () => teamService.list(),
    enabled: Boolean(user),
  });

  const stats = useMemo(() => {
    const projects = projectsData?.projects ?? [];
    const tasks = tasksData?.tasks ?? [];
    const teams = teamsData?.teams ?? [];
    const myId = user?.id ?? "";
    return {
      createdTasks: tasks.filter((t) => t.reporterId === myId).length,
      completedTasks: tasks.filter(
        (t) => t.assigneeId === myId && t.status === "done",
      ).length,
      managedProjects: projects.filter((p) => p.createdBy === myId).length,
      teamMembers: teams
        .filter((t) => (t.teamMember ?? []).some((m) => m.userId === myId))
        .reduce((sum, t) => sum + (t.teamMember?.length ?? 0), 0),
    };
  }, [projectsData?.projects, tasksData?.tasks, teamsData?.teams, user?.id]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      fullName: user?.fullName ?? "",
      email: user?.email ?? "",
      position: user?.position ?? "",
    },
  });

  const updateMut = useMutation({
    mutationFn: (data: EditForm) => authService.updateMe(data),
    onSuccess: async () => {
      await refreshUser();
      setEditing(false);
    },
  });

  function handleEdit() {
    reset({
      fullName: user?.fullName ?? "",
      email: user?.email ?? "",
      position: user?.position ?? "",
    });
    setEditing(true);
  }

  function handleCancel() {
    setEditing(false);
  }

  if (!user) return null;

  const roleName = user.role?.name ?? "Користувач";
  const joinDate = fmtJoinDate(user.createdAt);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Page header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-[30px] font-bold leading-9 text-[#0f172b]">
            Профіль користувача
          </h1>
          <p className="text-base leading-6 text-[#45556c]">
            Керуйте своїм профілем
          </p>
        </div>

        {/* Main layout */}
        <div className="flex gap-6 items-start">
          {/* Left column */}
          <div className="flex w-99.75 shrink-0 flex-col gap-6">
            {/* Avatar card */}
            <article className="flex flex-col items-center rounded-[14px] border border-black/10 bg-white px-6 py-6">
              <div className="mb-0 flex flex-col items-center gap-0">
                <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-[#dbeafe] text-2xl font-normal text-[#1447e6]">
                  {initials(user.fullName)}
                </div>
                <p className="text-[20px] font-bold leading-7 text-[#0f172b]">
                  {user.fullName}
                </p>
                <span className="mt-2 rounded-lg bg-[#dbeafe] px-2.25 py-0.75 text-xs font-medium text-[#1447e6]">
                  {roleName}
                </span>
                <p className="mt-4 text-sm text-[#45556c]">
                  {user.position || "—"}
                </p>
                <div className="mt-2 flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3 text-[#62748e]" />
                  <span className="text-xs text-[#62748e]">
                    Приєднався {joinDate}
                  </span>
                </div>
              </div>
            </article>

            {/* Stats card */}
            <article className="rounded-[14px] border border-black/10 bg-white">
              <div className="px-6 py-6">
                <p className="text-base font-medium text-[#0a0a0a]">
                  Статистика
                </p>
              </div>
              <div className="flex flex-col gap-4 px-6 pb-6">
                {[
                  {
                    label: "Створено задач",
                    value: stats.createdTasks,
                    color: "text-[#0f172b]",
                  },
                  {
                    label: "Завершено задач",
                    value: stats.completedTasks,
                    color: "text-[#009966]",
                  },
                  {
                    label: "Проєктів керую",
                    value: stats.managedProjects,
                    color: "text-[#0f172b]",
                  },
                  {
                    label: "Учасників команди",
                    value: stats.teamMembers,
                    color: "text-[#0f172b]",
                  },
                ].map((row, i) => (
                  <div key={row.label}>
                    {i > 0 && <div className="mb-4 h-px bg-black/10" />}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#45556c]">
                        {row.label}
                      </span>
                      <span className={`text-lg font-bold ${row.color}`}>
                        {row.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>

          {/* Right column – info card */}
          <article className="flex-1 rounded-[14px] border border-black/10 bg-white">
            {/* Card header */}
            <div className="flex items-center justify-between px-6 py-6">
              <div className="flex flex-col gap-0.5">
                <p className="text-base font-medium text-[#0a0a0a]">
                  Інформація профілю
                </p>
                <p className="text-sm text-[#717182]">
                  Основна інформація про ваш обліковий запис
                </p>
              </div>
              {!editing ? (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="flex h-8 items-center gap-1.5 rounded-lg bg-[#3b82f6] px-3 text-sm font-medium text-white hover:bg-[#2563eb] transition-colors"
                >
                  <EditIcon className="h-4 w-4" />
                  Редагувати
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex h-8 items-center gap-1.5 rounded-lg border border-[#e2e8f0] px-3 text-sm font-medium text-[#45556c] hover:bg-[#f8fafc] transition-colors"
                  >
                    <XIcon className="h-4 w-4" />
                    Скасувати
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit((data) => updateMut.mutate(data))}
                    disabled={updateMut.isPending}
                    className="flex h-8 items-center gap-1.5 rounded-lg bg-[#3b82f6] px-3 text-sm font-medium text-white hover:bg-[#2563eb] disabled:opacity-60 transition-colors"
                  >
                    {updateMut.isPending ? "Збереження…" : "Зберегти"}
                  </button>
                </div>
              )}
            </div>

            {/* Fields */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 px-6 pb-6">
              {/* Full name */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#0a0a0a]">
                  Повне ім'я
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]">
                    <UserIcon className="h-4 w-4" />
                  </span>
                  {editing ? (
                    <input
                      {...register("fullName")}
                      className="h-9 w-full rounded-lg border border-[#e2e8f0] bg-white pl-10 pr-3 text-sm text-[#0a0a0a] outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]"
                    />
                  ) : (
                    <div className="flex h-9 items-center rounded-lg bg-[#f3f3f5] pl-10 pr-3 text-sm text-[#0a0a0a] opacity-50">
                      {user.fullName}
                    </div>
                  )}
                </div>
                {errors.fullName && (
                  <p className="text-xs text-red-500">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#0a0a0a]">
                  Email
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]">
                    <MailIcon className="h-4 w-4" />
                  </span>
                  {editing ? (
                    <input
                      {...register("email")}
                      className="h-9 w-full rounded-lg border border-[#e2e8f0] bg-white pl-10 pr-3 text-sm text-[#0a0a0a] outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]"
                    />
                  ) : (
                    <div className="flex h-9 items-center rounded-lg bg-[#f3f3f5] pl-10 pr-3 text-sm text-[#0a0a0a] opacity-50">
                      {user.email}
                    </div>
                  )}
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Role – always readonly */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#0a0a0a]">
                  Роль
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]">
                    <MembersIcon className="h-4 w-4" />
                  </span>
                  <div className="flex h-9 items-center rounded-lg bg-[#f8fafc] pl-10 pr-3 text-sm text-[#0a0a0a] opacity-50">
                    {roleName}
                  </div>
                </div>
                <p className="text-xs text-[#62748e]">
                  Для зміни ролі зверніться до адміністратора
                </p>
              </div>

              {/* Position */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#0a0a0a]">
                  Посада
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]">
                    <MembersIcon className="h-4 w-4" />
                  </span>
                  {editing ? (
                    <input
                      {...register("position")}
                      className="h-9 w-full rounded-lg border border-[#e2e8f0] bg-white pl-10 pr-3 text-sm text-[#0a0a0a] outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]"
                    />
                  ) : (
                    <div className="flex h-9 items-center rounded-lg bg-[#f3f3f5] pl-10 pr-3 text-sm text-[#0a0a0a] opacity-50">
                      {user.position || "—"}
                    </div>
                  )}
                </div>
                {errors.position && (
                  <p className="text-xs text-red-500">
                    {errors.position.message}
                  </p>
                )}
              </div>
            </div>
          </article>
        </div>
      </div>
    </DashboardLayout>
  );
}
