import { z } from "zod";

export const createProjectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  client: z.string().min(1, "Client is required"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  budget: z.number().positive().optional(),
  status: z.enum(["planned", "active", "completed", "archived"]).optional(),
  thumbnailUrl: z.string().optional(),
});

export const updateProjectSchema = z.object({
  title: z.string().min(1).optional(),
  client: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.number().positive().optional(),
  status: z.enum(["planned", "active", "completed", "archived"]).optional(),
  thumbnailUrl: z.string().optional(),
});
