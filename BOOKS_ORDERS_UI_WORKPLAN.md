# Books & Orders UI – Elements and Multi-stage Plan

## Sources reviewed
- Frontend (personal_site): `./project_structure.json`, `src/api.ts`, `src/types.ts`, `src/pages/ShippyBooks.tsx`, `src/components/Books.tsx`, `src/components/Orders.tsx`, `src/hooks/useNotifications.ts`, `src/components/NotificationToast.tsx`, `src/styles/Books.css`
- Backend/API (shippybooks): `../../code/shippybooks/src/shippybooks/project_structre.json`, `src/shippybooks/api/endpoints/books.py`, `src/shippybooks/api/endpoints/orders.py` (and related domain/service/event structure)

> Note: `../../shippybooks/project_structure.json` was not found at that exact path; backend structure was read from `../../code/shippybooks/src/shippybooks/project_structre.json`.

---

## 1) Elements needed to affect the UI for Books and Orders

### A. Frontend entry points and layout
| Element | Location | Role / impact on Books & Orders UI |
|---|---|---|
| `ShippyBooks` page | `src/pages/ShippyBooks.tsx` | Composes the showcase: header, notifications, `<Books />`, separator, `<Orders />`; owns notification hook wiring |
| `Books` component | `src/components/Books.tsx` | All Books UI: list, create form, stock update form, detail action |
| `Orders` component | `src/components/Orders.tsx` | All Orders UI: order item builder, create order, status change, list/detail actions |
| `NotificationToast` | `src/components/NotificationToast.tsx` | Renders realtime API-driven notifications and dismiss actions |
| `useNotifications` hook | `src/hooks/useNotifications.ts` | SSE subscription to `${API_BASE}/notifications/stream`; dedupe/cap/dismiss state |
| Styles | `src/styles/Books.css`, `src/App.css`, inline styles in `ShippyBooks.tsx` | Visual presentation/layout (currently generic/minimal for forms/lists) |

### B. Frontend data/contracts and API hooks (client)
| Element | Location | Role / impact |
|---|---|---|
| `API_BASE` | `src/api.ts` | Base URL for all HTTP calls and SSE stream |
| `api` object | `src/api.ts` | **Primary UI API hooks/client** used by components |
| `api.createBook(book: NewBook)` | `POST /books/` | Create book (Books form) |
| `api.updateStock(bookId, quantity)` | `POST /books/{bookId}/stock/` | Update stock (Books form) |
| `api.changeStatus(orderId, status)` | `POST /orders/{orderId}/status/` | Change order status (Orders form) |
| `api.createOrder(items)` | `POST /orders/` | Create order from selected items |
| `api.getBook(id)` | `GET /books/{id}` | Fetch book details (currently logs to console) |
| `api.listBooks()` | `GET /books/` | Populate books list and order item book selector |
| `api.getOrder(id)` | `GET /orders/{id}` | Fetch order details (currently logs to console) |
| `api.listOrders()` | `GET /orders/` | Populate orders list and status-change selector |

### C. Frontend domain types
| Element | Location | Role / impact |
|---|---|---|
| `Book`, `NewBook` | `src/types.ts` | Book shape for list/create/update flows |
| `OrderItem`, `Order`, `OrderStatus`, `ORDER_STATUSES` | `src/types.ts` | Order composition, display, and status transitions in UI |
| `AppNotification`, `NotificationKind` | `src/types.ts` | Notification rendering/semantics from SSE stream |

### D. Backend/API surface (shippybooks) driving the UI
| Element | Location | Contract / effect |
|---|---|---|
| `POST /books/` (`create_book`) | `api/endpoints/books.py` | Creates book (`id`, `title`, `author`, `price`, `stock`) → `{status,id}` |
| `POST /books/{book_id}/stock/` (`update_stock`) | `api/endpoints/books.py` | Updates stock via body `{quantity}` → `{status}` |
| `GET /books/{book_id}` (`get_book`) | `api/endpoints/books.py` | Returns full `Book` model |
| `GET /books/` (`list_books`) | `api/endpoints/books.py` | Returns list of `{id,title,stock}` (partial shape vs frontend `Book`) |
| `POST /orders/` (`create_order`) | `api/endpoints/orders.py` | Creates order with `items` → `{status,id}` |
| `POST /orders/{order_id}/status/` (`change_status`) | `api/endpoints/orders.py` | Updates status (validates enum) → `{status}` / 400 on invalid |
| `GET /orders/{order_id}` (`get_order`) | `api/endpoints/orders.py` | Returns full `Order` (incl. items, status) |
| `GET /orders/` (`list_orders`) | `api/endpoints/orders.py` | Returns list of `{id,status}` (no items/count/total) |
| `GET /notifications/stream` (+ generator) | `api/endpoints/notifications.py` | SSE stream consumed by `useNotifications` |
| Domain/commands/queries/events | `domain/*`, `services/*`, `events/*` | Backend behavior behind hooks (CQRS + events/notifications) that UI should surface clearly |

