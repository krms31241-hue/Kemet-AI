import styles from "./Inspector.module.css";

export default function Inspector() {
  return (
    <aside className={styles.container}>
      <h2>Inspector</h2>

      <p>Select any node to edit its properties.</p>
    </aside>
  );
}
