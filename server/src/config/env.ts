import "dotenv/config";

const required = ["DATABASE_URL", "JWT_SECRET"] as const;

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env variable: ${key}`);
  }
}

const rawCorsOrigin = process.env.CORS_ORIGIN?.trim();
const corsOrigin: string | string[] =
  !rawCorsOrigin || rawCorsOrigin === "*"
    ? "*"
    : rawCorsOrigin.split(",").map((o) => o.trim()).filter(Boolean);

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 8000),
  databaseUrl: process.env.DATABASE_URL as string,
  jwtSecret: process.env.JWT_SECRET as string,
  corsOrigin,
};
