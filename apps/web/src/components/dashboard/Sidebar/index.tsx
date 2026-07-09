import {
  LayoutDashboard,
  Bot,
  FolderOpen,
  Brain,
  Workflow,
  Code2,
  Rocket,
  Store,
  Users,
  Database,
  ChartColumn,
  Plug,
  Settings,
  Gem,
} from "lucide-react";

import styles from "./Sidebar.module.css";

const items = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: Bot, label: "AI Director" },
  { icon: FolderOpen, label: "Projects" },
  { icon: Brain, label: "Agents" },
  { icon: Workflow, label: "Canvas" },
  { icon: Code2, label: "Code Editor" },
  { icon: Rocket, label: "Deployments" },
  { icon: Store, label: "Marketplace" },
  { icon: Users, label: "Teams" },
  { icon: Database, label: "Databases" },
  { icon: ChartColumn, label: "Analytics" },
  { icon: Plug, label: "Integrations" },
  { icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <h1>Kemet AI</h1>
        <p>Your Vision. Our Engine. Limitless.</p>
      </div>

      <nav className={styles.nav}>
        {items.map(({ icon: Icon, label }, index) => (
          <button
            key={label}
            className={`${styles.item} ${
              index === 0 ? styles.active : ""
            }`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className={styles.plan}>
        <Gem size={20} />
        <h3>KEMET ULTIMATE</h3>
        <p>Enterprise Power</p>

        <button className={styles.manage}>
          Manage Plan
        </button>
      </div>

      <div className={styles.footer}>
        EGYPT • OUR LEGACY • OUR FUTURE
      </div>
    </aside>
  );
}