### E. Current UI ↔ API hook mapping (as-is)
| User action | UI element | API hook(s) | Current feedback/UX |
|---|---|---|---|
| Load showcase data | `Books`/`Orders` mount | `listBooks`, `listOrders` | Silent fetch, no loading/error states |
| Create book | Books form | `createBook` → `listBooks` | Form resets; no success/error messaging |
| Update stock | Books form | `updateStock` → `listBooks` | No validation/feedback; quantity semantics opaque |
| View book details | “Details” button | `getBook` | Result only in `console.log` (not visible in UI) |
| Build order items | Orders add-item form | (local state; uses loaded books) | Shows raw `book_id × qty`; remove supported |
| Create order | Create Order form | `createOrder` → `listOrders` | No validation for empty stock/empty items edge feedback in UI |
| Change order status | Status form | `changeStatus` → `listOrders` | No success/error messaging |
| View order details | “Details” button | `getOrder` | Result only in `console.log` |
| Realtime updates | Notification toast | `GET /notifications/stream` via `useNotifications` | Toasts shown/dismissible; not correlated to specific actions/entities in UI |

### F. Key gaps/opportunities to address
- **API hook visibility:** calls/results/errors are mostly invisible; UI doesn’t “showcase” request/response lifecycle.
- **State handling:** missing loading, empty, error, and optimistic/pending states per action.
- **Data shape mismatches:** list endpoints return partial objects (`books`: id/title/stock; `orders`: id/status) vs detail endpoints/full types.
- **Details UX:** `getBook/getOrder` output not rendered; no drawers/modals/inspectors.
- **Form UX:** raw IDs/inputs, minimal validation, limited affordances (e.g. select book for stock update, quantity controls).
- **Coupling/refresh:** components fetch independently; mutations trigger ad-hoc refetches (no shared cache/invalidation strategy).
- **Observability/demo value:** no per-hook activity log, timing, payload preview, or status badges to demonstrate CQRS/event flow.

---

## 2) Multi-stage plan to develop a better UI for showcasing the API hooks

### Stage 0 – Baseline & instrumentation (foundation)
**Goal:** Make every API hook observable without changing core behavior yet.
- Add a lightweight **API activity/log layer** around `src/api.ts` (or wrapper) to capture: hook name, endpoint, method, request payload, status, duration, response/error.
- Create a shared UI surface (e.g. `ApiHookInspector`/panel) in `ShippyBooks` to display recent hook calls and outcomes.
- Introduce consistent async state helpers (`idle/loading/success/error`) reusable by Books/Orders.
- Keep existing forms/lists functional while surfacing console-only details in UI.
- **Affected elements:** `src/api.ts`, `src/pages/ShippyBooks.tsx`, `src/components/Books.tsx`, `src/components/Orders.tsx`, (new inspector component/hook).

### Stage 1 – Books UI: make book hooks explicit and user-friendly
**Goal:** Showcase all Books hooks with clear inputs, outputs, and state.
- Replace/augment book list with richer cards/table (id, title, stock, and fetched details where available).
- Improve **Create Book** form: validation, inline errors, submit/loading state, success feedback with created `id`.
- Improve **Update Stock**: select existing book (from `listBooks`) + quantity delta/set control; show before/after when possible.
- Add **Book details panel** using `getBook(id)` (render response schema/fields instead of console logging).
- Add explicit “Refresh (`listBooks`)” action and empty/loading/error states.
- **Hooks showcased:** `createBook`, `updateStock`, `getBook`, `listBooks`.

### Stage 2 – Orders UI: end-to-end order flow visibility
**Goal:** Showcase order composition, creation, status transitions, and inspection.
- Build a clearer **order builder**: pick book, qty, line preview (title/available stock context), running item summary.
- On **Create Order**: show request payload preview, pending/success/error, created order id, and refresh.
- Improve **Change Status**: guided selector (order + allowed statuses), display transition feedback and errors (incl. invalid status handling).
- Add **Order details panel** using `getOrder(id)` to render items/status/full payload.
- Enhance list to derive display labels (map ids to known books) and handle partial list data gracefully.
- **Hooks showcased:** `createOrder`, `changeStatus`, `getOrder`, `listOrders` (and `listBooks` as dependency).

### Stage 3 – Realtime/event integration and cross-hook coherence
**Goal:** Connect mutations, notifications, and data refresh into a cohesive demo.
- Correlate `useNotifications` SSE events with recent hook actions/entities (highlight affected book/order).
- Decide refresh strategy: targeted refetch/invalidation after mutations and/or on relevant notifications.
- Add notification context in UI (kind, message, linked entity/action when inferable) alongside the hook inspector.
- Handle SSE connection states/reconnect UX if needed.
- **Affected elements:** `useNotifications.ts`, `NotificationToast.tsx`, `ShippyBooks.tsx`, `Books.tsx`, `Orders.tsx`.

### Stage 4 – Polish, resilience, and demo ergonomics
**Goal:** Production-quality showcase UX and maintainability.
- Unify styling (extract/extend `Books.css` or component styles), responsive layout, accessible forms/controls, and consistent feedback components.
- Normalize error handling (API/network/validation) and response-shape guards for partial list payloads.
- Optional: add hook-level toggles/examples (sample payloads), loading skeletons, and simple metrics (call counts/latency).
- Add tests/smoke checks for critical flows and run lint/typecheck/build to validate.
- Document the showcased hooks and UI flow in README or in-app help.

## Suggested implementation order (incremental PRs/commits)
1. Stage 0 (inspector + async states) – establishes showcase foundation.
2. Stage 1 (Books) – complete vertical slice for all book hooks.
3. Stage 2 (Orders) – complete vertical slice for all order hooks.
4. Stage 3 (notifications/coherence) – demonstrate event-driven behavior.
5. Stage 4 (polish/resilience/docs) – finalize UX and quality.
