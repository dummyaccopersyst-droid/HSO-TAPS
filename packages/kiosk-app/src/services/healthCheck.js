import { api } from "./api.js";

const CHECK_INTERVAL_MS = 3000;
const FAILURES_BEFORE_OFFLINE = 5; // requires ~15s of sustained failure before locking screen

export function startHealthMonitor(onStatusChange) {
  let consecutiveFailures = 0;
  let isOnline = true;

  async function check() {
    try {
      await api.get("/health", { timeout: 3000 });
      consecutiveFailures = 0;
      if (!isOnline) {
        isOnline = true;
        onStatusChange(true);
      }
    } catch {
      consecutiveFailures += 1;
      if (isOnline && consecutiveFailures >= FAILURES_BEFORE_OFFLINE) {
        isOnline = false;
        onStatusChange(false);
      }
    }
  }

  const intervalId = setInterval(check, CHECK_INTERVAL_MS);
  return () => clearInterval(intervalId);
}
