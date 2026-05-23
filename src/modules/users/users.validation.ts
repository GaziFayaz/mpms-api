import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "manager", "member"]).optional(),
  department: z.string().optional(),
  skills: z.array(z.string()).optional(),
  avatarUrl: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["admin", "manager", "member"]).optional(),
  department: z.string().optional(),
  skills: z.array(z.string()).optional(),
  avatarUrl: z.string().optional(),
});
