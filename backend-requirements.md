# Minimal Project Management System — Backend Requirements

> **Stack:** Express.js (TypeScript) + PostgreSQL + Prisma ORM + Bun runtime

---

## 1. Data Models

### User / Team Member
| Field       | Type      | Notes                                  |
|-------------|-----------|----------------------------------------|
| id          | UUID (PK) |                                        |
| name        | string    | required                               |
| email       | string    | unique, required, used for login       |
| password    | string    | hashed, required                       |
| role        | enum      | `admin`, `manager`, `member`           |
| department  | string    | optional                               |
| skills      | string[]  | optional                               |
| avatar_url  | string    | optional                               |
| created_at  | timestamp |                                        |
| updated_at  | timestamp |                                        |

### Project
| Field        | Type      | Notes                                    |
|--------------|-----------|------------------------------------------|
| id           | UUID (PK) |                                          |
| title        | string    | required                                 |
| client       | string    | required                                 |
| description  | text      | optional                                 |
| start_date   | date      | required                                 |
| end_date     | date      | required                                 |
| budget       | decimal   | optional                                 |
| status       | enum      | `planned`, `active`, `completed`, `archived` |
| thumbnail_url| string    | optional (S3/local upload path)          |
| created_at   | timestamp |                                          |
| updated_at   | timestamp |                                          |

### Sprint / Milestone
| Field        | Type      | Notes                                         |
|--------------|-----------|-----------------------------------------------|
| id           | UUID (PK) |                                               |
| project_id   | UUID (FK) |                                               |
| title        | string    | required                                      |
| sprint_number| integer   | auto-increment per project                    |
| start_date   | date      | required                                      |
| end_date     | date      | required                                      |
| sort_order   | integer   | for manual ordering                           |
| created_at   | timestamp |                                               |
| updated_at   | timestamp |                                               |

**Constraint:** `UNIQUE (project_id, sprint_number)`

### Task
| Field        | Type      | Notes                                         |
|--------------|-----------|-----------------------------------------------|
| id           | UUID (PK) |                                               |
| sprint_id    | UUID (FK) | nullable (can exist outside sprint)           |
| project_id   | UUID (FK) | required                                      |
| title        | string    | required                                      |
| description  | text      | optional                                      |
| status       | enum      | `todo`, `in_progress`, `review`, `done`       |
| priority     | enum      | `low`, `medium`, `high`, `critical`           |
| estimate_hours| decimal  | optional                                      |
| due_date     | date      | optional                                      |
| sort_order   | integer   | for kanban ordering                           |
| created_at   | timestamp |                                               |
| updated_at   | timestamp |                                               |

### Task Assignee (junction table)
| Field    | Type      |
|----------|-----------|
| task_id  | UUID (FK) |
| user_id  | UUID (FK) |

**Constraint:** `PRIMARY KEY (task_id, user_id)`

### SubTask
| Field        | Type      |
|--------------|-----------|
| id           | UUID (PK) |
| task_id      | UUID (FK) |
| title        | string    |
| completed    | boolean   | default `false` |
| sort_order   | integer   |
| created_at   | timestamp |

### Attachment
| Field        | Type      | Notes                                |
|--------------|-----------|--------------------------------------|
| id           | UUID (PK) |                                      |
| task_id      | UUID (FK) |                                      |
| file_name    | string    |                                      |
| file_url     | string    | S3/local path                        |
| file_type    | string    | mime type                            |
| file_size    | integer   | bytes                                |
| uploaded_by  | UUID (FK) | user                                 |
| created_at   | timestamp |                                      |

### Comment
| Field        | Type      | Notes                                |
|--------------|-----------|--------------------------------------|
| id           | UUID (PK) |                                      |
| task_id      | UUID (FK) |                                      |
| user_id      | UUID (FK) |                                      |
| parent_id    | UUID (FK) | self-reference for threading         |
| body         | text      |                                      |
| created_at   | timestamp |                                      |
| updated_at   | timestamp |                                      |

