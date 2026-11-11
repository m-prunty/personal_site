import { useState, useEffect } from "react";
import { API_BASE } from "../api";
import type { AppNotification } from "../types";

export type SseStatus = "connecting" | "open" | "error" | "reconnecting";

interface UseNotificationsResult {
  notifications: AppNotification[];
  dismiss: (id: string) => void;
  status: SseStatus;
}

export function useNotifications(): UseNotificationsResult {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [status, setStatus] = useState<SseStatus>("connecting");

  useEffect(() => {
    let es: EventSource | null = null;
    let closed = false;
    let hadOpen = false;

    const connect = () => {
      if (closed) return;
      setStatus(hadOpen ? "reconnecting" : "connecting");
      es = new EventSource(`${API_BASE}/notifications/stream`);

      es.onopen = () => {
        hadOpen = true;
        setStatus("open");
      };

      es.onmessage = (e: MessageEvent<string>) => {
        try {
          const data: AppNotification = JSON.parse(e.data);
          setNotifications((prev) =>
            prev.some((n) => n.id === data.id)
              ? prev
              : [data, ...prev].slice(0, 20),
          );
        } catch {
          // ignore malformed events
        }
      };

      es.onerror = () => {
        setStatus("error");
        // EventSource auto-reconnects; reflect reconnecting shortly if not closed
        if (!closed) {
          setTimeout(() => {
            if (!closed) setStatus("reconnecting");
          }, 500);
        }
      };
    };

    connect();

    return () => {
      closed = true;
      es?.close();
    };
  }, []);

  const dismiss = (id: string): void =>
    setNotifications((prev) => prev.filter((n) => n.id !== id));

  return { notifications, dismiss, status };
}
