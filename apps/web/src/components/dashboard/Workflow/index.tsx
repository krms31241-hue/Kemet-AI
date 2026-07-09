import styles from "./Workflow.module.css";

const nodes = [
  "User Prompt",
  "AI Planner",
  "Architecture",
  "Code Generator",
  "UI Builder",
  "Self Correction",
  "Compilation",
  "Live Preview",
];

export default function Workflow() {
  return (
    <section className={styles.workflow}>
      <div className={styles.header}>
        <h2>Workflow Canvas</h2>
        <span>AI Pipeline</span>
      </div>

      <div className={styles.canvas}>
        {nodes.map((node) => (
          <div
            key={node}
            className={styles.node}
          >
            {node}
          </div>
        ))}
      </div>
    </section>
  );
}
