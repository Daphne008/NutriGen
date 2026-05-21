import app from "./app";
import { prisma } from "./config/db";
import { env } from "./config/env";

const server = app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend API listening on port ${env.port}`);
});

const shutdown = async (): Promise<void> => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
