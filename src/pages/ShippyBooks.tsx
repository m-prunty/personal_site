import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import Tooltip from "@mui/material/Tooltip";
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
  const [aboutMd, setAboutMd] = useState<string>("");
  const [aboutStatus, setAboutStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    fetch("/ABOUT.md")
      .then(async (r) => {
        if (!r.ok) throw new Error(`Failed to load ABOUT.md (${r.status})`);
        return r.text();
      })
      .then((text) => {
        if (!cancelled) {
          setAboutMd(text);
          setAboutStatus("success");
        }
      })
      .catch(() => {
        if (!cancelled) setAboutStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="BooksApp">
      <div className="app-header" style={{ padding: "20px", backgroundColor: "var(--surface)" }}>
        <h1>ShippyBooks</h1>
        <p className="info" style={{ margin: "4px 0 0" }}>
          API hooks showcase: live hook activity/metrics, SSE notifications with correlation/highlights, hybrid auto-refresh, and resilient UI states.
        </p>
        <div className="showcase-row" style={{ marginTop: 8 }}>
          <span className="info">Notifications stream:</span>
          <Tooltip title="Server-Sent Events stream status for realtime notifications" arrow>
            <span className={sseBadgeClass(status)} aria-live="polite">{status}</span>
          </Tooltip>
        </div>
        <p className="muted" style={{ margin: "8px 0 0" }}>
          Tip: use the API Hook Inspector at the bottom of the page for request/response payloads, hook metrics, and sample hints.
        </p>
      </div>
      <div className="app" style={{ padding: "20px", position: "relative", minHeight: "100vh", backgroundColor: "var(--bg)" }}>
        <NotificationToast notifications={notifications} onDismiss={dismiss} />

        <section className="showcase-section" aria-labelledby="about-md-heading">
          <h2 id="about-md-heading" style={{ marginTop: 0 }}>About</h2>
          {aboutStatus === "loading" && <div className="muted">Loading ABOUT.md…</div>}
          {aboutStatus === "error" && <div className="error">Failed to load ABOUT.md.</div>}
          {aboutStatus === "success" && (
            <div className="info" style={{ color: "var(--text)" }}>
              <ReactMarkdown>{aboutMd}</ReactMarkdown>
            </div>
          )}
        </section>

        <Books notifications={notifications} highlightedBookIds={highlights.bookIds} />
        <hr style={{ margin: "20px 0" }} />
        <Orders notifications={notifications} highlightedOrderIds={highlights.orderIds} />
        <ApiHookInspector notifications={notifications} sseStatus={status} />
      </div>
    </div>
  );
}
