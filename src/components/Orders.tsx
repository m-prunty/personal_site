import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api";
import { ORDER_STATUSES } from "../types";
import type { AppNotification, Book, Order, OrderItem, OrderStatus } from "../types";
import { useAsync } from "../hooks/useAsync";

type BookListItem = Partial<Book> & { id: string; title?: string; stock?: number; author?: string };
type OrderListItem = Partial<Order> & { id: string; status?: string | OrderStatus };
type OrderDetailItem = { book_id?: string; quantity?: number; price?: number };

interface ItemFormState {
  bookId: string;
  qty: string;
}

interface StatusUpdateState {
  orderId: string;
  status: OrderStatus | "";
}

const sectionStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 12,
  marginTop: 12,
  background: "#fff",
};

function parseResponseId(res: unknown): string | undefined {
  if (res && typeof res === "object" && "id" in res && typeof (res as { id?: unknown }).id === "string") {
    return (res as { id: string }).id;
  }
  return undefined;
}

function normalizeStatus(status: unknown): string {
  if (typeof status === "string") return status;
  return String(status ?? "unknown");
}

export default function Orders({
  notifications = [],
  highlightedOrderIds,
}: {
  notifications?: AppNotification[];
  highlightedOrderIds?: Set<string>;
}) {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [books, setBooks] = useState<BookListItem[]>([]);
  const [ordersStatus, setOrdersStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [booksStatus, setBooksStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [booksError, setBooksError] = useState<string | null>(null);

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [itemForm, setItemForm] = useState<ItemFormState>({ bookId: "", qty: "" });
  const [createStatus, setCreateStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  const [statusUpdate, setStatusUpdate] = useState<StatusUpdateState>({ orderId: "", status: "" });
  const [changeStatusState, setChangeStatusState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [changeStatusError, setChangeStatusError] = useState<string | null>(null);
  const [lastStatusTransition, setLastStatusTransition] = useState<{ orderId: string; from?: string; to: string } | null>(null);

  const orderDetail = useAsync<Order, [string]>();
  const handledNotifIdsRef = useRef<Set<string>>(new Set());

  const bookById = useMemo(() => {
    const map = new Map<string, BookListItem>();
    for (const b of books) map.set(b.id, b);
    return map;
  }, [books]);

  const refreshBooks = useCallback(async () => {
    setBooksStatus("loading");
    setBooksError(null);
    try {
      const data = await api.listBooks();
      setBooks(Array.isArray(data) ? (data as BookListItem[]) : []);
      setBooksStatus("success");
    } catch (err) {
      setBooksError(err instanceof Error ? err.message : String(err));
      setBooksStatus("error");
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    setOrdersStatus("loading");
    setOrdersError(null);
    try {
      const data = await api.listOrders();
      setOrders(data as OrderListItem[]);
      setOrdersStatus("success");
    } catch (err) {
      setOrdersError(err instanceof Error ? err.message : String(err));
      setOrdersStatus("error");
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshOrders(), refreshBooks()]);
  }, [refreshOrders, refreshBooks]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    const relevant = notifications.filter(
      (n) =>
        (n.kind === "order_confirmation" || n.kind === "status_update" || n.kind === "stock_alert") &&
        !handledNotifIdsRef.current.has(n.id),
    );
    if (relevant.length === 0) return;
    relevant.forEach((n) => handledNotifIdsRef.current.add(n.id));
    // stock alerts can affect book context; order events affect orders
    void refreshOrders();
    void refreshBooks();
    if (orderDetail.status === "success" && (orderDetail.data as OrderListItem | null)?.id) {
      void orderDetail.run(api.getOrder, (orderDetail.data as OrderListItem).id);
    }
  }, [notifications, refreshOrders, refreshBooks, orderDetail]);

  const handleAddItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const qty = Number(itemForm.qty);
    if (!itemForm.bookId || !Number.isFinite(qty) || !Number.isInteger(qty) || qty <= 0) return;
    setOrderItems((prev) => [...prev, { book_id: itemForm.bookId, quantity: qty }]);
    setItemForm({ bookId: "", qty: "" });
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreateStatus("loading");
    setCreateError(null);
    setCreatedOrderId(null);
    try {
      if (orderItems.length === 0) throw new Error("Add at least one item before creating an order.");
      const res = await api.createOrder(orderItems);
      let payload: unknown = undefined;
      try { payload = await res.clone().json(); } catch { try { payload = await res.clone().text(); } catch { payload = undefined; } }
      const id = parseResponseId(payload);
      if (!res.ok) throw new Error(`Create order failed (${res.status})${id ? ` [id: ${id}]` : ""}`);
      setCreatedOrderId(id ?? null);
      setCreateStatus("success");
      setOrderItems([]);
      await refreshOrders();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : String(err));
      setCreateStatus("error");
    }
  };

  const handleStatus = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setChangeStatusState("loading");
    setChangeStatusError(null);
    setLastStatusTransition(null);
    try {
      if (!statusUpdate.orderId || !statusUpdate.status) throw new Error("Select an order and status.");
      const from = normalizeStatus(orders.find((o) => o.id === statusUpdate.orderId)?.status);
      const res = await api.changeStatus(statusUpdate.orderId, statusUpdate.status);
      if (!res.ok) {
        let detail = "";
        try { detail = await res.text(); } catch { detail = ""; }
        throw new Error(`Status change failed (${res.status})${detail ? `: ${detail}` : ""}`);
      }
      setLastStatusTransition({ orderId: statusUpdate.orderId, from, to: statusUpdate.status });
      setChangeStatusState("success");
      await refreshOrders();
      setStatusUpdate({ orderId: "", status: "" });
    } catch (err) {
      setChangeStatusError(err instanceof Error ? err.message : String(err));
      setChangeStatusState("error");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>Orders</h2>
        <button onClick={() => void refreshAll()} disabled={ordersStatus === "loading" || booksStatus === "loading"}>
          {(ordersStatus === "loading" || booksStatus === "loading") ? "Refreshing..." : "Refresh (api.listOrders + api.listBooks)"}
        </button>
      </div>
      <div style={{ marginTop: 6, fontSize: 13, color: "#374151" }}>
        Data status: books={booksStatus} ({books.length}){booksError ? ` — ${booksError}` : ""}; orders={ordersStatus} ({orders.length}){ordersError ? ` — ${ordersError}` : ""}
      </div>
      <p style={{ margin: "4px 0 0", color: "#4b5563", fontSize: 13 }}>
        Showcasing hooks: <code>createOrder</code>, <code>changeStatus</code>, <code>getOrder</code>, <code>listOrders</code> (with <code>listBooks</code>)
      </p>

      <section style={sectionStyle}>
        <h3 style={{ marginTop: 0 }}>Order Builder (createOrder payload)</h3>
        {booksStatus === "loading" && <div style={{ fontSize: 13, color: "#374151" }}>Loading books for selection…</div>}
        {booksStatus === "error" && (
          <div style={{ fontSize: 13, color: "#dc2626", marginBottom: 8 }}>
            Failed to load books: {booksError}{" "}
            <button type="button" onClick={() => void refreshBooks()}>Retry</button>
          </div>
        )}
        {booksStatus === "success" && books.length === 0 && (
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
            No books available. Create books first, then refresh.
          </div>
        )}
        <form onSubmit={handleAddItem} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <select
            value={itemForm.bookId}
            onChange={(e) => setItemForm({ ...itemForm, bookId: e.target.value })}
            required
            disabled={booksStatus === "loading"}
          >
            <option value="" disabled>
              {booksStatus === "loading" ? "Loading books..." : "Select a book"}
            </option>
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title ?? book.id} {book.author ? `— ${book.author}` : ""} (stock: {book.stock ?? "?"})
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            step={1}
            placeholder="Qty"
            value={itemForm.qty}
            onChange={(e) => setItemForm({ ...itemForm, qty: e.target.value })}
            required
          />
          <button type="submit">Add Item</button>
        </form>

        {itemForm.bookId && (
          <div style={{ marginTop: 8, fontSize: 13, color: "#374151" }}>
            {(() => {
              const b = bookById.get(itemForm.bookId);
              if (!b) return "Selected book details not loaded.";
              return <>Selected: <strong>{b.title ?? b.id}</strong> (id: <code>{b.id}</code>, stock: {b.stock ?? "?"})</>;
            })()}
          </div>
        )}

        {orderItems.length === 0 ? (
          <div style={{ marginTop: 8, color: "#6b7280", fontSize: 13 }}>No items added yet.</div>
        ) : (
          <div style={{ marginTop: 8, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "6px" }}>Book</th>
                  <th style={{ padding: "6px" }}>Book ID</th>
                  <th style={{ padding: "6px" }}>Qty</th>
                  <th style={{ padding: "6px" }}>Stock context</th>
                  <th style={{ padding: "6px" }}></th>
                </tr>
              </thead>
              <tbody>
                {orderItems.map((item, i) => {
                  const b = bookById.get(item.book_id);
                  return (
                    <tr key={`${item.book_id}-${i}`} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "6px" }}>{b?.title ?? "(unknown title)"}</td>
                      <td style={{ padding: "6px", fontFamily: "monospace", fontSize: 12 }}>{item.book_id}</td>
                      <td style={{ padding: "6px" }}>{item.quantity}</td>
                      <td style={{ padding: "6px" }}>{b?.stock ?? "?"}</td>
                      <td style={{ padding: "6px" }}><button onClick={() => handleRemoveItem(i)}>Remove</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ marginTop: 6, fontSize: 13, color: "#374151" }}>
              Running summary: {orderItems.length} line item(s), total qty {orderItems.reduce((s, it) => s + it.quantity, 0)}
            </div>
          </div>
        )}

        <div style={{ marginTop: 10 }}>
          <strong style={{ fontSize: 13 }}>Request payload preview (api.createOrder):</strong>
          <pre style={{ background: "#f3f4f6", padding: 8, borderRadius: 6, overflowX: "auto", fontSize: 12, marginTop: 4 }}>
            {JSON.stringify({ items: orderItems }, null, 2)}
          </pre>
        </div>

        <form onSubmit={handleCreate} style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button type="submit" disabled={createStatus === "loading" || orderItems.length === 0}>
            {createStatus === "loading" ? "Creating..." : "Create Order (api.createOrder)"}
          </button>
          {createStatus === "success" && (
            <span style={{ color: "#16a34a", fontSize: 13 }}>
              Order created{createdOrderId ? ` (id: ${createdOrderId})` : ""}.
            </span>
          )}
          {createStatus === "error" && <span style={{ color: "#dc2626", fontSize: 13 }}>{createError}</span>}
        </form>
      </section>

      <section style={sectionStyle}>
        <h3 style={{ marginTop: 0 }}>Change Status (api.changeStatus)</h3>
        {ordersStatus === "loading" && <div style={{ fontSize: 13, color: "#374151" }}>Loading orders…</div>}
        {ordersStatus === "error" && (
          <div style={{ fontSize: 13, color: "#dc2626", marginBottom: 8 }}>
            Failed to load orders: {ordersError}{" "}
            <button type="button" onClick={() => void refreshOrders()}>Retry</button>
          </div>
        )}
        {ordersStatus === "success" && orders.length === 0 && (
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
            No orders available. Create an order first, then refresh.
          </div>
        )}
        <form onSubmit={handleStatus} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <select
            value={statusUpdate.orderId}
            onChange={(e) => setStatusUpdate({ ...statusUpdate, orderId: e.target.value })}
            required
            disabled={ordersStatus === "loading"}
          >
            <option value="" disabled>
              {ordersStatus === "loading" ? "Loading orders..." : "Select an order"}
            </option>
            {orders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.id} — {normalizeStatus(order.status)}
              </option>
            ))}
          </select>
          <select
            value={statusUpdate.status}
            onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value as OrderStatus })}
            required
          >
            <option value="" disabled>Select a status</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <button type="submit" disabled={changeStatusState === "loading"}>
            {changeStatusState === "loading" ? "Updating..." : "Change Status"}
          </button>
        </form>
        <div style={{ marginTop: 8, fontSize: 13 }}>
          {changeStatusState === "success" && lastStatusTransition && (
            <span style={{ color: "#16a34a" }}>
              Transitioned order <code>{lastStatusTransition.orderId}</code>: {lastStatusTransition.from ?? "?"} → {lastStatusTransition.to}
            </span>
          )}
          {changeStatusState === "error" && <span style={{ color: "#dc2626" }}>{changeStatusError}</span>}
          {changeStatusState === "idle" && <span style={{ color: "#6b7280" }}>Select an order and target status to apply a transition.</span>}
        </div>
      </section>

      <section style={sectionStyle}>
        <h3 style={{ marginTop: 0 }}>Orders List (api.listOrders)</h3>
        {ordersStatus === "loading" && <div>Loading orders…</div>}
        {ordersStatus === "error" && (
          <div style={{ color: "#dc2626" }}>Failed to load orders: {ordersError} <button onClick={() => void refreshOrders()}>Retry</button></div>
        )}
        {ordersStatus !== "loading" && orders.length === 0 && ordersStatus !== "error" && (
          <div style={{ color: "#6b7280" }}>No orders found. Create one from the builder above.</div>
        )}
        {orders.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "8px 6px" }}>Order ID</th>
                  <th style={{ padding: "8px 6px" }}>Status</th>
                  <th style={{ padding: "8px 6px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const highlighted = highlightedOrderIds?.has(o.id);
                  return (
                    <tr key={o.id} style={{ borderBottom: "1px solid #f3f4f6", background: highlighted ? "#eff6ff" : undefined }}>
                      <td style={{ padding: "8px 6px", fontFamily: "monospace", fontSize: 12 }}>
                        {o.id} {highlighted ? <span title="Related to recent notification">●</span> : null}
                      </td>
                      <td style={{ padding: "8px 6px" }}>{normalizeStatus(o.status)}</td>
                      <td style={{ padding: "8px 6px" }}>
                        <button onClick={() => orderDetail.run(api.getOrder, o.id)}>Details (api.getOrder)</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section style={sectionStyle}>
        <h3 style={{ marginTop: 0 }}>Order Details Panel (api.getOrder)</h3>
        {orderDetail.status === "idle" && (
          <div style={{ color: "#6b7280", fontSize: 13 }}>Select an order to fetch and inspect details.</div>
        )}
        {orderDetail.status === "loading" && <div>Loading order details…</div>}
        {orderDetail.status === "error" && <div style={{ color: "#dc2626" }}>Error: {orderDetail.error}</div>}
        {orderDetail.status === "success" && orderDetail.data && (
          <div style={{ display: "grid", gap: 8, background: highlightedOrderIds?.has((orderDetail.data as OrderListItem).id) ? "#eff6ff" : undefined, padding: highlightedOrderIds?.has((orderDetail.data as OrderListItem).id) ? 8 : 0, borderRadius: 6 }}>
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 4, fontSize: 14 }}>
              <strong>Order ID</strong><span style={{ fontFamily: "monospace" }}>{(orderDetail.data as OrderListItem).id}</span>
              <strong>Status</strong><span>{normalizeStatus((orderDetail.data as OrderListItem).status)}</span>
              {"total" in (orderDetail.data as object) && <><strong>Total</strong><span>{String((orderDetail.data as { total?: unknown }).total)}</span></>}
              {"timestamp" in (orderDetail.data as object) && <><strong>Timestamp</strong><span>{String((orderDetail.data as { timestamp?: unknown }).timestamp)}</span></>}
              {"last_updated" in (orderDetail.data as object) && <><strong>Last updated</strong><span>{String((orderDetail.data as { last_updated?: unknown }).last_updated)}</span></>}
            </div>

            <div>
              <strong>Items</strong>
              {Array.isArray((orderDetail.data as { items?: unknown }).items) && (orderDetail.data as { items: OrderDetailItem[] }).items.length > 0 ? (
                <div style={{ overflowX: "auto", marginTop: 4 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                        <th style={{ padding: "6px" }}>Book</th>
                        <th style={{ padding: "6px" }}>Book ID</th>
                        <th style={{ padding: "6px" }}>Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(orderDetail.data as { items: OrderDetailItem[] }).items.map((it, idx) => {
                        const bid = it.book_id ?? "";
                        const b = bookById.get(bid);
                        return (
                          <tr key={`${bid}-${idx}`} style={{ borderBottom: "1px solid #f3f4f6" }}>
                            <td style={{ padding: "6px" }}>{b?.title ?? (bid ? "(unknown title)" : "-")}</td>
                            <td style={{ padding: "6px", fontFamily: "monospace", fontSize: 12 }}>{bid || "-"}</td>
                            <td style={{ padding: "6px" }}>{it.quantity ?? "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>No items available in this response.</div>
              )}
            </div>

            <details>
              <summary style={{ cursor: "pointer" }}>Raw JSON response</summary>
              <pre style={{ background: "#f3f4f6", padding: 8, borderRadius: 6, overflowX: "auto", fontSize: 12, marginTop: 8 }}>
                {JSON.stringify(orderDetail.data, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </section>
    </div>
  );
}
