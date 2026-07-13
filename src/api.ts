import type { Book, NewBook, Order, OrderItem, OrderStatus } from "./types";

export const API_BASE: string = import.meta.env.VITE_API_BASE;

const post = (path: string, body: unknown): Promise<Response> =>
  fetch(`${API_BASE}${path}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

export const api = {
  createBook: (book: NewBook): Promise<Response> => post("/books/", book),
  updateStock: (bookId: string, quantity: number): Promise<Response> =>
    post(`/books/${bookId}/stock/`, { quantity }),
  changeStatus: (orderId: string, status: OrderStatus): Promise<Response> =>
    post(`/orders/${orderId}/status/`, { status }),
  createOrder: (items: OrderItem[]): Promise<Response> =>
    post("/orders/", { items }),

  getBook: (id: string): Promise<Book> =>
    fetch(`${API_BASE}/books/${id}`).then((r) => r.json()),
  listBooks: (): Promise<Book[]> =>
    fetch(`${API_BASE}/books/`).then((r) => r.json()),
  getOrder: (id: string): Promise<Order> =>
    fetch(`${API_BASE}/orders/${id}`).then((r) => r.json()),
  listOrders: (): Promise<Order[]> =>
    fetch(`${API_BASE}/orders/`).then((r) => r.json()),
};
