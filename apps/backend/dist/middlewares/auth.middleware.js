import { verifyAccessToken } from "../utils/jwt.js";
export function authMiddleware(req, res, next) {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).json({
            success: false,
            message: "Authorization header is missing",
        });
    }
    if (!authorization.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Invalid authorization format",
        });
    }
    const token = authorization.slice(7);
    try {
        const payload = verifyAccessToken(token);
        req.user = payload;
        next();
    }
    catch {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
}
