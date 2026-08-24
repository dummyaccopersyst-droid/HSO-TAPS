import { useEffect, useState } from "react";
import KioskHeader from "../components/KioskHeader.jsx";
import "../offline.css";

export default function OfflineScreen({ onRetry }) {
  const [retrying, setRetrying] = useState(false);
  const [countdown, setCountdown] = useState(10);

  // Countdown timer for automatic retry loop
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (navigator.onLine) {
            handleRetry();
          }
          return 10;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onRetry]);

  const handleRetry = async () => {
    setRetrying(true);
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
    setTimeout(() => setRetrying(false), 2000);
  };

  return (
    <div className="kiosk-shell offline-shell">
      <KioskHeader isOnline={false} />

      <div className="kiosk-content offline-content">
        <div className="offline-card-wrapper">
          {/* Top Status Header */}
          <div className="offline-header-banner">
            <div className="offline-banner-left">
              <div className="offline-status-pulse-ring">
                <div className="offline-status-pulse-core" />
              </div>
              <div>
                <span className="offline-tag">System Notice • Offline Fallback Protocol</span>
                <h2>Automated Check-in is Temporarily Unavailable</h2>
              </div>
            </div>
            <div className="offline-terminal-tag">TERMINAL 01</div>
          </div>

          {/* Body Section */}
          <div className="offline-card-body">
            <p className="offline-lead-text">
              The self-service kiosk has lost connection to the clinic network. <strong>All clinic services remain fully operational</strong> through our manual front desk reception.
            </p>

            {/* Structured Reception Guidance Cards */}
            <div className="offline-guidance-grid">
              <div className="guidance-card">
                <div className="guidance-card-header">
                  <div className="guidance-num-badge">1</div>
                  <h4>Proceed to the Front Desk</h4>
                </div>
                <p>
                  Please step inside the <strong>Health Services Office (Clinic)</strong> and approach the reception counter.
                </p>
                <div className="guidance-tip">
                  <span>📍</span>
                  <span>Located directly through the main clinic entrance</span>
                </div>
              </div>

              <div className="guidance-card">
                <div className="guidance-card-header">
                  <div className="guidance-num-badge">2</div>
                  <h4>Manual Intake & Priority Queue</h4>
                </div>
                <p>
                  Our clinic nurse will record your Student ID, check your temperature and vitals manually, and issue your queue ticket.
                </p>
                <div className="guidance-tip">
                  <span>🩺</span>
                  <span>Medical & Dental staff on duty</span>
                </div>
              </div>
            </div>

            {/* Reconnect Action & Heartbeat Diagnostics */}
            <div className="offline-footer-panel">
              <div className="offline-diagnostics">
                <div className="diagnostics-indicator">
                  <span className="diagnostics-radar" />
                  <span>Network Heartbeat: Auto-retrying in <strong>{countdown}s</strong></span>
                </div>
                <span className="diagnostics-subtext">Automatic resume will trigger immediately upon signal recovery</span>
              </div>

              <button
                type="button"
                className={`btn-offline-action ${retrying ? "loading" : ""}`}
                onClick={handleRetry}
                disabled={retrying}
              >
                {retrying ? "Checking Network..." : "🔄 Test Connection Now"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}