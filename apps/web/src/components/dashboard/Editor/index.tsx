import styles from "./Editor.module.css";

export default function Editor() {
  return (
    <section className={styles.editor}>
      <div className={styles.header}>
        <h2>Code Editor</h2>
        <span>main.tsx</span>
      </div>

      <pre className={styles.code}>
{`function App() {
  return (
    <KemetAI />
  );
}`}
      </pre>
    </section>
  );
}
