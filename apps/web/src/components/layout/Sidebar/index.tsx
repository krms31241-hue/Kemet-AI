import Logo from "../../common/Logo";
import { navigation } from "./navigation";

import styles from "./Sidebar.module.css";

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <Logo />
      </div>

      <nav className={styles.navigation}>
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              className={styles.navItem}
            >
              <Icon size={18} />

              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <div className={styles.workspace}>
          Default Workspace
        </div>

        <div className={styles.profile}>
          KS
        </div>
      </div>
    </aside>
  );
}
