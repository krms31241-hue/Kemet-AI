import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.overlay}>
        <div className={styles.content}>
          <span className={styles.badge}>
            🇪🇬 Proudly Built in Egypt
          </span>

          <h1>
            Kemet AI
          </h1>

          <h2>
            The AI Development Operating System
          </h2>

          <p>
            Your Vision. Our Engine. Limitless.
          </p>
        </div>
      </div>
    </section>
  );
}
