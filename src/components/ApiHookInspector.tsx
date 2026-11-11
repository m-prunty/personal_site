import { useState } from "react";
import { useApiActivity } from "../hooks/useApiActivity";
import type { ApiActivityEntry } from "../apiActivity";

function preview(value: unknown): string {
  if (value === undefined) return "—";
  try {
    const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
    return text.length > 500 ? `${text.slice(0, 500)}…` : text;
  } catch {
    return String(value);
  }
}

function statusColor(status: ApiActivityEntry["status"]): string {
  if (status === "success") return "#16a34a";
  if (status === "error") return "#dc2626";
  return "#2563eb";
}

export default function ApiHookInspector() {
  const { entries, clear } = useApiActivity();
  const [open, setOpen] = useState(true);

  return (
    <section
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        margin: "12px 0 20px",
        background: "#fafafa",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px",
          borderBottom: open ? "1px solid #e5e7eb" : "none",
        }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
            padding: 0,
          }}
          aria-expanded={open}
        >
          {open ? "▾" : "▸"} API Hook Inspector ({entries.length})
        </button>
        <button
          onClick={clear}
          style={{
            fontSize: 12,
            padding: "4px 8px",
            border: "1px solid #d1d5db",
            borderRadius: 4,
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Clear
        </button>
      </div>
      {open && (
        <div style={{ padding: 12, maxHeight: 320, overflow: "auto" }}>
          {entries.length === 0 ? (
            <div style={{ color: "#6b7280", fontSize: 13 }}>
              No API hook calls yet. Interact with Books/Orders to see activity.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {entries.map((e) => (
                <div
                  key={e.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 6,
                    padding: 8,
                    background: "#fff",
                    fontSize: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <strong>{e.hook}</strong>
                    <span style={{ color: "#374151" }}>
                      {e.method} {e.endpoint}
                    </span>
                    <span style={{ color: statusColor(e.status), fontWeight: 600 }}>
                      {e.status.toUpperCase()}
                    </span>
                    {e.durationMs != null && (
                      <span style={{ color: "#6b7280" }}>{e.durationMs} ms</span>
                    )}
                  </div>
                  <div style={{ display: "grid", gap: 4 }}>
                    <div>
                      <span style={{ color: "#6b7280" }}>Request: </span>
                      <code style={{ whiteSpace: "pre-wrap" }}>{preview(e.request)}</code>
                    </div>
                    {e.status === "error" ? (
                      <div>
                        <span style={{ color: "#dc2626" }}>Error: </span>
                        <code style={{ whiteSpace: "pre-wrap" }}>{e.error}</code>
                      </div>
                    ) : (
                      <div>
                        <span style={{ color: "#6b7280" }}>Response: </span>
                        <code style={{ whiteSpace: "pre-wrap" }}>{preview(e.response)}</code>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
