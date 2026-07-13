import { useState, useEffect } from "react";
import { API_BASE } from "../api";

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const es = new EventSource(`${API_BASE}/notifications/stream`);

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setNotifications((prev) =>
        prev.some((n) => n.id === data.id)
          ? prev // deduplicate on reconnect
          : [data, ...prev].slice(0, 10),
      );
    };

    return () => es.close();
  }, []);

  const dismiss = (id) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id));

  return { notifications, dismiss };
}
