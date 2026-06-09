import axios, { type AxiosInstance } from "axios";
import type {
  LoginRequest,
  LoginResponse,
  Project,
  Task,
  Milestone,
  Comment,
  Notification,
  AuditLog,
  RoleConfig,
  ProjectTemplate,
  User,
} from "@pm/types";

export interface ApiClientOptions {
  /** Backend base URL, e.g. https://projectmanager-api.onrender.com */
  baseURL: string;
  /** Returns the current JWT (sync or async). Platform injects storage. */
  getToken?: () => string | null | Promise<string | null>;
  /** Called when the API returns 401 (e.g. to log the user out). */
  onUnauthorized?: () => void;
}

/**
 * Creates a configured, typed REST client shared by web and mobile.
 * The platform supplies `getToken` (localStorage on web, SecureStore on mobile).
 */
export function createApiClient(opts: ApiClientOptions) {
  const http: AxiosInstance = axios.create({ baseURL: opts.baseURL });

  http.interceptors.request.use(async (config) => {
    const token = opts.getToken ? await opts.getToken() : null;
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
    return config;
  });

  http.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err?.response?.status === 401 && opts.onUnauthorized) opts.onUnauthorized();
      return Promise.reject(err);
    }
  );

  const get = <T>(url: string, params?: object) => http.get<T>(url, { params }).then((r) => r.data);
  const post = <T>(url: string, body?: object) => http.post<T>(url, body).then((r) => r.data);
  const put = <T>(url: string, body?: object) => http.put<T>(url, body).then((r) => r.data);
  const del = <T>(url: string) => http.delete<T>(url).then((r) => r.data);

  return {
    http,

    auth: {
      login: (body: LoginRequest) => post<LoginResponse>("/api/auth/login", body),
      profile: () => get<{ user: User }>("/api/auth/profile"),
      updateProfile: (body: FormData) =>
        http.put("/api/auth/update-profile", body, {
          headers: { "Content-Type": "multipart/form-data" },
        }).then((r) => r.data),
      forgotPassword: (email: string) => post("/api/auth/forgot-password", { email }),
      resetPassword: (token: string, password: string) =>
        post("/api/auth/reset-password", { token, password }),
      myManagers: () => get<User[]>("/api/auth/my-managers"),
      myOpics: () => get<User[]>("/api/auth/my-opics"),
      getAdmins: () => get<User[]>("/api/auth/get-admin"),
      usersByTeam: (team: string) => get<User[]>(`/api/auth/users/by-team/${team}`),
      createUser: (role: "admin" | "manager" | "opic", body: object) =>
        post(`/api/auth/create/${role}`, body),
      deleteUser: (role: "admin" | "manager" | "opic", id: string) =>
        del(`/api/auth/delete/${role}/${id}`),
    },

    projects: {
      list: () => get<Project[]>("/api/project/view"),
      stats: () => get<Record<string, unknown>>("/api/project/stats"),
      performance: () => get<unknown>("/api/project/overall-performance"),
      create: (body: object) => post<Project>("/api/project/create", body),
      update: (id: string, body: object) => put<Project>(`/api/project/update/${id}`, body),
      remove: (id: string) => del(`/api/project/delete/${id}`),
      copy: (id: string) => post<Project>(`/api/project/copy/${id}`),
      milestones: (projectId: string) => get<Milestone[]>(`/api/project/milestones/${projectId}`),
      createMilestone: (projectId: string, body: object) =>
        post<Milestone>(`/api/project/createMilestone/${projectId}`, body),
      updateMilestone: (milestoneId: string, body: object) =>
        put<Milestone>(`/api/project/updateMilestone/${milestoneId}`, body),
    },

    tasks: {
      byProject: (projectId: string) => get<Task[]>(`/api/task/view/${projectId}`),
      userTasks: () => get<unknown>("/api/task/user-tasks"),
      dueTasks: () => get<unknown>("/api/task/due-tasks"),
      workload: () => get<unknown>("/api/task/workload"),
      opicWorkload: () => get<unknown>("/api/task/opic-workload"),
      performance: () => get<unknown>("/api/task/performance"),
      create: (projectId: string, body: object) => post<Task>(`/api/task/create/${projectId}`, body),
      update: (taskId: string, body: object) => put<Task>(`/api/task/update/${taskId}`, body),
      remove: (taskId: string) => del(`/api/task/delete/${taskId}`),
      addSubtask: (taskId: string, body: object) => post(`/api/task/add/subtask/${taskId}`, body),
      updateSubtask: (subtaskId: string, body: object) =>
        put(`/api/task/update/subtask/${subtaskId}`, body),
      removeSubtask: (subtaskId: string) => del(`/api/task/delete/subtask/${subtaskId}`),
      dependencies: (personId: string) => get<unknown>(`/api/task/dependencies/${personId}`),
    },

    comments: {
      byTask: (taskId: string) => get<{ comments: Comment[] }>(`/api/comment/task/${taskId}`),
      add: (taskId: string, body: FormData) =>
        http.post(`/api/comment/add/${taskId}`, body, {
          headers: { "Content-Type": "multipart/form-data" },
        }).then((r) => r.data),
      update: (commentId: string, content: string) =>
        put(`/api/comment/update/${commentId}`, { content }),
      remove: (commentId: string) => del(`/api/comment/delete/${commentId}`),
    },

    notifications: {
      list: (unreadOnly?: boolean) =>
        get<Notification[]>("/api/notifications", unreadOnly ? { unreadOnly: true } : undefined),
      markRead: (id: string) => put(`/api/notifications/${id}/read`),
      markAllRead: () => put("/api/notifications/read-all"),
    },

    calendar: {
      fetch: () => get<{ events: unknown[] }>("/api/calendar/google/fetch"),
      sync: (body: object) => post("/api/calendar/google/sync", body),
      authUrl: (token: string) => `${opts.baseURL}/api/calendar/google/auth?token=${token}`,
    },

    audit: {
      logs: () => get<AuditLog[]>("/api/audit/view-logs"),
    },

    roleConfig: {
      all: () => get<RoleConfig[]>("/api/role-config/all"),
      get: (roleName: string) => get<RoleConfig>(`/api/role-config/${roleName}`),
      configure: (body: object) => post<RoleConfig>("/api/role-config/configure", body),
      remove: (roleName: string) => del(`/api/role-config/${roleName}`),
    },

    templates: {
      all: () => get<ProjectTemplate[]>("/api/templates/all"),
      get: (projectName: string) => get<ProjectTemplate>(`/api/templates/${projectName}`),
      create: (body: object) => post<ProjectTemplate>("/api/templates/create", body),
      update: (projectName: string, body: object) =>
        put<ProjectTemplate>(`/api/templates/update/${projectName}`, body),
      remove: (projectName: string) => del(`/api/templates/delete/${projectName}`),
    },

    clients: {
      all: () => get<string[]>("/api/clientName/all"),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