### Activity Log
| Field        | Type      | Notes                                    |
|--------------|-----------|------------------------------------------|
| id           | UUID (PK) |                                          |
| task_id      | UUID (FK) |                                          |
| user_id      | UUID (FK) |                                          |
| action       | enum      | `created`, `updated_status`, `assigned`, `commented`, `attached_file`, `subtask_toggled` |
| details      | jsonb     | flexible payload for action metadata     |
| created_at   | timestamp |                                          |

### Time Log
| Field        | Type      | Notes                                |
|--------------|-----------|--------------------------------------|
| id           | UUID (PK) |                                      |
| task_id      | UUID (FK) |                                      |
| user_id      | UUID (FK) |                                      |
| hours        | decimal   |                                      |
| description  | text      | optional                             |
| logged_date  | date      |                                      |
| created_at   | timestamp |                                      |

---

## 2. Project Structure

```
backend/
├── src/
│   ├── index.ts              # entry point, app bootstrap, keep-alive, error handlers
│   ├── app.ts                # express app setup (middleware, routes, error handler)
│   ├── config/
│   │   └── env.ts            # env var validation (zod) + typed export
│   ├── db/
│   │   ├── prisma/
│   │   │   └── schema.prisma # all data models
│   │   ├── migrations/       # Prisma Migrate output
│   │   └── seed.ts           # seed data (admin, manager, member + demo project)
│   ├── lib/
│   │   └── prisma.ts         # PrismaClient singleton (@prisma/adapter-pg)
│   ├── middleware/
│   │   ├── auth.ts           # JWT verification, extract user from token (authenticate)
│   │   ├── authorize.ts      # role-based guard: requireRole('admin' | 'manager')
│   │   ├── validate.ts       # request body validation (zod)
│   │   ├── upload.ts         # multer config for file uploads (pdf/png/jpg/gif)
│   │   └── error-handler.ts  # global error handler, structured error responses
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.validation.ts
│   │   ├── users/
│   │   │   ├── users.routes.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── users.validation.ts
│   │   ├── projects/
│   │   │   ├── projects.routes.ts
│   │   │   ├── projects.controller.ts
│   │   │   ├── projects.service.ts
│   │   │   └── projects.validation.ts
│   │   ├── sprints/
│   │   │   ├── sprints.routes.ts
│   │   │   ├── sprints.controller.ts
│   │   │   ├── sprints.service.ts
│   │   │   └── sprints.validation.ts
│   │   ├── tasks/
│   │   │   ├── tasks.routes.ts
│   │   │   ├── tasks.controller.ts
│   │   │   ├── tasks.service.ts
│   │   │   └── tasks.validation.ts
│   │   ├── comments/
│   │   │   ├── comments.routes.ts
│   │   │   ├── comments.controller.ts
│   │   │   └── comments.service.ts
│   │   ├── attachments/
│   │   │   ├── attachments.routes.ts
│   │   │   ├── attachments.controller.ts
│   │   │   └── attachments.service.ts
│   │   ├── timelogs/
│   │   │   ├── timelogs.controller.ts
│   │   │   └── timelogs.service.ts
│   │   └── reports/
│   │       ├── reports.routes.ts
│   │       ├── reports.controller.ts
│   │       └── reports.service.ts
│   ├── types/
│   │   └── index.ts          # shared TypeScript interfaces
│   └── utils/
│       ├── errors.ts         # AppError class, error codes
│       └── helpers.ts        # pagination helper
├── tests/                     # integration tests (bun test / vitest)
├── uploads/                   # local upload storage (dev only)
├── prisma.config.ts           # Prisma CLI config (datasource URL, migrations path)
├── package.json
├── tsconfig.json
├── .env.example
├── postman_collection.json    # all 32 API endpoints
└── CONTEXT.md                 # architecture decisions and phase log
```

---

## 3. API Endpoints

### Auth
| Method | Path               | Auth   | Role   | Description                    |
|--------|--------------------|--------|--------|--------------------------------|
| POST   | `/api/auth/login`  | No     | —      | Login, returns JWT + refresh token |
| POST   | `/api/auth/register`| No    | —      | Register, returns JWT + refresh token |
| GET    | `/api/auth/me`     | Yes    | Any    | Current user profile           |
| POST   | `/api/auth/refresh`| No     | —      | Exchange refresh token for new access + refresh tokens |

