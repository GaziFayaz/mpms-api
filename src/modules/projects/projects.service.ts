import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/errors.js";

export class ProjectsService {
  async list(query: { status?: string; client?: string }) {
    const where: Record<string, any> = {};

    if (query.status) {
      where.status = query.status;
    }
    if (query.client) {
      where.client = { contains: query.client, mode: "insensitive" };
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        _count: {
          select: { tasks: true },
        },
        tasks: {
          where: { status: "done" },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return projects.map((p) => ({
      id: p.id,
      title: p.title,
      client: p.client,
      status: p.status,
      startDate: p.startDate,
      endDate: p.endDate,
      budget: p.budget,
      thumbnailUrl: p.thumbnailUrl,
      stats: {
        total_tasks: p._count.tasks,
        completed_tasks: p.tasks.length,
        progress_percent: p._count.tasks > 0 ? Math.round((p.tasks.length / p._count.tasks) * 100) : 0,
      },
    }));
  }

  async getById(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        sprints: {
          orderBy: { sortOrder: "asc" },
          include: {
            _count: { select: { tasks: true } },
            tasks: {
              where: { status: "done" },
              select: { id: true },
            },
          },
        },
        _count: { select: { tasks: true } },
        tasks: {
          where: { status: "done" },
          select: { id: true },
        },
      },
    });

    if (!project) throw AppError.notFound("Project not found");

    return {
      id: project.id,
      title: project.title,
      client: project.client,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      budget: project.budget,
      thumbnailUrl: project.thumbnailUrl,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      stats: {
        total_tasks: project._count.tasks,
        completed_tasks: project.tasks.length,
        progress_percent:
          project._count.tasks > 0 ? Math.round((project.tasks.length / project._count.tasks) * 100) : 0,
      },
      sprints: project.sprints.map((s) => ({
        id: s.id,
        title: s.title,
        sprintNumber: s.sprintNumber,
        startDate: s.startDate,
        endDate: s.endDate,
        sortOrder: s.sortOrder,
        stats: {
          total_tasks: s._count.tasks,
          completed_tasks: s.tasks.length,
          progress_percent: s._count.tasks > 0 ? Math.round((s.tasks.length / s._count.tasks) * 100) : 0,
        },
      })),
    };
  }

  async create(data: {
    title: string;
    client: string;
    description?: string;
    startDate: string;
    endDate: string;
    budget?: number;
    status?: string;
    thumbnailUrl?: string;
  }) {
    return prisma.project.create({
      data: {
        title: data.title,
        client: data.client,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        budget: data.budget,
        status: (data.status as any) || "planned",
        thumbnailUrl: data.thumbnailUrl,
      },
    });
  }

  async update(
    id: string,
    data: Record<string, any>,
  ) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) throw AppError.notFound("Project not found");

    const updateData: Record<string, any> = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);

    return prisma.project.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) throw AppError.notFound("Project not found");

    await prisma.project.delete({ where: { id } });
  }
}

export const projectsService = new ProjectsService();
