import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const request = supertest(app);

let adminToken: string;
let managerToken: string;
let memberToken: string;
let projectId: string;

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

describe("Projects API", () => {
  beforeAll(async () => {
    adminToken = await registerAndLogin("Admin", "proj-admin@test.com", "password123", "admin");
    managerToken = await registerAndLogin("Manager", "proj-manager@test.com", "password123", "manager");
    memberToken = await registerAndLogin("Member", "proj-member@test.com", "password123", "member");
  });

  afterAll(async () => {
    await prisma.project.deleteMany({
      where: { client: { in: ["Test Client", "Updated Client"] } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: ["proj-admin@test.com", "proj-manager@test.com", "proj-member@test.com"] } },
    });
  });

  describe("POST /api/projects", () => {
    it("allows admin to create project", async () => {
      const res = await request
        .post("/api/projects")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "Test Project",
          client: "Test Client",
          description: "A test project",
          startDate: "2025-01-01",
          endDate: "2025-12-31",
          budget: 50000,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe("Test Project");
      expect(res.body.data.status).toBe("planned");
      projectId = res.body.data.id;
    });

    it("denies member to create project", async () => {
      const res = await request
        .post("/api/projects")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ title: "X", client: "X", startDate: "2025-01-01", endDate: "2025-01-02" });

      expect(res.status).toBe(403);
    });

    it("validates required fields", async () => {
      const res = await request
        .post("/api/projects")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/projects", () => {
    it("lists projects for any authenticated user", async () => {
      const res = await request
        .get("/api/projects")
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("returns project with stats", async () => {
      const res = await request
        .get("/api/projects")
        .set("Authorization", `Bearer ${memberToken}`);

      const project = res.body.data[0];
      expect(project.stats).toBeDefined();
      expect(project.stats.total_tasks).toBe(0);
      expect(project.stats.completed_tasks).toBe(0);
      expect(project.stats.progress_percent).toBe(0);
    });
  });

  describe("GET /api/projects/:id", () => {
    it("returns project detail", async () => {
      const res = await request
        .get(`/api/projects/${projectId}`)
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("Test Project");
      expect(res.body.data.sprints).toBeDefined();
    });

    it("returns 404 for non-existent project", async () => {
      const res = await request
        .get("/api/projects/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/projects/:id", () => {
    it("allows manager to update project", async () => {
      const res = await request
        .put(`/api/projects/${projectId}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send({ title: "Updated Project", client: "Updated Client" });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("Updated Project");
    });
  });

  describe("DELETE /api/projects/:id", () => {
    it("denies manager to delete project", async () => {
      const res = await request
        .delete(`/api/projects/${projectId}`)
        .set("Authorization", `Bearer ${managerToken}`);

      expect(res.status).toBe(403);
    });

    it("allows admin to delete project", async () => {
      const res = await request
        .delete(`/api/projects/${projectId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });
  });
});
