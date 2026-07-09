import styles from "./ProjectExplorer.module.css";

export default function ProjectExplorer() {
  return (
    <div className={styles.root}>
      <h2>Projects</h2>

      <div className={styles.list}>
        No projects loaded
      </div>
    </div>
  );
}
