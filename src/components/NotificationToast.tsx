import { CSSProperties, useEffect } from "react";
import type { AppNotification, NotificationKind } from "../types";

const STYLES: Record<NotificationKind, CSSProperties> = {
  order_confirmation: {
    borderLeft: "4px solid #22c55e",
    background: "#f0fdf4",
  },
  stock_alert: { borderLeft: "4px solid #f97316", background: "#fff7ed" },
  status_update: { borderLeft: "4px solid #3b82f6", background: "#eff6ff" },
};

interface NotificationToastProps {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
}

interface SingleNotificationProps {
  notification: AppNotification;
  onDismiss: (id: string) => void;
  duration?: number;
}

function SingleNotification({
  notification,
  onDismiss,
  duration = 4000,
}: SingleNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(notification.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [notification.id, onDismiss, duration]);

  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: 6,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        width: "100%",
        ...STYLES[notification.kind],
      }}
    >
      <span style={{ fontSize: 14 }}>{notification.message}</span>
      <button
        onClick={() => onDismiss(notification.id)}
        style={{
          marginLeft: 12,
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 16,
        }}
      >
        ×
      </button>
    </div>
  );
}

export default function NotificationToast({
  notifications,
  onDismiss,
}: NotificationToastProps) {
  if (!notifications.length) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: 320,
        width: "100%",
        alignItems: "center",
      }}
    >
      {notifications.map((n) => (
        <SingleNotification
          key={n.id}
          notification={n}
          onDismiss={onDismiss}
          duration={4000} // 4 seconds auto-dismiss
        />
      ))}
    </div>
  );
}
