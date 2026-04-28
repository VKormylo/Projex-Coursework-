import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import { env } from "./config/env";
import { swaggerSpec } from "./docs/swagger";
import { errorHandler } from "./middleware/error-handler";
import { apiRouter } from "./routes";

export const app = express();

app.set("json replacer", (_key: string, value: unknown) =>
  typeof value === "bigint" ? value.toString() : value,
);

app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "success",
    data: { ok: true },
  });
});

app.get("/api/docs/openapi.json", (_req, res) => {
  res.json(swaggerSpec);
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api", apiRouter);
app.use(errorHandler);
