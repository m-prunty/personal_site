export const API_BASE = import.meta.env.VITE_API_BASE;



const post = (path, body) =>
  fetch(`${API_BASE}${path}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });

export const api = {
  createBook: (book)                => post('/books/',                    book),
  updateStock: (bookId, quantity)   => post(`/books/${bookId}/stock/`,    { quantity }),
  changeStatus: (orderId, status)   => post(`/orders/${orderId}/status/`, { status }),
  createOrder: (items)              => post('/orders/',                   { items} ),

  getBook:    (id) => fetch(`${API_BASE}/books/${id}`).then(r => r.json()),
  listBooks:  ()   => fetch(`${API_BASE}/books/`).then(r => r.json()),
  getOrder:   (id) => fetch(`${API_BASE}/orders/${id}`).then(r => r.json()),
  listOrders: ()   => fetch(`${API_BASE}/orders/`).then(r => r.json()),
};
/*
 * export const api = {
  // Books
  createBook: (book) =>
    fetch(`${API_BASE}/books/`, {
      method: 'POST',
      body: JSON.stringify({book}),
      headers: { 'Content-Type': 'application/json' },
    }),
  updateStock: (bookId, quantity) =>
    fetch(`${API_BASE}/books/${bookId}/stock/`, {
      method: 'POST',
      body: new URLSearchParams({ quantity }),
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
    }),
  getOrder: (id) => fetch(`${API_BASE}/orders/${id}`).then(r => r.json()),
  listOrders: () => fetch(`${API_BASE}/orders/`).then(r => r.json()),
};
*/
