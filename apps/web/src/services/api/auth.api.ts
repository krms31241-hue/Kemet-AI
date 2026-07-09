import { apiClient } from "./client";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  accessToken: string;
  user: AuthUser;
}

export const authApi = {
  login(data: LoginRequest) {
    return apiClient<AuthResponse>(
      "/api/v1/auth/login",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  },

  register(data: RegisterRequest) {
    return apiClient<AuthResponse>(
      "/api/v1/auth/register",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  },
};
