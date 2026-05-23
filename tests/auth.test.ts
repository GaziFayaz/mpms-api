import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const request = supertest(app);

describe("POST /api/auth/register", () => {
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: "test@example.com" } });
  });

  it("registers a new user and returns token", async () => {
    const res = await request.post("/api/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });

    expect(res.status).toBe(201);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe("test@example.com");
    expect(res.body.data.user.name).toBe("Test User");
    expect(res.body.data.user.role).toBe("member");
  });

  it("rejects duplicate email", async () => {
    const res = await request.post("/api/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });

    expect(res.status).toBe(409);
  });

  it("validates required fields", async () => {
    const res = await request.post("/api/auth/register").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

describe("POST /api/auth/login", () => {
  beforeAll(async () => {
    await request.post("/api/auth/register").send({
      name: "Login Test",
      email: "login@example.com",
      password: "password123",
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: "login@example.com" } });
  });

  it("logs in with valid credentials", async () => {
    const res = await request.post("/api/auth/login").send({
      email: "login@example.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe("login@example.com");
  });

  it("rejects invalid password", async () => {
    const res = await request.post("/api/auth/login").send({
      email: "login@example.com",
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
  });

  it("rejects non-existent user", async () => {
    const res = await request.post("/api/auth/login").send({
      email: "nobody@example.com",
      password: "password123",
    });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  let token: string;

  beforeAll(async () => {
    const res = await request.post("/api/auth/register").send({
      name: "Me Test",
      email: "me@example.com",
      password: "password123",
    });
    token = res.body.data.token;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: "me@example.com" } });
  });

  it("returns current user with valid token", async () => {
    const res = await request.get("/api/auth/me").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("me@example.com");
  });

  it("rejects missing token", async () => {
    const res = await request.get("/api/auth/me");

    expect(res.status).toBe(401);
  });

  it("rejects invalid token", async () => {
    const res = await request.get("/api/auth/me").set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/refresh", () => {
  let refreshToken: string;

  beforeAll(async () => {
    const res = await request.post("/api/auth/register").send({
      name: "Refresh Test",
      email: "refresh@example.com",
      password: "password123",
    });
    refreshToken = res.body.data.refreshToken;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: "refresh@example.com" } });
  });

  it("returns new access token with valid refresh token", async () => {
    const res = await request.post("/api/auth/refresh").send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it("rejects invalid refresh token", async () => {
    const res = await request.post("/api/auth/refresh").send({ refreshToken: "invalid" });

    expect(res.status).toBe(401);
  });
});
