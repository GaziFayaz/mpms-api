import type { OpenAPIV3 } from "express";

type SchemaObject = OpenAPIV3.SchemaObject;
type ParameterObject = OpenAPIV3.ParameterObject;
type ResponseObject = OpenAPIV3.ResponseObject;
type SecuritySchemeObject = OpenAPIV3.SecuritySchemeObject;

const uuid = { type: "string", format: "uuid" } as const;
const dateStr = { type: "string", format: "date" } as const;
const dateTimeStr = { type: "string", format: "date-time" } as const;
const emailStr = { type: "string", format: "email" } as const;

// ─── Enums ────────────────────────────────────────────────────────────────

const userRole: SchemaObject = { type: "string", enum: ["admin", "manager", "member"] };
const projectStatus: SchemaObject = { type: "string", enum: ["planned", "active", "completed", "archived"] };
const taskStatus: SchemaObject = { type: "string", enum: ["todo", "in_progress", "review", "done"] };
const taskPriority: SchemaObject = { type: "string", enum: ["low", "medium", "high", "critical"] };
const activityAction: SchemaObject = {
  type: "string",
  enum: ["created", "updated_status", "assigned", "commented", "attached_file", "subtask_toggled"],
};

// ─── Entity Schemas ───────────────────────────────────────────────────────

const userBase = {
  id: { ...uuid, description: "Unique identifier", example: "550e8400-e29b-41d4-a716-446655440000" },
  name: { type: "string", example: "John Doe" },
  email: { ...emailStr, example: "john@example.com" },
  role: { ...userRole, example: "member" },
  department: { type: "string", nullable: true, example: "Engineering" },
  skills: { type: "array", items: { type: "string" }, example: ["typescript", "react"] },
  avatarUrl: { type: "string", nullable: true, format: "uri", example: "https://example.com/avatar.jpg" },
};

const User: SchemaObject = {
  type: "object",
  properties: {
    ...userBase,
    createdAt: { ...dateTimeStr, example: "2024-01-15T10:30:00Z" },
    updatedAt: { ...dateTimeStr, example: "2024-01-15T10:30:00Z" },
  },
  required: ["id", "name", "email", "role", "skills", "createdAt", "updatedAt"],
};

const UserSummary: SchemaObject = {
  type: "object",
  properties: {
    id: userBase.id,
    name: userBase.name,
    email: userBase.email,
    role: userBase.role,
    avatarUrl: userBase.avatarUrl,
  },
  required: ["id", "name", "email", "role"],
};

const Project: SchemaObject = {
  type: "object",
  properties: {
    id: { ...uuid, example: "550e8400-e29b-41d4-a716-446655440001" },
    title: { type: "string", example: "Website Redesign" },
    client: { type: "string", example: "Acme Corp" },
    description: { type: "string", nullable: true, example: "Complete overhaul of the corporate website" },
    startDate: { ...dateStr, example: "2024-03-01" },
    endDate: { ...dateStr, example: "2024-06-30" },
    budget: { type: "number", nullable: true, format: "double", example: 50000.0 },
    status: { ...projectStatus, example: "active" },
    thumbnailUrl: { type: "string", nullable: true, format: "uri", example: "https://example.com/thumb.jpg" },
    createdAt: { ...dateTimeStr, example: "2024-03-01T09:00:00Z" },
    updatedAt: { ...dateTimeStr, example: "2024-03-15T14:20:00Z" },
  },
  required: ["id", "title", "client", "startDate", "endDate", "status", "createdAt", "updatedAt"],
};

const Sprint: SchemaObject = {
  type: "object",
  properties: {
    id: { ...uuid, example: "550e8400-e29b-41d4-a716-446655440002" },
    projectId: { ...uuid, example: "550e8400-e29b-41d4-a716-446655440001" },
    title: { type: "string", example: "Sprint 1 - Foundation" },
    sprintNumber: { type: "integer", example: 1 },
    startDate: { ...dateStr, example: "2024-03-01" },
    endDate: { ...dateStr, example: "2024-03-14" },
    sortOrder: { type: "integer", example: 0 },
    createdAt: { ...dateTimeStr, example: "2024-03-01T09:00:00Z" },
    updatedAt: { ...dateTimeStr, example: "2024-03-01T09:00:00Z" },
  },
  required: ["id", "projectId", "title", "sprintNumber", "startDate", "endDate", "sortOrder", "createdAt", "updatedAt"],
};

