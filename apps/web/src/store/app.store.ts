import { create } from "zustand";

interface AppState {
  initialized: boolean;
  sidebarCollapsed: boolean;
  loading: boolean;

  setInitialized: (value: boolean) => void;
  setSidebarCollapsed: (value: boolean) => void;
  setLoading: (value: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  initialized: false,

  sidebarCollapsed: false,

  loading: false,

  setInitialized: (value) =>
    set({
      initialized: value,
    }),

  setSidebarCollapsed: (value) =>
    set({
      sidebarCollapsed: value,
    }),

  setLoading: (value) =>
    set({
      loading: value,
    }),
}));
