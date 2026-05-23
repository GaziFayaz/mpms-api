import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/errors.js";
import { paginate, getPaginationMeta } from "../../utils/helpers.js";

export class TasksService {
  async list(query: {
    projectId?: string;
    sprintId?: string;
    assignee?: string;
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }) {
    const { skip, take, page, limit } = paginate(query.page ?? 1, query.limit ?? 20);

    const where: Record<string, any> = {};

    if (query.projectId) where.projectId = query.projectId;
    if (query.sprintId) where.sprintId = query.sprintId;
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.assignee) {
      where.taskAssignees = { some: { userId: query.assignee } };
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          project: { select: { title: true } },
          sprint: { select: { title: true } },
          taskAssignees: {
            include: {
              user: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
          _count: { select: { subtasks: true } },
          subtasks: {
            where: { completed: true },
            select: { id: true },
          },
        },
        skip,
        take,
        orderBy: { sortOrder: "asc" },
      }),
      prisma.task.count({ where }),
    ]);

    const data = tasks.map((t) => ({
      id: t.id,
      projectId: t.projectId,
      projectTitle: t.project.title,
      sprintId: t.sprintId,
      sprintTitle: t.sprint?.title ?? null,
      title: t.title,
      status: t.status,
      priority: t.priority,
      estimateHours: t.estimateHours,
      dueDate: t.dueDate,
      assignees: t.taskAssignees.map((ta) => ({
        id: ta.user.id,
        name: ta.user.name,
        avatarUrl: ta.user.avatarUrl,
      })),
      subtasksStats: {
        total: t._count.subtasks,
        completed: t.subtasks.length,
      },
      sortOrder: t.sortOrder,
    }));

    return { data, ...getPaginationMeta(total, page, limit) };
  }

  async getById(id: string) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { title: true } },
        sprint: { select: { title: true } },
        taskAssignees: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        subtasks: {
          orderBy: { sortOrder: "asc" },
        },
        _count: { select: { subtasks: true } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        activityLog: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!task) throw AppError.notFound("Task not found");

    const completedSubtasks = task.subtasks.filter((s) => s.completed).length;

    return {
      id: task.id,
      projectId: task.projectId,
      projectTitle: task.project.title,
      sprintId: task.sprintId,
      sprintTitle: task.sprint?.title ?? null,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      estimateHours: task.estimateHours,
      dueDate: task.dueDate,
      assignees: task.taskAssignees.map((ta) => ({
        id: ta.user.id,
        name: ta.user.name,
        avatarUrl: ta.user.avatarUrl,
      })),
      subtasksStats: {
        total: task._count.subtasks,
        completed: completedSubtasks,
      },
      sortOrder: task.sortOrder,
      subtasks: task.subtasks,
      comments: task.comments.map((c) => ({
        id: c.id,
        userId: c.userId,
        userName: c.user.name,
        userAvatarUrl: c.user.avatarUrl,
        parentId: c.parentId,
        body: c.body,
        createdAt: c.createdAt,
        replies: [],
      })),
      activityLog: task.activityLog.map((a) => ({
        id: a.id,
        userId: a.userId,
        userName: a.user.name,
        action: a.action,
        details: a.details,
        createdAt: a.createdAt,
      })),
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }

  async create(data: {
    projectId: string;
    sprintId?: string;
    title: string;
    description?: string;
    priority?: string;
    estimateHours?: number;
    dueDate?: string;
    assigneeIds?: string[];
  }) {
    const createData: Record<string, any> = {
      projectId: data.projectId,
      title: data.title,
      description: data.description,
      priority: data.priority || "medium",
      estimateHours: data.estimateHours,
    };

    if (data.sprintId) createData.sprintId = data.sprintId;
    if (data.dueDate) createData.dueDate = new Date(data.dueDate);
    if (data.assigneeIds?.length) {
      createData.taskAssignees = {
        create: data.assigneeIds.map((userId) => ({ userId })),
      };
    }

    return prisma.task.create({
      data: createData,
      include: {
        project: { select: { title: true } },
        taskAssignees: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    });
  }

  async update(id: string, data: Record<string, any>) {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw AppError.notFound("Task not found");

    const updateData: Record<string, any> = {};

    const simpleFields = ["title", "description", "status", "priority", "estimateHours", "sortOrder", "sprintId"];
    for (const field of simpleFields) {
      if (data[field] !== undefined) updateData[field] = data[field];
    }

    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    if (data.assigneeIds !== undefined) {
      await prisma.taskAssignee.deleteMany({ where: { taskId: id } });
      if (data.assigneeIds.length) {
        await prisma.taskAssignee.createMany({
          data: data.assigneeIds.map((userId: string) => ({ taskId: id, userId })),
        });
      }
    }

    return prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { title: true } },
        taskAssignees: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    });
  }

  async delete(id: string) {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw AppError.notFound("Task not found");

    await prisma.task.delete({ where: { id } });
  }

  async updateStatus(
    id: string,
    newStatus: string,
    userId: string,
    userRole: string,
  ) {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw AppError.notFound("Task not found");

    const validTransitions: Record<string, string[]> = {
      todo: ["in_progress"],
      in_progress: ["review"],
      review: ["done"],
      done: [],
    };

    const allowed = validTransitions[task.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw AppError.badRequest(`Cannot transition from ${task.status} to ${newStatus}`);
    }

    if (task.status === "review" && newStatus === "done" && userRole === "member") {
      throw AppError.forbidden("Only manager or admin can approve review");
    }

    const updated = await prisma.task.update({
      where: { id },
      data: { status: newStatus as any },
    });

    await prisma.activityLog.create({
      data: {
        taskId: id,
        userId,
        action: "updated_status",
        details: { from: task.status, to: newStatus },
      },
    });

    return updated;
  }
}

export const tasksService = new TasksService();
