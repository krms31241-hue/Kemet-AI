import {
  Bell,
  Globe,
  Search,
  Sun,
  ChevronDown,
} from "lucide-react";

import styles from "./Topbar.module.css";

export default function Topbar() {
  return (
    <header className={styles.topbar}>
      <div className={styles.searchBox}>
        <Search size={18} />

        <input
          type="text"
          placeholder="Ask Kemet AI to build anything..."
        />

        <kbd>⌘ K</kbd>
      </div>

      <div className={styles.actions}>
        <button className={styles.iconButton}>
          <Globe size={18} />
          <span>EN</span>
          <ChevronDown size={14} />
        </button>

        <button className={styles.iconButton}>
          <Bell size={18} />
        </button>

        <button className={styles.iconButton}>
          <Sun size={18} />
        </button>

        <div className={styles.profile}>
          <div className={styles.avatar}>
            KA
          </div>

          <div>
            <h4>Kemet AI</h4>
            <p>Founder &amp; CEO</p>
          </div>
        </div>
      </div>
    </header>
  );
}
