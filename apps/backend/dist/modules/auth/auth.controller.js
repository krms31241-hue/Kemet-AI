import { authService } from "./auth.service.js";
import { loginSchema, registerSchema, } from "./auth.validator.js";
export class AuthController {
    async register(req, res) {
        const body = registerSchema.parse(req.body);
        const result = await authService.register(body);
        return res.status(201).json(result);
    }
    async login(req, res) {
        const body = loginSchema.parse(req.body);
        const result = await authService.login(body);
        return res.status(200).json(result);
    }
    async me(req, res) {
        const authReq = req;
        const result = await authService.me(authReq.user.userId);
        return res.status(200).json(result);
    }
}
export const authController = new AuthController();
