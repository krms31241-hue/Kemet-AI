import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "kemet-ai-super-secret";

const EXPIRES_IN = "7d";

export interface JwtPayload {
  userId: string;
  email: string;
}

export function generateAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: EXPIRES_IN,
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
