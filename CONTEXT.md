# MPMS Backend - Architecture Context

## Git Conventions
- **Separate meaningful commits** for small but significant updates
- Each commit should represent a single logical change (e.g., new dependency, schema migration, service refactor, new endpoint, test update)
- Group related file changes into one commit; split unrelated changes into separate commits
- Commit message format: `type: short description` (types: feat, fix, refactor, chore, test, docs)
- Never commit `.env` files — use `.env.example` for template values

## Stack
- **Runtime:** Bun 1.3.14
- **Framework:** Express 5.2.1
- **Language:** TypeScript 5.9 (strict mode)
- **ORM:** Prisma 7.8.0 (adapter: @prisma/adapter-pg)
- **Database:** PostgreSQL (Neon-hosted)
- **Validation:** Zod 4.4.3
- **Auth:** bcryptjs 3.0.3, jsonwebtoken 9.0.3
- **Testing:** Vitest 4.1.7
- **Dev runner:** tsx 4.22.3
- **Storage:** Cloudflare R2 via @aws-sdk/client-s3
- **API Docs:** swagger-ui-express 5.0.1 (OpenAPI 3.1)

## Project Decisions

### Root Directory: `src/`
- Entry point: `src/index.ts`
- All source code under `src/`
- Tests under `tests/`

### Imports: Relative Paths Only
- No path aliases (e.g. no `@/` prefix)
- All imports use relative paths like `../config/env.js`
- `.js` extension required for ESM imports

### Prisma
- Schema: `src/db/prisma/schema.prisma`
- Migrations: `src/db/migrations/`
- Config: `prisma.config.ts` (root level)
- Client singleton: `src/lib/prisma.ts`
- Adapter: `@prisma/adapter-pg` (standard connection pool)

### Config
- Single file: `src/config/env.ts`
- Uses Zod for validation
- All env vars typed and exported as `env` object
- Throws on missing required vars

### Error Handling
- `AppError` class in `src/utils/errors.ts`
- Global error handler middleware: `src/middleware/error-handler.ts`
- Stack traces included in development responses

## Phase 2 - Users - Complete
- [x] Users validation schemas (createUserSchema, updateUserSchema)
- [x] Users service (list, getById, create, update, delete)
- [x] Users controller
- [x] Users routes mounted at /api/users
- [x] Authorize middleware (requireRole) - role-based guard
- [x] 9 integration tests passing
- [x] Total: 19 tests passing
Each feature module follows: routes → controller → service → validation

## Phase 0 - Complete
- [x] Project initialized (bun init)
- [x] Dependencies installed
- [x] TypeScript config
- [x] Prisma schema (10 models) + migration applied
- [x] Config module (env.ts) with Zod
- [x] Prisma client singleton (lib/prisma.ts)
- [x] AppError class (utils/errors.ts)
- [x] Pagination helpers (utils/helpers.ts)
- [x] Shared types (types/index.ts)
- [x] Error handler middleware
- [x] Express app + index bootstrap
- [x] ESLint + Prettier config
- [x] Vitest config
- [x] Tests passing (env.test.ts)

## Phase 1 - Auth - Complete
- [x] Auth validation schemas (registerSchema, loginSchema)
- [x] Auth service (register, login, getMe with JWT generation via bcrypt + jsonwebtoken)
- [x] Auth controller
- [x] Auth routes mounted at /api/auth
- [x] JWT middleware (authenticate) - extracts user from Bearer token
- [x] Validation middleware (validate) - Zod schema parsing
- [x] 9 integration tests passing
- [x] Zod 4 note: uses `issues` property (not `errors`) for ZodError details

## Phase 3 - Projects - Complete
- [x] Projects validation schemas (createProjectSchema, updateProjectSchema)
- [x] Projects service (list, getById, create, update, delete) with stats
- [x] Projects controller
- [x] Projects routes mounted at /api/projects
- [x] 10 integration tests passing
- [x] Total: 29 tests passing

## Phase 4 - Sprints - Complete
- [x] Sprints validation schemas
- [x] Sprints service (CRUD, auto-increment sprint_number, listByProject)
- [x] Sprints controller
- [x] Sprints routes mounted at /api/sprints
- [x] Project sprints sub-route: /api/projects/:projectId/sprints
- [x] 7 integration tests passing
- [x] Total: 36 tests passing

## Phase 5 - Tasks - Complete
- [x] Tasks validation schemas (createTaskSchema, updateTaskSchema) — **sprintId required on create**
- [x] Tasks service (list with pagination/filtering, getById, create, update, delete)
- [x] Tasks controller
- [x] Tasks routes mounted at /api/tasks
- [x] Task assignees via TaskAssignee junction table
- [x] Tasks must belong to a sprint (sprintId non-nullable, projectId auto-derived from sprint)
- [x] 9 integration tests passing
- [x] Total: 45 tests passing

