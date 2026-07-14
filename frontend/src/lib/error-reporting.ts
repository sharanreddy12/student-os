type AppErrorOptions = {
  boundary?: string;
  [key: string]: unknown;
};

type AppEvents = {
  captureException?: (
    error: unknown,
    options?: AppErrorOptions,
  ) => void;
};

declare global {
  interface Window {
    __appEvents?: AppEvents;
  }
}

export function reportAppError(error: unknown, context: Record<string, unknown> = {}) {
  // If the error reporting system is injected, use it
  window.__appEvents?.captureException?.(
    error,
    { boundary: "tanstack_root_error_component", ...context }
  );
}
