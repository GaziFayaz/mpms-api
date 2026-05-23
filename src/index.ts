import app from "./app.js";
import { env } from "./config/env.js";

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

const server = app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
});

const keepAlive = setInterval(() => {}, 60_000);

process.on("SIGTERM", () => {
  clearInterval(keepAlive);
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  clearInterval(keepAlive);
  server.close(() => process.exit(0));
});