## Phase 6 - Status Workflow - Complete
- [x] State machine: todo → in_progress → review → done
- [x] Review approval: only manager/admin can approve review → done
- [x] Activity log entries created on each status change
- [x] Invalid transition validation
- [x] 6 integration tests passing
- [x] Total: 51 tests passing

## Phase 7 - Subtasks - Complete
- [x] Subtask creation with auto-increment sortOrder
- [x] Toggle subtask completed/uncompleted
- [x] Activity log on subtask toggle
- [x] 4 integration tests passing
- [x] Total: 55 tests passing

## Phase 8 - Comments - Complete
- [x] Threaded comments via parentId self-reference
- [x] Create comment, create reply
- [x] Edit own comment only
- [x] List comments with nested replies
- [x] 4 integration tests passing
- [x] Total: 59 tests passing

## Phase 9 - Attachments - Complete
- [x] Cloudflare R2 storage via @aws-sdk/client-s3 (replaced local disk storage)
- [x] Multer memoryStorage for buffer capture, then PutObject to R2
- [x] Presigned download URLs (1h expiry) via @aws-sdk/s3-request-presigner
- [x] Delete attachment removes from R2 + DB
- [x] MIME validation (PDF, PNG, JPG, GIF) + 10MB size limit
- [x] List attachments per task with presigned URLs
- [x] GET /attachments/:id for metadata + download URL
- [x] GET /attachments/:id/download → 302 redirect to presigned URL
- [x] Prisma: fileKey column stores R2 object key
- [x] 7 integration tests passing
- [x] Total: 68 tests passing

## Phase 10 - TimeLogs + Reports - Complete
- [x] Time logging for tasks
- [x] List time logs per task
- [x] Project progress report (tasks, completion, hours, breakdown)
- [x] User workload report (tasks, hours, projects)
- [x] Overview report (all projects summary)
- [x] 6 integration tests passing
- [x] Total: 68 tests passing

## API Routes Summary
- `/api/auth` - register, login, me
- `/api/users` - CRUD (admin/manager)
- `/api/projects` - CRUD + sprints sub-route
- `/api/sprints` - CRUD
- `/api/tasks` - CRUD + status, subtasks, comments, attachments, timelogs
- `/api/comments` - edit
- `/api/attachments` - delete, get metadata, download (302 redirect)
- `/api/reports` - project, user, overview

## OpenAPI Documentation

### Spec location
- OpenAPI spec builder: `src/openapi/index.ts` (builds spec from `src/openapi/schemas.ts`)
- Swagger UI: `GET /api/docs`
- Raw spec JSON (for AI agent consumption): `GET /api/openapi.json`
- Spec is OpenAPI 3.1 format, generated dynamically on startup — always reflects current code

### Mandatory sync rules
When making ANY backend change, you MUST also update the OpenAPI spec:

| Backend change | OpenAPI update required |
|---|---|
| New/removed/renamed route | Add/remove/rename path entry in `src/openapi/index.ts` |
| Changed HTTP method on a route | Update method in path entry |
| Added/removed middleware (authenticate, requireRole, validate) | Update `security` array in path entry; update `description` with role info |
| Modified Zod validation schema | Update corresponding OpenAPI request schema in `src/openapi/schemas.ts` |
| Changed request/response shape | Update requestBody schema in `src/openapi/schemas.ts` and responses in path entry |
| Added/removed query or path parameters | Update `parameters` array in path entry and in `src/openapi/schemas.ts` |
| New/removed enum values in Prisma schema | Update both Zod enum and OpenAPI enum in `src/openapi/schemas.ts` |
| New entity/model added | Add entity schema in `src/openapi/schemas.ts` and register in `components.schemas` in `src/openapi/index.ts` |

### Verification checklist
After any changes, confirm all of the following:
1. `GET /api/openapi.json` returns valid OpenAPI 3.1 JSON (no broken `$ref`s, no undefined schemas)
2. Swagger UI at `GET /api/docs` renders without JavaScript console errors
3. `security` array on each path accurately reflects the middleware chain in the route file
4. Response schemas match actual controller return shapes (check `res.json({ data: ... })` calls)
5. All schema objects include `example` values for each property
6. All request schemas have correct `required` fields matching the Zod `.required()`/`.optional()` calls

## Phase 11 - OpenAPI Documentation - Complete
- [x] OpenAPI 3.1 spec builder with all 45 endpoints
- [x] Component schemas for all entities, requests, and responses
- [x] JWT Bearer security scheme documented
- [x] Role requirements documented in endpoint descriptions
- [x] Swagger UI served at /api/docs
- [x] Raw spec JSON endpoint at /api/openapi.json for AI agent consumption
- [x] CONTEXT.md sync rules for future maintainers

