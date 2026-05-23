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
let sprintId: string;
let sprint2Id: string;

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

describe("Sprints API", () => {
  beforeAll(async () => {
    adminToken = await registerAndLogin("Admin", "sprint-admin@test.com", "password123", "admin");
    managerToken = await registerAndLogin("Manager", "sprint-manager@test.com", "password123", "manager");
    memberToken = await registerAndLogin("Member", "sprint-member@test.com", "password123", "member");

    const meRes = await request.get("/api/auth/me").set("Authorization", `Bearer ${memberToken}`);
    memberId = meRes.body.data.id;

    const projRes = await request
      .post("/api/projects")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Sprint Project", client: "Test", startDate: "2025-01-01", endDate: "2025-06-30" });
    projectId = projRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.sprint.deleteMany({ where: { projectId } });
    await prisma.project.deleteMany({ where: { id: projectId } });
    await prisma.user.deleteMany({
      where: { email: { in: ["sprint-admin@test.com", "sprint-manager@test.com", "sprint-member@test.com"] } },
    });
  });

  describe("POST /api/sprints", () => {
    it("creates sprint with auto-increment number", async () => {
      const res = await request
        .post("/api/sprints")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ projectId, title: "Sprint 1", startDate: "2025-01-01", endDate: "2025-01-14" });

      expect(res.status).toBe(201);
      expect(res.body.data.sprintNumber).toBe(1);
      sprintId = res.body.data.id;
    });

    it("increments sprint number for same project", async () => {
      const res = await request
        .post("/api/sprints")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ projectId, title: "Sprint 2", startDate: "2025-01-15", endDate: "2025-01-28" });

      expect(res.status).toBe(201);
      expect(res.body.data.sprintNumber).toBe(2);
      sprint2Id = res.body.data.id;
    });

    it("denies member to create sprint", async () => {
      const res = await request
        .post("/api/sprints")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ projectId, title: "X", startDate: "2025-02-01", endDate: "2025-02-14" });

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/sprints/:id", () => {
    it("returns sprint detail", async () => {
      const res = await request
        .get(`/api/sprints/${sprintId}`)
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("Sprint 1");
    });
  });

  describe("PUT /api/sprints/:id", () => {
    it("updates sprint", async () => {
      const res = await request
        .put(`/api/sprints/${sprintId}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send({ title: "Updated Sprint 1" });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("Updated Sprint 1");
    });
  });

  describe("PATCH /api/sprints/:id/order", () => {
    it("reorders sprint", async () => {
      const res = await request
        .patch(`/api/sprints/${sprintId}/order`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send({ sortOrder: 99 });

      expect(res.status).toBe(200);
      expect(res.body.data.sortOrder).toBe(99);
    });
  });

  describe("GET /api/sprints/:id/tasks", () => {
    beforeAll(async () => {
      const taskRes = await request
        .post("/api/tasks")
        .set("Authorization", `Bearer ${managerToken}`)
        .send({ projectId, sprintId, title: "Sprint Task", assigneeIds: [memberId] });
    });

    it("returns tasks for sprint", async () => {
      const res = await request
        .get(`/api/sprints/${sprintId}/tasks`)
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("GET /api/projects/:id/sprints", () => {
    it("returns sprints for project", async () => {
      const res = await request
        .get(`/api/projects/${projectId}/sprints`)
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("DELETE /api/sprints/:id", () => {
    it("allows admin to delete sprint 2", async () => {
      const res = await request
        .delete(`/api/sprints/${sprint2Id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });

    it("allows admin to delete sprint 1", async () => {
      const res = await request
        .delete(`/api/sprints/${sprintId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });
  });
});
