import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const request = supertest(app);

let managerToken: string;
let memberToken: string;
let projectId: string;
let taskId: string;

async function registerAndLogin(name: string, email: string, password: string, role: string = "member") {
  const res = await request.post("/api/auth/register").send({ name, email, password });
  if (res.status === 201) {
    if (role !== "member") {
      await prisma.user.update({ where: { email }, data: { role } as any });
    }
    const loginRes = await request.post("/api/auth/login").send({ email, password });
    return loginRes.body.data.token;
  }
  const loginRes = await request.post("/api/auth/login").send({ email, password });
  return loginRes.body.data.token;
}

describe("Task Status Workflow", () => {
  beforeAll(async () => {
    managerToken = await registerAndLogin("Mgr", "workflow-mgr@test.com", "password123", "manager");
    memberToken = await registerAndLogin("Mem", "workflow-mem@test.com", "password123", "member");

    const projRes = await request
      .post("/api/projects")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ title: "Workflow Project", client: "Test", startDate: "2025-01-01", endDate: "2025-12-31" });
    projectId = projRes.body.data.id;

    const taskRes = await request
      .post("/api/tasks")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ projectId, title: "Workflow Task" });
    taskId = taskRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.task.deleteMany({ where: { projectId } });
    await prisma.project.deleteMany({ where: { id: projectId } });
    await prisma.user.deleteMany({
      where: { email: { in: ["workflow-mgr@test.com", "workflow-mem@test.com"] } },
    });
  });

  it("member can move todo to in_progress", async () => {
    const res = await request
      .patch(`/api/tasks/${taskId}/status`)
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ status: "in_progress" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("in_progress");
  });

  it("member can move in_progress to review", async () => {
    const res = await request
      .patch(`/api/tasks/${taskId}/status`)
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ status: "review" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("review");
  });

  it("member cannot move review to done", async () => {
    const res = await request
      .patch(`/api/tasks/${taskId}/status`)
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ status: "done" });

    expect(res.status).toBe(403);
  });

  it("manager can move review to done", async () => {
    const res = await request
      .patch(`/api/tasks/${taskId}/status`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ status: "done" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("done");
  });

  it("creates activity log on status change", async () => {
    const logs = await prisma.activityLog.findMany({
      where: { taskId },
      orderBy: { createdAt: "desc" },
    });

    expect(logs.length).toBeGreaterThanOrEqual(3);
    expect(logs[0]!.action).toBe("updated_status");
  });

  it("rejects invalid status transition", async () => {
    const res = await request
      .patch(`/api/tasks/${taskId}/status`)
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ status: "todo" });

    expect(res.status).toBe(400);
  });
});
