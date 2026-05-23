import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/errors.js";

export class AttachmentsService {
  async upload(taskId: string, userId: string, file: Express.Multer.File) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw AppError.notFound("Task not found");

    return prisma.attachment.create({
      data: {
        taskId,
        fileName: file.originalname,
        fileUrl: `/uploads/${file.filename}`,
        fileType: file.mimetype,
        fileSize: file.size,
        uploadedBy: userId,
      },
    });
  }

  async delete(id: string, userId: string, userRole: string) {
    const attachment = await prisma.attachment.findUnique({ where: { id } });
    if (!attachment) throw AppError.notFound("Attachment not found");

    if (attachment.uploadedBy !== userId && userRole !== "admin") {
      throw AppError.forbidden("Only owner or admin can delete attachment");
    }

    await prisma.attachment.delete({ where: { id } });
  }
}

export const attachmentsService = new AttachmentsService();
