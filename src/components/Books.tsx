import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api";
import type { AppNotification, Book } from "../types";
import { useAsync } from "../hooks/useAsync";

type BookListItem = Partial<Book> & { id: string; title?: string; stock?: number };

interface BookFormState {
  title: string;
  author: string;
  price: string;
  stock: string;
}

interface StockUpdateState {
  bookId: string;
  delta: string;
}

const emptyForm: BookFormState = {
  title: "Neuromancer",
  author: "William Gibson",
  price: "10.99",
  stock: "5",
};

const emptyStockUpdate: StockUpdateState = { bookId: "", delta: "" };

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

export default function Books({
  notifications = [],
  highlightedBookIds,
}: {
  notifications?: AppNotification[];
  highlightedBookIds?: Set<string>;
}) {
  const [books, setBooks] = useState<BookListItem[]>([]);
  const [listStatus, setListStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [listError, setListError] = useState<string | null>(null);

  const [form, setForm] = useState<BookFormState>(emptyForm);
  const [createStatus, setCreateStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const [stockUpdate, setStockUpdate] = useState<StockUpdateState>(emptyStockUpdate);
  const [stockStatus, setStockStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [stockError, setStockError] = useState<string | null>(null);
  const [stockBeforeAfter, setStockBeforeAfter] = useState<{ before: number; delta: number; after: number } | null>(null);

  const bookDetail = useAsync<Book, [string]>();
  const handledNotifIdsRef = useRef<Set<string>>(new Set());

  const refreshBooks = useCallback(async () => {
    setListStatus("loading");
    setListError(null);
    try {
      const data = await api.listBooks();
      setBooks(data as BookListItem[]);
      setListStatus("success");
    } catch (err) {
      setListError(err instanceof Error ? err.message : String(err));
      setListStatus("error");
    }
  }, []);

  useEffect(() => {
    void refreshBooks();
  }, [refreshBooks]);

  useEffect(() => {
    const relevant = notifications.filter(
      (n) =>
        (n.kind === "stock_alert" || n.kind === "order_confirmation" || n.kind === "status_update") &&
        !handledNotifIdsRef.current.has(n.id),
    );
    if (relevant.length === 0) return;
    relevant.forEach((n) => handledNotifIdsRef.current.add(n.id));
    void refreshBooks();
    if (bookDetail.status === "success" && bookDetail.data?.id) {
      void bookDetail.run(api.getBook, bookDetail.data.id);
    }
  }, [notifications, refreshBooks, bookDetail]);

  const selectedStockBook = useMemo(
    () => books.find((b) => b.id === stockUpdate.bookId),
    [books, stockUpdate.bookId],
  );

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreateStatus("loading");
    setCreateError(null);
    setCreatedId(null);
    try {
      const price = Number(form.price);
      const stock = Number(form.stock);
      if (!Number.isFinite(price) || !Number.isFinite(stock)) {
        throw new Error("Price and stock must be valid numbers.");
      }
      const res = await api.createBook({
        title: form.title,
        author: form.author,
        price,
        stock,
      });
      let payload: unknown = undefined;
      try {
        const clone = res.clone();
        payload = await clone.json();
      } catch {
        try {
          payload = await res.clone().text();
        } catch {
          payload = undefined;
        }
      }
      const id = parseResponseId(payload);
      if (!res.ok) {
        throw new Error(`Create failed (${res.status})${id ? ` [id: ${id}]` : ""}`);
      }
      setCreatedId(id ?? null);
      setCreateStatus("success");
      await refreshBooks();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : String(err));
      setCreateStatus("error");
    }
  };

  const handleStock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStockStatus("loading");
    setStockError(null);
    setStockBeforeAfter(null);
    try {
      const delta = Number(stockUpdate.delta);
      if (!stockUpdate.bookId) throw new Error("Select a book to update.");
      if (!Number.isFinite(delta) || !Number.isInteger(delta) || delta === 0) {
        throw new Error("Enter a non-zero integer delta (e.g. +5 or -2).");
      }
      const before = typeof selectedStockBook?.stock === "number" ? selectedStockBook.stock : undefined;
      const res = await api.updateStock(stockUpdate.bookId, delta);
      if (!res.ok) {
        let detail = "";
        try {
          detail = await res.text();
        } catch {
          detail = "";
        }
        throw new Error(`Stock update failed (${res.status})${detail ? `: ${detail}` : ""}`);
      }
      if (typeof before === "number") {
        setStockBeforeAfter({ before, delta, after: before + delta });
      }
      setStockStatus("success");
      await refreshBooks();
    } catch (err) {
      setStockError(err instanceof Error ? err.message : String(err));
      setStockStatus("error");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>Books</h2>
        <button onClick={() => void refreshBooks()} disabled={listStatus === "loading"}>
          {listStatus === "loading" ? "Refreshing..." : "Refresh (api.listBooks)"}
        </button>
      </div>
      <p style={{ margin: "4px 0 0", color: "#4b5563", fontSize: 13 }}>
        Showcasing hooks: <code>createBook</code>, <code>updateStock</code>, <code>getBook</code>, <code>listBooks</code>
      </p>

      <section style={sectionStyle}>
        <h3 style={{ marginTop: 0 }}>Create Book (api.createBook)</h3>
        <form onSubmit={handleCreate} style={{ display: "grid", gap: 8, maxWidth: 520 }}>
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <input
            placeholder="Author"
            value={form.author}
            onChange={(e) => setForm({ ...form, author: e.target.value })}
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Initial stock"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            required
          />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button type="submit" disabled={createStatus === "loading"}>
              {createStatus === "loading" ? "Creating..." : "Create Book"}
            </button>
            {createStatus === "success" && (
              <span style={{ color: "#16a34a", fontSize: 13 }}>
                Created successfully{createdId ? ` (id: ${createdId})` : ""}.
              </span>
            )}
            {createStatus === "error" && (
              <span style={{ color: "#dc2626", fontSize: 13 }}>{createError}</span>
            )}
          </div>
        </form>
      </section>

      <section style={sectionStyle}>
        <h3 style={{ marginTop: 0 }}>Update Stock (api.updateStock, delta)</h3>
        <form onSubmit={handleStock} style={{ display: "grid", gap: 8, maxWidth: 520 }}>
          <select
            value={stockUpdate.bookId}
            onChange={(e) => setStockUpdate({ ...stockUpdate, bookId: e.target.value })}
            required
          >
            <option value="" disabled>
              Select a book
            </option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title ?? "(untitled)"} — {b.id} (stock: {b.stock ?? "?"})
              </option>
            ))}
          </select>
          <label style={{ fontSize: 13, color: "#374151" }}>
            Stock delta (signed integer; backend applies <code>stock += quantity</code>)
          </label>
          <input
            type="number"
            step="1"
            placeholder="e.g. 5 or -2"
            value={stockUpdate.delta}
            onChange={(e) => setStockUpdate({ ...stockUpdate, delta: e.target.value })}
            required
          />
          {selectedStockBook && typeof selectedStockBook.stock === "number" && stockUpdate.delta && Number.isFinite(Number(stockUpdate.delta)) && (
            <div style={{ fontSize: 13, color: "#374151" }}>
              Preview: {selectedStockBook.stock} + ({Number(stockUpdate.delta)}) = {selectedStockBook.stock + Number(stockUpdate.delta)}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button type="submit" disabled={stockStatus === "loading"}>
              {stockStatus === "loading" ? "Updating..." : "Apply Stock Delta"}
            </button>
            {stockStatus === "success" && (
              <span style={{ color: "#16a34a", fontSize: 13 }}>
                Stock updated
                {stockBeforeAfter ? ` (${stockBeforeAfter.before} → ${stockBeforeAfter.after}, delta ${stockBeforeAfter.delta})` : ""}.
              </span>
            )}
            {stockStatus === "error" && (
              <span style={{ color: "#dc2626", fontSize: 13 }}>{stockError}</span>
            )}
          </div>
        </form>
      </section>

      <section style={sectionStyle}>
        <h3 style={{ marginTop: 0 }}>Book List (api.listBooks)</h3>
        {listStatus === "loading" && <div>Loading books…</div>}
        {listStatus === "error" && (
          <div style={{ color: "#dc2626" }}>
            Failed to load books: {listError}{" "}
            <button onClick={() => void refreshBooks()}>Retry</button>
          </div>
        )}
        {listStatus !== "loading" && books.length === 0 && listStatus !== "error" && (
          <div style={{ color: "#6b7280" }}>No books found. Create one to populate the list.</div>
        )}
        {books.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "8px 6px" }}>ID</th>
                  <th style={{ padding: "8px 6px" }}>Title</th>
                  <th style={{ padding: "8px 6px" }}>Stock</th>
                  <th style={{ padding: "8px 6px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((b) => {
                  const highlighted = highlightedBookIds?.has(b.id);
                  return (
                    <tr
                      key={b.id}
                      style={{
                        borderBottom: "1px solid #f3f4f6",
                        background: highlighted ? "#fff7ed" : undefined,
                      }}
                    >
                      <td style={{ padding: "8px 6px", fontFamily: "monospace", fontSize: 12 }}>
                        {b.id} {highlighted ? <span title="Related to recent notification">●</span> : null}
                      </td>
                      <td style={{ padding: "8px 6px" }}>{b.title ?? "(unknown)"}</td>
                      <td style={{ padding: "8px 6px" }}>{b.stock ?? "?"}</td>
                      <td style={{ padding: "8px 6px" }}>
                        <button onClick={() => bookDetail.run(api.getBook, b.id)}>
                          Details (api.getBook)
                        </button>
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
        <h3 style={{ marginTop: 0 }}>Book Details Panel (api.getBook)</h3>
        {bookDetail.status === "idle" && (
          <div style={{ color: "#6b7280", fontSize: 13 }}>
            Select “Details” on a book to fetch and inspect full response fields.
          </div>
        )}
        {bookDetail.status === "loading" && <div>Loading book details…</div>}
        {bookDetail.status === "error" && (
          <div style={{ color: "#dc2626" }}>Error: {bookDetail.error}</div>
        )}
        {bookDetail.status === "success" && bookDetail.data && (
          <div style={{ display: "grid", gap: 8, background: highlightedBookIds?.has(bookDetail.data.id) ? "#fff7ed" : undefined, padding: highlightedBookIds?.has(bookDetail.data.id) ? 8 : 0, borderRadius: 6 }}>
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 4, fontSize: 14 }}>
              <strong>ID</strong><span style={{ fontFamily: "monospace" }}>{bookDetail.data.id}</span>
              <strong>Title</strong><span>{bookDetail.data.title}</span>
              <strong>Author</strong><span>{bookDetail.data.author}</span>
              <strong>Price</strong><span>{bookDetail.data.price}</span>
              <strong>Stock</strong><span>{bookDetail.data.stock}</span>
            </div>
            <details>
              <summary style={{ cursor: "pointer" }}>Raw JSON response</summary>
              <pre
                style={{
                  background: "#f3f4f6",
                  padding: 8,
                  borderRadius: 6,
                  overflowX: "auto",
                  fontSize: 12,
                  marginTop: 8,
                }}
              >
                {JSON.stringify(bookDetail.data, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </section>
    </div>
  );
}
