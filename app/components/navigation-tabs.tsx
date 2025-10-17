import { useLocation, useNavigate, useNavigation } from "react-router";
import { useRef } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import styles from "./navigation-tabs.module.css";
import { Logo } from "./logo";

export function NavigationTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isNavigating = navigation.state === "loading";
  const isNavigatingRef = useRef(false);

  const handleTabChange = (value: string) => {
    // Prevent double navigation
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    navigate(value);

    // Reset the flag after navigation starts
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 100);
  };

  return (
    <>
      <nav className={styles.navigationContainer}>
        <Tabs.Root
          className={styles.tabsRoot}
          value={location.pathname}
          onValueChange={handleTabChange}
        >
          <Tabs.List className={styles.tabsList} aria-label="Main navigation">
            <Tabs.Trigger
              className={`${styles.tabsTrigger} ${styles.tabHome}`}
              value="/"
            >
              <Logo />
            </Tabs.Trigger>
            <Tabs.Trigger className={styles.tabsTrigger} value="/todos">
              Todo List
            </Tabs.Trigger>
            <Tabs.Trigger className={styles.tabsTrigger} value="/weather">
              Weather
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      </nav>
      {isNavigating && (
        <div className={styles.loadingBarCenter}>
          <div className={styles.loadingProgress}></div>
        </div>
      )}
    </>
  );
}
