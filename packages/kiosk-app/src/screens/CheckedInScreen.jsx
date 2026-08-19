import KioskHeader from "../components/KioskHeader.jsx";
import "../styles/screens/CheckedIn.css";

export default function CheckedInScreen({ info, onDone, isOnline }) {
  const isFever = info?.temperatureC != null && Number(info.temperatureC) >= 37.5;

  return (
    <div className="kiosk-shell">
      <KioskHeader isOnline={isOnline} />

      <div className="kiosk-content">
        {isFever ? (
          <>
            <div className="checkin-success-icon alert-icon" style={{ background: '#fdeceb', color: 'var(--danger)' }}>🚨</div>
            <h1 style={{ color: "var(--danger)", maxWidth: "640px" }}>Please proceed inside the clinic immediately</h1>
            <p className="kiosk-subtitle" style={{ color: "#b91c1c", fontWeight: 600, maxWidth: "600px" }}>
              ⚠️ High body temperature detected ({Number(info.temperatureC).toFixed(1)} °C). Please proceed inside the clinic immediately for direct attention of the nurse.
            </p>
          </>
        ) : (
          <>
            <div className="checkin-success-icon">✓</div>
            <h1>You're checked in</h1>
            <p className="kiosk-subtitle">Please have a seat — a staff member will call you shortly.</p>
          </>
        )}

        <div className="kiosk-card checkin-summary">
          {info?.serviceType && (
            <div className="checkin-row">
              <span className="confirm-detail-label">Service:</span>
              <span className="confirm-detail-value">
                {info.serviceType}
                {info?.subType ? ` — ${info.subType}` : ""}
              </span>
            </div>
          )}
          {info?.temperatureC != null && (
            <div className="checkin-row">
              <span className="confirm-detail-label">Recorded Temp:</span>
              <span className="confirm-detail-value" style={{ fontWeight: 700, color: isFever ? '#ef4444' : '#10b981' }}>
                {Number(info.temperatureC).toFixed(1)} °C
                {isFever ? " (🔥 Fever Flagged - High Priority)" : " (✓ Normal)"}
              </span>
            </div>
          )}
          {info?.queueNumber && (
            <div className="checkin-queue-block">
              <span className="checkin-queue-label">{isFever ? "Priority Queue Number" : "Queue Number"}</span>
              <span className="checkin-queue-number">{info.queueNumber}</span>
            </div>
          )}
        </div>

        <button className="btn-kiosk btn-kiosk-primary checkin-done-btn" onClick={onDone}>
          Done
        </button>
      </div>
    </div>
  );
}