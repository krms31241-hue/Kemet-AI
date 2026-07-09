import styles from "./RightPanel.module.css";

const activities = [
  {
    title: "Workflow completed",
    time: "2 min ago",
  },
  {
    title: "Project generated",
    time: "15 min ago",
  },
  {
    title: "AI Review finished",
    time: "1 hour ago",
  },
];

export default function RightPanel() {
  return (
    <aside className={styles.panel}>
      <section className={styles.card}>
        <h3>Kemet Assistant</h3>

        <p>
          AI Director is online and ready to orchestrate your development
          workflow.
        </p>

        <button className={styles.button}>
          Start New Task
        </button>
      </section>

      <section className={styles.card}>
        <h3>Recent Activity</h3>

        <div className={styles.list}>
          {activities.map((item) => (
            <div
              key={item.title}
              className={styles.item}
            >
              <strong>{item.title}</strong>

              <span>{item.time}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <h3>System Status</h3>

        <div className={styles.status}>
          <div>
            <span>API</span>
            <strong>Online</strong>
          </div>

          <div>
            <span>Agents</span>
            <strong>12 Active</strong>
          </div>

          <div>
            <span>Queue</span>
            <strong>0 Pending</strong>
          </div>
        </div>
      </section>
    </aside>
  );
}
