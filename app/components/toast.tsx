import * as ToastPrimitive from "@radix-ui/react-toast";
import { useToast } from "../context/toast-context";
import { useEffect, useState } from "react";
import styles from "./toast.module.css";

function ToastWithTimer({
  toast,
  onDismiss,
}: {
  toast: any;
  onDismiss: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(
    toast.duration ? Math.ceil(toast.duration / 1000) : 0
  );

  useEffect(() => {
    if (!toast.duration) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [toast.duration]);

  return (
    <ToastPrimitive.Root
      key={toast.id}
      data-toast-id={toast.id}
      className={styles.toastRoot}
      duration={toast.duration}
      onOpenChange={(open: boolean) => {
        if (!open) {
          onDismiss();
        }
      }}
    >
      <section className={styles.toastContent}>
        <header className={styles.toastHeader}>
          <ToastPrimitive.Title className={styles.toastTitle} asChild>
            <h3>{toast.title}</h3>
          </ToastPrimitive.Title>
          {toast.duration && <time className={styles.timer}>{timeLeft}s</time>}
        </header>
        {toast.description && (
          <ToastPrimitive.Description
            className={styles.toastDescription}
            asChild
          >
            <p>{toast.description}</p>
          </ToastPrimitive.Description>
        )}
      </section>

      {toast.action && (
        <footer className={styles.toastActions}>
          <ToastPrimitive.Action asChild altText={toast.action.label}>
            <button
              className={`${styles.toastButton} ${styles.toastAction}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Call the action handler
                toast.action?.onClick();
                // Remove the toast from the context
                // This will be handled by the toast's own cleanup
              }}
            >
              {toast.action.label}
            </button>
          </ToastPrimitive.Action>
        </footer>
      )}
    </ToastPrimitive.Root>
  );
}

export function GlobalToast() {
  const { toasts, removeToast } = useToast();

  const handleDismiss = (toast: any) => {
    if (toast.onDismiss) {
      toast.onDismiss();
    }
    removeToast(toast.id);
  };

  return (
    <aside aria-label="Notifications" role="region">
      {toasts.map((toast) => (
        <ToastWithTimer
          key={toast.id}
          toast={toast}
          onDismiss={() => handleDismiss(toast)}
        />
      ))}
      <ToastPrimitive.Viewport className={styles.toastViewport} />
    </aside>
  );
}
