import { useEffect, useState } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigation,
} from "react-router";
import { Theme, ThemePanel } from "@radix-ui/themes";
import { ToastProvider } from "./context/toast-context";
import { GlobalToast } from "./components/toast";
import { NavigationTabs } from "./components/navigation-tabs";
import { Logo } from "./components/logo";
import { Favicon } from "./components/favicon";
import { ThemeToggle } from "./components/theme-toggle";

import type { Route } from "./+types/root";
import "@radix-ui/themes/styles.css";
import styles from "./root.module.css";
import NotFound from "./$";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const isDev = import.meta.env.DEV;
  const [appearance, setAppearance] = useState<"light" | "dark">("dark");

  useEffect(() => {
    // Get theme from localStorage on mount
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setAppearance(savedTheme);
    }

    // Listen for theme changes
    const handleThemeChange = (event: CustomEvent<"light" | "dark">) => {
      setAppearance(event.detail);
    };

    window.addEventListener("themechange", handleThemeChange as EventListener);
    return () => {
      window.removeEventListener(
        "themechange",
        handleThemeChange as EventListener
      );
    };
  }, []);

  return (
    <html lang="en">
      <head>
        <Favicon />
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes"
        />
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#0090ff" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <Theme appearance={appearance} accentColor="orange">
          <ToastProvider>
            {children}
            <GlobalToast />
            {isDev && <ThemePanel defaultOpen={false} />}
          </ToastProvider>
        </Theme>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <>
      <NavigationTabs />
      <ThemeToggle />
      <Outlet />
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFound />;
  }

  // For other errors, show a generic error message
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = `Error ${error.status}`;
    details = error.statusText || details;
  } else if (error instanceof Error) {
    details = error.message;
    stack = import.meta.env.DEV ? error.stack : undefined;
  }

  return (
    <main className={styles.errorBoundary}>
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre>
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
