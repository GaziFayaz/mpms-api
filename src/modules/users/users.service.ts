import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/errors.js";
import bcrypt from "bcryptjs";

export class UsersService {
  async list() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        skills: true,
        avatarUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        skills: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw AppError.notFound("User not found");
    return user;
  }

  async create(data: { name: string; email: string; password: string; role?: string; department?: string; skills?: string[]; avatarUrl?: string }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw AppError.conflict("Email already registered");

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: (data.role as any) || "member",
        department: data.department,
        skills: data.skills || [],
        avatarUrl: data.avatarUrl,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        skills: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
  }

  async update(id: string, data: Record<string, any>) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw AppError.notFound("User not found");

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        skills: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async delete(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw AppError.notFound("User not found");

    await prisma.user.delete({ where: { id } });
  }

  async invite(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw AppError.notFound("User not found");

    return { message: `Invitation sent to ${user.email}` };
  }
}

export const usersService = new UsersService();
