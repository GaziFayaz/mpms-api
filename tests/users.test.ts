import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const request = supertest(app);

let adminToken: string;
let managerToken: string;
let memberToken: string;
let memberId: string;

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

describe("Users API", () => {
  beforeAll(async () => {
    adminToken = await registerAndLogin("Admin User", "admin@test.com", "password123", "admin");
    managerToken = await registerAndLogin("Manager User", "manager@test.com", "password123", "manager");
    memberToken = await registerAndLogin("Member User", "member@test.com", "password123", "member");

    const meRes = await request.get("/api/auth/me").set("Authorization", `Bearer ${memberToken}`);
    memberId = meRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ["admin@test.com", "manager@test.com", "member@test.com"] } },
    });
  });

  describe("GET /api/users", () => {
    it("allows admin to list users", async () => {
      const res = await request.get("/api/users").set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("allows manager to list users", async () => {
      const res = await request.get("/api/users").set("Authorization", `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
    });

    it("denies member to list users", async () => {
      const res = await request.get("/api/users").set("Authorization", `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/users/:id", () => {
    it("returns a user by ID", async () => {
      const res = await request
        .get(`/api/users/${memberId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe("member@test.com");
    });

    it("returns 404 for non-existent user", async () => {
      const res = await request
        .get("/api/users/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/users", () => {
    it("allows admin to create user", async () => {
      const res = await request
        .post("/api/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Created User",
          email: "created@test.com",
          password: "password123",
          role: "member",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.email).toBe("created@test.com");
    });

    it("denies manager to create user", async () => {
      const res = await request
        .post("/api/users")
        .set("Authorization", `Bearer ${managerToken}`)
        .send({ name: "X", email: "x@test.com", password: "password123" });

      expect(res.status).toBe(403);
    });

    afterAll(async () => {
      await prisma.user.deleteMany({ where: { email: "created@test.com" } });
    });
  });

  describe("PUT /api/users/:id", () => {
    it("allows admin to update user", async () => {
      const res = await request
        .put(`/api/users/${memberId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Updated Member", department: "Engineering" });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Updated Member");
    });
  });

  describe("DELETE /api/users/:id", () => {
    it("denies manager to delete user", async () => {
      const res = await request
        .delete(`/api/users/${memberId}`)
        .set("Authorization", `Bearer ${managerToken}`);

      expect(res.status).toBe(403);
    });
  });
});
