import styles from "./Stats.module.css";

const stats = [
  {
    title: "Total Projects",
    value: "24",
  },
  {
    title: "AI Generations",
    value: "18,942",
  },
  {
    title: "Success Rate",
    value: "99.8%",
  },
  {
    title: "Time Saved",
    value: "312h",
  },
  {
    title: "Active Agents",
    value: "12",
  },
];

export default function Stats() {
  return (
    <section className={styles.grid}>
      {stats.map((item) => (
        <div
          key={item.title}
          className={styles.card}
        >
          <p className={styles.label}>
            {item.title}
          </p>

          <h2 className={styles.value}>
            {item.value}
          </h2>
        </div>
      ))}
    </section>
  );
}
