# Health API Spec Sheet

## Purpose
Define a standard **health endpoint contract** to be exposed by the API (e.g. shippybooks/FastAPI) so clients, deploys, and operators can determine service liveness, readiness, and dependency status.

This spec is designed to complement the existing API surface used by the UI (`/books`, `/orders`, `/notifications/stream`) and to be easy to consume from frontend diagnostics and infrastructure probes.

## Goals
- Provide a fast, stable way to check if the API process is running (**liveness**).
- Provide a dependency-aware signal for whether the API can serve traffic (**readiness**).
- Return structured, machine-readable JSON with enough detail for UI/ops troubleshooting.
- Support both shallow and deep checks with predictable latency and status semantics.

## Non-goals
- Exposing secrets, credentials, connection strings, or sensitive internal data.
- Replacing domain/business endpoints or detailed observability/metrics systems.
- Guaranteeing deep dependency correctness beyond configured checks/timeouts.

---

## Endpoints

### 1. `GET /health/live` (Liveness)
**Intent:** Indicates the API process is up and able to respond. Should not depend on external systems.

- **Auth:** None (recommended) or internal-only, but must be accessible to orchestrator probes.
- **Success:** `200 OK`
- **Failure:** No response / timeout / non-200 treated as unhealthy by probe.

**Response body (`application/json`):**
```json
{
  "status": "ok",
  "check": "live",
  "service": "shippybooks-api",
  "version": "1.0.0",
  "timestamp": "2026-11-11T12:00:00Z"
}
```

### 2. `GET /health/ready` (Readiness)
**Intent:** Indicates the API is ready to handle requests (dependencies required for core functionality are available).

- **Auth:** None (recommended for infra) or protected consistently; prefer same visibility as liveness in trusted environments.
- **Success:** `200 OK` when all **required** checks pass.
- **Failure:** `503 Service Unavailable` when any **required** check fails or times out.
- **Degraded (optional policy):** `200 OK` with `status: "degraded"` only if failures are in explicitly non-required checks and the service can still serve core traffic.

**Response body (`application/json`):**
```json
{
  "status": "ok",
  "check": "ready",
  "service": "shippybooks-api",
  "version": "1.0.0",
  "timestamp": "2026-11-11T12:00:00Z",
  "duration_ms": 12,
  "checks": [
    {
      "name": "database",
      "status": "ok",
      "required": true,
      "duration_ms": 8,
      "message": "connection and ping succeeded"
    },
    {
      "name": "event_store",
      "status": "ok",
      "required": true,
      "duration_ms": 2,
      "message": "store accessible"
    },
    {
      "name": "notification_stream",
      "status": "ok",
      "required": false,
      "duration_ms": 1,
      "message": "stream subsystem initialized"
    }
  ]
}
```

### 3. `GET /health` (Aggregate / Summary) — Recommended
**Intent:** Convenience endpoint for humans, dashboards, and frontend diagnostics. Returns aggregate status and component checks.

- **Default behavior:** same evaluation as readiness (or configurable summary mode).
- **Query params:**
  - `verbose=true|false` (default `true`): include `checks` array when `true`; omit or summarize when `false`.
  - `deep=true|false` (default `false`): when `true`, run deeper/non-cached checks (subject to stricter timeout/budget); when `false`, prefer fast cached/light checks.
- **Success:** `200 OK` for `ok`/`degraded` (if degraded policy enabled).
- **Failure:** `503 Service Unavailable` for `unhealthy` (required check failure).

---

## Response Schema

### Top-level fields
| Field | Type | Required | Description |
|---|---|---|---|
| `status` | `"ok" \| "degraded" \| "unhealthy"` | yes | Aggregate health state |
| `check` | `"live" \| "ready" \| "health"` | yes | Endpoint/check mode identifier |
| `service` | `string` | yes | Service name (e.g. `shippybooks-api`) |
| `version` | `string` | yes | App version/build identifier (semver, git SHA, or build tag) |
| `timestamp` | `string` (RFC 3339/ISO 8601 UTC) | yes | Time health result was produced |
| `duration_ms` | `number` | yes (ready/health), optional (live) | Total evaluation time in milliseconds |
| `checks` | `Check[]` | yes (ready), conditional (health verbose) | Component/dependency check results |

### `Check` object
| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | yes | Stable check identifier (e.g. `database`, `migrations`, `event_store`, `notification_stream`) |
| `status` | `"ok" \| "degraded" \| "unhealthy"` | yes | Check result |
| `required` | `boolean` | yes | If `true`, failure forces aggregate `unhealthy`/503 (readiness) |
| `duration_ms` | `number` | yes | Check execution time |
| `message` | `string` | no | Short human-readable summary (no secrets) |
| `data` | `object` | no | Non-sensitive diagnostic metadata (e.g. counts/latency buckets), omit by default |

