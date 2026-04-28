export const URLs = {
  auth: {
    signup: "/auth/register",
    login: "/auth/login",
    me: "/auth/me",
    updateMe: "/auth/me",
  },
  projects: {
    list: "/projects",
    create: "/projects",
    byId: (id: string) => `/projects/${id}`,
    delete: (id: string) => `/projects/${id}`,
  },
  users: {
    list: "/users",
    byEmail: "/users/by-email",
    create: "/users",
    byId: (id: string) => `/users/${id}`,
    roles: (id: string) => `/users/${id}/roles`,
  },
  roles: {
    list: "/roles",
  },
  teams: {
    list: "/teams",
    create: "/teams",
    byId: (id: string) => `/teams/${id}`,
    members: (id: string) => `/teams/${id}/members`,
    member: (id: string, userId: string) => `/teams/${id}/members/${userId}`,
  },
  sprints: {
    list: "/sprints",
    create: "/sprints",
    byId: (id: string) => `/sprints/${id}`,
    close: (id: string) => `/sprints/${id}/close`,
  },
  tasks: {
    list: "/tasks",
    create: "/tasks",
    byId: (id: string) => `/tasks/${id}`,
    status: (id: string) => `/tasks/${id}/status`,
    history: (id: string) => `/tasks/${id}/history`,
  },
  comments: {
    byTask: (taskId: string) => `/comments/task/${taskId}`,
    create: "/comments",
  },
  releases: {
    list: "/releases",
    create: "/releases",
    byId: (id: string) => `/releases/${id}`,
  },
  admin: {
    seed: "/admin/seed",
    clear: "/admin/clear",
  },
  analytics: {
    projectSummary: "/analytics/project-summary",
    sprintVelocity: "/analytics/sprint-velocity",
    sprintStats: "/analytics/sprint-stats",
    reportData: "/analytics/report-data",
  },
} as const;
