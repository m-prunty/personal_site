import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api";
import type { AppNotification, Book } from "../types";
import { useAsync } from "../hooks/useAsync";
import "../styles/Books.css";

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
      const safe = Array.isArray(data)
        ? (data as unknown[]).filter((b): b is BookListItem => !!b && typeof b === "object" && "id" in b && typeof (b as { id?: unknown }).id === "string")
        : [];
      setBooks(safe);
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
    <div className="showcase-grid" aria-label="Books showcase">
      <div className="showcase-row">
        <h2 style={{ margin: 0 }}>Books</h2>
        <button onClick={() => void refreshBooks()} disabled={listStatus === "loading"}>
          {listStatus === "loading" ? "Refreshing..." : "Refresh (api.listBooks)"}
        </button>
      </div>
      <p className="muted" style={{ margin: 0 }}>
        Showcasing hooks: <code>createBook</code>, <code>updateStock</code>, <code>getBook</code>, <code>listBooks</code>
      </p>

      <section className="showcase-section" aria-labelledby="create-book-heading">
        <h3 id="create-book-heading">Create Book (api.createBook)</h3>
        <form onSubmit={handleCreate} className="showcase-form">
          <label>Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
          <label>Author<input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} required /></label>
          <label>Price<input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></label>
          <label>Initial stock<input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required /></label>
          <div className="showcase-row" aria-live="polite">
            <button type="submit" disabled={createStatus === "loading"}>
              {createStatus === "loading" ? "Creating..." : "Create Book"}
            </button>
            {createStatus === "success" && <span className="success">Created successfully{createdId ? ` (id: ${createdId})` : ""}.</span>}
            {createStatus === "error" && <span className="error">{createError}</span>}
          </div>
        </form>
      </section>

      <section className="showcase-section" aria-labelledby="update-stock-heading">
        <h3 id="update-stock-heading">Update Stock (api.updateStock, delta)</h3>
        <form onSubmit={handleStock} className="showcase-form">
          <label>
            Book
            <select value={stockUpdate.bookId} onChange={(e) => setStockUpdate({ ...stockUpdate, bookId: e.target.value })} required>
              <option value="" disabled>Select a book</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title ?? "(untitled)"} — {b.id} (stock: {b.stock ?? "?"})
                </option>
              ))}
            </select>
          </label>
          <label>
            Stock delta (signed integer; backend applies <code>stock += quantity</code>)
            <input type="number" step="1" placeholder="e.g. 5 or -2" value={stockUpdate.delta} onChange={(e) => setStockUpdate({ ...stockUpdate, delta: e.target.value })} required />
          </label>
          {selectedStockBook && typeof selectedStockBook.stock === "number" && stockUpdate.delta && Number.isFinite(Number(stockUpdate.delta)) && (
            <div className="info">Preview: {selectedStockBook.stock} + ({Number(stockUpdate.delta)}) = {selectedStockBook.stock + Number(stockUpdate.delta)}</div>
          )}
          <div className="showcase-row" aria-live="polite">
            <button type="submit" disabled={stockStatus === "loading"}>
              {stockStatus === "loading" ? "Updating..." : "Apply Stock Delta"}
            </button>
            {stockStatus === "success" && (
              <span className="success">Stock updated{stockBeforeAfter ? ` (${stockBeforeAfter.before} → ${stockBeforeAfter.after}, delta ${stockBeforeAfter.delta})` : ""}.</span>
            )}
            {stockStatus === "error" && <span className="error">{stockError}</span>}
          </div>
        </form>
      </section>

      <section className="showcase-section" aria-labelledby="book-list-heading">
        <h3 id="book-list-heading">Book List (api.listBooks)</h3>
        {listStatus === "loading" && (
          <div className="showcase-stack" aria-label="Loading books">
            <div className="skeleton" style={{ width: "60%" }} />
            <div className="skeleton" style={{ width: "80%" }} />
            <div className="skeleton" style={{ width: "70%" }} />
          </div>
        )}
        {listStatus === "error" && (
          <div className="error">Failed to load books: {listError} <button onClick={() => void refreshBooks()}>Retry</button></div>
        )}
        {listStatus !== "loading" && books.length === 0 && listStatus !== "error" && (
          <div className="muted">No books found. Create one to populate the list.</div>
        )}
        {books.length > 0 && (
          <div className="table-wrap">
            <table className="data-table" aria-label="Books list">
              <thead>
                <tr><th>ID</th><th>Title</th><th>Stock</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {books.map((b) => {
                  const highlighted = !!highlightedBookIds?.has(b.id);
                  return (
                    <tr key={b.id} className={highlighted ? "highlight-book" : undefined}>
                      <td className="mono">{b.id} {highlighted ? <span title="Related to recent notification">●</span> : null}</td>
                      <td>{b.title ?? "(unknown)"}</td>
                      <td>{typeof b.stock === "number" ? b.stock : "?"}</td>
                      <td><button onClick={() => bookDetail.run(api.getBook, b.id)}>Details (api.getBook)</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="showcase-section" aria-labelledby="book-details-heading">
        <h3 id="book-details-heading">Book Details Panel (api.getBook)</h3>
        {bookDetail.status === "idle" && <div className="muted">Select “Details” on a book to fetch and inspect full response fields.</div>}
        {bookDetail.status === "loading" && <div className="showcase-stack"><div className="skeleton" style={{ width: "50%" }} /><div className="skeleton" style={{ width: "90%" }} /></div>}
        {bookDetail.status === "error" && <div className="error">Error: {bookDetail.error}</div>}
        {bookDetail.status === "success" && bookDetail.data && (
          <div className={`showcase-stack ${highlightedBookIds?.has(bookDetail.data.id) ? "highlight-book" : ""}`} style={{ padding: highlightedBookIds?.has(bookDetail.data.id) ? 8 : 0, borderRadius: 6 }}>
            <div className="kv-grid">
              <strong>ID</strong><span className="mono">{bookDetail.data.id}</span>
              <strong>Title</strong><span>{bookDetail.data.title ?? "(unknown)"}</span>
              <strong>Author</strong><span>{bookDetail.data.author ?? "(unknown)"}</span>
              <strong>Price</strong><span>{bookDetail.data.price ?? "(unknown)"}</span>
              <strong>Stock</strong><span>{bookDetail.data.stock ?? "(unknown)"}</span>
            </div>
            <details>
              <summary style={{ cursor: "pointer" }}>Raw JSON response</summary>
              <pre className="pre">{JSON.stringify(bookDetail.data, null, 2)}</pre>
            </details>
          </div>
        )}
      </section>
    </div>
  );
}
