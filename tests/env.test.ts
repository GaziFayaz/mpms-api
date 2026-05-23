import { describe, it, expect } from "vitest";

describe("env config", () => {
  it("exports env object with all expected fields", async () => {
    const { env } = await import("../src/config/env.js");

    expect(env.PORT).toBe(4000);
    expect(typeof env.DATABASE_URL).toBe("string");
    expect(typeof env.JWT_ACCESS_SECRET).toBe("string");
    expect(typeof env.JWT_REFRESH_SECRET).toBe("string");
    expect(env.JWT_ACCESS_EXPIRES_IN).toBe("15m");
    expect(env.JWT_REFRESH_EXPIRES_IN).toBe("7d");
    expect(env.UPLOAD_DIR).toBe("./uploads");
    expect(env.MAX_FILE_SIZE).toBe(10485760);
    expect(env.CORS_ORIGIN).toBe("http://localhost:3000");
    expect(["development", "production", "test"]).toContain(env.NODE_ENV);
    expect(typeof env.PORT).toBe("number");
    expect(typeof env.MAX_FILE_SIZE).toBe("number");
  });
});
