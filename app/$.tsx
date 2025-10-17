import { Link } from "react-router-dom";
import styles from "./$.module.css";

const NotFound = () => {
  return (
    <div className={styles.container}>
      <h1>404 - Page Not Found</h1>
      <p>Sorry, the page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className={styles.link}>
        Go back home
      </Link>
    </div>
  );
};

export default NotFound;
