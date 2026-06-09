// Shared constants & enums used by web, mobile, and (conceptually) the API.

export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  OPIC: "opic",
} as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = [
  "create_project", "edit_project", "delete_project",
  "create_task", "edit_task", "delete_task",
  "create_subtask", "edit_subtask", "delete_subtask",
  "create_user", "edit_user", "delete_user",
  "view_analytics", "manage_roles",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [...PERMISSIONS],
  manager: [
    "create_project", "edit_project",
    "create_task", "edit_task", "delete_task",
    "create_subtask", "edit_subtask", "delete_subtask",
    "create_user", "edit_user", "view_analytics",
  ],
  opic: ["edit_task", "create_subtask", "edit_subtask"],
};

export const TASK_STATUS = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CLOSED: "Closed",
} as const;
export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

export const PROJECT_STATUS = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
} as const;
export type ProjectStatus = (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS];

export const MILESTONE_STATUS = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
} as const;
export type MilestoneStatus = (typeof MILESTONE_STATUS)[keyof typeof MILESTONE_STATUS];

// Shared color palette (mirrors the web app's tokens) so mobile matches the brand.
export const COLORS = {
  primary: "#1a73e8",
  secondary: "#f1f3f4",
  success: "#4caf50",
  error: "#ef4444",
  warning: "#facc15",
  text: "#1f2937",
  muted: "#6b7280",
  background: "#ffffff",
  border: "#e5e7eb",
} as const;

// Maps a status string to a palette color for badges/pills.
export const statusColor = (status: string): string => {
  const s = status.toLowerCase();
  if (s.includes("complete")) return COLORS.success;
  if (s.includes("progress")) return COLORS.warning;
  if (s.includes("closed")) return COLORS.muted;
  if (s.includes("overdue")) return COLORS.error;
  return COLORS.muted;
};

export const ID_PREFIX = { PROJECT: "PJ", TASK: "TK", MILESTONE: "M" } as const;
