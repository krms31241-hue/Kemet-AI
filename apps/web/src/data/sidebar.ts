import {
  LayoutDashboard,
  FolderKanban,
  Bot,
  Workflow,
  Files,
  TerminalSquare,
  Settings,
} from "lucide-react";

export const sidebarItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    title: "Projects",
    icon: FolderKanban,
    path: "/projects",
  },
  {
    title: "Agents",
    icon: Bot,
    path: "/agents",
  },
  {
    title: "Workflows",
    icon: Workflow,
    path: "/workflows",
  },
  {
    title: "Files",
    icon: Files,
    path: "/files",
  },
  {
    title: "Terminal",
    icon: TerminalSquare,
    path: "/terminal",
  },
  {
    title: "Settings",
    icon: Settings,
    path: "/settings",
  },
];
