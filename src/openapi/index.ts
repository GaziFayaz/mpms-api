import type { OpenAPIV3 } from "express";
import { schemas, parameters, securitySchemes, security } from "./schemas.js";
import { env } from "../config/env.js";

type PathsObject = Record<string, OpenAPIV3.PathItemObject>;

const { idParam } = parameters;
const {
  DataResponse, PaginatedResponse,
  AuthResponse, TokenResponse, ErrorResponse,
  ProjectReport, UserReport, OverviewReport, HealthResponse,
} = schemas;

const authRequired = { description: "Requires authentication", ...security[0] };
const rbac = (roles: string) => ({ description: `Requires authentication. Allowed roles: ${roles}.`, ...security[0] });
const noAuth = undefined;

function simpleResponse(schema: OpenAPIV3.SchemaObject): OpenAPIV3.ResponsesObject {
  return {
    "200": { description: "Success", content: { "application/json": { schema } } },
    "400": { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
  };
}

function crudResponses(schema: OpenAPIV3.SchemaObject): {
  ok: OpenAPIV3.ResponsesObject;
  created: OpenAPIV3.ResponsesObject;
  noContent: OpenAPIV3.ResponsesObject;
  withList: OpenAPIV3.ResponsesObject;
} {
  const body = (s: OpenAPIV3.SchemaObject) => ({
    "application/json": { schema: s },
  });
  const common = {
    "400": { description: "Validation error", content: body(ErrorResponse) },
    "401": { description: "Unauthorized — missing or invalid token", content: body(ErrorResponse) },
    "403": { description: "Forbidden — insufficient role", content: body(ErrorResponse) },
    "404": { description: "Resource not found", content: body(ErrorResponse) },
    "500": { description: "Internal server error", content: body(ErrorResponse) },
  };

  return {
    ok: { "200": { description: "Success", content: body(DataResponse(schema)) }, ...common },
    created: { "201": { description: "Created", content: body(DataResponse(schema)) }, ...common },
    noContent: { "204": { description: "Deleted successfully" }, ...common },
    withList: { "200": { description: "Success", content: body(DataResponse({ type: "array", items: { $ref: `#/components/schemas/${schema.title ?? "Unknown"}` } })) }, ...common },
  };
}

// ─── Build paths ───────────────────────────────────────────────────────────

const paths: PathsObject = {

  // ── Health ───────────────────────────────────────────────────────────────
  "/api/health": {
    get: {
      tags: ["Health"],
      summary: "Health check",
      responses: simpleResponse(HealthResponse),
    },
  },

  // ── Auth ─────────────────────────────────────────────────────────────────
  "/api/auth/register": {
    post: {
      tags: ["Auth"],
      summary: "Register a new user",
      requestBody: {
        required: true,
        content: { "application/json": { schema: schemas.RegisterRequest } },
      },
      responses: {
        "201": { description: "User registered", content: { "application/json": { schema: AuthResponse } } },
        "400": { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
        "409": { description: "Email already registered", content: { "application/json": { schema: ErrorResponse } } },
      },
    },
  },

  "/api/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Login with email and password",
      requestBody: {
        required: true,
        content: { "application/json": { schema: schemas.LoginRequest } },
      },
      responses: {
        "200": { description: "Login successful", content: { "application/json": { schema: AuthResponse } } },
        "400": { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
        "401": { description: "Invalid credentials", content: { "application/json": { schema: ErrorResponse } } },
      },
    },
  },

  "/api/auth/me": {
    get: {
      tags: ["Auth"],
      summary: "Get current authenticated user profile",
      security,
      responses: simpleResponse(DataResponse(schemas.User)),
    },
  },

  "/api/auth/refresh": {
    post: {
      tags: ["Auth"],
      summary: "Refresh access token using refresh token",
      requestBody: {
        required: true,
        content: { "application/json": { schema: schemas.RefreshRequest } },
      },
      responses: {
        "200": { description: "Tokens refreshed", content: { "application/json": { schema: TokenResponse } } },
        "401": { description: "Invalid or expired refresh token", content: { "application/json": { schema: ErrorResponse } } },
      },
    },
  },

  // ── Users ────────────────────────────────────────────────────────────────
  "/api/users": {
    get: {
      tags: ["Users"],
      summary: "List all users",
      description: "Requires admin or manager role.",
      security,
      responses: simpleResponse(DataResponse({ type: "array", items: { $ref: "#/components/schemas/User" } })),
    },
    post: {
      tags: ["Users"],
      summary: "Create a new user",
      description: "Requires admin role.",
      security,
      requestBody: {
        required: true,
        content: { "application/json": { schema: schemas.CreateUserRequest } },
      },
      responses: {
        "201": { description: "User created", content: { "application/json": { schema: DataResponse(schemas.User) } } },
        "400": { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
        "401": { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
        "403": { description: "Forbidden — requires admin role", content: { "application/json": { schema: ErrorResponse } } },
        "409": { description: "Email already in use", content: { "application/json": { schema: ErrorResponse } } },
      },
    },
  },

  "/api/users/{id}": {
    get: {
      tags: ["Users"],
      summary: "Get a user by ID",
      description: "Requires admin or manager role.",
      security,
      parameters: [idParam()],
      responses: simpleResponse(DataResponse(schemas.User)),
    },
    put: {
      tags: ["Users"],
      summary: "Update a user",
      description: "Requires admin role.",
      security,
      parameters: [idParam()],
      requestBody: {
        required: true,
        content: { "application/json": { schema: schemas.UpdateUserRequest } },
      },
      responses: simpleResponse(DataResponse(schemas.User)),
    },
    delete: {
      tags: ["Users"],
      summary: "Delete a user",
      description: "Requires admin role.",
      security,
      parameters: [idParam()],
      responses: {
        "204": { description: "User deleted" },
        "401": { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
        "403": { description: "Forbidden — requires admin role", content: { "application/json": { schema: ErrorResponse } } },
        "404": { description: "User not found", content: { "application/json": { schema: ErrorResponse } } },
      },
    },
  },

  "/api/users/{id}/invite": {
    post: {
      tags: ["Users"],
      summary: "Send invitation to a user",
      description: "Requires admin role.",
      security,
      parameters: [idParam()],
      responses: {
        "200": { description: "Invitation sent", content: { "application/json": { schema: DataResponse({ type: "object", properties: {} }) } } },
        "401": { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
        "403": { description: "Forbidden — requires admin role", content: { "application/json": { schema: ErrorResponse } } },
      },
    },
  },

  // ── Projects ─────────────────────────────────────────────────────────────
  "/api/projects": {
    get: {
      tags: ["Projects"],
      summary: "List projects",
      description: "Optionally filter by status or client.",
      security,
      parameters: parameters.projectFilterParams,
      responses: simpleResponse(DataResponse({ type: "array", items: { $ref: "#/components/schemas/Project" } })),
    },
    post: {
      tags: ["Projects"],
      summary: "Create a new project",
      description: "Requires admin or manager role.",
      security,
      requestBody: {
        required: true,
        content: { "application/json": { schema: schemas.CreateProjectRequest } },
      },
      responses: {
        "201": { description: "Project created", content: { "application/json": { schema: DataResponse(schemas.Project) } } },
        "400": { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
        "401": { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
        "403": { description: "Forbidden — requires admin or manager role", content: { "application/json": { schema: ErrorResponse } } },
      },
    },
  },

  "/api/projects/{id}": {
    get: {
      tags: ["Projects"],
      summary: "Get a project by ID (includes stats)",
      security,
      parameters: [idParam()],
      responses: simpleResponse(DataResponse(schemas.Project)),
    },
    put: {
      tags: ["Projects"],
      summary: "Update a project",
      description: "Requires admin or manager role.",
      security,
      parameters: [idParam()],
      requestBody: {
        required: true,
        content: { "application/json": { schema: schemas.UpdateProjectRequest } },
      },
      responses: simpleResponse(DataResponse(schemas.Project)),
    },
    delete: {
      tags: ["Projects"],
      summary: "Delete a project",
      description: "Requires admin role.",
      security,
      parameters: [idParam()],
      responses: {
        "204": { description: "Project deleted" },
        "403": { description: "Forbidden — requires admin role", content: { "application/json": { schema: ErrorResponse } } },
      },
    },
  },

  "/api/projects/{projectId}/sprints": {
    get: {
      tags: ["Projects"],
      summary: "List sprints for a project",
      security,
      parameters: [idParam("projectId", "Project UUID")],
      responses: simpleResponse(DataResponse({ type: "array", items: { $ref: "#/components/schemas/Sprint" } })),
    },
  },

  // ── Sprints ──────────────────────────────────────────────────────────────
  "/api/sprints/{id}": {
    get: {
      tags: ["Sprints"],
      summary: "Get a sprint by ID",
      security,
      parameters: [idParam()],
      responses: simpleResponse(DataResponse(schemas.Sprint)),
    },
    put: {
      tags: ["Sprints"],
      summary: "Update a sprint",
      description: "Requires admin or manager role.",
      security,
      parameters: [idParam()],
      requestBody: {
        required: true,
        content: { "application/json": { schema: schemas.UpdateSprintRequest } },
      },
      responses: simpleResponse(DataResponse(schemas.Sprint)),
    },
    delete: {
      tags: ["Sprints"],
      summary: "Delete a sprint",
      description: "Requires admin role.",
      security,
      parameters: [idParam()],
      responses: {
        "204": { description: "Sprint deleted" },
        "403": { description: "Forbidden — requires admin role", content: { "application/json": { schema: ErrorResponse } } },
      },
    },
  },

  "/api/sprints": {
    post: {
      tags: ["Sprints"],
      summary: "Create a sprint",
      description: "Requires admin or manager role. sprintNumber is auto-incremented per project.",
      security,
      requestBody: {
        required: true,
        content: { "application/json": { schema: schemas.CreateSprintRequest } },
      },
      responses: {
        "201": { description: "Sprint created", content: { "application/json": { schema: DataResponse(schemas.Sprint) } } },
        "400": { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
        "403": { description: "Forbidden — requires admin or manager", content: { "application/json": { schema: ErrorResponse } } },
      },
    },
  },

  "/api/sprints/{id}/order": {
    patch: {
      tags: ["Sprints"],
      summary: "Reorder a sprint (update sortOrder)",
      description: "Requires admin or manager role.",
      security,
      parameters: [idParam()],
      requestBody: {
        required: true,
        content: { "application/json": { schema: schemas.ReorderSprintRequest } },
      },
      responses: simpleResponse(DataResponse(schemas.Sprint)),
    },
  },

  "/api/sprints/{id}/tasks": {
    get: {
      tags: ["Sprints"],
      summary: "List tasks in a sprint",
      security,
      parameters: [idParam()],
      responses: simpleResponse(DataResponse({ type: "array", items: { $ref: "#/components/schemas/Task" } })),
    },
  },

  // ── Tasks ────────────────────────────────────────────────────────────────
  "/api/tasks": {
    get: {
      tags: ["Tasks"],
      summary: "List tasks with pagination and filtering",
      description: "Can filter by project, sprint, assignee, status, and priority.",
      security,
      parameters: parameters.taskFilterParams,
      responses: simpleResponse(PaginatedResponse({ $ref: "#/components/schemas/Task" })),
    },
    post: {
      tags: ["Tasks"],
      summary: "Create a task",
      description: "Requires admin or manager role. Task must belong to a sprint. projectId is auto-derived from the sprint.",
      security,
      requestBody: {
        required: true,
        content: { "application/json": { schema: schemas.CreateTaskRequest } },
      },
      responses: {
        "201": { description: "Task created", content: { "application/json": { schema: DataResponse(schemas.Task) } } },
        "400": { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
        "403": { description: "Forbidden — requires admin or manager", content: { "application/json": { schema: ErrorResponse } } },
        "404": { description: "Sprint not found", content: { "application/json": { schema: ErrorResponse } } },
      },
    },
  },

  "/api/tasks/{id}": {
    get: {
      tags: ["Tasks"],
      summary: "Get a task by ID (includes assignees and subtasks)",
      security,
      parameters: [idParam()],
      responses: simpleResponse(DataResponse(schemas.Task)),
    },
    put: {
      tags: ["Tasks"],
      summary: "Update a task",
      description: "Requires admin or manager role.",
      security,
      parameters: [idParam()],
      requestBody: {
        required: true,
        content: { "application/json": { schema: schemas.UpdateTaskRequest } },
      },
      responses: simpleResponse(DataResponse(schemas.Task)),
    },
    delete: {
      tags: ["Tasks"],
      summary: "Delete a task",
      description: "Requires admin role.",
      security,
      parameters: [idParam()],
      responses: {
        "204": { description: "Task deleted" },
        "403": { description: "Forbidden — requires admin role", content: { "application/json": { schema: ErrorResponse } } },
      },
    },
  },

  "/api/tasks/{id}/status": {
    patch: {
      tags: ["Tasks"],
      summary: "Update task status with state-machine validation",
      description:
        "Valid transitions: todo→in_progress, in_progress→review (any user), review→done (manager/admin only). Invalid transitions return 400.",
      security,
      parameters: [idParam()],
      requestBody: {
        required: true,
        content: { "application/json": { schema: schemas.UpdateStatusRequest } },
      },
      responses: simpleResponse(DataResponse(schemas.Task)),
    },
  },

  "/api/tasks/{id}/kanban-order": {
    patch: {
      tags: ["Tasks"],
      summary: "Update task sort order (kanban positioning)",
      security,
      parameters: [idParam()],
      requestBody: {
        required: true,
        content: { "application/json": { schema: schemas.UpdateKanbanOrderRequest } },
      },
      responses: simpleResponse(DataResponse(schemas.Task)),
    },
  },

  "/api/tasks/{id}/subtasks": {
    post: {
      tags: ["Tasks"],
      summary: "Add a subtask to a task",
      description: "Subtask sortOrder is auto-incremented.",
      security,
      parameters: [idParam()],
      requestBody: {
        required: true,
        content: { "application/json": { schema: schemas.AddSubtaskRequest } },
      },
      responses: {
        "201": { description: "Subtask created", content: { "application/json": { schema: DataResponse(schemas.SubTask) } } },
        "404": { description: "Task not found", content: { "application/json": { schema: ErrorResponse } } },
      },
    },
  },

  "/api/tasks/{id}/subtasks/{subId}": {
    patch: {
      tags: ["Tasks"],
      summary: "Toggle subtask completion status",
      security,
      parameters: [idParam(), idParam("subId", "Subtask UUID")],
      requestBody: {
        required: true,
        content: { "application/json": { schema: schemas.ToggleSubtaskRequest } },
      },
      responses: simpleResponse(DataResponse(schemas.SubTask)),
    },
  },

  "/api/tasks/{id}/comments": {
    get: {
      tags: ["Tasks"],
      summary: "List comments on a task (includes nested replies)",
      security,
      parameters: [idParam()],
      responses: simpleResponse(DataResponse({ type: "array", items: { $ref: "#/components/schemas/Comment" } })),
    },
    post: {
      tags: ["Tasks"],
      summary: "Create a comment on a task",
      description: "Set parentId to reply to an existing comment (threaded).",
      security,
      parameters: [idParam()],
      requestBody: {
        required: true,
        content: { "application/json": { schema: schemas.CreateCommentRequest } },
      },
      responses: {
        "201": { description: "Comment created", content: { "application/json": { schema: DataResponse(schemas.Comment) } } },
        "400": { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
        "404": { description: "Task not found", content: { "application/json": { schema: ErrorResponse } } },
      },
    },
  },

  "/api/tasks/{id}/attachments": {
    get: {
      tags: ["Tasks"],
      summary: "List attachments for a task",
      description: "Each attachment includes a presigned download URL (1h expiry).",
      security,
      parameters: [idParam()],
      responses: simpleResponse(DataResponse({ type: "array", items: { $ref: "#/components/schemas/Attachment" } })),
    },
    post: {
      tags: ["Tasks"],
      summary: "Upload an attachment to a task",
      description: "Accepted MIME types: image/png, image/jpeg, image/gif, application/pdf. Max 10MB. Uses Cloudflare R2 storage.",
      security,
      parameters: [idParam()],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                file: {
                  type: "string",
                  format: "binary",
                  description: "The file to upload (PNG, JPEG, GIF, or PDF, max 10MB)",
                },
              },
              required: ["file"],
            },
          },
        },
      },
      responses: {
        "201": { description: "Attachment uploaded", content: { "application/json": { schema: DataResponse(schemas.Attachment) } } },
        "400": { description: "Invalid file type or size", content: { "application/json": { schema: ErrorResponse } } },
        "404": { description: "Task not found", content: { "application/json": { schema: ErrorResponse } } },
      },
    },
  },

  "/api/tasks/{id}/timelogs": {
    get: {
      tags: ["Tasks"],
      summary: "List time logs for a task",
      security,
      parameters: [idParam()],
      responses: simpleResponse(DataResponse({ type: "array", items: { $ref: "#/components/schemas/TimeLog" } })),
    },
    post: {
      tags: ["Tasks"],
      summary: "Log time against a task",
      security,
      parameters: [idParam()],
      requestBody: {
        required: true,
        content: { "application/json": { schema: schemas.CreateTimeLogRequest } },
      },
      responses: {
        "201": { description: "Time log created", content: { "application/json": { schema: DataResponse(schemas.TimeLog) } } },
        "400": { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
        "404": { description: "Task not found", content: { "application/json": { schema: ErrorResponse } } },
      },
    },
  },

  // ── Comments ─────────────────────────────────────────────────────────────
  "/api/comments/{id}": {
    put: {
      tags: ["Comments"],
      summary: "Edit a comment",
      description: "Users can only edit their own comments.",
      security,
      parameters: [idParam()],
      requestBody: {
        required: true,
        content: { "application/json": { schema: schemas.UpdateCommentRequest } },
      },
      responses: {
        "200": { description: "Comment updated", content: { "application/json": { schema: DataResponse(schemas.Comment) } } },
        "403": { description: "Cannot edit another user's comment", content: { "application/json": { schema: ErrorResponse } } },
        "404": { description: "Comment not found", content: { "application/json": { schema: ErrorResponse } } },
      },
    },
  },

  // ── Attachments ──────────────────────────────────────────────────────────
  "/api/attachments/{id}": {
    get: {
      tags: ["Attachments"],
      summary: "Get attachment metadata",
      description: "Returns metadata including a presigned download URL (1h expiry).",
      security,
      parameters: [idParam()],
      responses: simpleResponse(DataResponse(schemas.Attachment)),
    },
    delete: {
      tags: ["Attachments"],
      summary: "Delete an attachment",
      description: "Removes from both Cloudflare R2 storage and database.",
      security,
      parameters: [idParam()],
      responses: {
        "200": { description: "Attachment deleted", content: { "application/json": { schema: DataResponse({ type: "object", properties: { message: { type: "string", example: "Attachment deleted" } }, required: ["message"] }) } } },
        "404": { description: "Attachment not found", content: { "application/json": { schema: ErrorResponse } } },
      },
    },
  },

  "/api/attachments/{id}/download": {
    get: {
      tags: ["Attachments"],
      summary: "Download an attachment",
      description: "Returns a 302 redirect to a Cloudflare R2 presigned URL (1h expiry).",
      security,
      parameters: [idParam()],
      responses: {
        "302": { description: "Redirect to presigned download URL" },
        "404": { description: "Attachment not found", content: { "application/json": { schema: ErrorResponse } } },
      },
    },
  },

  // ── Reports ──────────────────────────────────────────────────────────────
  "/api/reports/project/{id}": {
    get: {
      tags: ["Reports"],
      summary: "Generate project progress report",
      description: "Requires admin or manager role. Includes task breakdown by status and sprint.",
      security,
      parameters: [idParam()],
      responses: {
        "200": { description: "Project report", content: { "application/json": { schema: ProjectReport } } },
        "401": { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
        "403": { description: "Forbidden — requires admin or manager", content: { "application/json": { schema: ErrorResponse } } },
        "404": { description: "Project not found", content: { "application/json": { schema: ErrorResponse } } },
      },
    },
  },

  "/api/reports/user/{id}": {
    get: {
      tags: ["Reports"],
      summary: "Generate user workload report",
      description: "Requires admin or manager role. Includes assigned tasks, hours, and projects.",
      security,
      parameters: [idParam()],
      responses: {
        "200": { description: "User report", content: { "application/json": { schema: UserReport } } },
        "403": { description: "Forbidden — requires admin or manager", content: { "application/json": { schema: ErrorResponse } } },
        "404": { description: "User not found", content: { "application/json": { schema: ErrorResponse } } },
      },
    },
  },

  "/api/reports/overview": {
    get: {
      tags: ["Reports"],
      summary: "Generate overview of all projects",
      description: "Requires admin or manager role.",
      security,
      responses: {
        "200": { description: "Overview report", content: { "application/json": { schema: OverviewReport } } },
        "403": { description: "Forbidden — requires admin or manager", content: { "application/json": { schema: ErrorResponse } } },
      },
    },
  },
};

// ─── Assemble full spec ────────────────────────────────────────────────────

export const openApiSpec: OpenAPIV3.Document = {
  openapi: "3.1.0",
  info: {
    title: "MPMS — Multi-Project Management System API",
    version: "1.0.0",
    description:
      "Backend API for managing projects, sprints, tasks, users, attachments, comments, and reports.\n\n" +
      "**Authentication:** JWT Bearer tokens. Obtain via `POST /api/auth/login` or `POST /api/auth/register`.\n\n" +
      "**Roles:** `admin`, `manager`, `member`. Role requirements are noted in endpoint descriptions.\n\n" +
      "**Response envelope:** `{ data: ... }` for success. `{ error, status, details? }` for errors.",
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}`,
      description: "Local development server",
    },
  ],
  tags: [
    { name: "Health", description: "Health check" },
    { name: "Auth", description: "Authentication — register, login, token management" },
    { name: "Users", description: "User management — CRUD + invite" },
    { name: "Projects", description: "Project management — CRUD + nested sprints" },
    { name: "Sprints", description: "Sprint management — CRUD + reorder + tasks" },
    { name: "Tasks", description: "Task management — CRUD + status workflow + subtasks + comments + attachments + time logs" },
    { name: "Comments", description: "Comment editing" },
    { name: "Attachments", description: "Attachment metadata, download, and deletion" },
    { name: "Reports", description: "Project, user, and overview reports" },
  ],
  components: {
    schemas: {
      User: schemas.User,
      UserSummary: schemas.UserSummary,
      Project: schemas.Project,
      Sprint: schemas.Sprint,
      Task: schemas.Task,
      SubTask: schemas.SubTask,
      Comment: schemas.Comment,
      Attachment: schemas.Attachment,
      TimeLog: schemas.TimeLog,
      ActivityLog: schemas.ActivityLog,
      // Request bodies
      RegisterRequest: schemas.RegisterRequest,
      LoginRequest: schemas.LoginRequest,
      RefreshRequest: schemas.RefreshRequest,
      CreateUserRequest: schemas.CreateUserRequest,
      UpdateUserRequest: schemas.UpdateUserRequest,
      CreateProjectRequest: schemas.CreateProjectRequest,
      UpdateProjectRequest: schemas.UpdateProjectRequest,
      CreateSprintRequest: schemas.CreateSprintRequest,
      UpdateSprintRequest: schemas.UpdateSprintRequest,
      CreateTaskRequest: schemas.CreateTaskRequest,
      UpdateTaskRequest: schemas.UpdateTaskRequest,
      CreateCommentRequest: schemas.CreateCommentRequest,
      UpdateCommentRequest: schemas.UpdateCommentRequest,
      CreateTimeLogRequest: schemas.CreateTimeLogRequest,
    },
    securitySchemes,
  },
  paths,
};