const SubTaskSchema: SchemaObject = {
  type: "object",
  properties: {
    id: { ...uuid, example: "550e8400-e29b-41d4-a716-446655440010" },
    taskId: { ...uuid, example: "550e8400-e29b-41d4-a716-446655440003" },
    title: { type: "string", example: "Set up CI/CD pipeline" },
    completed: { type: "boolean", example: false },
    sortOrder: { type: "integer", example: 0 },
    createdAt: { ...dateTimeStr, example: "2024-03-05T10:00:00Z" },
  },
  required: ["id", "taskId", "title", "completed", "sortOrder", "createdAt"],
};

const CommentSchema: SchemaObject = {
  type: "object",
  properties: {
    id: { ...uuid, example: "550e8400-e29b-41d4-a716-446655440011" },
    taskId: { ...uuid, example: "550e8400-e29b-41d4-a716-446655440003" },
    userId: { ...uuid, example: "550e8400-e29b-41d4-a716-446655440000" },
    parentId: { type: "string", nullable: true, format: "uuid", example: null },
    body: { type: "string", example: "This needs clarification on the API contract." },
    user: UserSummary,
    replies: {
      type: "array",
      items: { $ref: "#/components/schemas/Comment" as const },
    },
    createdAt: { ...dateTimeStr, example: "2024-03-05T10:00:00Z" },
    updatedAt: { ...dateTimeStr, example: "2024-03-05T10:00:00Z" },
  },
  required: ["id", "taskId", "userId", "body", "user", "createdAt", "updatedAt"],
};

const AttachmentSchema: SchemaObject = {
  type: "object",
  properties: {
    id: { ...uuid, example: "550e8400-e29b-41d4-a716-446655440012" },
    taskId: { ...uuid, example: "550e8400-e29b-41d4-a716-446655440003" },
    fileName: { type: "string", example: "screenshot.png" },
    fileKey: { type: "string", example: "attachments/task-xxx/screenshot.png" },
    fileType: { type: "string", example: "image/png" },
    fileSize: { type: "integer", example: 204800 },
    uploadedBy: { ...uuid, example: "550e8400-e29b-41d4-a716-446655440000" },
    downloadUrl: {
      type: "string",
      nullable: true,
      format: "uri",
      description: "Presigned download URL (1h expiry). Present when listing/fetching attachments.",
      example: "https://r2.example.com/attachments/task-xxx/screenshot.png?token=...",
    },
    createdAt: { ...dateTimeStr, example: "2024-03-05T10:00:00Z" },
  },
  required: ["id", "taskId", "fileName", "fileKey", "fileType", "fileSize", "uploadedBy", "createdAt"],
};

const TimeLogSchema: SchemaObject = {
  type: "object",
  properties: {
    id: { ...uuid, example: "550e8400-e29b-41d4-a716-446655440013" },
    taskId: { ...uuid, example: "550e8400-e29b-41d4-a716-446655440003" },
    userId: { ...uuid, example: "550e8400-e29b-41d4-a716-446655440000" },
    hours: { type: "number", format: "double", example: 2.5 },
    description: { type: "string", nullable: true, example: "Worked on API integration" },
    loggedDate: { ...dateStr, example: "2024-03-05" },
    user: {
      type: "object",
      properties: { id: uuid, name: { type: "string", example: "John Doe" } },
      required: ["id", "name"],
    },
    createdAt: { ...dateTimeStr, example: "2024-03-05T12:00:00Z" },
  },
  required: ["id", "taskId", "userId", "hours", "loggedDate", "user", "createdAt"],
};

const ActivityLogSchema: SchemaObject = {
  type: "object",
  properties: {
    id: { ...uuid, example: "550e8400-e29b-41d4-a716-446655440014" },
    taskId: { ...uuid, example: "550e8400-e29b-41d4-a716-446655440003" },
    userId: { ...uuid, example: "550e8400-e29b-41d4-a716-446655440000" },
    action: { ...activityAction, example: "updated_status" },
    details: { type: "object", description: "Free-form JSON with action-specific data", example: { from: "todo", to: "in_progress" } },
    createdAt: { ...dateTimeStr, example: "2024-03-05T10:00:00Z" },
  },
  required: ["id", "taskId", "userId", "action", "createdAt"],
};

