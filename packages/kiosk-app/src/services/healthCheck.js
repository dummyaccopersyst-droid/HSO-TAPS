import { api } from "./api.js";

const CHECK_INTERVAL_MS = 3000;
const FAILURES_BEFORE_OFFLINE = 3; // ~9s of sustained API/network failure before locking to offline screen

export function startHealthMonitor(onStatusChange) {
  let consecutiveFailures = 0;
  let isOnline = navigator.onLine;

  async function check() {
    if (!navigator.onLine) {
      if (isOnline) {
        isOnline = false;
        onStatusChange(false);
      }
      return;
    }

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

  const handleOnline = () => {
    check();
  };

  const handleOffline = () => {
    isOnline = false;
    onStatusChange(false);
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  const intervalId = setInterval(check, CHECK_INTERVAL_MS);
  check();

  return () => {
    clearInterval(intervalId);
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}
