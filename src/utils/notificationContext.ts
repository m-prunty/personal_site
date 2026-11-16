import type { AppNotification } from "../types";
import type { ApiActivityEntry } from "../apiActivity";

export interface NotificationCorrelation {
  notification: AppNotification;
  entityType?: "book" | "order" | "stock";
  entityIds: string[];
  actionHint?: string;
  relatedHooks: string[];
}

function extractIds(text: string): string[] {
  const ids = new Set<string>();
  const uuidRe = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;
  for (const m of text.matchAll(uuidRe)) ids.add(m[0]);
  // fallback: tokens after common labels
  const labelRe = /\b(book|order|id)[:\s#]+([A-Za-z0-9_-]{4,})/gi;
  for (const m of text.matchAll(labelRe)) {
    if (m[2] && !/^(created|updated|status|stock)$/i.test(m[2])) ids.add(m[2]);
  }
  return [...ids];
}

function kindHints(kind: AppNotification["kind"]): { entityType?: NotificationCorrelation["entityType"]; actionHint?: string; hooks: string[] } {
  switch (kind) {
    case "order_confirmation":
      return { entityType: "order", actionHint: "order created/confirmed", hooks: ["api.createOrder", "api.listOrders", "api.getOrder"] };
    case "stock_alert":
      return { entityType: "stock", actionHint: "stock alert/updated", hooks: ["api.updateStock", "api.createBook", "api.listBooks", "api.getBook"] };
    case "status_update":
      return { entityType: "order", actionHint: "order status updated", hooks: ["api.changeStatus", "api.listOrders", "api.getOrder"] };
    default:
      return { hooks: [] };
  }
}

export function correlateNotification(notification: AppNotification, recentActivity: ApiActivityEntry[]): NotificationCorrelation {
  const entityIds = extractIds(notification.message || "");
  const hints = kindHints(notification.kind);
  const now = Date.now();
  const relatedHooks = recentActivity
    .filter((e) => {
      if (now - e.startedAt > 2 * 60 * 1000) return false;
      if (hints.hooks.includes(e.hook)) return true;
      if (entityIds.length > 0) {
        const blob = JSON.stringify({ req: e.request, res: e.response }).toLowerCase();
        return entityIds.some((id) => blob.includes(id.toLowerCase()));
      }
      return false;
    })
    .map((e) => e.hook);

  return {
    notification,
    entityType: hints.entityType,
    entityIds,
    actionHint: hints.actionHint,
    relatedHooks: [...new Set(relatedHooks)],
  };
}

export function extractHighlightIds(notifications: AppNotification[]): { bookIds: Set<string>; orderIds: Set<string> } {
  const bookIds = new Set<string>();
  const orderIds = new Set<string>();
  for (const n of notifications) {
    const ids = extractIds(n.message || "");
    if (n.kind === "stock_alert") ids.forEach((id) => bookIds.add(id));
    if (n.kind === "order_confirmation" || n.kind === "status_update") ids.forEach((id) => orderIds.add(id));
  }
  return { bookIds, orderIds };
}
