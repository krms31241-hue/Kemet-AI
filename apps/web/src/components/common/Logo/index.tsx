import styles from "./Logo.module.css";

type LogoProps = {
  compact?: boolean;
};

export default function Logo({ compact = false }: LogoProps) {
  return (
    <div className={styles.logo}>
      <div
        className={`${styles.logoIcon} ${
          compact ? styles.compact : ""
        }`}
      >
        K
      </div>

      {!compact && (
        <div>
          <h2 className={styles.title}>
            Kemet AI
          </h2>

          <p className={styles.subtitle}>
            Build • Innovate • Empower
          </p>
        </div>
      )}
    </div>
  );
}
