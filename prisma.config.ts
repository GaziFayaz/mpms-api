import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "src/db/prisma/schema.prisma",
  migrations: {
    path: "src/db/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
