import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
export function createApp() {
    const app = express();
    app.use(helmet());
    app.use(cors({
        origin: true,
        credentials: true,
    }));
    app.use(compression());
    app.use(cookieParser());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    return app;
}