const Task: SchemaObject = {
  type: "object",
  properties: {
    id: { ...uuid, example: "550e8400-e29b-41d4-a716-446655440003" },
    sprintId: { ...uuid, example: "550e8400-e29b-41d4-a716-446655440002" },
    projectId: { ...uuid, example: "550e8400-e29b-41d4-a716-446655440001" },
    title: { type: "string", example: "Implement user login" },
    description: { type: "string", nullable: true, example: "Add JWT-based authentication with refresh tokens" },
    status: { ...taskStatus, example: "in_progress" },
    priority: { ...taskPriority, example: "high" },
    estimateHours: { type: "number", nullable: true, format: "double", example: 8.0 },
    dueDate: { ...dateStr, nullable: true, example: "2024-03-10" },
    sortOrder: { type: "integer", example: 0 },
    assignees: { type: "array", items: UserSummary },
    subtasks: { type: "array", items: { $ref: "#/components/schemas/SubTask" as const } },
    createdAt: { ...dateTimeStr, example: "2024-03-02T14:00:00Z" },
    updatedAt: { ...dateTimeStr, example: "2024-03-05T09:30:00Z" },
  },
  required: [
    "id", "sprintId", "projectId", "title", "status", "priority",
    "sortOrder", "assignees", "subtasks", "createdAt", "updatedAt",
  ],
};

// ─── Auth Schemas ──────────────────────────────────────────────────────────

const AuthResponse: SchemaObject = {
  type: "object",
  properties: {
    data: {
      type: "object",
      properties: {
        user: UserSummary,
        token: { type: "string", description: "JWT access token", example: "eyJhbGciOiJIUzI1NiIs..." },
        refreshToken: { type: "string", description: "JWT refresh token", example: "eyJhbGciOiJIUzI1NiIs..." },
      },
      required: ["user", "token", "refreshToken"],
    },
  },
  required: ["data"],
};

const TokenResponse: SchemaObject = {
  type: "object",
  properties: {
    data: {
      type: "object",
      properties: {
        token: { type: "string", example: "eyJhbGciOiJIUzI1NiIs..." },
        refreshToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIs..." },
      },
      required: ["token", "refreshToken"],
    },
  },
  required: ["data"],
};

// ─── Generic Response Wrappers ─────────────────────────────────────────────

function DataResponse(schema: SchemaObject | { $ref: string }): SchemaObject {
  return {
    type: "object",
    properties: { data: schema },
    required: ["data"],
  };
}

function PaginatedResponse(schema: SchemaObject | { $ref: string }): SchemaObject {
  return {
    type: "object",
    properties: {
      data: { type: "array", items: schema },
      total: { type: "integer", example: 42 },
      page: { type: "integer", example: 1 },
      limit: { type: "integer", example: 20 },
      totalPages: { type: "integer", example: 3 },
    },
    required: ["data", "total", "page", "limit", "totalPages"],
  };
}

const ErrorResponse: SchemaObject = {
  type: "object",
  properties: {
    error: { type: "string", description: "Human-readable error message", example: "Validation failed" },
    status: { type: "integer", example: 400 },
    details: {
      type: "array",
      items: {
        type: "object",
        properties: {
          field: { type: "string", example: "email" },
          message: { type: "string", example: "Invalid email" },
        },
        required: ["field", "message"],
      },
    },
    stack: {
      type: "string",
      description: "Stack trace (only in development mode)",
      example: "Error: Validation failed\n    at ...",
    },
  },
  required: ["error", "status"],
};

// ─── Request Body Schemas ──────────────────────────────────────────────────

const RegisterRequest: SchemaObject = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1, example: "John Doe" },
    email: { ...emailStr, example: "john@example.com" },
    password: { type: "string", minLength: 6, format: "password", example: "securePass123" },
  },
  required: ["name", "email", "password"],
};

const LoginRequest: SchemaObject = {
  type: "object",
  properties: {
    email: { ...emailStr, example: "john@example.com" },
    password: { type: "string", minLength: 1, format: "password", example: "securePass123" },
  },
  required: ["email", "password"],
};

const RefreshRequest: SchemaObject = {
  type: "object",
  properties: {
    refreshToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIs..." },
  },
  required: ["refreshToken"],
};

