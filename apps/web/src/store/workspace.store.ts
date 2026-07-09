import { create } from "zustand";

interface WorkspaceState {
  projectId: string | null;
  projectName: string | null;

  activePanel: string;
  activeView: string;

  setProject: (id: string | null, name: string | null) => void;
  setActivePanel: (panel: string) => void;
  setActiveView: (view: string) => void;

  reset: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  projectId: null,

  projectName: null,

  activePanel: "dashboard",

  activeView: "overview",

  setProject: (id, name) =>
    set({
      projectId: id,
      projectName: name,
    }),

  setActivePanel: (panel) =>
    set({
      activePanel: panel,
    }),

  setActiveView: (view) =>
    set({
      activeView: view,
    }),

  reset: () =>
    set({
      projectId: null,
      projectName: null,
      activePanel: "dashboard",
      activeView: "overview",
    }),
}));
