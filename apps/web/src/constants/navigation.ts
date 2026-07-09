import {
  Bot,
  Boxes,
  Code2,
  Database,
  FolderKanban,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Workflow,
} from "lucide-react";

import type { NavigationItem } from "../types/navigation";

export const navigation: NavigationItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    id: "projects",
    title: "Projects",
    path: "/projects",
    icon: FolderKanban,
  },
  {
    id: "workflow",
    title: "Workflow",
    path: "/workflow",
    icon: Workflow,
  },
  {
    id: "agents",
    title: "Agents",
    path: "/agents",
    icon: Bot,
  },
  {
    id: "marketplace",
    title: "Marketplace",
    path: "/marketplace",
    icon: Boxes,
  },
  {
    id: "code",
    title: "Code",
    path: "/code",
    icon: Code2,
  },
  {
    id: "database",
    title: "Database",
    path: "/database",
    icon: Database,
  },
  {
    id: "security",
    title: "Security",
    path: "/security",
    icon: ShieldCheck,
  },
  {
    id: "settings",
    title: "Settings",
    path: "/settings",
    icon: Settings,
  },
];
