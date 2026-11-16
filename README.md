# personal_site

Vite + React + TypeScript personal site.

## Development

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Theme

The site uses a unified white/cream/grey terminal-inspired theme with monospace typography and shared CSS tokens (defined in `src/index.css`, aligned in `src/theme.ts` for MUI):

- **Base:** `--bg` near-black grey (dark) / near-white (light), `--surface`/`--surface-2` panels, cream/dark primary text (`--text`), cream/dark accent (`--accent`)
- **Highlights:** bright blue (`--hl-blue`) for info/links/pending/SSE, purple (`--hl-purple`) for correlated highlights, inverse-text (`--inverse-text`) for badges on accent backgrounds
- **Status:** `--danger` for errors, `--warning` for warnings
- **Theme switch:** a Dark/Light toggle in the navbar persists your choice to `localStorage` and respects `prefers-color-scheme`

All pages (Home, CV, Experience, ShippyBooks) share the same styling system. Pages no longer override the theme with hardcoded colors.

## ShippyBooks API Hooks Showcase

The `/shippybooks` route provides a UI for demonstrating and inspecting the Books/Orders API hooks (backed by the shippybooks API).

### Showcased hooks (`src/api.ts`)
- **Books:** `api.listBooks`, `api.createBook`, `api.getBook`, `api.updateStock`
- **Orders:** `api.listOrders`, `api.createOrder`, `api.getOrder`, `api.changeStatus`
- **Notifications:** SSE stream via `useNotifications` (`GET ${API_BASE}/notifications/stream`)

Configure the backend base URL with `VITE_API_BASE` (see `.env.development` / `.env.production`).

### UI flow
1. **API Hook Inspector:** shows live hook activity (request/response/error, status, latency), hook metrics, sample payload hints, and notification correlation/context.
2. **Books:** list/refresh, create book, apply stock delta (backend semantics: `stock += quantity`), and inspect full book details in-UI.
3. **Orders:** load books for context, build an order (payload preview), create order, change status with transition feedback, and inspect full order details in-UI.
4. **Realtime (SSE):** connection status badge, toast notifications, heuristic correlation/highlights, and hybrid auto-refresh on relevant events/mutations.

### Key files
- `src/pages/ShippyBooks.tsx` – showcase composition and SSE wiring
- `src/components/Books.tsx`, `src/components/Orders.tsx` – Books/Orders hook UIs
- `src/components/ApiHookInspector.tsx`, `src/apiActivity.ts` – hook instrumentation/inspection
- `src/hooks/useNotifications.ts`, `src/utils/notificationContext.ts` – SSE + correlation
- `src/index.css`, `src/theme.ts`, `src/styles/*.css` – theme tokens and styling
- `src/context/ThemeContext.tsx` – dark/light theme provider
- `src/components/ThemeToggle.tsx` – dark/light toggle switch
- `BOOKS_ORDERS_UI_WORKPLAN.md` – staged plan and elements map
- `HEALTH_API_SPEC.md` – proposed API health endpoint spec
