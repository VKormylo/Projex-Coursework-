import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "~/components/dashboard-layout/DashboardLayout";
import Button from "~/components/button/Button";
import ConfirmDialog from "~/components/confirm-dialog/ConfirmDialog";
import { PlusIcon } from "~/components/svg/Svg";
import CreateReleaseDialog, {
  type ReleaseFormValues,
} from "./CreateReleaseDialog";
import { releaseService } from "~/services/release-service";
import { projectService } from "~/services/project-service";
import { sprintService } from "~/services/sprint-service";
import { useAuthContext } from "~/context/authContext";
import type { ReleaseDto } from "~/types/release.types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: "planned" | "released" }) {
  if (status === "planned") {
    return (
      <span className="rounded-lg bg-[#dbeafe] px-2.5 py-0.5 text-xs font-medium text-[#1447e6]">
        Запланований
      </span>
    );
  }
  return (
    <span className="rounded-lg bg-[#d0fae5] px-2.5 py-0.5 text-xs font-medium text-[#007a55]">
      Випущений
    </span>
  );
}

function MoreMenu({
  onEdit,
  onDelete,
  canEdit = true,
}: {
  onEdit: () => void;
  onDelete: () => void;
  canEdit?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-9 cursor-pointer items-center justify-center rounded-lg text-[#45556c] transition hover:bg-[#f1f5f9]"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="3" r="1.2" fill="currentColor" />
          <circle cx="8" cy="8" r="1.2" fill="currentColor" />
          <circle cx="8" cy="13" r="1.2" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-gray-100 bg-white py-1 shadow-xl">
            {canEdit ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onEdit();
                }}
                className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm text-[#0f172b] hover:bg-[#f8fafc]"
              >
                Редагувати
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Видалити
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ReleaseCard({
  release,
  onEdit,
  onDelete,
  canManage,
}: {
  release: ReleaseDto;
  onEdit: (r: ReleaseDto) => void;
  onDelete: (r: ReleaseDto) => void;
  canManage: boolean;
}) {
  const navigate = useNavigate();
  const status: "planned" | "released" =
    release.status === "completed" ? "released" : "planned";
  const tasks = release.sprint?.tasks ?? [];
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/releases/${release.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`/releases/${release.id}`);
        }
      }}
      className="flex cursor-pointer flex-col gap-4 rounded-[10px] border border-[#e2e8f0] bg-white px-6 pt-6 pb-1 outline-none ring-offset-2 transition-colors hover:bg-[#f8fafc] focus-visible:ring-2 focus-visible:ring-[#3b82f6]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-[#dbeafe]">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="text-[#3b82f6]"
            >
              <path
                d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xl font-bold text-[#0f172b]">
                {release.version}
              </span>
              <StatusBadge status={status} />
            </div>
            <p className="text-[18px] leading-7 text-[#314158]">
              {release.name}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#45556c]">
              <span className="flex items-center gap-1">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect
                    x="2"
                    y="3"
                    width="12"
                    height="11"
                    rx="1.5"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                  <path
                    d="M5 1.5V4M11 1.5V4M2 6.5h12"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </svg>
                {formatDate(release.releaseDate)}
              </span>
              {release.sprint && (
                <span className="flex items-center gap-1">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect
                      x="2"
                      y="2"
                      width="12"
                      height="12"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="1.3"
                    />
                    <path
                      d="M5 8h6M5 5.5h3M5 10.5h4"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                    />
                  </svg>
                  {release.sprint.name}
                </span>
              )}
            </div>
          </div>
        </div>
        {canManage ? (
          <MoreMenu
            onEdit={() => onEdit(release)}
            onDelete={() => onDelete(release)}
            canEdit={release.status !== "completed"}
          />
        ) : null}
      </div>

      {release.notes ? (
        <p className="text-sm leading-5 text-[#45556c]">{release.notes}</p>
      ) : null}

      <div className="flex flex-col gap-2 pb-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#45556c]">Прогрес виконання</span>
          <span className="font-medium text-[#0f172b]">
            {done} / {total} задач ({percent}%)
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
          <div
            className="h-2 rounded-full bg-[#155dfc] transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function Releases() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const isDeveloper = user?.role?.name === "Developer";
  const [createOpen, setCreateOpen] = useState(false);
  const [editRelease, setEditRelease] = useState<ReleaseDto | null>(null);
  const [deleteReleaseTarget, setDeleteReleaseTarget] =
    useState<ReleaseDto | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const { data: releasesData, isLoading } = useQuery({
    queryKey: ["releases"],
    queryFn: () => releaseService.list(),
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectService.list(),
  });

  const { data: sprintsData } = useQuery({
    queryKey: ["sprints"],
    queryFn: () => sprintService.list(),
  });

  const releases = releasesData?.releases ?? [];
  const projects = (projectsData?.projects ?? []).filter(
    (p) => p.status === "active",
  );
  const sprints = sprintsData?.sprints ?? [];

  const { mutate: createRelease, isPending: isCreating } = useMutation({
    mutationFn: (vals: ReleaseFormValues) =>
      releaseService.create({
        projectId: vals.projectId,
        sprintId: vals.sprintId || null,
        version: vals.version,
        name: vals.name,
        releaseDate: vals.releaseDate,
        notes: vals.notes || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["releases"] });
      setCreateOpen(false);
      setApiError(null);
    },
    onError: (err: Error) => setApiError(err.message),
  });

  const { mutate: updateRelease, isPending: isUpdating } = useMutation({
    mutationFn: (vals: ReleaseFormValues) =>
      releaseService.update(editRelease!.id, {
        projectId: vals.projectId,
        sprintId: vals.sprintId || null,
        version: vals.version,
        name: vals.name,
        releaseDate: vals.releaseDate,
        notes: vals.notes || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["releases"] });
      setEditRelease(null);
      setApiError(null);
    },
    onError: (err: Error) => setApiError(err.message),
  });

  const { mutate: deleteRelease, isPending: isDeletingRelease } = useMutation({
    mutationFn: (id: string) => releaseService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["releases"] });
      setDeleteReleaseTarget(null);
    },
  });

  function handleFormSubmit(vals: ReleaseFormValues) {
    if (editRelease) {
      updateRelease(vals);
    } else {
      createRelease(vals);
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[30px] font-bold leading-9 text-[#0f172b]">Релізи</h1>
            <p className="mt-1 text-base text-[#45556c]">
              Керуйте версіями та релізами продукту
            </p>
          </div>
          {!isDeveloper ? (
            <Button onClick={() => setCreateOpen(true)}>
              <PlusIcon />
              <span className="pl-1">Створити реліз</span>
            </Button>
          ) : null}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-sm text-[#45556c]">
            Завантаження…
          </div>
        ) : releases.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e2e8f0] py-20 text-center">
            <p className="text-base font-medium text-[#45556c]">
              Немає релізів
            </p>
            <p className="mt-1 text-sm text-[#94a3b8]">
              Натисніть «Створити реліз», щоб додати перший
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {releases.map((r) => (
              <ReleaseCard
                key={r.id}
                release={r}
                onEdit={(rel) => {
                  setEditRelease(rel);
                  setApiError(null);
                }}
                onDelete={(rel) => setDeleteReleaseTarget(rel)}
                canManage={!isDeveloper}
              />
            ))}
          </div>
        )}
      </div>

      <CreateReleaseDialog
        open={createOpen || Boolean(editRelease)}
        onClose={() => {
          setCreateOpen(false);
          setEditRelease(null);
          setApiError(null);
        }}
        onSubmit={handleFormSubmit}
        isPending={isCreating || isUpdating}
        apiError={apiError}
        release={editRelease ?? undefined}
        projects={projects}
        sprints={sprints}
      />

      <ConfirmDialog
        open={Boolean(deleteReleaseTarget)}
        onClose={() => setDeleteReleaseTarget(null)}
        onCancel={() => setDeleteReleaseTarget(null)}
        onConfirm={() => {
          if (deleteReleaseTarget) deleteRelease(deleteReleaseTarget.id);
        }}
        isPending={isDeletingRelease}
        title="Видалити реліз?"
        description="Цю дію не можна скасувати."
      >
        <p className="text-sm text-[#45556c]">
          Реліз{" "}
          <span className="font-medium text-[#0f172b]">
            {deleteReleaseTarget?.version}
          </span>{" "}
          буде видалено назавжди.
        </p>
      </ConfirmDialog>
    </DashboardLayout>
  );
}
