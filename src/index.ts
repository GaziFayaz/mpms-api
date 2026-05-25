import app from "./app.js";
import { env } from "./config/env.js";

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

const server = app.listen(env.PORT, () => {
  console.log(`Server running at http://localhost:${env.PORT} [${env.NODE_ENV}]`);
});

server.on("error", (err: any) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${env.PORT} is already in use. Kill the existing process or use a different port.`);
    process.exit(1);
  }
  throw err;
});

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  server.close(() => process.exit(0));
});