const CreateUserRequest: SchemaObject = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1, example: "Jane Smith" },
    email: { ...emailStr, example: "jane@example.com" },
    password: { type: "string", minLength: 6, format: "password", example: "securePass123" },
    role: { ...userRole, example: "manager" },
    department: { type: "string", example: "Design" },
    skills: { type: "array", items: { type: "string" }, example: ["figma", "sketch"] },
    avatarUrl: { type: "string", format: "uri", example: "https://example.com/jane.jpg" },
  },
  required: ["name", "email", "password"],
};

const UpdateUserRequest: SchemaObject = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1, example: "Jane Doe" },
    email: { ...emailStr, example: "jane@example.com" },
    password: { type: "string", minLength: 6, format: "password", example: "newPassword456" },
    role: userRole,
    department: { type: "string", example: "Engineering" },
    skills: { type: "array", items: { type: "string" }, example: ["typescript", "figma"] },
    avatarUrl: { type: "string", format: "uri", example: "https://example.com/jane-new.jpg" },
  },
};

const CreateProjectRequest: SchemaObject = {
  type: "object",
  properties: {
    title: { type: "string", minLength: 1, example: "Website Redesign" },
    client: { type: "string", minLength: 1, example: "Acme Corp" },
    description: { type: "string", example: "Complete overhaul of the corporate website" },
    startDate: { ...dateStr, example: "2024-03-01" },
    endDate: { ...dateStr, example: "2024-06-30" },
    budget: { type: "number", minimum: 0, exclusiveMinimum: true, format: "double", example: 50000.0 },
    status: { ...projectStatus, example: "planned" },
    thumbnailUrl: { type: "string", format: "uri", example: "https://example.com/thumb.jpg" },
  },
  required: ["title", "client", "startDate", "endDate"],
};

const UpdateProjectRequest: SchemaObject = {
  type: "object",
  properties: {
    title: { type: "string", minLength: 1, example: "Website Redesign v2" },
    client: { type: "string", minLength: 1, example: "Acme International" },
    description: { type: "string", example: "Updated scope" },
    startDate: { ...dateStr, example: "2024-04-01" },
    endDate: { ...dateStr, example: "2024-07-31" },
    budget: { type: "number", minimum: 0, exclusiveMinimum: true, format: "double", example: 60000.0 },
    status: projectStatus,
    thumbnailUrl: { type: "string", format: "uri", example: "https://example.com/new-thumb.jpg" },
  },
};

const CreateSprintRequest: SchemaObject = {
  type: "object",
  properties: {
    projectId: { ...uuid, example: "550e8400-e29b-41d4-a716-446655440001" },
    title: { type: "string", minLength: 1, example: "Sprint 1 - Foundation" },
    startDate: { ...dateStr, example: "2024-03-01" },
    endDate: { ...dateStr, example: "2024-03-14" },
    sortOrder: { type: "integer", example: 0 },
  },
  required: ["projectId", "title", "startDate", "endDate"],
};

const UpdateSprintRequest: SchemaObject = {
  type: "object",
  properties: {
    projectId: { ...uuid, example: "550e8400-e29b-41d4-a716-446655440001" },
    title: { type: "string", minLength: 1, example: "Sprint 1 - Foundation (Revised)" },
    startDate: { ...dateStr, example: "2024-03-01" },
    endDate: { ...dateStr, example: "2024-03-21" },
    sortOrder: { type: "integer", example: 1 },
  },
};

const ReorderSprintRequest: SchemaObject = {
  type: "object",
  properties: {
    sortOrder: { type: "integer", example: 2 },
  },
  required: ["sortOrder"],
};

const CreateTaskRequest: SchemaObject = {
  type: "object",
  properties: {
    sprintId: { ...uuid, example: "550e8400-e29b-41d4-a716-446655440002" },
    title: { type: "string", minLength: 1, example: "Implement user login" },
    description: { type: "string", example: "Add JWT-based authentication with refresh tokens" },
    priority: { ...taskPriority, example: "high" },
    estimateHours: { type: "number", minimum: 0, exclusiveMinimum: true, format: "double", example: 8.0 },
    dueDate: { ...dateStr, example: "2024-03-10" },
    assigneeIds: { type: "array", items: uuid, example: ["550e8400-e29b-41d4-a716-446655440000"] },
  },
  required: ["sprintId", "title"],
};

