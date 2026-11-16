export type ApiCallStatus = "pending" | "success" | "error";

export interface ApiActivityEntry {
  id: string;
  hook: string;
  endpoint: string;
  method: string;
  request?: unknown;
  status: ApiCallStatus;
  startedAt: number;
  durationMs?: number;
  response?: unknown;
  error?: string;
}

type Listener = () => void;

const MAX_ENTRIES = 50;

let entries: ApiActivityEntry[] = [];
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

export function getApiActivity(): ApiActivityEntry[] {
  return entries;
}

export function subscribeApiActivity(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function addApiActivity(entry: Omit<ApiActivityEntry, "id" | "startedAt" | "status"> & { status?: ApiCallStatus }): string {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const full: ApiActivityEntry = {
    id,
    startedAt: Date.now(),
    status: entry.status ?? "pending",
    ...entry,
  };
  entries = [full, ...entries].slice(0, MAX_ENTRIES);
  emit();
  return id;
}

export function updateApiActivity(id: string, patch: Partial<ApiActivityEntry>) {
  entries = entries.map((e) => (e.id === id ? { ...e, ...patch } : e));
  emit();
}

export function clearApiActivity() {
  entries = [];
  emit();
}
