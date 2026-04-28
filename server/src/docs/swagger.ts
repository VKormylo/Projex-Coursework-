import { readFileSync } from "node:fs";
import { join } from "node:path";

export const swaggerSpec = JSON.parse(
  readFileSync(join(process.cwd(), "openapi.json"), "utf-8"),
) as Record<string, unknown>;
