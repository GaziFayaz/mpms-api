import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/errors.js";

export class TimeLogsService {
  async listByTask(taskId: string) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw AppError.notFound("Task not found");

    return prisma.timeLog.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { loggedDate: "desc" },
    });
  }

  async create(taskId: string, userId: string, data: { hours: number; description?: string; loggedDate: string }) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw AppError.notFound("Task not found");

    return prisma.timeLog.create({
      data: {
        taskId,
        userId,
        hours: data.hours,
        description: data.description,
        loggedDate: new Date(data.loggedDate),
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }
}

export const timeLogsService = new TimeLogsService();
