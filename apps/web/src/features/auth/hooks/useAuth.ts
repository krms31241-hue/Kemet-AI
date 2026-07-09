import { useState } from "react";

import { useAuthStore } from "../../../store/auth.store";

import {
  login as loginService,
  register as registerService,
} from "../services/auth.service";

import type {
  LoginInput,
  RegisterInput,
} from "../types";

export function useAuth() {
  const [loading, setLoading] = useState(false);

  const loginStore = useAuthStore((state) => state.login);

  const logoutStore = useAuthStore((state) => state.logout);

  async function login(data: LoginInput) {
    setLoading(true);

    try {
      const result = await loginService(data);

      loginStore(result.accessToken, result.user);

      return result;
    } finally {
      setLoading(false);
    }
  }

  async function register(data: RegisterInput) {
    setLoading(true);

    try {
      const result = await registerService(data);

      loginStore(result.accessToken, result.user);

      return result;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    logoutStore();
  }

  return {
    loading,
    login,
    register,
    logout,
  };
}
