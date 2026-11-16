import { useSyncExternalStore } from "react";
import {
  clearApiActivity,
  getApiActivity,
  subscribeApiActivity,
  type ApiActivityEntry,
} from "../apiActivity";

export function useApiActivity(): {
  entries: ApiActivityEntry[];
  clear: () => void;
} {
  const entries = useSyncExternalStore(
    subscribeApiActivity,
    getApiActivity,
    getApiActivity,
  );
  return { entries, clear: clearApiActivity };
}
