import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/errors.js";
import { uploadToR2, deleteFromR2, getSignedDownloadUrl } from "../../lib/r2.js";
import crypto from "node:crypto";
import path from "node:path";

export class AttachmentsService {
  async upload(taskId: string, userId: string, file: Express.Multer.File) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw AppError.notFound("Task not found");

    const ext = path.extname(file.originalname);
    const key = `attachments/${taskId}/${crypto.randomUUID()}${ext}`;

    await uploadToR2(key, file.buffer, file.mimetype);

    return prisma.attachment.create({
      data: {
        taskId,
        fileName: file.originalname,
        fileKey: key,
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

    await deleteFromR2(attachment.fileKey);
    await prisma.attachment.delete({ where: { id } });
  }

  async getById(id: string) {
    const attachment = await prisma.attachment.findUnique({ where: { id } });
    if (!attachment) throw AppError.notFound("Attachment not found");

    const downloadUrl = await getSignedDownloadUrl(attachment.fileKey);

    return {
      ...attachment,
      downloadUrl,
    };
  }

  async listByTask(taskId: string) {
    const attachments = await prisma.attachment.findMany({
      where: { taskId },
      orderBy: { createdAt: "desc" },
    });

    const withUrls = await Promise.all(
      attachments.map(async (a) => ({
        ...a,
        downloadUrl: await getSignedDownloadUrl(a.fileKey),
      })),
    );

    return withUrls;
  }
}

export const attachmentsService = new AttachmentsService();
