import styles from "./Explorer.module.css";

export default function Explorer() {
  return (
    <aside className={styles.container}>
      <h2>Explorer</h2>

      <ul className={styles.tree}>
        <li>📁 Projects</li>
        <li>🤖 Agents</li>
        <li>🔄 Workflows</li>
        <li>📂 Knowledge</li>
        <li>📄 Files</li>
      </ul>
    </aside>
  );
}
