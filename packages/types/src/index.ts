// Shared domain types mirroring the API's Mongoose models.
import type { Role, Permission } from "@pm/config";

export type ID = string;

export interface ProfilePicture {
  url?: string;
  publicId?: string;
}

export interface User {
  _id: ID;
  name: string;
  email: string;
  role: Role;
  team?: string;
  location?: string;
  designation?: string;
  managerId?: ID | null;
  googleId?: string;
  profilePicture?: ProfilePicture;
  permissions?: Permission[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Milestone {
  _id: ID;
  milestoneId: string;
  milestoneName: string;
  budget: number;
  dueDate: string;
  projectId: ID;
  tasks?: ID[];
  status: string;
  completionDate?: string;
}

export interface TaskDependency {
  personId: ID;
  description: string;
  status: "Pending" | "In Progress" | "Completed";
}

export interface SubTask {
  _id: ID;
  name: string;
  assignee?: ID;
  submission?: string;
  status: string;
}

export interface Comment {
  _id: ID;
  content: string;
  user: ID | User;
  task: ID;
  attachments?: Attachment[];
  driveLinks?: DriveLink[];
  createdAt?: string;
}

export interface Attachment {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  publicId?: string;
}

export interface DriveLink {
  isDrive?: boolean;
  name?: string;
  url?: string;
}

export interface Task {
  _id: ID;
  taskId: string;
  taskName: string;
  assignee?: ID | User;
  assigner: ID | User;
  teamStatus: string;
  progress: number;
  dueDate?: string;
  completionDate?: string;
  subtasks?: SubTask[] | ID[];
  comments?: Comment[] | ID[];
  milestone?: ID;
  dependencies?: TaskDependency[];
  closeReason?: string;
  closeDate?: string;
}

export interface Project {
  _id: ID;
  projectId: string;
  projectName: string;
  projectType: string;
  projectDescription?: string;
  owner: ID | User;
  startDate?: string;
  endDate?: string;
  targetDate?: string;
  status: string;
  completionDate?: string;
  tasks?: ID[] | Task[];
  assignedTo?: ID[];
  team: string;
  totalBudget?: number;
  clientName?: string;
  milestones?: ID[] | Milestone[];
  teamMembers?: ID[];
  expectedDuration?: number;
}

export interface Notification {
  _id: ID;
  recipient: ID;
  title: string;
  message: string;
  type: string;
  referenceId?: ID;
  read: boolean;
  createdAt?: string;
}

export interface AuditLog {
  _id: ID;
  userId: ID | User;
  action: string;
  objectId?: ID;
  objectType?: string;
  additionalInfo?: string;
  parentId?: ID;
  timestamp?: string;
}

export interface RoleConfig {
  _id: ID;
  roleName: Role;
  permissions: Permission[];
}

export interface ProjectTemplate {
  _id: ID;
  projectName: string;
  expectedDuration?: number;
  tasks?: unknown[];
  milestones?: unknown[];
}

export interface Client {
  _id: ID;
  zohoId: string;
  name: string;
  companyName?: string;
  email?: string;
}

// ---- Auth DTOs ----
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  role: Role;
  permissions: Permission[];
  name: string;
  id: ID;
}

export interface JwtPayload {
  id: ID;
  team?: string;
  role: Role;
  permissions: Permission[];
  parentId?: ID | null;
}
