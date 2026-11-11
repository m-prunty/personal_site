import Books from "../components/Books";
import Orders from "../components/Orders";

import { useNotifications } from "../hooks/useNotifications";
import NotificationToast from "../components/NotificationToast";
import ApiHookInspector from "../components/ApiHookInspector";

export default function ShippyBooks() {
  const { notifications, dismiss } = useNotifications();
  return (
    <div className="BooksApp">
      <div
        className="app-header"
        style={{ padding: "20px", backgroundColor: "#f5f5f5" }}
      >
        <h1>ShippyBooks</h1>
        <p style={{ margin: "4px 0 0", color: "#4b5563" }}>
          API hooks showcase (Stage 0): live hook activity, request/response visibility, and in-UI details.
        </p>
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
        <ApiHookInspector />
        <Books />
        <hr style={{ margin: "20px 0" }} />
        <Orders />
      </div>
    </div>
  );
}
