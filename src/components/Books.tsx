import React, { useEffect, useState } from "react";
import { api } from "../api";
import type { Book } from "../types";

interface BookFormState {
  title: string;
  author: string;
  price: string;
  stock: string;
}

interface StockUpdateState {
  bookId: string;
  quantity: string;
}

const emptyForm: BookFormState = {
  title: "Neuromancer",
  author: "William Gibson",
  price: "10.99",
  stock: "5",
};
const emptyStockUpdate: StockUpdateState = { bookId: "", quantity: "" };

export default function Books() {
  const [books, setBooks] = useState<Book[]>([]);
  const [form, setForm] = useState<BookFormState>(emptyForm);
  const [stockUpdate, setStockUpdate] =
    useState<StockUpdateState>(emptyStockUpdate);

  useEffect(() => {
    api.listBooks().then(setBooks);
  }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await api.createBook({
      title: form.title,
      author: form.author,
      price: parseFloat(form.price),
      stock: parseInt(form.stock, 10),
    });
    setBooks(await api.listBooks());
    setForm(emptyForm);
  };

  const handleStock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await api.updateStock(
      stockUpdate.bookId,
      parseInt(stockUpdate.quantity, 10),
    );
    setBooks(await api.listBooks());
    setStockUpdate(emptyStockUpdate);
  };

  return (
    <div>
      <h2>Books</h2>

      <form onSubmit={handleCreate}>
        <input
          placeholder="Title"
          value={form.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setForm({ ...form, title: e.target.value })
          }
          required
        />
        <input
          placeholder="Author"
          value={form.author}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setForm({ ...form, author: e.target.value })
          }
          required
        />
        <input
          type="number"
          placeholder="Price"
          value={form.price}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setForm({ ...form, price: e.target.value })
          }
          required
        />
        <input
          type="number"
          placeholder="Stock"
          value={form.stock}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setForm({ ...form, stock: e.target.value })
          }
          required
        />
        <button>Create</button>
      </form>

      <form onSubmit={handleStock}>
        <input
          placeholder="Book ID"
          value={stockUpdate.bookId}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setStockUpdate({ ...stockUpdate, bookId: e.target.value })
          }
          required
        />
        <input
          type="number"
          placeholder="Quantity"
          value={stockUpdate.quantity}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setStockUpdate({ ...stockUpdate, quantity: e.target.value })
          }
          required
        />
        <button>Update Stock</button>
      </form>

      <ul>
        {books.map((b) => (
          <li key={b.id}>
            {b.title} (Stock: {b.stock}){" "}
            <button onClick={() => api.getBook(b.id).then(console.log)}>
              Details
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
