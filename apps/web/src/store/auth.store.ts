import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

interface AuthState {
  authenticated: boolean;
  token: string | null;
  user: User | null;

  login: (token: string, user: User) => void;

  logout: () => void;

  setUser: (user: User) => void;

  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      authenticated: false,

      token: null,

      user: null,

      login: (token, user) =>
        set({
          authenticated: true,
          token,
          user,
        }),

      logout: () =>
        set({
          authenticated: false,
          token: null,
          user: null,
        }),

      setUser: (user) =>
        set({
          user,
        }),

      setToken: (token) =>
        set({
          token,
          authenticated: true,
        }),
    }),
    {
      name: "kemet-ai-auth",
    },
  ),
);
