export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
}

export interface AuthResult {
  success: boolean;
  message: string;
  accessToken: string;
  user: AuthUser;
}
