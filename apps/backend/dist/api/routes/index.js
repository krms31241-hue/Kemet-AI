import { Router } from "express";
import authRouter from "../../modules/auth/auth.routes.js";
import { projectRouter } from "../../modules/projects/index.js";
import { agentRouter } from "../../modules/agents/index.js";
const apiRouter = Router();
apiRouter.get("/health", (_, res) => {
    res.json({
        success: true,
        service: "Kemet AI Backend",
        version: "1.0.0",
        status: "healthy",
        timestamp: new Date().toISOString(),
    });
});
apiRouter.use("/auth", authRouter);
apiRouter.use("/projects", projectRouter);
apiRouter.use("/agents", agentRouter);
export { apiRouter };
