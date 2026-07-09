import bcrypt from "bcryptjs";
import { generateAccessToken } from "../../utils/jwt.js";
import { userRepository } from "../../repositories/index.js";
export class AuthService {
    async register(data) {
        const existingEmail = await userRepository.findByEmail(data.email);
        if (existingEmail) {
            throw new Error("Email already exists");
        }
        const existingUsername = await userRepository.findByUsername(data.username);
        if (existingUsername) {
            throw new Error("Username already exists");
        }
        const passwordHash = await bcrypt.hash(data.password, 12);
        const user = await userRepository.create({
            email: data.email,
            username: data.username,
            passwordHash,
            firstName: data.firstName,
            lastName: data.lastName,
            avatarUrl: undefined,
        });
        const accessToken = generateAccessToken({
            userId: user.id,
            email: user.email,
        });
        return {
            success: true,
            message: "User created successfully",
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                avatarUrl: user.avatarUrl,
            },
        };
    }
    async login(data) {
        const user = await userRepository.findByEmail(data.email);
        if (!user) {
            throw new Error("Invalid credentials");
        }
        const validPassword = await bcrypt.compare(data.password, user.passwordHash);
        if (!validPassword) {
            throw new Error("Invalid credentials");
        }
        const accessToken = generateAccessToken({
            userId: user.id,
            email: user.email,
        });
        return {
            success: true,
            message: "Login successful",
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                avatarUrl: user.avatarUrl,
            },
        };
    }
    async me(userId) {
        const user = await userRepository.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }
        return {
            success: true,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                avatarUrl: user.avatarUrl,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        };
    }
}
export const authService = new AuthService();
