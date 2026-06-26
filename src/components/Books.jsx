import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Books() {
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState({ title: '', author: '', price: '', stock: '' });
  const [stockUpdate, setStockUpdate] = useState({ bookId: '', quantity: '' });

  useEffect(() => { api.listBooks().then(setBooks); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.createBook(form);
    setBooks(await api.listBooks());
    setForm({ title: '', author: '', price: '', stock: '' });
  };

  const handleStock = async (e) => {
    e.preventDefault();
    await api.updateStock(stockUpdate.bookId, stockUpdate.quantity);
    setBooks(await api.listBooks());
    setStockUpdate({ bookId: '', quantity: '' });
  };

  return (
    <div>
      <h2>Books</h2>

      <form onSubmit={handleCreate}>
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} required />
        <input placeholder="Author" value={form.author} onChange={(e) => setForm({...form, author: e.target.value})} required />
        <input type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} required />
        <input type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({...form, stock: e.target.value})} required />
        <button>Create</button>
      </form>

      <form onSubmit={handleStock}>
        <input placeholder="Book ID" value={stockUpdate.bookId} onChange={(e) => setStockUpdate({...stockUpdate, bookId: e.target.value})} required />
        <input type="number" placeholder="Quantity" value={stockUpdate.quantity} onChange={(e) => setStockUpdate({...stockUpdate, quantity: e.target.value})} required />
        <button>Update Stock</button>
      </form>

      <ul>
        {books.map((b) => (
          <li key={b.id}>
            {b.title} (Stock: {b.stock}) <button onClick={() => api.getBook(b.id).then(console.log)}>Details</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
