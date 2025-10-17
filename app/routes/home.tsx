import { Link } from "react-router";
import styles from "./home.module.css";
import type { LoaderFunctionArgs } from "react-router";
import { Hero } from "../components/hero";

export function meta() {
  return [
    { title: "Full-Stack Demo Application" },
    {
      name: "description",
      content:
        "Modern full-stack application built with Cloudflare Workers, React Router 7, and cutting-edge web technologies",
    },
  ];
}

export async function loader({ context }: LoaderFunctionArgs) {
  return {
    message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE,
  };
}

export default function Home({
  loaderData,
}: {
  loaderData: { message: string };
}) {
  return (
    <main className={styles.container}>
      <Hero />

      <p className={styles.visuallyHidden}>
        Use Tab key to navigate through interactive elements. Press Enter to
        activate links and buttons.
      </p>

      <section className={styles.techSection}>
        <h2 className={styles.sectionTitle}>Technologies & Architecture</h2>
        <div className={styles.techGrid}>
          <div className={styles.techCategory}>
            <h3>🚀 Infrastructure</h3>
            <ul>
              <li>Cloudflare Workers (Edge Computing)</li>
              <li>Cloudflare KV (Distributed Database)</li>
              <li>Server-Side Rendering (SSR)</li>
            </ul>
          </div>
          <div className={styles.techCategory}>
            <h3>⚛️ Frontend</h3>
            <ul>
              <li>React 19</li>
              <li>React Router v7 (Remix)</li>
              <li>Radix UI Components & Themes</li>
              <li>Pure CSS Modules</li>
              <li>Dark/Light Theme Toggle</li>
              <li>Advanced Animations</li>
              <li>Page Loading Indicator</li>
            </ul>
          </div>
          <div className={styles.techCategory}>
            <h3>🔧 Backend & API</h3>
            <ul>
              <li>REST API Architecture</li>
              <li>Swagger-Compatible API</li>
              <li>React Router Actions</li>
              <li>Cloudflare KV Database</li>
              <li>Async Toast Notifications</li>
              <li>KV Import/Export Scripts</li>
            </ul>
          </div>
          <div className={styles.techCategory}>
            <h3>♿ Accessibility & UX</h3>
            <ul>
              <li>Semantic HTML Structure</li>
              <li>ARIA Labels & Roles</li>
              <li>Keyboard Navigation Support</li>
              <li>Mobile-Optimized Design</li>
              <li>Touch-Friendly Interactions</li>
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.demoSection}>
        <h2 className={styles.sectionTitle}>Interactive Demos</h2>
        <div className={styles.cardGrid}>
          <Link to="/todos" className={`${styles.card} ${styles.cardDelay1}`}>
            <h3>📝 Todo List</h3>
            <p>
              Full CRUD operations with Cloudflare KV persistence, optimistic UI
              updates, and real-time validation
            </p>
          </Link>
          <Link to="/weather" className={`${styles.card} ${styles.cardDelay2}`}>
            <h3>🌤️ Weather Forecast</h3>
            <p>
              Dynamic city selection with API integration and responsive data
              visualization
            </p>
          </Link>
        </div>
      </section>

      <section className={styles.roadmapSection}>
        <h2 className={styles.sectionTitle}>Roadmap & Planned Features</h2>
        <div className={styles.roadmapGrid}>
          <div className={styles.roadmapColumn}>
            <h3>🎨 UI/UX Enhancements</h3>
            <ul>
              <li>Internationalization (i18n)</li>
            </ul>
          </div>
          <div className={styles.roadmapColumn}>
            <h3>⚡ Performance</h3>
            <ul>
              <li>Server-side caching</li>
              <li>Client API caching (SWR/TanStack Query)</li>
              <li>Pagination & infinite scroll</li>
            </ul>
          </div>
          <div className={styles.roadmapColumn}>
            <h3>🏗️ Architecture</h3>
            <ul>
              <li>Zustand state management</li>
              <li>Zod schema validation</li>
              <li>Headless CMS integration</li>
            </ul>
          </div>
          <div className={styles.roadmapColumn}>
            <h3>🚢 DevOps</h3>
            <ul>
              <li>Git-based CI/CD pipeline</li>
              <li>Staging environment</li>
              <li>Automated testing</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
