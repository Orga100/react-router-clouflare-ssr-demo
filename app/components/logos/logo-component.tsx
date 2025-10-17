import type { FC } from "react";
import styles from "./logo.module.css";
import { useThemeContext } from "@radix-ui/themes";

export const Logo: FC = () => {
  const theme = useThemeContext();

  return (
    <figure className={styles.logoContainer}>
      <img
        src={`/assets/logos/logo-${theme.appearance}.svg`}
        alt="React Router Logo"
        className={styles.logo}
      />
    </figure>
  );
};
