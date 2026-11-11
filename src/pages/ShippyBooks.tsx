import { useMemo } from "react";
import Books from "../components/Books";
import Orders from "../components/Orders";

import { useNotifications } from "../hooks/useNotifications";
import NotificationToast from "../components/NotificationToast";
import ApiHookInspector from "../components/ApiHookInspector";
import { extractHighlightIds } from "../utils/notificationContext";
import "../styles/Books.css";

function sseBadgeClass(status: string): string {
  if (status === "open") return "badge badge-open";
  if (status === "error") return "badge badge-error";
  return "badge badge-pending";
}

export default function ShippyBooks() {
  const { notifications, dismiss, status } = useNotifications();
  const highlights = useMemo(() => extractHighlightIds(notifications), [notifications]);

  return (
    <div className="BooksApp">
      <div className="app-header" style={{ padding: "20px", backgroundColor: "var(--surface)" }}>
        <h1>ShippyBooks</h1>
        <p className="info" style={{ margin: "4px 0 0" }}>
          API hooks showcase: live hook activity/metrics, SSE notifications with correlation/highlights, hybrid auto-refresh, and resilient UI states.
        </p>
        <div className="showcase-row" style={{ marginTop: 8 }}>
          <span className="info">Notifications stream:</span>
          <span className={sseBadgeClass(status)} aria-live="polite">{status}</span>
        </div>
        <p className="muted" style={{ margin: "8px 0 0" }}>
          Tip: use the inspector below for request/response payloads, hook metrics, and sample hints. Details and mutations surface in-UI feedback.
        </p>
      </div>
      <div className="app" style={{ padding: "20px", position: "relative", minHeight: "100vh", backgroundColor: "var(--bg)" }}>
        <NotificationToast notifications={notifications} onDismiss={dismiss} />
        <ApiHookInspector notifications={notifications} sseStatus={status} />
        <Books notifications={notifications} highlightedBookIds={highlights.bookIds} />
        <hr style={{ margin: "20px 0" }} />
        <Orders notifications={notifications} highlightedOrderIds={highlights.orderIds} />
      </div>
    </div>
  );
}
