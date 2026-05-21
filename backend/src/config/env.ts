import dotenv from "dotenv";

dotenv.config();

const required = (value: string | undefined, name: string): string => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

/** Comma-separated origins, e.g. `http://localhost:3000,http://nutriplan.com:3000` */
const parseCorsOrigins = (raw: string | undefined): string | string[] => {
  const parts = (raw ?? "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 1) {
    return parts[0]!;
  }
  return parts;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required(process.env.DATABASE_URL, "DATABASE_URL"),
  jwtSecret: required(process.env.JWT_SECRET, "JWT_SECRET"),
  corsOrigin: parseCorsOrigins(process.env.CORS_ORIGIN)
};

export const isProduction = env.nodeEnv === "production";
