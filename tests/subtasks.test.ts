import { describe, it, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const request = supertest(app);

let memberToken: string;
let projectId: string;
let sprintId: string;
let taskId: string;
let subTaskId: string;

describe("Subtasks", () => {
  beforeAll(async () => {
    const regRes = await request.post("/api/auth/register").send({
      name: "Sub User", email: "subuser@test.com", password: "password123",
    });
    memberToken = regRes.body.data.token;

    await prisma.user.update({ where: { email: "subuser@test.com" }, data: { role: "manager" } as any });
    const loginRes = await request.post("/api/auth/login").send({ email: "subuser@test.com", password: "password123" });
    memberToken = loginRes.body.data.token;

    const projRes = await request
      .post("/api/projects")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ title: "Subtask Project", client: "Test", startDate: "2025-01-01", endDate: "2025-12-31" });
    projectId = projRes.body.data.id;

    const sprintRes = await request
      .post("/api/sprints")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ projectId, title: "Sub Sprint", startDate: "2025-01-01", endDate: "2025-01-14" });
    sprintId = sprintRes.body.data.id;

    const taskRes = await request
      .post("/api/tasks")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ sprintId, title: "Parent Task" });
    taskId = taskRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.subTask.deleteMany({ where: { taskId } });
    await prisma.task.deleteMany({ where: { sprintId } });
    await prisma.sprint.deleteMany({ where: { projectId } });
    await prisma.project.deleteMany({ where: { id: projectId } });
    await prisma.user.deleteMany({ where: { email: "subuser@test.com" } });
  });

  it("adds subtask to task", async () => {
    const res = await request
      .post(`/api/tasks/${taskId}/subtasks`)
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ title: "First subtask" });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe("First subtask");
    expect(res.body.data.completed).toBe(false);
    subTaskId = res.body.data.id;
  });

  it("toggles subtask completed", async () => {
    const res = await request
      .patch(`/api/tasks/${taskId}/subtasks/${subTaskId}`)
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ completed: true });

    expect(res.status).toBe(200);
    expect(res.body.data.completed).toBe(true);
  });

  it("toggles subtask back to incomplete", async () => {
    const res = await request
      .patch(`/api/tasks/${taskId}/subtasks/${subTaskId}`)
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ completed: false });

    expect(res.status).toBe(200);
    expect(res.body.data.completed).toBe(false);
  });

  it("lists subtasks on task detail", async () => {
    const res = await request
      .get(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${memberToken}`);

    expect(res.body.data.subtasks.length).toBeGreaterThanOrEqual(1);
  });
});
