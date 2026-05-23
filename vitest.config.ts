import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    server: {
      deps: {
        inline: ["zod", "@prisma/client", "@prisma/adapter-neon", "@neondatabase/serverless"],
      },
    },
  },
});
