import styles from "./Preview.module.css";

export default function Preview() {
  return (
    <section className={styles.preview}>
      <div className={styles.header}>
        <h2>Live Preview</h2>
        <span>Running</span>
      </div>

      <div className={styles.screen}>
        <div className={styles.window}>
          <div className={styles.dots}>
            <span />
            <span />
            <span />
          </div>

          <div className={styles.content}>
            <h3>Kemet AI</h3>

            <p>
              Application Preview
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
