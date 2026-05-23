import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/errors.js";

export class CommentsService {
  async listByTask(taskId: string) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw AppError.notFound("Task not found");

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        replies: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return comments.filter((c) => !c.parentId).map((c) => ({
      id: c.id,
      userId: c.userId,
      userName: c.user.name,
      userAvatarUrl: c.user.avatarUrl,
      parentId: c.parentId,
      body: c.body,
      createdAt: c.createdAt,
      replies: c.replies.map((r) => ({
        id: r.id,
        userId: r.userId,
        userName: r.user.name,
        userAvatarUrl: r.user.avatarUrl,
        parentId: r.parentId,
        body: r.body,
        createdAt: r.createdAt,
      })),
    }));
  }

  async create(taskId: string, userId: string, body: string, parentId?: string) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw AppError.notFound("Task not found");

    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parent || parent.taskId !== taskId) {
        throw AppError.badRequest("Invalid parent comment");
      }
    }

    return prisma.comment.create({
      data: { taskId, userId, body, parentId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async update(id: string, userId: string, body: string) {
    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) throw AppError.notFound("Comment not found");
    if (comment.userId !== userId) throw AppError.forbidden("Can only edit own comments");

    return prisma.comment.update({
      where: { id },
      data: { body },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }
}

export const commentsService = new CommentsService();
