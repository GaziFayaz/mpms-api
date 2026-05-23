import type { UserRole, ProjectStatus, TaskStatus, TaskPriority, ActivityAction } from "@prisma/client";

export type { UserRole, ProjectStatus, TaskStatus, TaskPriority, ActivityAction };

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  status: number;
  details?: { field: string; message: string }[];
  stack?: string;
}

export interface JwtPayload {
  userId: string;
  role: UserRole;
}

export interface AuthRequestUser {
  userId: string;
  role: UserRole;
}

export interface TaskAssigneeUser {
  id: string;
  name: string;
  avatarUrl: string | null;
}
