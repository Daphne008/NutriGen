"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const env_1 = require("./config/env");
const server = app_1.default.listen(env_1.env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend API listening on port ${env_1.env.port}`);
});
const shutdown = async () => {
    await db_1.prisma.$disconnect();
    server.close(() => process.exit(0));
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
