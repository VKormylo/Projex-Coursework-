import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import DashboardLayout from "~/components/dashboard-layout/DashboardLayout";
import Badge from "~/components/badge/Badge";
import { ChevronDownIcon } from "~/components/svg/Svg";
import { userService } from "~/services/user-service";
import { teamService } from "~/services/team-service";
import { useAuthContext } from "~/context/authContext";
import { useClickOutside } from "~/hooks/useClickOutside";
import type { AdminUserDto, TeamDto, RoleDto } from "~/types/project.types";

// ─── helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getUserPrimaryRole(user: AdminUserDto): string {
  return user.role?.name ?? "Немає ролі";
}

function roleBadgeClass(role: string): string {
  if (role === "Admin") return "text-[#7c3aed] bg-[#ede9fe]";
  if (role === "Project Manager") return "text-[#0369a1] bg-[#e0f2fe]";
  if (role === "Developer") return "text-[#166534] bg-[#dcfce7]";
  return "text-[#6b7280] bg-[#f3f4f6]";
}

function hasRole(user: { role?: { name: string } | null }, roleName: string) {
  return user.role?.name === roleName;
}

type TabId = "users" | "teams";

// ─── shared sub-components ────────────────────────────────────────────────────

function UserAvatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md";
}) {
  const colors = [
    "bg-blue-200 text-blue-800",
    "bg-green-200 text-green-800",
    "bg-purple-200 text-purple-800",
    "bg-orange-200 text-orange-800",
    "bg-pink-200 text-pink-800",
    "bg-teal-200 text-teal-800",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  const cls = size === "sm" ? "w-7 h-7 text-xs" : "w-10 h-10 text-sm";
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-medium ${color} ${cls}`}
    >
      {getInitials(name)}
    </span>
  );
}

// ─── schemas ──────────────────────────────────────────────────────────────────

const createUserSchema = z.object({
  fullName: z.string().min(2, "Мінімум 2 символи"),
  email: z.string().email("Невалідний email"),
  password: z.string().min(8, "Мінімум 8 символів"),
  position: z.string().min(2, "Мінімум 2 символи"),
});
type CreateUserForm = z.infer<typeof createUserSchema>;

const editUserSchema = z.object({
  fullName: z.string().min(2, "Мінімум 2 символи"),
  email: z.string().email("Невалідний email"),
  position: z.string().min(2, "Мінімум 2 символи"),
});
type EditUserForm = z.infer<typeof editUserSchema>;

const teamSchema = z.object({ name: z.string().min(2, "Мінімум 2 символи") });
type TeamForm = z.infer<typeof teamSchema>;

// ─── Create User Dialog ───────────────────────────────────────────────────────

function CreateUserDialog({
  roles,
  onClose,
  onCreated,
}: {
  roles: RoleDto[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const qc = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
  });

  const createMut = useMutation({
    mutationFn: userService.create,
    onSuccess: async (res) => {
      if (selectedRole) await userService.assignRole(res.user.id, selectedRole);
      await qc.invalidateQueries({ queryKey: ["users"] });
      onCreated();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">
          Додати користувача
        </h2>
        <form
          onSubmit={handleSubmit((d) => createMut.mutate(d))}
          className="space-y-4"
        >
          {(
            [
              {
                name: "fullName",
                label: "Повне ім'я",
                placeholder: "Іван Іваненко",
                type: "text",
              },
              {
                name: "email",
                label: "Email",
                placeholder: "ivan@company.com",
                type: "email",
              },
              {
                name: "password",
                label: "Пароль",
                placeholder: "Мінімум 8 символів",
                type: "password",
              },
              {
                name: "position",
                label: "Посада",
                placeholder: "Frontend Developer",
                type: "text",
              },
            ] as const
          ).map(({ name, label, placeholder, type }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              <input
                {...register(name)}
                type={type}
                placeholder={placeholder}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/40"
              />
              {errors[name] && (
                <p className="text-red-500 text-xs mt-1">
                  {errors[name]?.message}
                </p>
              )}
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Роль
            </label>
            <select
              value={selectedRole ?? ""}
              onChange={(e) =>
                setSelectedRole(e.target.value ? Number(e.target.value) : null)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/40 bg-white"
            >
              <option value="">Без ролі</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          {createMut.isError && (
            <p className="text-red-500 text-sm">Помилка при створенні</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={createMut.isPending}
              className="px-4 py-2 rounded-lg bg-[#3b82f6] text-sm text-white font-medium hover:bg-[#2563eb] transition-colors disabled:opacity-50"
            >
              {createMut.isPending ? "Збереження..." : "Додати"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit User Dialog ─────────────────────────────────────────────────────────

function EditUserDialog({
  user,
  roles,
  onClose,
}: {
  user: AdminUserDto;
  roles: RoleDto[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const currentRoleId = user.role?.id ?? null;
  const [selectedRole, setSelectedRole] = useState<number | null>(
    currentRoleId,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      fullName: user.fullName,
      email: user.email,
      position: user.position,
    },
  });

  const updateMut = useMutation({
    mutationFn: (data: EditUserForm) => userService.update(user.id, data),
    onSuccess: async () => {
      if (selectedRole && selectedRole !== currentRoleId)
        await userService.assignRole(user.id, selectedRole);
      await qc.invalidateQueries({ queryKey: ["users"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">
          Редагувати користувача
        </h2>
        <form
          onSubmit={handleSubmit((d) => updateMut.mutate(d))}
          className="space-y-4"
        >
          {(
            [
              { name: "fullName", label: "Повне ім'я", type: "text" },
              { name: "email", label: "Email", type: "email" },
              { name: "position", label: "Посада", type: "text" },
            ] as const
          ).map(({ name, label, type }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              <input
                {...register(name)}
                type={type}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/40"
              />
              {errors[name] && (
                <p className="text-red-500 text-xs mt-1">
                  {errors[name]?.message}
                </p>
              )}
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Роль
            </label>
            <select
              value={selectedRole ?? ""}
              onChange={(e) =>
                setSelectedRole(e.target.value ? Number(e.target.value) : null)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/40 bg-white"
            >
              <option value="">Без ролі</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          {updateMut.isError && (
            <p className="text-red-500 text-sm">Помилка при оновленні</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={updateMut.isPending}
              className="px-4 py-2 rounded-lg bg-[#3b82f6] text-sm text-white font-medium hover:bg-[#2563eb] transition-colors disabled:opacity-50"
            >
              {updateMut.isPending ? "Збереження..." : "Зберегти"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add Member Dialog (by email) ─────────────────────────────────────────────

function AddMemberDialog({
  team,
  onClose,
}: {
  team: TeamDto;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [found, setFound] = useState<AdminUserDto | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searching, setSearching] = useState(false);

  const teamMembers = team.teamMember ?? [];
  const isAlreadyMember = (userId: string) =>
    teamMembers.some((m) => m.userId === userId);

  async function handleSearch() {
    if (!email.trim()) return;
    setSearching(true);
    setFound(null);
    setNotFound(false);
    try {
      const res = await userService.findByEmail(email.trim());
      setFound(res.user);
    } catch {
      setNotFound(true);
    } finally {
      setSearching(false);
    }
  }

  const addMut = useMutation({
    mutationFn: async () => {
      if (!found) return;
      await teamService.addMember(team.id, found.id);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["teams"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Додати учасника до команди
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Команда:{" "}
          <span className="font-medium text-gray-700">{team.name}</span>
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email користувача
            </label>
            <div className="flex gap-2">
              <input
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFound(null);
                  setNotFound(false);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                type="email"
                placeholder="user@company.com"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/40"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={searching || !email.trim()}
                className="px-4 py-2 rounded-lg bg-[#f3f3f5] text-sm font-medium text-gray-700 hover:bg-[#ebebed] transition-colors disabled:opacity-50"
              >
                {searching ? "..." : "Знайти"}
              </button>
            </div>
            {notFound && (
              <p className="text-red-500 text-xs mt-1">
                Користувача з таким email не знайдено
              </p>
            )}
          </div>

          {found && (
            <div className="rounded-xl border border-gray-200 p-3 bg-gray-50">
              <div className="flex items-center gap-3">
                <UserAvatar name={found.fullName} />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {found.fullName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {found.email} · {found.position}
                  </p>
                </div>
                {isAlreadyMember(found.id) && (
                  <span className="ml-auto text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">
                    Вже в команді
                  </span>
                )}
              </div>
            </div>
          )}

          {addMut.isError && (
            <p className="text-red-500 text-sm">Помилка при додаванні</p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Скасувати
            </button>
            <button
              type="button"
              onClick={() => addMut.mutate()}
              disabled={!found || isAlreadyMember(found.id) || addMut.isPending}
              className="px-4 py-2 rounded-lg bg-[#3b82f6] text-sm text-white font-medium hover:bg-[#2563eb] transition-colors disabled:opacity-50"
            >
              {addMut.isPending ? "Додавання..." : "Додати до команди"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Create/Edit Team Dialog ──────────────────────────────────────────────────

function TeamDialog({
  team,
  onClose,
}: {
  team?: TeamDto | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TeamForm>({
    resolver: zodResolver(teamSchema),
    defaultValues: { name: team?.name ?? "" },
  });

  const saveMut = useMutation({
    mutationFn: async (data: TeamForm) => {
      if (team) return teamService.update(team.id, data.name);
      return teamService.create(data.name);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["teams"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">
          {team ? "Редагувати команду" : "Створити команду"}
        </h2>
        <form
          onSubmit={handleSubmit((d) => saveMut.mutate(d))}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Назва команди
            </label>
            <input
              {...register("name")}
              placeholder="Команда розробки"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/40"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>
          {saveMut.isError && (
            <p className="text-red-500 text-sm">Помилка при збереженні</p>
          )}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={saveMut.isPending}
              className="px-4 py-2 rounded-lg bg-[#3b82f6] text-sm text-white font-medium hover:bg-[#2563eb] transition-colors disabled:opacity-50"
            >
              {saveMut.isPending
                ? "Збереження..."
                : team
                  ? "Зберегти"
                  : "Створити"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── User Row Dropdown (Admin-only Users tab) ─────────────────────────────────

function UserRowDropdown({
  user,
  onEdit,
  onToggleActive,
  onAssignAdmin,
}: {
  user: AdminUserDto;
  onEdit: () => void;
  onToggleActive: () => void;
  onAssignAdmin: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isAdmin = hasRole(user, "Admin");

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleToggle() {
    if (!open && btnRef.current)
      setRect(btnRef.current.getBoundingClientRect());
    setOpen((v) => !v);
  }

  return (
    <div>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <circle cx="10" cy="4" r="1.5" />
          <circle cx="10" cy="10" r="1.5" />
          <circle cx="10" cy="16" r="1.5" />
        </svg>
      </button>
      {open &&
        rect &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: rect.bottom + 4,
              right: window.innerWidth - rect.right,
              zIndex: 9999,
            }}
            className="w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1"
          >
            <button
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4 text-gray-400"
              >
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Редагувати
            </button>
            <button
              onClick={() => {
                setOpen(false);
                onAssignAdmin();
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 transition-colors text-gray-700"
            >
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`w-4 h-4 ${isAdmin ? "text-amber-500" : "text-gray-400"}`}
              >
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              {isAdmin ? "Зняти роль Admin" : "Призначити Admin"}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                onToggleActive();
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 transition-colors text-gray-700"
            >
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`w-4 h-4 ${user.isActive ? "text-red-400" : "text-green-400"}`}
              >
                {user.isActive ? (
                  <path
                    fillRule="evenodd"
                    d="M13.477 14.89A6 6 0 015.11 6.524L13.477 14.89zm1.414-1.414L6.524 5.11A6 6 0 0114.89 13.476zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                    clipRule="evenodd"
                  />
                ) : (
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                )}
              </svg>
              {user.isActive ? "Деактивувати" : "Активувати"}
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}

// ─── Member Row Dropdown (Teams tab) ─────────────────────────────────────────

function MemberRowDropdown({
  member,
  team,
  roles,
  canMakeAdmin,
  canRemove,
}: {
  member: TeamDto["teamMember"] extends infer M
    ? M extends Array<infer T>
      ? T
      : never
    : never;
  team: TeamDto;
  roles: RoleDto[];
  canMakeAdmin: boolean;
  canRemove: boolean;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [adminConflict, setAdminConflict] = useState(false);

  const adminRoleId = roles.find((r) => r.name === "Admin")?.id ?? null;
  const devRoleId = roles.find((r) => r.name === "Developer")?.id ?? null;
  const memberUser = member.user;
  const isAdmin = hasRole(memberUser, "Admin");
  const teamAdminMember = (team.teamMember ?? []).find((m) =>
    hasRole(m.user, "Admin"),
  );

  const removeMut = useMutation({
    mutationFn: () => teamService.removeMember(team.id, member.userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teams"] }),
  });

  const assignAdminMut = useMutation({
    mutationFn: async () => {
      if (isAdmin) {
        await userService.clearRole(member.userId);
      } else {
        if (
          teamAdminMember &&
          teamAdminMember.userId !== member.userId &&
          devRoleId
        ) {
          await userService.assignRole(teamAdminMember.userId, devRoleId);
        }
        if (adminRoleId)
          await userService.assignRole(member.userId, adminRoleId);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teams", "users"] }),
  });

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleToggle() {
    if (!open && btnRef.current)
      setRect(btnRef.current.getBoundingClientRect());
    setOpen((v) => !v);
  }

  function handleMakeAdmin() {
    setOpen(false);
    if (
      !isAdmin &&
      teamAdminMember &&
      teamAdminMember.userId !== member.userId
    ) {
      setAdminConflict(true);
      return;
    }
    assignAdminMut.mutate();
  }

  return (
    <>
      {adminConflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Замінити адміністратора команди?
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              Поточний адміністратор —{" "}
              <span className="font-medium">
                {teamAdminMember?.user.fullName}
              </span>
              . Він буде переведений у роль Developer. Продовжити?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setAdminConflict(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Скасувати
              </button>
              <button
                onClick={() => {
                  setAdminConflict(false);
                  assignAdminMut.mutate();
                }}
                className="px-4 py-2 rounded-lg bg-[#3b82f6] text-sm text-white font-medium hover:bg-[#2563eb] transition-colors"
              >
                Замінити
              </button>
            </div>
          </div>
        </div>
      )}
      <div>
        <button
          ref={btnRef}
          onClick={handleToggle}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <circle cx="10" cy="4" r="1.5" />
            <circle cx="10" cy="10" r="1.5" />
            <circle cx="10" cy="16" r="1.5" />
          </svg>
        </button>
        {open &&
          rect &&
          createPortal(
            <div
              ref={menuRef}
              style={{
                position: "fixed",
                top: rect.bottom + 4,
                right: window.innerWidth - rect.right,
                zIndex: 9999,
              }}
              className="w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1"
            >
              {canMakeAdmin && (
                <button
                  onClick={handleMakeAdmin}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`w-4 h-4 ${isAdmin ? "text-amber-500" : "text-gray-400"}`}
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {isAdmin ? "Зняти Admin" : "Призначити Admin"}
                </button>
              )}
              {canRemove && (
                <button
                  onClick={() => {
                    setOpen(false);
                    removeMut.mutate();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M13.477 14.89A6 6 0 015.11 6.524L13.477 14.89zm1.414-1.414L6.524 5.11A6 6 0 0114.89 13.476zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Видалити з команди
                </button>
              )}
            </div>,
            document.body,
          )}
      </div>
    </>
  );
}

// ─── Users Tab (Admin only) ───────────────────────────────────────────────────

function UsersTab({
  users,
  roles,
}: {
  users: AdminUserDto[];
  roles: RoleDto[];
}) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleDropOpen, setRoleDropOpen] = useState(false);
  const [statusDropOpen, setStatusDropOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<AdminUserDto | null>(null);

  const roleDropRef = useClickOutside<HTMLDivElement>(() =>
    setRoleDropOpen(false),
  );
  const statusDropRef = useClickOutside<HTMLDivElement>(() =>
    setStatusDropOpen(false),
  );

  const adminRoleId = roles.find((r) => r.name === "Admin")?.id ?? null;
  const devRoleId = roles.find((r) => r.name === "Developer")?.id ?? null;

  const toggleActiveMut = useMutation({
    mutationFn: (u: AdminUserDto) =>
      userService.update(u.id, { isActive: !u.isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  const assignAdminMut = useMutation({
    mutationFn: async (u: AdminUserDto) => {
      const isAdmin = hasRole(u, "Admin");
      const roleToAssign = isAdmin ? devRoleId : adminRoleId;
      if (roleToAssign) await userService.assignRole(u.id, roleToAssign);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => u.isActive).length,
      pms: users.filter((u) => u.role?.name === "Project Manager").length,
      devs: users.filter((u) => u.role?.name === "Developer").length,
    }),
    [users],
  );

  const roleOptions = useMemo(() => ["", ...roles.map((r) => r.name)], [roles]);

  const filtered = useMemo(
    () =>
      users.filter((u) => {
        const matchSearch =
          !search ||
          u.fullName.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase());
        const matchRole = !roleFilter || u.role?.name === roleFilter;
        const matchStatus =
          !statusFilter ||
          (statusFilter === "active" ? u.isActive : !u.isActive);
        return matchSearch && matchRole && matchStatus;
      }),
    [users, search, roleFilter, statusFilter],
  );

  return (
    <>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172b]">Адміністрування</h1>
          <p className="text-sm text-[#45556c] mt-1">
            Керування користувачами та ролями системи
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#3b82f6] text-white text-sm font-medium rounded-lg hover:bg-[#2563eb] transition-colors"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Додати користувача
        </button>
      </div>

      {/* stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Всього користувачів",
            value: stats.total,
            color: "text-[#0f172b]",
          },
          { label: "Активні", value: stats.active, color: "text-[#16a34a]" },
          {
            label: "Project Managers",
            value: stats.pms,
            color: "text-[#0369a1]",
          },
          { label: "Developers", value: stats.devs, color: "text-[#7c3aed]" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-[#e2e8f0] px-5 py-4"
          >
            <p className="text-sm text-[#45556c]">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* filters */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] px-5 py-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#717182]"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Пошук користувача..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/30"
            />
          </div>

          <div ref={roleDropRef} className="relative">
            <button
              onClick={() => setRoleDropOpen((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm text-[#45556c] hover:bg-[#f1f5f9] transition-colors min-w-40"
            >
              <span className="flex-1 text-left">
                {roleFilter || "Всі ролі"}
              </span>
              <ChevronDownIcon
                className={`w-4 h-4 shrink-0 transition-transform ${roleDropOpen ? "rotate-180" : ""}`}
              />
            </button>
            {roleDropOpen && (
              <div className="absolute left-0 z-20 mt-1 w-48 bg-white rounded-xl shadow-xl border border-[#e2e8f0] py-1">
                {roleOptions.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRoleFilter(r);
                      setRoleDropOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-[#f8fafc] transition-colors ${roleFilter === r ? "text-[#3b82f6] font-medium" : "text-[#374151]"}`}
                  >
                    {r || "Всі ролі"}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div ref={statusDropRef} className="relative">
            <button
              onClick={() => setStatusDropOpen((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-sm text-[#45556c] hover:bg-[#f1f5f9] transition-colors min-w-40"
            >
              <span className="flex-1 text-left">
                {statusFilter === "active"
                  ? "Активні"
                  : statusFilter === "inactive"
                    ? "Неактивні"
                    : "Всі статуси"}
              </span>
              <ChevronDownIcon
                className={`w-4 h-4 shrink-0 transition-transform ${statusDropOpen ? "rotate-180" : ""}`}
              />
            </button>
            {statusDropOpen && (
              <div className="absolute left-0 z-20 mt-1 w-40 bg-white rounded-xl shadow-xl border border-[#e2e8f0] py-1">
                {[
                  { value: "", label: "Всі статуси" },
                  { value: "active", label: "Активні" },
                  { value: "inactive", label: "Неактивні" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => {
                      setStatusFilter(value);
                      setStatusDropOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-[#f8fafc] transition-colors ${statusFilter === value ? "text-[#3b82f6] font-medium" : "text-[#374151]"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* table */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e2e8f0]">
              {[
                "Користувач",
                "Email",
                "Роль",
                "Статус",
                "Задач",
                "Дата приєднання",
                "Дії",
              ].map((h, i) => (
                <th
                  key={h}
                  className={`text-sm font-medium text-[#45556c] px-4 py-3 ${i === 6 ? "text-right" : "text-left"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f5f9]">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-12 text-center text-sm text-[#45556c]"
                >
                  Користувачів не знайдено
                </td>
              </tr>
            ) : (
              filtered.map((u) => {
                const primaryRole = getUserPrimaryRole(u);
                return (
                  <tr
                    key={u.id}
                    className="hover:bg-[#f8fafc]/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={u.fullName} />
                        <div>
                          <p className="text-sm font-medium text-[#0f172b]">
                            {u.fullName}
                          </p>
                          <p className="text-xs text-[#45556c]">{u.position}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#45556c]">
                      {u.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ${roleBadgeClass(primaryRole)}`}
                      >
                        {primaryRole === "Admin" && (
                          <svg
                            viewBox="0 0 12 12"
                            fill="currentColor"
                            className="w-3 h-3 mr-1"
                          >
                            <path d="M6 1l1.39 2.81L10.5 4.24l-2.25 2.19.53 3.09L6 8l-2.78 1.52.53-3.09L1.5 4.24l3.11-.43L6 1z" />
                          </svg>
                        )}
                        {primaryRole}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={u.isActive ? "active" : "cancelled"}
                        label={u.isActive ? "Активний" : "Неактивний"}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-[#45556c]">
                      {u._count.assigned}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#45556c]">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <UserRowDropdown
                        user={u}
                        onEdit={() => setEditUser(u)}
                        onToggleActive={() => toggleActiveMut.mutate(u)}
                        onAssignAdmin={() => assignAdminMut.mutate(u)}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateUserDialog
          roles={roles}
          onClose={() => setShowCreate(false)}
          onCreated={() => setShowCreate(false)}
        />
      )}
      {editUser && (
        <EditUserDialog
          user={editUser}
          roles={roles}
          onClose={() => setEditUser(null)}
        />
      )}
    </>
  );
}

// ─── Teams Tab (Admin + PM) ───────────────────────────────────────────────────

function TeamsTab({
  teams,
  roles,
  canManage,
  isAdmin: isAdminRole,
  currentUserId,
}: {
  teams: TeamDto[];
  roles: RoleDto[];
  canManage: boolean;
  isAdmin: boolean;
  currentUserId: string;
}) {
  const qc = useQueryClient();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(
    teams[0]?.id ?? null,
  );
  const [teamDropOpen, setTeamDropOpen] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [editTeam, setEditTeam] = useState<TeamDto | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);

  const teamDropRef = useClickOutside<HTMLDivElement>(() =>
    setTeamDropOpen(false),
  );

  const selectedTeam = teams.find((t) => t.id === selectedTeamId) ?? null;

  // keep selection in sync when teams list updates
  const currentTeam = selectedTeam ?? teams[0] ?? null;

  const deleteMut = useMutation({
    mutationFn: (id: string) => teamService.delete(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["teams"] });
      setSelectedTeamId(teams.find((t) => t.id !== selectedTeamId)?.id ?? null);
    },
  });

  const members = currentTeam?.teamMember ?? [];

  return (
    <>
      {/* header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172b]">Команди</h1>
          <p className="text-sm text-[#45556c] mt-1">
            Керування командами та їх учасниками
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowCreateTeam(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#3b82f6] text-white text-sm font-medium rounded-lg hover:bg-[#2563eb] transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Нова команда
          </button>
        )}
      </div>

      {teams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] py-20 text-center">
          <p className="text-[#45556c] text-sm">Команд ще немає</p>
          {canManage && (
            <button
              onClick={() => setShowCreateTeam(true)}
              className="mt-3 text-[#3b82f6] text-sm font-medium hover:underline"
            >
              Створити першу команду
            </button>
          )}
        </div>
      ) : (
        <>
          {/* team selector + actions */}
          <div className="flex items-center gap-3 mb-6">
            <div ref={teamDropRef} className="relative">
              <button
                onClick={() => setTeamDropOpen((v) => !v)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e2e8f0] bg-white text-sm font-medium text-[#0f172b] hover:bg-[#f8fafc] transition-colors min-w-48"
              >
                <span className="flex-1 text-left truncate">
                  {currentTeam?.name ?? "Виберіть команду"}
                </span>
                <ChevronDownIcon
                  className={`w-4 h-4 shrink-0 transition-transform ${teamDropOpen ? "rotate-180" : ""}`}
                />
              </button>
              {teamDropOpen && (
                <div className="absolute left-0 z-20 mt-1 w-56 bg-white rounded-xl shadow-xl border border-[#e2e8f0] py-1 max-h-56 overflow-y-auto">
                  {teams.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTeamId(t.id);
                        setTeamDropOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-[#f8fafc] transition-colors ${currentTeam?.id === t.id ? "text-[#3b82f6] font-medium" : "text-[#374151]"}`}
                    >
                      {t.name}
                      <span className="ml-1 text-xs text-[#45556c]">
                        ({t.teamMember?.length ?? 0})
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {canManage && currentTeam && (
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setEditTeam(currentTeam)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#45556c] hover:bg-[#f8fafc] transition-colors"
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Редагувати
                </button>
                <button
                  onClick={() => deleteMut.mutate(currentTeam.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 bg-white text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Видалити
                </button>
              </div>
            )}
          </div>

          {/* stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-[#e2e8f0] px-5 py-4">
              <p className="text-sm text-[#45556c]">Учасників</p>
              <p className="text-3xl font-bold text-[#0f172b] mt-1">
                {members.length}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-[#e2e8f0] px-5 py-4">
              <p className="text-sm text-[#45556c]">Активних</p>
              <p className="text-3xl font-bold text-[#16a34a] mt-1">
                {members.filter((m) => m.user.isActive).length}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-[#e2e8f0] px-5 py-4">
              <p className="text-sm text-[#45556c]">Адміністратор</p>
              <p className="text-sm font-semibold text-[#7c3aed] mt-2 truncate">
                {members.find((m) => hasRole(m.user, "Admin"))?.user.fullName ??
                  "—"}
              </p>
            </div>
          </div>

          {/* members table */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#e2e8f0]">
              <p className="text-sm font-medium text-[#0f172b]">
                Учасники команди
              </p>
              {canManage && (
                <button
                  onClick={() => setShowAddMember(true)}
                  className="flex items-center gap-1.5 text-sm text-[#3b82f6] font-medium hover:text-[#2563eb] transition-colors"
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Додати учасника
                </button>
              )}
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#f1f5f9]">
                  {["Учасник", "Email", "Посада", "Роль", "Статус", "Дії"].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={`text-sm font-medium text-[#45556c] px-4 py-3 ${i === 5 ? "text-right" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {members.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-10 text-center text-sm text-[#45556c]"
                    >
                      В цій команді ще немає учасників
                    </td>
                  </tr>
                ) : (
                  members.map((m) => {
                    const memberUser = m.user;
                    const primaryRole = getUserPrimaryRole(
                      memberUser as unknown as AdminUserDto,
                    );
                    return (
                      <tr
                        key={m.userId}
                        className="hover:bg-[#f8fafc]/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <UserAvatar name={m.user.fullName} />
                            <p className="text-sm font-medium text-[#0f172b]">
                              {m.user.fullName}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#45556c]">
                          {m.user.email}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#45556c]">
                          {m.user.position ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ${roleBadgeClass(primaryRole)}`}
                          >
                            {primaryRole === "Admin" && (
                              <svg
                                viewBox="0 0 12 12"
                                fill="currentColor"
                                className="w-3 h-3 mr-1"
                              >
                                <path d="M6 1l1.39 2.81L10.5 4.24l-2.25 2.19.53 3.09L6 8l-2.78 1.52.53-3.09L1.5 4.24l3.11-.43L6 1z" />
                              </svg>
                            )}
                            {primaryRole}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={m.user.isActive ? "active" : "cancelled"}
                            label={m.user.isActive ? "Активний" : "Неактивний"}
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canManage &&
                            currentTeam &&
                            (isAdminRole || m.userId !== currentUserId) && (
                              <MemberRowDropdown
                                member={m}
                                team={currentTeam}
                                roles={roles}
                                canMakeAdmin={isAdminRole}
                                canRemove={m.userId !== currentUserId}
                              />
                            )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {(showCreateTeam || editTeam) && (
        <TeamDialog
          team={editTeam}
          onClose={() => {
            setShowCreateTeam(false);
            setEditTeam(null);
          }}
        />
      )}
      {showAddMember && currentTeam && (
        <AddMemberDialog
          team={currentTeam}
          onClose={() => setShowAddMember(false)}
        />
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Admin() {
  const { user } = useAuthContext();
  const isAdmin = user?.role?.name === "Admin";
  const isPM = user?.role?.name === "Project Manager";

  const [tab, setTab] = useState<TabId>(() => (isAdmin ? "users" : "teams"));

  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => userService.list(),
    select: (r) => r.users,
    enabled: isAdmin,
  });

  const { data: rolesData } = useQuery({
    queryKey: ["roles"],
    queryFn: () => userService.listRoles(),
    select: (r) => r.roles,
  });

  const { data: teamsData } = useQuery({
    queryKey: ["teams"],
    queryFn: () => teamService.list(),
    select: (r) => r.teams,
  });

  const users = usersData ?? [];
  const roles = rolesData ?? [];
  const teams = teamsData ?? [];

  const showBothTabs = isAdmin;
  const canManageTeams = isAdmin || isPM;

  return (
    <DashboardLayout>
      <div>
        {/* tabs — only show switcher when Admin (who sees both) */}
        {showBothTabs && (
          <div className="flex gap-1 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-1 w-fit mb-6">
            {(
              [
                { id: "users", label: "Користувачі" },
                { id: "teams", label: "Команди" },
              ] as { id: TabId; label: string }[]
            ).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`rounded-md px-4 py-1.25 text-sm font-medium transition ${
                  tab === id
                    ? "bg-white text-[#0f172b] shadow-sm"
                    : "text-[#45556c] hover:text-[#0f172b]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {tab === "users" && isAdmin && <UsersTab users={users} roles={roles} />}
        {(tab === "teams" || !showBothTabs) && (
          <TeamsTab
            teams={teams}
            roles={roles}
            canManage={canManageTeams}
            isAdmin={isAdmin}
            currentUserId={user?.id ?? ""}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
