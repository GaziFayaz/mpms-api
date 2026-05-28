import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.mock("../src/lib/r2.js", () => ({
  uploadToR2: vi.fn().mockResolvedValue(undefined),
  deleteFromR2: vi.fn().mockResolvedValue(undefined),
  getSignedDownloadUrl: vi.fn().mockResolvedValue("https://r2.example.com/signed-url/test-file"),
  getR2PublicUrl: vi.fn().mockReturnValue("https://r2.example.com/test-file"),
  s3Client: {},
}));

import supertest from "supertest";
import path from "node:path";
import fs from "node:fs";
import app from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { uploadToR2, deleteFromR2, getSignedDownloadUrl } from "../src/lib/r2.js";

const request = supertest(app);

let managerToken: string;
let projectId: string;
let sprintId: string;
let taskId: string;
let attachmentId: string;

const testDir = path.dirname(Bun.fileURLToPath(import.meta.url));
const testFilePath = path.join(testDir, "test-upload.pdf");

describe("Attachments", () => {
  beforeAll(async () => {
    const regRes = await request.post("/api/auth/register").send({
      name: "Uploader", email: "uploader-r2@test.com", password: "password123",
    });
    managerToken = regRes.body.data.token;

    await prisma.user.update({ where: { email: "uploader-r2@test.com" }, data: { role: "manager" } as any });
    const loginRes = await request.post("/api/auth/login").send({ email: "uploader-r2@test.com", password: "password123" });
    managerToken = loginRes.body.data.token;

    const projRes = await request
      .post("/api/projects")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ title: "R2 Project", client: "Test", startDate: "2025-01-01", endDate: "2025-12-31" });
    projectId = projRes.body.data.id;

    const sprintRes = await request
      .post("/api/sprints")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ projectId, title: "R2 Sprint", startDate: "2025-01-01", endDate: "2025-01-14" });
    sprintId = sprintRes.body.data.id;

    const taskRes = await request
      .post("/api/tasks")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ sprintId, title: "R2 Task" });
    taskId = taskRes.body.data.id;

    fs.writeFileSync(testFilePath, "%PDF-1.4 test");
  });

  afterAll(async () => {
    await prisma.attachment.deleteMany({ where: { taskId } });
    await prisma.task.deleteMany({ where: { sprintId } });
    await prisma.sprint.deleteMany({ where: { projectId } });
    await prisma.project.deleteMany({ where: { id: projectId } });
    await prisma.user.deleteMany({ where: { email: "uploader-r2@test.com" } });
    if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);
  });

  it("uploads a file to R2", async () => {
    const res = await request
      .post(`/api/tasks/${taskId}/attachments`)
      .set("Authorization", `Bearer ${managerToken}`)
      .attach("file", testFilePath);

    expect(res.status).toBe(201);
    expect(res.body.data.fileName).toBe("test-upload.pdf");
    expect(res.body.data.fileKey).toBeDefined();
    expect(res.body.data.fileKey).toContain("attachments/");
    expect(res.body.data.fileType).toBe("application/pdf");
    expect(uploadToR2).toHaveBeenCalledTimes(1);
    attachmentId = res.body.data.id;
  });

  it("rejects upload without file", async () => {
    const res = await request
      .post(`/api/tasks/${taskId}/attachments`)
      .set("Authorization", `Bearer ${managerToken}`);

    expect(res.status).toBe(400);
  });

  it("lists attachments for a task", async () => {
    const res = await request
      .get(`/api/tasks/${taskId}/attachments`)
      .set("Authorization", `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].downloadUrl).toBeDefined();
  });

  it("gets an attachment by id with presigned URL", async () => {
    const res = await request
      .get(`/api/attachments/${attachmentId}`)
      .set("Authorization", `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(attachmentId);
    expect(res.body.data.downloadUrl).toBeDefined();
  });

  it("download redirects to presigned URL", async () => {
    const res = await request
      .get(`/api/attachments/${attachmentId}/download`)
      .set("Authorization", `Bearer ${managerToken}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("https://r2.example.com/signed-url/test-file");
  });

  it("deletes attachment from R2 and DB", async () => {
    const res = await request
      .delete(`/api/attachments/${attachmentId}`)
      .set("Authorization", `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
    expect(deleteFromR2).toHaveBeenCalledTimes(1);

    const deleted = await prisma.attachment.findUnique({ where: { id: attachmentId } });
    expect(deleted).toBeNull();
  });

  it("returns 404 for non-existent attachment", async () => {
    const res = await request
      .get(`/api/attachments/${attachmentId}`)
      .set("Authorization", `Bearer ${managerToken}`);

    expect(res.status).toBe(404);
  });
});
