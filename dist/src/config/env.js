"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProduction = exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const required = (value, name) => {
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
};
/** Comma-separated origins, e.g. `http://localhost:3000,http://nutriplan.com:3000` */
const parseCorsOrigins = (raw) => {
    const parts = (raw ?? "http://localhost:3000")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    if (parts.length === 1) {
        return parts[0];
    }
    return parts;
};
exports.env = {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: Number(process.env.PORT ?? 4000),
    databaseUrl: required(process.env.DATABASE_URL, "DATABASE_URL"),
    jwtSecret: required(process.env.JWT_SECRET, "JWT_SECRET"),
    corsOrigin: parseCorsOrigins(process.env.CORS_ORIGIN)
};
exports.isProduction = exports.env.nodeEnv === "production";
