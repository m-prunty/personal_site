import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]); // [[bookId, qty], ...]
  const [itemForm, setItemForm] = useState({ bookId: "", qty: "" });
  const [statusUpdate, setStatusUpdate] = useState({ orderId: "", status: "" });

  useEffect(() => {
    api.listOrders().then(setOrders);
  }, []);

  const handleAddItem = (e) => {
    e.preventDefault();

    setOrderItems([
      ...orderItems,
      {
        book_id: itemForm.bookId,
        quantity: parseInt(itemForm.qty, 10),
      },
    ]);

    setItemForm({ bookId: "", qty: "" });
  };

  const handleRemoveItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.createOrder(orderItems);
    setOrders(await api.listOrders());
    setOrderItems([]);
  };

  const handleStatus = async (e) => {
    e.preventDefault();
    await api.changeStatus(statusUpdate.orderId, statusUpdate.status);
    setOrders(await api.listOrders());
    setStatusUpdate({ orderId: "", status: "" });
  };

  return (
    <div>
      <h2>Orders</h2>

      <form onSubmit={handleAddItem}>
        <input
          placeholder="Book ID"
          value={itemForm.bookId}
          onChange={(e) => setItemForm({ ...itemForm, bookId: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Qty"
          value={itemForm.qty}
          onChange={(e) => setItemForm({ ...itemForm, qty: e.target.value })}
          required
        />
        <button>Add Item</button>
      </form>

      {orderItems.length > 0 && (
        <>
          <ul>
            {orderItems.map((item, i) => (
              <li key={i}>
                {item.book_id} × {item.quantity}
                <button onClick={() => handleRemoveItem(i)}>Remove</button>
              </li>
            ))}
          </ul>
          <form onSubmit={handleCreate}>
            <button>Create Order</button>
          </form>
        </>
      )}

      <form onSubmit={handleStatus}>
        <input
          placeholder="Order ID"
          value={statusUpdate.orderId}
          onChange={(e) =>
            setStatusUpdate({ ...statusUpdate, orderId: e.target.value })
          }
          required
        />
        <input
          placeholder="Status"
          value={statusUpdate.status}
          onChange={(e) =>
            setStatusUpdate({ ...statusUpdate, status: e.target.value })
          }
          required
        />
        <button>Change Status</button>
      </form>

      <ul>
        {orders.map((o) => (
          <li key={o.id}>
            Order {o.id} - {o.status}{" "}
            <button onClick={() => api.getOrder(o.id).then(console.log)}>
              Details
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
