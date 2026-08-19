import { useEffect } from "react";
import "../offline.css";

export default function OfflineScreen() {
  // Automatic refresh every 10 seconds if user is inactive on offline screen
  useEffect(() => {
    const timer = setInterval(() => {
      window.location.reload();
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="offline-screen">
      <div className="offline-icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h1>We're temporarily unable to check you in here.</h1>
      <p>Please proceed to the front desk and a staff member will assist you.</p>

      <div style={{ marginTop: "28px" }}>
        <button className="btn-offline-retry" onClick={handleRetry}>
          Try Reconnecting Now
        </button>
      </div>

      <p className="offline-hint">
        This screen automatically retries every 10 seconds once connection is restored.
      </p>
    </div>
  );
}