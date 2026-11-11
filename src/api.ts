import type { Book, NewBook, Order, OrderItem, OrderStatus } from "./types";
import { addApiActivity, updateApiActivity } from "./apiActivity";

export const API_BASE: string = import.meta.env.VITE_API_BASE;

async function track<T>(
  hook: string,
  endpoint: string,
  method: string,
  request: unknown,
  fn: () => Promise<T>,
  summarize?: (value: T) => unknown,
): Promise<T> {
  const id = addApiActivity({ hook, endpoint, method, request });
  const start = performance.now();
  try {
    const result = await fn();
    let response: unknown = summarize ? summarize(result) : result;
    if (result instanceof Response) {
      try {
        const clone = result.clone();
        const ct = clone.headers.get("content-type") || "";
        response = ct.includes("application/json")
          ? await clone.json()
          : await clone.text();
      } catch {
        response = { ok: result.ok, status: result.status };
      }
    }
    updateApiActivity(id, {
      status: "success",
      durationMs: Math.round(performance.now() - start),
      response,
    });
    return result;
  } catch (err) {
    updateApiActivity(id, {
      status: "error",
      durationMs: Math.round(performance.now() - start),
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

const post = (path: string, body: unknown): Promise<Response> =>
  fetch(`${API_BASE}${path}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      detail = "";
    }
    throw new Error(`GET ${path} failed (${res.status})${detail ? `: ${detail}` : ""}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  createBook: (book: NewBook): Promise<Response> =>
    track("api.createBook", "/books/", "POST", book, () => post("/books/", book)),
  updateStock: (bookId: string, quantity: number): Promise<Response> =>
    track(
      "api.updateStock",
      `/books/${bookId}/stock/`,
      "POST",
      { bookId, quantity },
      () => post(`/books/${bookId}/stock/`, { quantity }),
    ),
  changeStatus: (orderId: string, status: OrderStatus): Promise<Response> =>
    track(
      "api.changeStatus",
      `/orders/${orderId}/status/`,
      "POST",
      { orderId, status },
      () => post(`/orders/${orderId}/status/`, { status }),
    ),
  createOrder: (items: OrderItem[]): Promise<Response> =>
    track("api.createOrder", "/orders/", "POST", { items }, () =>
      post("/orders/", { items }),
    ),

  getBook: (id: string): Promise<Book> =>
    track("api.getBook", `/books/${id}`, "GET", { id }, () =>
      getJson<Book>(`/books/${id}`),
    ),
  listBooks: (): Promise<Book[]> =>
    track("api.listBooks", "/books/", "GET", undefined, () =>
      getJson<Book[]>("/books/"),
    ),
  getOrder: (id: string): Promise<Order> =>
    track("api.getOrder", `/orders/${id}`, "GET", { id }, () =>
      getJson<Order>(`/orders/${id}`),
    ),
  listOrders: (): Promise<Order[]> =>
    track("api.listOrders", "/orders/", "GET", undefined, () =>
      getJson<Order[]>("/orders/"),
    ),
};
