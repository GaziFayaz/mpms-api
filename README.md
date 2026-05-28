# MPMS Backend

REST API for managing multiple projects, sprints, tasks, and teams — built with Express + TypeScript + Prisma.

---

## Live API & Test Credentials

**Base URL:** `https://mpms-api.gazifayazahmed.site/api`

**Swagger Docs:** [mpms-api.gazifayazahmed.site/api/docs](https://mpms-api.gazifayazahmed.site/api/docs)

### Test Users (from seed)

| Email | Password | Role | Can… |
|---|---|---|---|
| `admin@mpms.com` | `password123` | Admin | Full access — manage users, projects, everything |
| `manager@mpms.com` | `password123` | Manager | Create/edit projects, sprints, tasks, approve reviews |
| `member@mpms.com` | `password123` | Member | Work on assigned tasks, log time, comment |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | [Bun](https://bun.sh) 1.3 |
| Framework | [Express 5](https://expressjs.com) |
| Language | TypeScript 5.9 (strict mode) |
| ORM | [Prisma](https://prisma.io) 7.8 |
| Database | PostgreSQL ([Neon](https://neon.tech)-hosted) |
| Adapter | `@prisma/adapter-pg` (standard connection pool) |
| Validation | [Zod](https://zod.dev) 4.4 |
| Authentication | JWT (access + refresh tokens) |
| File Storage | [Cloudflare R2](https://www.cloudflare.com/r2/) (S3-compatible) |
| API Docs | [Swagger UI](https://swagger.io) (OpenAPI 3.1) |
| Testing | [Vitest](https://vitest.dev) + Supertest |
| Linting | ESLint + Prettier |

---

## What is MPMS?

MPMS helps teams plan and track projects from start to finish. Think of it as a lightweight Jira or Linear — you create **projects**, break them into **sprints**, fill sprints with **tasks**, and move tasks through a **kanban-style workflow** (`todo → in_progress → review → done`).

Every task supports **subtasks**, **threaded comments**, **file attachments** (stored in Cloudflare R2), and **time logging**. Managers get three built-in **reports** — project progress, user workload, and a high-level overview across all projects.

Three roles gate access: **admin** (full control), **manager** (run projects and teams), and **member** (work on assigned tasks).

---

## Core Features

### Auth & Users
- Register and login with JWT access + refresh tokens
- Three roles: admin, manager, member
- Admins and managers can invite, update, and remove users

### Projects
- Full CRUD with status lifecycle: `planned → active → completed → archived`
- Track budget, client, date range, and thumbnail
- Stats endpoint returns task counts and completion percentage per project

### Sprints
- Belong to a project; auto-incrementing sprint number
- Drag-and-drop reordering via `sortOrder`
- Filter tasks by sprint

### Tasks
- Must belong to a sprint (not standalone)
- Status workflow: `todo → in_progress → review → done`
- Only managers/admins can approve the `review → done` transition
- Priorities: low, medium, high, critical
- Estimate hours and due date tracking
- Assign multiple users per task (junction table)
- Paginated listing with status, priority, and project filters
- Kanban column reordering

### Subtasks
- Checklist items inside any task
- Toggle completed/uncompleted
- Activity log entries recorded on each toggle

### Comments
- Leave comments on any task
- Reply to existing comments (threaded)
- Only the comment author can edit their own comment

### Attachments
- Upload files (PDF, PNG, JPEG, GIF) up to 10 MB to Cloudflare R2
- Presigned download URLs (1-hour expiry)
- Metadata endpoint without downloading the file

### Time Logging
- Log hours against any task with a description and date
- View all time logs for a task

### Reports
- **Project Report** — task counts, completion %, total hours logged, status breakdown
- **User Report** — tasks assigned, hours logged, projects involved
- **Overview Report** — summary across all projects

### Activity Log
- Every status change, assignment, comment, attachment, and subtask toggle is logged
- Full history for auditing and traceability

---

## How Entities Relate

```
Project
  └── Sprints
        └── Tasks
              ├── Subtasks
              ├── Comments (threaded via parentId)
              ├── Attachments (R2)
              ├── TimeLogs
              └── ActivityLog

Users ──(TaskAssignee)── Tasks
```

- A **Project** contains many **Sprints** and directly holds **Tasks**
- A **Sprint** contains many **Tasks** (every task belongs to exactly one sprint)
- A **Task** has subtasks, comments, attachments, time logs, and an activity history
- **Users** are linked to tasks through the `TaskAssignee` junction table (many-to-many)

---

## Roles & Permissions

| Action | Admin | Manager | Member |
|---|---|---|---|
| Manage users (CRUD) | ✔ | ✔ | ✘ |
| Manage projects & sprints | ✔ | ✔ | ✘ |
| Create/update tasks | ✔ | ✔ | ✔ |
| Assign users to tasks | ✔ | ✔ | ✔ |
| Change task status | ✔ | ✔ | ✔ |
| Approve review → done | ✔ | ✔ | ✘ |
| Log time | ✔ | ✔ | ✔ |
| Comment & upload files | ✔ | ✔ | ✔ |
| Access reports | ✔ | ✔ | ✘ |

---

## API at a Glance

| Module | Key Endpoints | Description |
|---|---|---|
| `/api/auth` | `POST /register`, `POST /login`, `GET /me`, `POST /refresh` | Authentication with JWT |
| `/api/users` | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id` | User management (admin/manager) |
| `/api/projects` | `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id` | Project CRUD with stats |
| `/api/sprints` | `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`, `PATCH /:id/order` | Sprint management with reordering |
| `/api/tasks` | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`, `PATCH /:id/status` | Task CRUD with status workflow |
| `/api/tasks/:id` | `POST /subtasks`, `PATCH /subtasks/:subId`, `GET|POST /comments`, `POST|GET /attachments`, `GET|POST /timelogs` | Nested resources under a task |
| `/api/comments` | `PUT /:id` | Edit own comment |
| `/api/attachments` | `GET /:id`, `GET /:id/download`, `DELETE /:id` | Download and manage files |
| `/api/reports` | `GET /project/:id`, `GET /user/:id`, `GET /overview` | Project, user, and overview reports |

**Full OpenAPI spec** at `GET /api/openapi.json` — use it to generate client SDKs or feed into AI tools.

---

## Setup

### Prerequisites

- [Bun](https://bun.sh) 1.3.14 or later
- PostgreSQL database (local, Docker, or [Neon](https://neon.tech))

### 1. Clone and install

```bash
git clone <repo-url>
cd backend
bun install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `.env` with your values (see table below).

### 3. Run migrations

```bash
bun run db:migrate
```

### 4. Seed the database

```bash
bun run db:seed
```

This creates 3 test users, 1 project, 2 sprints, and 5 sample tasks.

### 5. Start the server

```bash
bun run dev
```

API runs at `http://localhost:4000` by default. Open `http://localhost:4000/api/docs` for Swagger UI.

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `4000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens | Any random string |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | Any random string |
| `JWT_ACCESS_EXPIRES_IN` | Access token lifespan | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifespan | `7d` |
| `MAX_FILE_SIZE` | Max upload size in bytes | `10485760` (10 MB) |
| `R2_ACCOUNT_ID` | Cloudflare account ID | From R2 dashboard |
| `R2_ACCESS_KEY_ID` | R2 access key | From R2 dashboard |
| `R2_SECRET_ACCESS_KEY` | R2 secret key | From R2 dashboard |
| `R2_BUCKET_NAME` | R2 bucket name | `mpms-attachments` |
| `CORS_ORIGIN` | Allowed origins (comma-separated) | `http://localhost:3000` |
| `NODE_ENV` | Environment | `development` |

---

## Scripts

| Script | Command | What it does |
|---|---|---|
| `dev` | `bun run --watch src/index.ts` | Start with hot reload |
| `start` | `bun run src/index.ts` | Start in production |
| `test` | `bun test tests/` | Run all 68 integration tests |
| `test:watch` | `bun test --watch tests/` | Run tests in watch mode |
| `db:migrate` | `bunx prisma migrate dev` | Apply pending migrations |
| `db:migrate:prod` | `bunx prisma migrate deploy` | Deploy migrations (production) |
| `db:seed` | `bun run src/db/seed.ts` | Populate database with sample data |
| `db:generate` | `bunx prisma generate` | Regenerate Prisma client |
| `db:studio` | `bunx prisma studio` | Open Prisma Studio GUI |
| `lint` | `eslint src tests` | Lint source and test files |
| `format` | `prettier --write` | Auto-format code |

---

## Project Structure

```
backend/
├── src/
│   ├── config/          # Environment variable validation (Zod)
│   ├── db/
│   │   ├── prisma/      # Schema + migrations
│   │   └── seed.ts      # Database seeder
│   ├── lib/             # Prisma client singleton, R2 storage helpers
│   ├── middleware/       # Auth, role guard, validation, upload, error handler
│   ├── modules/
│   │   ├── auth/        # Register, login, token refresh
│   │   ├── users/       # User CRUD
│   │   ├── projects/    # Project CRUD with stats
│   │   ├── sprints/     # Sprint CRUD with ordering
│   │   ├── tasks/       # Task CRUD, status workflow, subtasks
│   │   ├── comments/    # Threaded comments
│   │   ├── attachments/ # R2 file upload/download
│   │   ├── timelogs/    # Time logging
│   │   └── reports/     # Project/user/overview reports
│   ├── openapi/         # OpenAPI 3.1 spec builder + schemas
│   ├── types/           # Shared TypeScript types
│   └── utils/           # AppError, pagination helpers
├── tests/               # 68 integration tests (11 files)
├── .env.example         # Environment variable template
├── prisma.config.ts     # Prisma configuration
├── tsconfig.json        # TypeScript configuration
├── vitest.config.ts     # Test runner configuration
└── package.json
```
