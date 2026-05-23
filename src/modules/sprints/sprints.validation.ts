import { z } from "zod";

export const createSprintSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  title: z.string().min(1, "Title is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  sortOrder: z.number().int().optional(),
});

export const updateSprintSchema = z.object({
  projectId: z.string().uuid().optional(),
  title: z.string().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortOrder: z.number().int().optional(),
});
