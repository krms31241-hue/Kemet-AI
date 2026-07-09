import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";

import { apiRouter } from "./api/routes/index.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

export function createHttpServer() {
  const app = express();

  app.use(cors());

  app.use(helmet());

  app.use(compression());

  app.use(express.json());

  app.use(cookieParser());

  app.use("/api/v1", apiRouter);

  app.use((_, res) => {
    res.status(404).json({
      success: false,
      message: "Route not found",
    });
  });

  app.use(errorMiddleware);

  return app;
}
