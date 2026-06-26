import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState('');
  const [statusUpdate, setStatusUpdate] = useState({ orderId: '', status: '' });

  useEffect(() => { api.listOrders().then(setOrders); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.createOrder(JSON.parse(items));
    setOrders(await api.listOrders());
    setItems('');
  };

  const handleStatus = async (e) => {
    e.preventDefault();
    await api.changeStatus(statusUpdate.orderId, statusUpdate.status);
    setOrders(await api.listOrders());
    setStatusUpdate({ orderId: '', status: '' });
  };

  return (
    <div>
      <h2>Orders</h2>

      <form onSubmit={handleCreate}>
        <input placeholder='Items: [["bookId", qty]]' value={items} onChange={(e) => setItems(e.target.value)} required />
        <button>Create</button>
      </form>

      <form onSubmit={handleStatus}>
        <input placeholder="Order ID" value={statusUpdate.orderId} onChange={(e) => setStatusUpdate({...statusUpdate, orderId: e.target.value})} required />
        <input placeholder="Status" value={statusUpdate.status} onChange={(e) => setStatusUpdate({...statusUpdate, status: e.target.value})} required />
        <button>Change Status</button>
      </form>

      <ul>
        {orders.map((o) => (
          <li key={o.id}>
            Order {o.id} - {o.status} <button onClick={() => api.getOrder(o.id).then(console.log)}>Details</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
