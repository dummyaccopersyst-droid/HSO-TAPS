import KioskHeader from "../components/KioskHeader.jsx";
import "../offline.css";

export default function OfflineScreen() {
  return (
    <div className="kiosk-shell">
      <KioskHeader isOnline={false} />

      <div className="kiosk-content">
        <h1>Automated Check-in is Temporarily Unavailable</h1>
        <p className="kiosk-subtitle">Please proceed to the front desk</p>

        <div className="offline-icon-circle">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18" />
            <path d="M5 21V7l8-4v18" />
            <path d="M19 21V11l-6-4" />
            <path d="M9 9v.01" />
            <path d="M9 12v.01" />
            <path d="M9 15v.01" />
            <path d="M9 18v.01" />
          </svg>
        </div>

        <h2 className="offline-notice-label">PLEASE PROCEED TO THE CLINIC FRONT DESK</h2>
        <p className="offline-notice-hint">
          A staff member will assist you with manual check-in and registration.
        </p>
      </div>
    </div>
  );
}