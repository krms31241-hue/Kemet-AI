import { authApi } from "../../../services/api/auth.api";

import type {
  LoginInput,
  RegisterInput,
  AuthResult,
} from "../types";

export async function login(
  data: LoginInput,
): Promise<AuthResult> {
  return authApi.login(data);
}

export async function register(
  data: RegisterInput,
): Promise<AuthResult> {
  return authApi.register(data);
}
