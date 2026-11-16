import { useCallback, useState } from "react";

export type AsyncStatus = "idle" | "loading" | "success" | "error";

export interface AsyncState<T> {
  status: AsyncStatus;
  data: T | null;
  error: string | null;
}

export function useAsync<T, Args extends unknown[] = []>() {
  const [state, setState] = useState<AsyncState<T>>({
    status: "idle",
    data: null,
    error: null,
  });

  const run = useCallback(async (fn: (...args: Args) => Promise<T>, ...args: Args): Promise<T | null> => {
    setState({ status: "loading", data: null, error: null });
    try {
      const data = await fn(...args);
      setState({ status: "success", data, error: null });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState({ status: "error", data: null, error: message });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: "idle", data: null, error: null });
  }, []);

  return { ...state, run, reset, setState };
}
