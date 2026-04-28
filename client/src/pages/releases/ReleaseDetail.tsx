import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import DashboardLayout from "~/components/dashboard-layout/DashboardLayout";
import Badge from "~/components/badge/Badge";
import Button from "~/components/button/Button";
import { releaseService } from "~/services/release-service";
import { useAuthContext } from "~/context/authContext";
import { getTaskCode } from "~/utils/project-key";
import type { BadgeVariant } from "~/components/badge/Badge";
import {
  CalendarIcon,
  ChevronRightIcon,
  FolderIcon,
  GoalIcon,
} from "~/components/svg/Svg";

function taskStatusBadge(s: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    todo: "planning",
    in_progress: "active",
    in_review: "review",
    done: "done",
    blocked: "blocked",
  };
  return map[s] ?? "planning";
}

function taskStatusLabel(s: string): string {
  const map: Record<string, string> = {
    todo: "To Do",
    in_progress: "In Progress",
    in_review: "In Review",
    done: "Done",
    blocked: "Blocked",
  };
  return map[s] ?? s;
}

function priorityVariant(p: string): BadgeVariant {
  if (p === "low" || p === "medium" || p === "high" || p === "critical")
    return p;
  return "medium";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ReleaseDetail() {
  const { releaseId } = useParams<{ releaseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const canManage = user?.role?.name !== "Developer";

  const { data, isLoading, error } = useQuery({
    queryKey: ["release", releaseId],
    queryFn: () => releaseService.get(releaseId!),
    enabled: Boolean(releaseId),
  });

  const release = data?.release;

  const completeMut = useMutation({
    mutationFn: () =>
      releaseService.update(release!.id, { status: "completed" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["release", releaseId] });
      void queryClient.invalidateQueries({ queryKey: ["releases"] });
    },
  });

  if (!releaseId) {
    return (
      <DashboardLayout>
        <p className="text-sm text-[#62748e]">Некоректне посилання</p>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-24 text-sm text-[#62748e]">
          Завантаження…
        </div>
      </DashboardLayout>
    );
  }

  if (error || !release) {
    return (
      <DashboardLayout>
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : "Реліз не знайдено"}
        </p>
        <Link
          to="/releases"
          className="mt-4 inline-block text-sm font-medium text-[#3b82f6]"
        >
          ← До списку релізів
        </Link>
      </DashboardLayout>
    );
  }

  const tasks = release.sprint?.tasks ?? [];
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const allDone = tasks.length === 0 || doneCount === tasks.length;
  const storyPointsTotal = tasks.reduce((s, t) => s + (t.storyPoint ?? 0), 0);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate("/releases")}
          className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#62748e] transition-colors hover:text-[#0f172b]"
        >
          <ChevronRightIcon className="rotate-180" />
          Назад до релізів
        </button>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-[#0f172b]">
              {release.version}
            </h1>
            {release.status === "completed" ? (
              <span className="rounded-lg bg-[#d0fae5] px-2.5 py-0.5 text-xs font-medium text-[#007a55]">
                Випущено
              </span>
            ) : (
              <span className="rounded-lg bg-[#dbeafe] px-2.5 py-0.5 text-xs font-medium text-[#1447e6]">
                Запланований
              </span>
            )}
          </div>
          {release.name ? (
            <p className="mt-2 text-lg text-[#314158]">{release.name}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[#45556c]">
            <span className="flex items-center gap-1.5">
              <FolderIcon className="h-4 w-4 shrink-0" />
              {release.project.name}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="h-4 w-4 shrink-0" />
              {formatDate(release.releaseDate)}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 gap-3">
          {canManage &&
          release.status === "planned" &&
          !completeMut.isPending ? (
            <Button
              className="cursor-pointer"
              type="button"
              variant="outlined"
              onClick={() => completeMut.mutate()}
              disabled={!allDone}
              title={!allDone ? `Не всі задачі виконано (${doneCount}/${tasks.length})` : undefined}
            >
              Випустити
            </Button>
          ) : null}
          {completeMut.isPending ? (
            <span className="text-sm text-[#62748e]">Збереження…</span>
          ) : null}
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-[14px] border border-black/10 bg-white p-6">
          <p className="text-sm font-medium text-[#45556c]">Задачі</p>
          <p className="mt-2 text-2xl font-bold text-[#0f172b]">
            {tasks.length}
          </p>
          <p className="mt-1 text-xs text-[#62748e]">
            Виконано: {doneCount} (
            {tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0}%)
          </p>
        </div>
        <div className="rounded-[14px] border border-black/10 bg-white p-6">
          <p className="text-sm font-medium text-[#45556c]">
            Story points (спринт)
          </p>
          <p className="mt-2 text-2xl font-bold text-[#0f172b]">
            {storyPointsTotal}
          </p>
          <p className="mt-1 text-xs text-[#62748e]">
            Сума оцінок у задачах спринту
          </p>
        </div>
        <div className="rounded-[14px] border border-black/10 bg-white p-6">
          <p className="text-sm font-medium text-[#45556c]">Спринт</p>
          <p className="mt-2 text-base font-semibold text-[#0f172b]">
            {release.sprint ? release.sprint.name : "—"}
          </p>
          <p className="mt-1 text-xs text-[#62748e]">
            {release.sprint
              ? `${formatDate(release.sprint.startDate)} — ${formatDate(release.sprint.endDate)}`
              : "Не прив’язано"}
          </p>
        </div>
      </div>

      {release.sprint?.goal ? (
        <div className="mb-6 flex gap-3 rounded-[14px] border border-black/10 bg-white p-6">
          <GoalIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#3b82f6]" />
          <div>
            <p className="text-sm font-medium text-[#45556c]">Мета спринту</p>
            <p className="mt-2 text-sm leading-6 text-[#0f172b]">
              {release.sprint.goal}
            </p>
          </div>
        </div>
      ) : null}

      {release.notes ? (
        <div className="mb-6 rounded-[14px] border border-black/10 bg-white p-6">
          <p className="text-sm font-medium text-[#45556c]">
            Примітки до релізу
          </p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#314158]">
            {release.notes}
          </p>
        </div>
      ) : null}

      <div className="rounded-[14px] border border-black/10 bg-white">
        <div className="border-b border-[#e2e8f0] px-6 pt-6 pb-4">
          <h2 className="text-lg font-semibold text-[#0a0a0a]">
            Задачі в релізі
          </h2>
          <p className="mt-1 text-sm text-[#717182]">
            Усі тікети з прив’язаного спринту до цієї версії продукту
          </p>
        </div>
        {!release.sprint || tasks.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-[#62748e]">
            {!release.sprint
              ? "До цього релізу не прив’язано спринт — задачі недоступні."
              : "У спринті ще немає задач."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] text-[#45556c]">
                  <th className="px-6 py-3 font-medium">Код</th>
                  <th className="py-3 pr-6 font-medium">Назва</th>
                  <th className="py-3 pr-6 font-medium">Статус</th>
                  <th className="py-3 pr-6 font-medium">Пріоритет</th>
                  <th className="py-3 pr-6 font-medium">Виконавець</th>
                  <th className="py-3 pr-6 font-medium text-right">SP</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-[#f1f5f9] last:border-0"
                  >
                    <td className="px-6 py-3">
                      <Link
                        to={`/board/${t.id}`}
                        className="font-medium text-[#3b82f6] hover:underline"
                      >
                        {getTaskCode(release.project.name, t.id)}
                      </Link>
                    </td>
                    <td className="max-w-xs py-3 pr-6">
                      <Link
                        to={`/board/${t.id}`}
                        className="line-clamp-2 text-[#0f172b] hover:text-[#3b82f6]"
                      >
                        {t.title}
                      </Link>
                    </td>
                    <td className="py-3 pr-6">
                      <Badge
                        variant={taskStatusBadge(t.status)}
                        label={taskStatusLabel(t.status)}
                      />
                    </td>
                    <td className="py-3 pr-6">
                      <Badge variant={priorityVariant(t.priority)} />
                    </td>
                    <td className="py-3 pr-6 text-[#45556c]">
                      {t.assignee?.fullName ?? "—"}
                    </td>
                    <td className="py-3 pr-6 text-right text-[#0f172b]">
                      {t.storyPoint ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