### Users (Team Management)
| Method | Path                    | Auth | Role        | Description               |
|--------|-------------------------|------|-------------|---------------------------|
| GET    | `/api/users`            | Yes  | Admin/Mgr   | List all users            |
| GET    | `/api/users/:id`        | Yes  | Admin/Mgr   | Get user by ID            |
| POST   | `/api/users`            | Yes  | Admin       | Create user               |
| PUT    | `/api/users/:id`        | Yes  | Admin       | Update user               |
| DELETE | `/api/users/:id`        | Yes  | Admin       | Delete user               |
| POST   | `/api/users/:id/invite` | Yes  | Admin       | Send invite email (stub)  |

### Projects
| Method | Path                          | Auth | Role        | Description                       |
|--------|-------------------------------|------|-------------|-----------------------------------|
| GET    | `/api/projects`               | Yes  | Any         | List projects (query: status, client) |
| GET    | `/api/projects/:id`           | Yes  | Any         | Get project detail + progress stats |
| POST   | `/api/projects`               | Yes  | Admin/Mgr   | Create project                    |
| PUT    | `/api/projects/:id`           | Yes  | Admin/Mgr   | Update project                    |
| DELETE | `/api/projects/:id`           | Yes  | Admin       | Delete project                    |
| GET    | `/api/projects/:id/sprints`   | Yes  | Any         | Get sprints for project           |

### Sprints
| Method | Path                    | Auth | Role        | Description              |
|--------|-------------------------|------|-------------|--------------------------|
| GET    | `/api/sprints/:id`      | Yes  | Any         | Get sprint details       |
| POST   | `/api/sprints`          | Yes  | Admin/Mgr   | Create sprint            |
| PUT    | `/api/sprints/:id`      | Yes  | Admin/Mgr   | Update sprint            |
| DELETE | `/api/sprints/:id`      | Yes  | Admin       | Delete sprint            |
| PATCH  | `/api/sprints/:id/order`| Yes  | Admin/Mgr   | Reorder sprints          |
| GET    | `/api/sprints/:id/tasks`| Yes  | Any         | Get tasks for sprint     |

### Tasks
| Method | Path                          | Auth | Role        | Description                       |
|--------|-------------------------------|------|-------------|-----------------------------------|
| GET    | `/api/tasks`                  | Yes  | Any         | List tasks (query: project, sprint, assignee, status, priority) |
| GET    | `/api/tasks/:id`              | Yes  | Any         | Get task detail + comments + activity |
| POST   | `/api/tasks`                  | Yes  | Admin/Mgr   | Create task                       |
| PUT    | `/api/tasks/:id`              | Yes  | Admin/Mgr   | Update task                       |
| DELETE | `/api/tasks/:id`              | Yes  | Admin       | Delete task                       |
| PATCH  | `/api/tasks/:id/status`       | Yes  | Any         | Update task status (with review approval flow) |
| PATCH  | `/api/tasks/:id/kanban-order` | Yes  | Any         | Update kanban position (drag-drop)|
| POST   | `/api/tasks/:id/subtasks`     | Yes  | Any         | Add subtask                       |
| PATCH  | `/api/tasks/:id/subtasks/:subId` | Yes | Any      | Toggle subtask                    |

### Comments
| Method | Path                              | Auth | Role | Description                       |
|--------|-----------------------------------|------|------|-----------------------------------|
| GET    | `/api/tasks/:id/comments`         | Yes  | Any  | Get threaded comments for task    |
| POST   | `/api/tasks/:id/comments`         | Yes  | Any  | Add comment                       |
| PUT    | `/api/comments/:id`               | Yes  | Author | Edit own comment               |

### Attachments
| Method | Path                              | Auth | Role | Description                       |
|--------|-----------------------------------|------|------|-----------------------------------|
| POST   | `/api/tasks/:id/attachments`      | Yes  | Any  | Upload file (multipart)           |
| DELETE | `/api/attachments/:id`            | Yes  | Owner/Admin | Delete attachment          |

### Time Logs
| Method | Path                    | Auth | Role | Description              |
|--------|-------------------------|------|------|--------------------------|
| GET    | `/api/tasks/:id/timelogs`| Yes | Any  | Get time logs for task   |
| POST   | `/api/tasks/:id/timelogs`| Yes | Any  | Log time                 |