### Example: unhealthy readiness
```json
{
  "status": "unhealthy",
  "check": "ready",
  "service": "shippybooks-api",
  "version": "1.0.0",
  "timestamp": "2026-11-11T12:00:05Z",
  "duration_ms": 1003,
  "checks": [
    {
      "name": "database",
      "status": "unhealthy",
      "required": true,
      "duration_ms": 1000,
      "message": "ping timed out"
    },
    {
      "name": "notification_stream",
      "status": "ok",
      "required": false,
      "duration_ms": 3,
      "message": "stream subsystem initialized"
    }
  ]
}
```

---

## Recommended Checks for Shippybooks API
| Name | Required | Suggested validation | Notes |
|---|---|---|---|
| `database` | yes | Lightweight connectivity/ping via SQLAlchemy/session/engine (e.g. `SELECT 1`) | Core for books/orders persistence and queries |
| `schema` / `migrations` | yes (if migrations used) | Verify expected tables/metadata available or migration head applied | Prevents serving with incompatible schema |
| `event_store` | context-dependent | Verify event store read/write path or initialization | Required if command/event flow depends on it at request time |
| `notification_stream` | no (typically) | Verify notification store/bus/SSE subsystem initialized | SSE may degrade independently; mark required only if critical |
| `config` | yes | Validate required runtime config loaded (e.g. env/settings present) without exposing values | Fails fast on misconfiguration |

> Mark checks `required` based on actual runtime criticality. Readiness should reflect ability to serve core Books/Orders API traffic.

---

## Status and HTTP Semantics
| Aggregate status | Meaning | `GET /health/live` | `GET /health/ready` | `GET /health` |
|---|---|---|---|---|
| `ok` | All required checks pass (and no degrading conditions) | `200` | `200` | `200` |
| `degraded` | Non-required checks failing or partial degradation; core traffic still possible (policy-dependent) | n/a (live should remain `ok`) | `200` or `503` by policy (recommend `200` only if core ready) | `200` (recommended) |
| `unhealthy` | One or more required checks failing/timed out | non-200/timeout | `503` | `503` |

**Rules:**
- Liveness must be independent of dependency checks.
- Readiness must fail (`503`) when any `required=true` check is not `ok` (unless explicitly modeled as degraded-but-ready by policy).
- Never return `200` from readiness if core DB-backed functionality is unavailable.

---

## Performance, Caching, and Timeouts
- **Liveness:** < 100ms target; no I/O beyond process handling.
- **Readiness/Health (default):** < 1s target total budget.
- **Deep checks (`deep=true`):** separate budget (e.g. < 3s) and may be rate-limited/cached.
- Apply per-check timeouts (e.g. 250–500ms for DB ping) to avoid probe hangs.
- Optional short-lived caching (e.g. 1–5s) for aggregate/deep results to protect dependencies under frequent probing; include `timestamp` of evaluation.

## Security and Privacy
- Do not include secrets, DSNs, tokens, stack traces, or PII in responses.
- Keep `message` fields concise and sanitized.
- If exposed publicly, consider minimal `verbose=false` responses and/or auth for detailed diagnostics; keep infra probes functional.

## Versioning and Compatibility
- Include `version` and stable `name` identifiers for checks.
- Additive fields are backward-compatible; consumers should ignore unknown fields.
- If breaking changes are needed, introduce a versioned path (e.g. `/health/v2`) while preserving existing behavior during migration.

## Frontend Integration Notes (personal_site / UI)
- Use `GET /health` or `GET /health/ready` to display API connectivity/readiness in diagnostics (e.g. alongside API Hook Inspector).
- Treat `503`/network errors as unavailable; show `status`, failing `checks[].name`, and sanitized `message`.
- Poll conservatively (e.g. on page load/manual refresh or low-frequency interval) and respect timeouts; avoid tight polling loops.

## Implementation Checklist (FastAPI/shippybooks)
- [ ] Add router/endpoints: `/health/live`, `/health/ready`, and `/health`.
- [ ] Implement DB ping check using existing engine/session dependencies.
- [ ] Implement optional checks for event store / notification subsystem initialization.
- [ ] Return `503` on required-check failure; include per-check timings and statuses.
- [ ] Add `version`/`service` from settings/build metadata.
- [ ] Ensure CORS/probe access as needed for deployment and UI diagnostics.
- [ ] Add tests for `ok`, `unhealthy` (DB down/timeout), and response schema.
