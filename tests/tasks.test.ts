import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const request = supertest(app);

let adminToken: string;
let managerToken: string;
let memberToken: string;
let memberId: string;
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

describe("Tasks API", () => {
  beforeAll(async () => {
    adminToken = await registerAndLogin("Admin", "task-admin@test.com", "password123", "admin");
    managerToken = await registerAndLogin("Manager", "task-manager@test.com", "password123", "manager");
    memberToken = await registerAndLogin("Member", "task-member@test.com", "password123", "member");

    const meRes = await request.get("/api/auth/me").set("Authorization", `Bearer ${memberToken}`);
    memberId = meRes.body.data.id;

    const projRes = await request
      .post("/api/projects")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Task Project", client: "Test", startDate: "2025-01-01", endDate: "2025-12-31" });
    projectId = projRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.task.deleteMany({ where: { projectId } });
    await prisma.project.deleteMany({ where: { id: projectId } });
    await prisma.user.deleteMany({
      where: { email: { in: ["task-admin@test.com", "task-manager@test.com", "task-member@test.com"] } },
    });
  });

  describe("POST /api/tasks", () => {
    it("allows admin to create task", async () => {
      const res = await request
        .post("/api/tasks")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          projectId,
          title: "Test Task",
          description: "Task description",
          priority: "high",
          estimateHours: 8,
          dueDate: "2025-06-01",
          assigneeIds: [memberId],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe("Test Task");
      expect(res.body.data.status).toBe("todo");
      expect(res.body.data.priority).toBe("high");
      taskId = res.body.data.id;
    });

    it("denies member to create task", async () => {
      const res = await request
        .post("/api/tasks")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ projectId, title: "X" });

      expect(res.status).toBe(403);
    });

    it("validates required fields", async () => {
      const res = await request
        .post("/api/tasks")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/tasks", () => {
    it("lists tasks with pagination", async () => {
      const res = await request
        .get("/api/tasks")
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("returns pagination meta", async () => {
      const res = await request
        .get("/api/tasks?page=1&limit=10")
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.body.total).toBeDefined();
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(10);
    });

    it("filters by status", async () => {
      const res = await request
        .get("/api/tasks?status=todo")
        .set("Authorization", `Bearer ${memberToken}`);

      res.body.data.forEach((t: any) => {
        expect(t.status).toBe("todo");
      });
    });
  });

  describe("GET /api/tasks/:id", () => {
    it("returns task detail", async () => {
      const res = await request
        .get(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("Test Task");
      expect(res.body.data.subtasks).toBeDefined();
      expect(res.body.data.comments).toBeDefined();
    });
  });

  describe("PUT /api/tasks/:id", () => {
    it("allows manager to update task", async () => {
      const res = await request
        .put(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send({ title: "Updated Task", priority: "critical" });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("Updated Task");
    });
  });

  describe("DELETE /api/tasks/:id", () => {
    it("allows admin to delete task", async () => {
      const res = await request
        .delete(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });
  });
});