const UpdateTaskRequest: SchemaObject = {
  type: "object",
  properties: {
    projectId: { ...uuid, example: "550e8400-e29b-41d4-a716-446655440001" },
    sprintId: { ...uuid, nullable: true, example: "550e8400-e29b-41d4-a716-446655440002" },
    title: { type: "string", minLength: 1, example: "Implement user login with OAuth" },
    description: { type: "string", example: "Updated scope" },
    status: { ...taskStatus, example: "review" },
    priority: taskPriority,
    estimateHours: { type: "number", minimum: 0, exclusiveMinimum: true, format: "double", example: 12.0 },
    dueDate: { ...dateStr, example: "2024-03-12" },
    assigneeIds: { type: "array", items: uuid, example: ["550e8400-e29b-41d4-a716-446655440000"] },
    sortOrder: { type: "integer", example: 1 },
  },
};

const UpdateStatusRequest: SchemaObject = {
  type: "object",
  properties: {
    status: {
      ...taskStatus,
      description:
        "New status. Valid transitions: todo→in_progress, in_progress→review (any user), review→done (manager/admin only)",
    },
  },
  required: ["status"],
};

const UpdateKanbanOrderRequest: SchemaObject = {
  type: "object",
  properties: {
    sortOrder: { type: "integer", example: 3 },
  },
  required: ["sortOrder"],
};

const AddSubtaskRequest: SchemaObject = {
  type: "object",
  properties: {
    title: { type: "string", minLength: 1, example: "Set up CI/CD pipeline" },
  },
  required: ["title"],
};

const ToggleSubtaskRequest: SchemaObject = {
  type: "object",
  properties: {
    completed: { type: "boolean", example: true },
  },
  required: ["completed"],
};

const CreateCommentRequest: SchemaObject = {
  type: "object",
  properties: {
    body: { type: "string", minLength: 1, example: "This needs clarification on the API contract." },
    parentId: { ...uuid, nullable: true, description: "Set to reply to an existing comment (threaded)", example: null },
  },
  required: ["body"],
};

const UpdateCommentRequest: SchemaObject = {
  type: "object",
  properties: {
    body: { type: "string", minLength: 1, example: "This needs clarification (updated)." },
  },
  required: ["body"],
};

const CreateTimeLogRequest: SchemaObject = {
  type: "object",
  properties: {
    hours: { type: "number", minimum: 0, exclusiveMinimum: true, format: "double", example: 2.5 },
    description: { type: "string", example: "Worked on API integration" },
    loggedDate: { ...dateStr, example: "2024-03-05" },
  },
  required: ["hours"],
};

// ─── Report Response Schemas ───────────────────────────────────────────────

const ProjectReport: SchemaObject = {
  type: "object",
  properties: {
    data: {
      type: "object",
      properties: {
        project: { type: "object", properties: { id: uuid, title: { type: "string" }, status: projectStatus }, required: ["id", "title", "status"] },
        total_tasks: { type: "integer", example: 20 },
        completed_tasks: { type: "integer", example: 12 },
        progress_percent: { type: "integer", example: 60 },
        total_hours_logged: { type: "number", format: "double", example: 85.5 },
        tasks_by_status: {
          type: "array",
          items: {
            type: "object",
            properties: { status: taskStatus, count: { type: "integer" } },
            required: ["status", "count"],
          },
        },
        tasks_by_sprint: {
          type: "array",
          items: {
            type: "object",
            properties: {
              sprint_id: uuid,
              sprint_title: { type: "string" },
              total: { type: "integer" },
              completed: { type: "integer" },
            },
            required: ["sprint_id", "sprint_title", "total", "completed"],
          },
        },
      },
      required: ["project", "total_tasks", "completed_tasks", "progress_percent", "total_hours_logged", "tasks_by_status", "tasks_by_sprint"],
    },
  },
  required: ["data"],
};

const UserReport: SchemaObject = {
  type: "object",
  properties: {
    data: {
      type: "object",
      properties: {
        user: { type: "object", properties: { id: uuid, name: { type: "string" }, email: emailStr }, required: ["id", "name", "email"] },
        assigned_tasks: { type: "integer", example: 8 },
        tasks_by_status: {
          type: "array",
          items: {
            type: "object",
            properties: { status: taskStatus, count: { type: "integer" } },
            required: ["status", "count"],
          },
        },
        total_hours: { type: "number", format: "double", example: 40.0 },
        projects_involved: {
          type: "array",
          items: {
            type: "object",
            properties: { id: uuid, title: { type: "string" } },
            required: ["id", "title"],
          },
        },
      },
      required: ["user", "assigned_tasks", "tasks_by_status", "total_hours", "projects_involved"],
    },
  },
  required: ["data"],
};

