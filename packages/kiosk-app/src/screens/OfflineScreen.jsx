import KioskHeader from "../components/KioskHeader.jsx";
import "../offline.css";

export default function OfflineScreen() {
  return (
    <div className="kiosk-shell">
      <KioskHeader isOnline={false} />

      <div className="kiosk-content offline-centered-container">
        <span className="offline-kiosk-eyebrow">Health Services Office • Service Notice</span>
        
        <h1 className="offline-main-title">Kiosk Self-Service is Temporarily Unavailable</h1>
        <p className="offline-subtitle">
          The automated check-in terminal is currently offline. All clinic operations remain active.
        </p>

        <div className="offline-icon-circle">
          <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        </div>

        <div className="offline-details-card">
          <h2 className="offline-action-title">Please Proceed to the Clinic Front Desk</h2>
          <p className="offline-action-desc">
            Please step inside the Health Services Office. Our clinic staff will assist you with manual check-in:
          </p>

          <div className="offline-details-list">
            <div className="offline-detail-item">
              <span className="offline-item-bullet">1</span>
              <span><strong>Approach the Reception Counter:</strong> Step inside the clinic waiting area.</span>
            </div>
            <div className="offline-detail-item">
              <span className="offline-item-bullet">2</span>
              <span><strong>Provide Student Details:</strong> Present your ID card or give your Student ID number to the nurse.</span>
            </div>
            <div className="offline-detail-item">
              <span className="offline-item-bullet">3</span>
              <span><strong>Manual Triage & Queue:</strong> The staff will take your vitals and issue your queue ticket.</span>
            </div>
          </div>
        </div>

        <p className="offline-bottom-note">
          Medical consultations, dental check-ups, and health screenings remain fully operational.
        </p>
      </div>
    </div>
  );
}