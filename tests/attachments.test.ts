import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import path from "node:path";
import fs from "node:fs";
import app from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const request = supertest(app);

let managerToken: string;
let projectId: string;
let taskId: string;
let attachmentId: string;

const testDir = path.dirname(Bun.fileURLToPath(import.meta.url));
const testFilePath = path.join(testDir, "test-upload.pdf");

describe("Attachments", () => {
  beforeAll(async () => {
    const regRes = await request.post("/api/auth/register").send({
      name: "Uploader", email: "uploader@test.com", password: "password123",
    });
    managerToken = regRes.body.data.token;

    await prisma.user.update({ where: { email: "uploader@test.com" }, data: { role: "manager" } as any });
    const loginRes = await request.post("/api/auth/login").send({ email: "uploader@test.com", password: "password123" });
    managerToken = loginRes.body.data.token;

    const projRes = await request
      .post("/api/projects")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ title: "Attach Project", client: "Test", startDate: "2025-01-01", endDate: "2025-12-31" });
    projectId = projRes.body.data.id;

    const taskRes = await request
      .post("/api/tasks")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ projectId, title: "Attachable Task" });
    taskId = taskRes.body.data.id;

    fs.writeFileSync(testFilePath, "%PDF-1.4 test");
  });

  afterAll(async () => {
    await prisma.attachment.deleteMany({ where: { taskId } });
    await prisma.task.deleteMany({ where: { projectId } });
    await prisma.project.deleteMany({ where: { id: projectId } });
    await prisma.user.deleteMany({ where: { email: "uploader@test.com" } });
    if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);
  });

  it("uploads a file", async () => {
    const res = await request
      .post(`/api/tasks/${taskId}/attachments`)
      .set("Authorization", `Bearer ${managerToken}`)
      .attach("file", testFilePath);

    expect(res.status).toBe(201);
    expect(res.body.data.fileName).toBe("test-upload.pdf");
    expect(res.body.data.fileUrl).toBeDefined();
    expect(res.body.data.fileType).toBe("application/pdf");
    attachmentId = res.body.data.id;
  });

  it("rejects upload without file", async () => {
    const res = await request
      .post(`/api/tasks/${taskId}/attachments`)
      .set("Authorization", `Bearer ${managerToken}`);

    expect(res.status).toBe(400);
  });

  it("deletes attachment", async () => {
    const res = await request
      .delete(`/api/attachments/${attachmentId}`)
      .set("Authorization", `Bearer ${managerToken}`);

    expect(res.status).toBe(200);
  });
});
