import { useMemo } from "react";
import Books from "../components/Books";
import Orders from "../components/Orders";

import { useNotifications } from "../hooks/useNotifications";
import NotificationToast from "../components/NotificationToast";
import ApiHookInspector from "../components/ApiHookInspector";
import { extractHighlightIds } from "../utils/notificationContext";

function sseBadgeColor(status: string): string {
  if (status === "open") return "#16a34a";
  if (status === "error") return "#dc2626";
  return "#2563eb";
}

export default function ShippyBooks() {
  const { notifications, dismiss, status } = useNotifications();
  const highlights = useMemo(() => extractHighlightIds(notifications), [notifications]);

  return (
    <div className="BooksApp">
      <div
        className="app-header"
        style={{ padding: "20px", backgroundColor: "#f5f5f5" }}
      >
        <h1>ShippyBooks</h1>
        <p style={{ margin: "4px 0 0", color: "#4b5563" }}>
          API hooks showcase (Stage 3): hook activity, realtime SSE notifications, correlation/highlights, and hybrid auto-refresh.
        </p>
        <div style={{ marginTop: 8, fontSize: 13 }}>
          <span style={{ marginRight: 8, color: "#374151" }}>Notifications stream:</span>
          <span
            style={{
              color: "#fff",
              background: sseBadgeColor(status),
              borderRadius: 999,
              padding: "2px 10px",
              fontWeight: 600,
            }}
          >
            {status}
          </span>
        </div>
      </div>
      <div
        className="app"
        style={{
          padding: "20px",
          position: "relative",
          minHeight: "100vh",
          backgroundColor: "#ffffff",
        }}
      >
        <NotificationToast notifications={notifications} onDismiss={dismiss} />
        <ApiHookInspector notifications={notifications} sseStatus={status} />
        <Books notifications={notifications} highlightedBookIds={highlights.bookIds} />
        <hr style={{ margin: "20px 0" }} />
        <Orders notifications={notifications} highlightedOrderIds={highlights.orderIds} />
      </div>
    </div>
  );
}