const OverviewReport: SchemaObject = {
  type: "object",
  properties: {
    data: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: uuid,
          title: { type: "string", example: "Website Redesign" },
          client: { type: "string", example: "Acme Corp" },
          status: projectStatus,
          total_tasks: { type: "integer", example: 20 },
          completed_tasks: { type: "integer", example: 12 },
          progress_percent: { type: "integer", example: 60 },
        },
        required: ["id", "title", "client", "status", "total_tasks", "completed_tasks", "progress_percent"],
      },
    },
  },
  required: ["data"],
};

// ─── Query Parameter Schemas ───────────────────────────────────────────────

const paginationParams: ParameterObject[] = [
  { name: "page", in: "query", schema: { type: "integer", default: 1, minimum: 1 }, description: "Page number (1-based)" },
  { name: "limit", in: "query", schema: { type: "integer", default: 20, minimum: 1, maximum: 100 }, description: "Items per page" },
];

const taskFilterParams: ParameterObject[] = [
  ...paginationParams,
  { name: "project", in: "query", schema: uuid, description: "Filter by project ID" },
  { name: "sprint", in: "query", schema: uuid, description: "Filter by sprint ID" },
  { name: "assignee", in: "query", schema: uuid, description: "Filter by assigned user ID" },
  { name: "status", in: "query", schema: { type: "string", enum: ["todo", "in_progress", "review", "done"] }, description: "Filter by task status" },
  { name: "priority", in: "query", schema: { type: "string", enum: ["low", "medium", "high", "critical"] }, description: "Filter by priority" },
];

const projectFilterParams: ParameterObject[] = [
  { name: "status", in: "query", schema: { type: "string", enum: ["planned", "active", "completed", "archived"] }, description: "Filter by project status" },
  { name: "client", in: "query", schema: { type: "string" }, description: "Filter by client name" },
];

// ─── Path Parameter Schemas ────────────────────────────────────────────────

function idParam(name = "id", desc = "Resource UUID"): ParameterObject {
  return { name, in: "path", required: true, schema: uuid, description: desc };
}

// ─── Security Scheme ───────────────────────────────────────────────────────

const bearerAuth: SecuritySchemeObject = {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "JWT access token obtained from POST /api/auth/login or /api/auth/register.",
};

// ─── Health Response ───────────────────────────────────────────────────────

const HealthResponse: SchemaObject = {
  type: "object",
  properties: {
    status: { type: "string", enum: ["ok"], example: "ok" },
    timestamp: { ...dateTimeStr, example: "2024-03-05T12:00:00Z" },
  },
  required: ["status", "timestamp"],
};

// ─── Exports ───────────────────────────────────────────────────────────────

export const schemas = {
  User,
  UserSummary,
  Project,
  Sprint,
  Task,
  SubTask: SubTaskSchema,
  Comment: CommentSchema,
  Attachment: AttachmentSchema,
  TimeLog: TimeLogSchema,
  ActivityLog: ActivityLogSchema,
  // Request bodies
  RegisterRequest,
  LoginRequest,
  RefreshRequest,
  CreateUserRequest,
  UpdateUserRequest,
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateSprintRequest,
  UpdateSprintRequest,
  ReorderSprintRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
  UpdateStatusRequest,
  UpdateKanbanOrderRequest,
  AddSubtaskRequest,
  ToggleSubtaskRequest,
  CreateCommentRequest,
  UpdateCommentRequest,
  CreateTimeLogRequest,
  // Responses
  AuthResponse,
  TokenResponse,
  ErrorResponse,
  ProjectReport,
  UserReport,
  OverviewReport,
  HealthResponse,
  // Helpers
  DataResponse,
  PaginatedResponse,
};

export const parameters = {
  paginationParams,
  taskFilterParams,
  projectFilterParams,
  idParam,
};

export const securitySchemes = {
  bearerAuth,
};

export const security = [{ bearerAuth: [] }];
