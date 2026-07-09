import {
  LayoutDashboard,
  FolderKanban,
  Bot,
  Workflow,
  BrainCircuit,
  Database,
  FolderOpen,
  Rocket,
  Settings,
} from "lucide-react";

export const navigation = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Projects",
    icon: FolderKanban,
  },
  {
    label: "Agents",
    icon: Bot,
  },
  {
    label: "Workflows",
    icon: Workflow,
  },
  {
    label: "Models",
    icon: BrainCircuit,
  },
  {
    label: "Knowledge",
    icon: Database,
  },
  {
    label: "Files",
    icon: FolderOpen,
  },
  {
    label: "Deployments",
    icon: Rocket,
  },
  {
    label: "Settings",
    icon: Settings,
  },
];
