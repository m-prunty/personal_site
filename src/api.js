export const API_BASE = 'https://api.mprunty.com/api/v1';

export const api = {
  // Books
  createBook: (book) =>
    fetch(`${API_BASE}/books/`, {
      method: 'POST',
      body: new URLSearchParams(book),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  updateStock: (bookId, quantity) =>
    fetch(`${API_BASE}/books/${bookId}/stock/`, {
      method: 'POST',
      body: new URLSearchParams({ quantity }),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  getBook: (id) => fetch(`${API_BASE}/books/${id}`).then(r => r.json()),
  listBooks: () => fetch(`${API_BASE}/books/`).then(r => r.json()),

  // Orders
  createOrder: (items) =>
    fetch(`${API_BASE}/orders/`, {
      method: 'POST',
      body: JSON.stringify({ items }),
      headers: { 'Content-Type': 'application/json' },
    }),
  changeStatus: (orderId, status) =>
    fetch(`${API_BASE}/orders/${orderId}/status/`, {
      method: 'POST',
      body: new URLSearchParams({ status }),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  getOrder: (id) => fetch(`${API_BASE}/orders/${id}`).then(r => r.json()),
  listOrders: () => fetch(`${API_BASE}/orders/`).then(r => r.json()),
};
