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
    expect(env.MAX_FILE_SIZE).toBe(10485760);
    expect(typeof env.R2_ACCOUNT_ID).toBe("string");
    expect(typeof env.R2_ACCESS_KEY_ID).toBe("string");
    expect(typeof env.R2_SECRET_ACCESS_KEY).toBe("string");
    expect(typeof env.R2_BUCKET_NAME).toBe("string");
    expect(env.CORS_ORIGIN).toBeInstanceOf(Array);
    expect(env.CORS_ORIGIN).toContain("http://localhost:3000");
    expect(["development", "production", "test"]).toContain(env.NODE_ENV);
    expect(typeof env.PORT).toBe("number");
    expect(typeof env.MAX_FILE_SIZE).toBe("number");
  });
});
