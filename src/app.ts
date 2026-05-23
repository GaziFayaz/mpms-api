import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import authRoutes from "./modules/auth/auth.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import projectsRoutes from "./modules/projects/projects.routes.js";
import sprintsRoutes from "./modules/sprints/sprints.routes.js";
import tasksRoutes from "./modules/tasks/tasks.routes.js";
import commentsRoutes from "./modules/comments/comments.routes.js";

const app = express();

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/sprints", sprintsRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/comments", commentsRoutes);

app.use(errorHandler);

export default app;
