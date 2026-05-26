import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const request = supertest(app);

let userToken: string;
let userId: string;
let projectId: string;
let sprintId: string;
let taskId: string;
let commentId: string;

describe("Comments", () => {
  beforeAll(async () => {
    const regRes = await request.post("/api/auth/register").send({
      name: "Commenter", email: "commenter@test.com", password: "password123",
    });
    userToken = regRes.body.data.token;
    userId = regRes.body.data.user.id;

    await prisma.user.update({ where: { email: "commenter@test.com" }, data: { role: "manager" } as any });
    const loginRes = await request.post("/api/auth/login").send({ email: "commenter@test.com", password: "password123" });
    userToken = loginRes.body.data.token;

    const projRes = await request
      .post("/api/projects")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ title: "Comment Project", client: "Test", startDate: "2025-01-01", endDate: "2025-12-31" });
    projectId = projRes.body.data.id;

    const sprintRes = await request
      .post("/api/sprints")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ projectId, title: "Comment Sprint", startDate: "2025-01-01", endDate: "2025-01-14" });
    sprintId = sprintRes.body.data.id;

    const taskRes = await request
      .post("/api/tasks")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ sprintId, title: "Commentable Task" });
    taskId = taskRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.comment.deleteMany({ where: { taskId } });
    await prisma.task.deleteMany({ where: { sprintId } });
    await prisma.sprint.deleteMany({ where: { projectId } });
    await prisma.project.deleteMany({ where: { id: projectId } });
    await prisma.user.deleteMany({ where: { email: "commenter@test.com" } });
  });

  it("adds comment to task", async () => {
    const res = await request
      .post(`/api/tasks/${taskId}/comments`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ body: "First comment" });

    expect(res.status).toBe(201);
    expect(res.body.data.body).toBe("First comment");
    expect(res.body.data.userId).toBe(userId);
    commentId = res.body.data.id;
  });

  it("adds reply comment", async () => {
    const res = await request
      .post(`/api/tasks/${taskId}/comments`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ body: "Reply comment", parentId: commentId });

    expect(res.status).toBe(201);
    expect(res.body.data.parentId).toBe(commentId);
  });

  it("lists comments for task with threading", async () => {
    const res = await request
      .get(`/api/tasks/${taskId}/comments`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].replies.length).toBeGreaterThanOrEqual(1);
  });

  it("edits own comment", async () => {
    const res = await request
      .put(`/api/comments/${commentId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ body: "Edited comment" });

    expect(res.status).toBe(200);
    expect(res.body.data.body).toBe("Edited comment");
  });
});
