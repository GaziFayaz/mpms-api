import { z } from "zod";

export const createTaskSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  sprintId: z.string().uuid().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  estimateHours: z.number().positive().optional(),
  dueDate: z.string().optional(),
  assigneeIds: z.array(z.string().uuid()).optional(),
});

export const updateTaskSchema = z.object({
  projectId: z.string().uuid().optional(),
  sprintId: z.string().uuid().nullable().optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "review", "done"]).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  estimateHours: z.number().positive().optional(),
  dueDate: z.string().optional(),
  assigneeIds: z.array(z.string().uuid()).optional(),
  sortOrder: z.number().int().optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(["todo", "in_progress", "review", "done"]),
});
