import { useMemo, useState } from "react";
import Tooltip from "@mui/material/Tooltip";
import { useApiActivity } from "../hooks/useApiActivity";
import type { ApiActivityEntry } from "../apiActivity";
import type { AppNotification } from "../types";
import type { SseStatus } from "../hooks/useNotifications";
import { correlateNotification } from "../utils/notificationContext";
import "../styles/Books.css";

function preview(value: unknown): string {
  if (value === undefined) return "—";
  try {
    const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
    return text.length > 500 ? `${text.slice(0, 500)}…` : text;
  } catch {
    return String(value);
  }
}

function statusClass(status: ApiActivityEntry["status"]): string {
  if (status === "success") return "status-success";
  if (status === "error") return "status-error";
  return "status-pending";
}

function sseBadge(status?: SseStatus): string {
  if (status === "open") return "badge badge-open";
  if (status === "error") return "badge badge-error";
  return "badge badge-pending";
}

const SAMPLE_HINTS = [
  { hook: "api.createBook", sample: { title: "Neuromancer", author: "William Gibson", price: 10.99, stock: 5 } },
  { hook: "api.updateStock", sample: { bookId: "<book-id>", quantity: 5 } },
  { hook: "api.createOrder", sample: { items: [{ book_id: "<book-id>", quantity: 1 }] } },
  { hook: "api.changeStatus", sample: { orderId: "<order-id>", status: "processing" } },
];

export default function ApiHookInspector({
  notifications = [],
  sseStatus,
}: {
  notifications?: AppNotification[];
  sseStatus?: SseStatus;
}) {
  const { entries, clear } = useApiActivity();
  const [open, setOpen] = useState(false);

  const correlations = useMemo(
    () => notifications.slice(0, 10).map((n) => correlateNotification(n, entries.slice(0, 20))),
    [notifications, entries],
  );

  const metrics = useMemo(() => {
    const byHook: Record<string, { count: number; success: number; error: number; totalMs: number; timed: number }> = {};
    let total = 0, success = 0, error = 0, pending = 0, totalMs = 0, timed = 0;
    for (const e of entries) {
      total += 1;
      if (e.status === "success") success += 1;
      else if (e.status === "error") error += 1;
      else pending += 1;
      const m = (byHook[e.hook] ||= { count: 0, success: 0, error: 0, totalMs: 0, timed: 0 });
      m.count += 1;
      if (e.status === "success") m.success += 1;
      if (e.status === "error") m.error += 1;
      if (typeof e.durationMs === "number") { m.totalMs += e.durationMs; m.timed += 1; totalMs += e.durationMs; timed += 1; }
    }
    return { total, success, error, pending, avgMs: timed ? Math.round(totalMs / timed) : null, byHook };
  }, [entries]);

  return (
    <section className="inspector" aria-label="API Hook Inspector">
      <div className="inspector-header" style={{ borderBottom: open ? "1px solid var(--border)" : "none" }}>
        <div className="showcase-row">
          <Tooltip title="Toggle API hook inspector panel (request/response metrics and notification context)" arrow>
            <span>
              <button
                onClick={() => setOpen((v) => !v)}
                style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, padding: 0 }}
                aria-expanded={open}
              >
                {open ? "▾" : "▸"} API Hook Inspector ({entries.length})
              </button>
            </span>
          </Tooltip>
          {sseStatus && <span className={sseBadge(sseStatus)} title="SSE notifications stream status">SSE: {sseStatus}</span>}
        </div>
        <Tooltip title="Clear recorded hook activity" arrow><span><button onClick={clear} style={{ fontSize: 12, padding: "4px 8px", border: "1px solid var(--border)", borderRadius: 4, background: "var(--surface-2)", color: "var(--text)", cursor: "pointer" }}>Clear</button></span></Tooltip>
      </div>
      {open && (
        <div className="inspector-body">
          <div className="card">
            <h4 style={{ margin: "0 0 6px" }}>Hook Metrics</h4>
            <div className="info">Total: {metrics.total} · Success: {metrics.success} · Error: {metrics.error} · Pending: {metrics.pending} · Avg latency: {metrics.avgMs != null ? `${metrics.avgMs} ms` : "—"}</div>
            {Object.keys(metrics.byHook).length > 0 && (
              <div className="table-wrap" style={{ marginTop: 6 }}>
                <table className="data-table" aria-label="Hook metrics by endpoint">
                  <thead><tr><th>Hook</th><th>Calls</th><th>OK</th><th>Err</th><th>Avg ms</th></tr></thead>
                  <tbody>
                    {Object.entries(metrics.byHook).map(([hook, m]) => (
                      <tr key={hook}><td><code>{hook}</code></td><td>{m.count}</td><td>{m.success}</td><td>{m.error}</td><td>{m.timed ? Math.round(m.totalMs / m.timed) : "—"}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <h4 style={{ margin: "0 0 6px" }}>Sample Payload Hints</h4>
            <div className="card-list">
              {SAMPLE_HINTS.map((h) => (
                <div key={h.hook}><strong><code>{h.hook}</code></strong><pre className="pre" style={{ marginTop: 4 }}>{JSON.stringify(h.sample, null, 2)}</pre></div>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ margin: "0 0 6px" }}>Notification Context (SSE)</h4>
            {correlations.length === 0 ? (
              <div className="muted">No notifications yet. Events and inferred entity/action links will appear here.</div>
            ) : (
              <div className="card-list">
                {correlations.map((c) => (
                  <div key={c.notification.id} className="card">
                    <div className="showcase-row" style={{ marginBottom: 4 }}>
                      <strong>{c.notification.kind}</strong>
                      {c.actionHint && <span className="info">{c.actionHint}</span>}
                      {c.entityType && <span className="muted">entity: {c.entityType}</span>}
                    </div>
                    <div style={{ marginBottom: 4 }}>{c.notification.message}</div>
                    <div className="muted">inferred IDs: {c.entityIds.length ? c.entityIds.join(", ") : "none"}; related hooks: {c.relatedHooks.length ? c.relatedHooks.join(", ") : "none (recent/heuristic)"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 style={{ margin: "0 0 6px" }}>Recent Hook Activity</h4>
            {entries.length === 0 ? (
              <div className="muted">No API hook calls yet. Interact with Books/Orders to see activity.</div>
            ) : (
              <div className="card-list" style={{ maxHeight: 260, overflow: "auto" }}>
                {entries.map((e) => (
                  <div key={e.id} className="card">
                    <div className="showcase-row" style={{ marginBottom: 4 }}>
                      <strong>{e.hook}</strong>
                      <span className="info">{e.method} {e.endpoint}</span>
                      <span className={statusClass(e.status)}>{e.status.toUpperCase()}</span>
                      {e.durationMs != null && <span className="muted">{e.durationMs} ms</span>}
                    </div>
                    <div className="showcase-stack">
                      <div><span className="muted">Request: </span><code style={{ whiteSpace: "pre-wrap" }}>{preview(e.request)}</code></div>
                      {e.status === "error" ? (
                        <div><span className="error">Error: </span><code style={{ whiteSpace: "pre-wrap" }}>{e.error}</code></div>
                      ) : (
                        <div><span className="muted">Response: </span><code style={{ whiteSpace: "pre-wrap" }}>{preview(e.response)}</code></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
