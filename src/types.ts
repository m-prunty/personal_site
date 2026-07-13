export interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  stock: number;
}

export type NewBook = Omit<Book, "id">;

export interface OrderItem {
  book_id: string;
  quantity: number;
}

export const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface Order {
  id: string;
  status: OrderStatus;
  items: OrderItem[];
}

export type NotificationKind =
  "order_confirmation" | "stock_alert" | "status_update";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  message: string;
}