### Reports (Admin/Manager only)
| Method | Path                              | Auth | Role        | Description                       |
|--------|-----------------------------------|------|-------------|-----------------------------------|
| GET    | `/api/reports/project/:id`        | Yes  | Admin/Mgr   | Project progress + tasks + time   |
| GET    | `/api/reports/user/:id`           | Yes  | Admin/Mgr   | User workload + time summary      |
| GET    | `/api/reports/overview`           | Yes  | Admin/Mgr   | All projects summary              |

### Health
| Method | Path            | Auth | Role | Description          |
|--------|-----------------|------|------|----------------------|
| GET    | `/api/health`   | No   | —    | Server health check  |

---

## 4. Business Logic Requirements

### 4.1 Authentication & Authorization
- **Bcrypt** for password hashing (10 rounds)
- **JWT** access token (15m expiry) + refresh token (7d expiry)
  - Access token payload: `{ userId, role }`
  - Refresh token payload: `{ userId, role }`
  - Signed with separate secrets: `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`
- Role hierarchy: `admin > manager > member`
  - `admin`: full CRUD on all resources
  - `manager`: create/update projects, sprints, tasks, view reports
  - `member`: view projects/tasks, update own assigned task status, comment, log time
- Custom middleware: `authenticate` extracts user from JWT, `requireRole(...roles)` guards routes
- All authenticated routes extract user from JWT and inject `req.user`

### 4.2 Task Status Workflow (Review Approval)
- Status machine: `todo → in_progress → review → done`
- Any member can move from `todo → in_progress`, `in_progress → review`
- `review → done`: only a manager/admin can approve. Member attempts get `403`
- State machine enforced server-side in `tasks.service.ts`
- Each status change creates an activity log entry

### 4.3 File Uploads
- Multer middleware for multipart form data
- Accept: PDF, PNG, JPG, GIF (validate MIME)
- Max file size: 10 MB (configurable via `MAX_FILE_SIZE`)
- Store: local `uploads/` folder in dev
- Upload endpoint returns `file_url`, `file_name`, `file_type`, `file_size`

### 4.4 Data Validation
- **Zod** schemas for every request body
- Validation runs in `validate` middleware before controller
- Custom error messages returned in `{ error: string, status: number, details?: fieldErrors[] }` format

### 4.5 Error Handling
- Global error handler catches all thrown/explicit errors
- Structured response:
  ```json
  {
    "error": "Human-readable message",
    "status": 400,
    "details": [{ "field": "title", "message": "Title is required" }]
  }
  ```
- `AppError` class with `statusCode`, `message`, optional `details`
- Stack trace included in responses when `NODE_ENV=development`
- Unhandled rejections return `500` with generic message

### 4.6 Pagination
- `GET /api/tasks?page=1&limit=20&status=in_progress&assignee=<userId>`
- Response: `{ data: T[], total: number, page: number, limit: number, totalPages: number }`

### 4.7 Reports
- **Project Progress:** `GET /api/reports/project/:id`
  - Returns: total tasks, completed tasks, percent complete, total time logged, tasks by status breakdown, tasks by sprint breakdown
- **User Report:** `GET /api/reports/user/:id`
  - Returns: assigned tasks by status, total hours logged, projects involved
- **Overview:** `GET /api/reports/overview`
  - Returns: all projects with progress percent, tasks count

### 4.8 Sprint Number Auto-Increment
- When creating a sprint for a project, `sprint_number` = `MAX(sprint_number) + 1` for that project
- App-level lock using ordered query

### 4.9 Database Migrations
- Use Prisma Migrate (not Knex)
- Timestamp-prefixed migration files in `src/db/migrations/`
- Seed file at `src/db/seed.ts` with:
  - 1 admin user (admin@mpms.com / password123)
  - 1 manager user (manager@mpms.com / password123)
  - 1 member user (member@mpms.com / password123)
  - 1 demo project with 2 sprints and 5 tasks

---

## 5. API Contract (Request/Response Shapes)

### 5.1 Standard Response Format

All single-object endpoints return:
```json
{
  "data": { ... },
  "message": "optional success message"
}
```

