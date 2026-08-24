import { useEffect } from "react";
import "../offline.css";

export default function OfflineScreen({ onRetry }) {
  // Automatic refresh / retry every 8 seconds if connection is restored
  useEffect(() => {
    const timer = setInterval(() => {
      if (navigator.onLine) {
        if (onRetry) onRetry();
        else window.location.reload();
      }
    }, 8000);
    return () => clearInterval(timer);
  }, [onRetry]);

  const handleRetry = () => {
    if (onRetry) onRetry();
    else window.location.reload();
  };

  return (
    <div className="offline-screen">
      <div className="offline-icon">
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      </div>

      <span className="offline-badge">Offline Fallback Protocol</span>
      <h1>Automated Service Temporarily Unavailable</h1>
      <p className="offline-desc">
        The kiosk has lost its network or database connection. Please proceed to the clinic reception for manual check-in.
      </p>

      <div className="offline-steps-card">
        <div className="offline-step-item">
          <span className="offline-step-num">1</span>
          <span>Please proceed inside the Health Services Office (Clinic).</span>
        </div>
        <div className="offline-step-item">
          <span className="offline-step-num">2</span>
          <span>Approach the nurse or reception desk for manual consultation or screening assistance.</span>
        </div>
      </div>

      <div style={{ marginTop: "24px" }}>
        <button className="btn-offline-retry" onClick={handleRetry}>
          🔄 Check Connection & Retry
        </button>
      </div>

      <p className="offline-hint">
        The kiosk will automatically resume service as soon as the network connection is restored.
      </p>
    </div>
  );
}