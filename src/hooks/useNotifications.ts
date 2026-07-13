import { useState, useEffect } from "react";
import { API_BASE } from "../api";
import type { AppNotification } from "../types";

interface UseNotificationsResult {
  notifications: AppNotification[];
  dismiss: (id: string) => void;
}

export function useNotifications(): UseNotificationsResult {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    const es = new EventSource(`${API_BASE}/notifications/stream`);

    es.onmessage = (e: MessageEvent<string>) => {
      const data: AppNotification = JSON.parse(e.data);
      setNotifications((prev) =>
        prev.some((n) => n.id === data.id)
          ? prev // deduplicate on reconnect
          : [data, ...prev].slice(0, 10),
      );
    };

    return () => es.close();
  }, []);

  const dismiss = (id: string): void =>
    setNotifications((prev) => prev.filter((n) => n.id !== id));

  return { notifications, dismiss };
}
