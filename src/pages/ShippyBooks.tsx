import Books from "../components/Books";
import Orders from "../components/Orders";

import { useNotifications } from "../hooks/useNotifications";
import NotificationToast from "../components/NotificationToast";

export default function ShippyBooks() {
  const { notifications, dismiss } = useNotifications();
  return (
    <div className="BooksApp">
      <div
        className="app-header"
        style={{ padding: "20px", backgroundColor: "#f5f5f5" }}
      >
        <h1>ShippyBooks</h1>
      </div>
      <div
        className="app"
        style={{
          padding: "20px",
          position: "relative",
          minHeight: "100vh",
          backgroundColor: "#ffffff",
        }}
      >
        <NotificationToast notifications={notifications} onDismiss={dismiss} />
        <Books />
        <hr style={{ margin: "20px 0" }} />
        <Orders />
      </div>
    </div>
  );
}
