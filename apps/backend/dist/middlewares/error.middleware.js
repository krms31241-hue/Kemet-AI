import { ZodError } from "zod";
export function errorMiddleware(error, _req, res, _next) {
    if (error instanceof ZodError) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: error.issues,
        });
    }
    if (error instanceof Error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
    return res.status(500).json({
        success: false,
        message: "Internal server error",
    });
}
