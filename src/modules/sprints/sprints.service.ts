import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/errors.js";

export class SprintsService {
  async getById(id: string) {
    const sprint = await prisma.sprint.findUnique({
      where: { id },
      include: {
        _count: { select: { tasks: true } },
        tasks: {
          where: { status: "done" },
          select: { id: true },
        },
      },
    });

    if (!sprint) throw AppError.notFound("Sprint not found");

    return {
      id: sprint.id,
      projectId: sprint.projectId,
      title: sprint.title,
      sprintNumber: sprint.sprintNumber,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      sortOrder: sprint.sortOrder,
      stats: {
        total_tasks: sprint._count.tasks,
        completed_tasks: sprint.tasks.length,
        progress_percent: sprint._count.tasks > 0
          ? Math.round((sprint.tasks.length / sprint._count.tasks) * 100)
          : 0,
      },
    };
  }

  async listByProject(projectId: string) {
    const sprints = await prisma.sprint.findMany({
      where: { projectId },
      include: {
        _count: { select: { tasks: true } },
        tasks: {
          where: { status: "done" },
          select: { id: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return sprints.map((s) => ({
      id: s.id,
      projectId: s.projectId,
      title: s.title,
      sprintNumber: s.sprintNumber,
      startDate: s.startDate,
      endDate: s.endDate,
      sortOrder: s.sortOrder,
      stats: {
        total_tasks: s._count.tasks,
        completed_tasks: s.tasks.length,
        progress_percent: s._count.tasks > 0
          ? Math.round((s.tasks.length / s._count.tasks) * 100)
          : 0,
      },
    }));
  }

  async create(data: {
    projectId: string;
    title: string;
    startDate: string;
    endDate: string;
    sortOrder?: number;
  }) {
    const project = await prisma.project.findUnique({ where: { id: data.projectId } });
    if (!project) throw AppError.notFound("Project not found");

    const maxSprint = await prisma.sprint.findFirst({
      where: { projectId: data.projectId },
      orderBy: { sprintNumber: "desc" },
      select: { sprintNumber: true },
    });

    const sprintNumber = (maxSprint?.sprintNumber ?? 0) + 1;

    return prisma.sprint.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        sprintNumber,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        sortOrder: data.sortOrder ?? sprintNumber,
      },
    });
  }

  async update(id: string, data: Record<string, any>) {
    const sprint = await prisma.sprint.findUnique({ where: { id } });
    if (!sprint) throw AppError.notFound("Sprint not found");

    const updateData: Record<string, any> = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);

    return prisma.sprint.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    const sprint = await prisma.sprint.findUnique({ where: { id } });
    if (!sprint) throw AppError.notFound("Sprint not found");

    await prisma.sprint.delete({ where: { id } });
  }
}

export const sprintsService = new SprintsService();
