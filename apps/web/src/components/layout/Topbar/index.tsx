import { Bell, Search, Plus } from "lucide-react";

import styles from "./Topbar.module.css";

export default function Topbar() {
  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <div>
          <h1 className={styles.title}>Kemet AI</h1>

          <p className={styles.subtitle}>
            Multi-Agent Development Platform
          </p>
        </div>
      </div>

      <div className={styles.center}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input
            placeholder="Search projects, agents, workflows..."
          />
        </div>
      </div>

      <div className={styles.right}>
        <button className={styles.action}>
          <Plus size={18} />
        </button>

        <button className={styles.action}>
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}