List endpoints return:
```json
{
  "data": [ ... ],
  "total": 45,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

Error responses:
```json
{
  "error": "Human readable error",
  "status": 400,
  "details": [
    { "field": "title", "message": "Title is required" }
  ],
  "stack": "Error: ... (development only)"
}
```

### 5.2 Key Response Shapes

```typescript
// /api/auth/login → POST
// /api/auth/register → POST
type AuthResponse = {
  token: string;       // access token (15m expiry)
  refreshToken: string; // refresh token (7d expiry)
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'member';
    avatarUrl: string | null;
  };
};

// /api/auth/refresh → POST
type RefreshResponse = {
  token: string;
  refreshToken: string;
};

// /api/projects → GET
type ProjectListItem = {
  id: string;
  title: string;
  client: string;
  status: 'planned' | 'active' | 'completed' | 'archived';
  startDate: string;
  endDate: string;
  budget: number | null;
  thumbnailUrl: string | null;
  stats: {
    total_tasks: number;
    completed_tasks: number;
    progress_percent: number;
  };
};

// /api/projects/:id → GET
type ProjectDetail = ProjectListItem & {
  description: string;
  sprints: SprintListItem[];
  createdAt: string;
  updatedAt: string;
};

// /api/sprints/:id → GET
type SprintDetail = {
  id: string;
  projectId: string;
  title: string;
  sprintNumber: number;
  startDate: string;
  endDate: string;
  sortOrder: number;
  tasks: TaskListItem[];
  stats: {
    total_tasks: number;
    completed_tasks: number;
    progress_percent: number;
  };
};

// /api/tasks → GET (list)
type TaskListItem = {
  id: string;
  projectId: string;
  projectTitle: string;
  sprintId: string | null;
  sprintTitle: string | null;
  title: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimateHours: number | null;
  dueDate: string | null;
  assignees: { id: string; name: string; avatarUrl: string | null }[];
  subtasksStats: { total: number; completed: number };
  sortOrder: number;
};

// /api/tasks/:id → GET (detail)
type TaskDetail = TaskListItem & {
  description: string;
  subtasks: { id: string; title: string; completed: boolean; sortOrder: number }[];
  comments: CommentItem[];
  activityLog: ActivityItem[];
  createdAt: string;
  updatedAt: string;
};

type CommentItem = {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
  parentId: string | null;
  body: string;
  createdAt: string;
  replies: CommentItem[];
};

type ActivityItem = {
  id: string;
  userId: string;
  userName: string;
  action: 'created' | 'updated_status' | 'assigned' | 'commented' | 'attached_file' | 'subtask_toggled';
  details: Record<string, unknown>;
  createdAt: string;
};

// /api/reports/project/:id → GET
type ProjectReport = {
  project: { id: string; title: string; status: string };
  total_tasks: number;
  completed_tasks: number;
  progress_percent: number;
  total_hours_logged: number;
  tasks_by_status: { status: string; count: number }[];
  tasks_by_sprint: { sprint_id: string; sprint_title: string; total: number; completed: number }[];
};
```

---

## 6. Development & Testing

- **Runtime:** Bun 1.3+
- **Framework:** Express.js 5.x
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL
- **ORM:** Prisma 7.x (adapter: @prisma/adapter-pg)
- **Query client:** PrismaClient
- **Validation:** Zod 4.x
- **File uploads:** Multer
- **Auth:** jsonwebtoken, bcryptjs
- **Environment:** Bun auto-loads `.env` (no dotenv import needed)
- **Testing:** Bun test + Vitest (76 integration tests)
- **Linting:** ESLint + Prettier

### Setup Commands
```bash
cd backend
bun install
bun db:migrate
bun db:seed
bun dev
```

---

## 7. VS Code Remote Development

When using VS Code SSH to access a remote machine on the same network:
- The server log outputs `Server running at http://localhost:4000 [development]` to trigger VS Code port auto-forwarding
- If auto-forward doesn't trigger: press `F1` → "Forward a Port" → enter `4000`
- Ensure `remote.autoForwardPorts` is enabled in VS Code settings
- Access via `http://localhost:4000` in your local browser after port forwarding

---

## 8. Environment Variables (`.env`)

```
PORT=4000
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```
