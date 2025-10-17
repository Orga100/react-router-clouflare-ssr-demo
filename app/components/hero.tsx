import { Link } from "react-router";
import styles from "./hero.module.css";

export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <h1 className={styles.heroTitle}>Full-Stack Demo Application</h1>
        <p className={styles.heroSubtitle}>
          A production-ready showcase of modern web development practices that could be used in your products
        </p>
        <p className={styles.heroDescription}>
          Experience the power of edge computing with React Router 7, Cloudflare
          Workers, and cutting-edge web technologies. Built for speed,
          scalability, and developer experience.
        </p>
        <div className={styles.heroActions}>
          <Link to="/todos" className={styles.heroPrimaryButton}>
            View TodoList
          </Link>
          <Link to="/weather" className={styles.heroSecondaryButton}>
            View Weather
          </Link>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <div className={styles.heroStatValue}>{"<50ms"}</div>
            <div className={styles.heroStatLabel}>Response Time</div>
          </div>
          <div className={styles.heroStat}>
            <div className={styles.heroStatValue}>300+</div>
            <div className={styles.heroStatLabel}>Edge Locations</div>
          </div>
          <div className={styles.heroStat}>
            <div className={styles.heroStatValue}>100%</div>
            <div className={styles.heroStatLabel}>TypeScript</div>
          </div>
        </div>
      </div>
      <div className={styles.heroBackground}>
        <div className={styles.heroGradient}></div>
        <div className={styles.heroGrid}></div>
      </div>
    </section>
  );
}
