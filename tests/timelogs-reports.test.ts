import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const request = supertest(app);

let managerToken: string;
let memberToken: string;
let memberId: string;
let projectId: string;
let sprintId: string;
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

describe("TimeLogs & Reports", () => {
  beforeAll(async () => {
    managerToken = await registerAndLogin("Mgr", "timelog-mgr@test.com", "password123", "manager");
    memberToken = await registerAndLogin("Mem", "timelog-mem@test.com", "password123", "member");

    const meRes = await request.get("/api/auth/me").set("Authorization", `Bearer ${memberToken}`);
    memberId = meRes.body.data.id;

    const projRes = await request
      .post("/api/projects")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ title: "TimeLog Project", client: "Test", startDate: "2025-01-01", endDate: "2025-12-31" });
    projectId = projRes.body.data.id;

    const sprintRes = await request
      .post("/api/sprints")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ projectId, title: "TL Sprint", startDate: "2025-01-01", endDate: "2025-01-14" });
    sprintId = sprintRes.body.data.id;

    const taskRes = await request
      .post("/api/tasks")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({ sprintId, title: "Loggable Task", assigneeIds: [memberId] });
    taskId = taskRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.timeLog.deleteMany({ where: { taskId } });
    await prisma.task.deleteMany({ where: { sprintId } });
    await prisma.sprint.deleteMany({ where: { projectId } });
    await prisma.project.deleteMany({ where: { id: projectId } });
    await prisma.user.deleteMany({
      where: { email: { in: ["timelog-mgr@test.com", "timelog-mem@test.com"] } },
    });
  });

  describe("Time Logs", () => {
    it("logs time for a task", async () => {
      const res = await request
        .post(`/api/tasks/${taskId}/timelogs`)
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ hours: 4, description: "Worked on feature", loggedDate: "2025-06-15" });

      expect(res.status).toBe(201);
      expect(res.body.data.hours).toBe("4");
      expect(res.body.data.description).toBe("Worked on feature");
    });

    it("lists time logs for a task", async () => {
      const res = await request
        .get(`/api/tasks/${taskId}/timelogs`)
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Reports", () => {
    it("returns project progress report", async () => {
      const res = await request
        .get(`/api/reports/project/${projectId}`)
        .set("Authorization", `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.project).toBeDefined();
      expect(res.body.data.total_tasks).toBeGreaterThanOrEqual(1);
    });

    it("returns user workload report", async () => {
      const res = await request
        .get(`/api/reports/user/${memberId}`)
        .set("Authorization", `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total_hours).toBeDefined();
    });

    it("returns overview report", async () => {
      const res = await request
        .get("/api/reports/overview")
        .set("Authorization", `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("denies member to view reports", async () => {
      const res = await request
        .get("/api/reports/overview")
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
    });
  });
});
