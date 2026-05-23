# MPMS Backend - Architecture Context

## Stack
- **Runtime:** Bun 1.3.14
- **Framework:** Express 5.2.1
- **Language:** TypeScript 5.9 (strict mode)
- **ORM:** Prisma 7.8.0 (adapter: @prisma/adapter-neon)
- **Database:** PostgreSQL (Neon serverless)
- **Validation:** Zod 4.4.3
- **Auth:** bcryptjs 3.0.3, jsonwebtoken 9.0.3
- **Testing:** Vitest 4.1.7
- **Dev runner:** tsx 4.22.3

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
- Adapter: `@prisma/adapter-neon` with `neonConfig.poolQueryViaFetch = true`

### Config
- Single file: `src/config/env.ts`
- Uses Zod for validation
- All env vars typed and exported as `env` object
- Throws on missing required vars

### Error Handling
- `AppError` class in `src/utils/errors.ts`
- Global error handler middleware: `src/middleware/error-handler.ts`
- Stack traces included in development responses

## Module Structure
Each feature module follows: routes → controller → service → validation
```
src/modules/<name>/
  <name>.routes.ts
  <name>.controller.ts
  <name>.service.ts
  <name>.validation.ts
```

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
