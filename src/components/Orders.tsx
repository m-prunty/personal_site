import React, { useEffect, useState } from "react";
import { api } from "../api";
import { ORDER_STATUSES } from "../types";
import type { Order, OrderItem, OrderStatus } from "../types";

interface ItemFormState {
  bookId: string;
  qty: string;
}

interface StatusUpdateState {
  orderId: string;
  status: OrderStatus | "";
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [itemForm, setItemForm] = useState<ItemFormState>({
    bookId: "",
    qty: "",
  });
  const [statusUpdate, setStatusUpdate] = useState<StatusUpdateState>({
    orderId: "",
    status: "",
  });

  useEffect(() => {
    api.listOrders().then(setOrders);
  }, []);

  const handleAddItem = (e: React.FormEvent<HTMLFormElement>) => {
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

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await api.createOrder(orderItems);
    setOrders(await api.listOrders());
    setOrderItems([]);
  };

  const handleStatus = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!statusUpdate.status) {
      return;
    }
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setItemForm({ ...itemForm, bookId: e.target.value })
          }
          required
        />
        <input
          type="number"
          placeholder="Qty"
          value={itemForm.qty}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setItemForm({ ...itemForm, qty: e.target.value })
          }
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setStatusUpdate({ ...statusUpdate, orderId: e.target.value })
          }
          required
        />
        <select
          value={statusUpdate.status}
          onChange={(e) =>
            setStatusUpdate({
              ...statusUpdate,
              status: e.target.value as OrderStatus,
            })
          }
          required
        >
          <option value="" disabled>
            Select a status
          </option>
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>{" "}
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
