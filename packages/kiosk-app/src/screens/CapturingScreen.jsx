import KioskHeader from "../components/KioskHeader.jsx";
import "../styles/screens/Capturing.css";

function WristTempIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
      <path d="M17 10h4M17 14h3M17 6h2" />
    </svg>
  );
}

function ScaleIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M12 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
      <path d="M12 12v3" />
    </svg>
  );
}

function HeightPlatformIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v16M8 5l4-3 4 3" />
      <path d="M4 22h16" />
      <path d="M7 18h10" />
    </svg>
  );
}

const MODE_COPY = {
  complete: { title: "Automated Vitals Measurement", instruction: "Follow the positioning guides below while the sensors acquire your vitals." },
  temperature: { title: "Measuring Body Temperature", instruction: "Hold still while the thermal sensor scans your temperature." },
  physical: { title: "Measuring Height & Weight", instruction: "Please stand still and balanced on the measuring platform." },
};

export default function CapturingScreen({
  mode = "complete",
  readings = {},
  manualFields = [],
  onCancel,
  onManualEdit,
  isOnline,
}) {
  const copy = MODE_COPY[mode] || MODE_COPY.complete;
  const needsTemp = mode === "complete" || mode === "temperature";
  const needsPhysical = mode === "complete" || mode === "physical";

  const isTempManual = manualFields.includes("temperatureC");
  const isHeightManual = manualFields.includes("heightCm");
  const isWeightManual = manualFields.includes("weightKg");

  return (
    <div className="kiosk-shell">
      <KioskHeader isOnline={isOnline} />

      <div className="kiosk-content capturing-container">
        {/* Animated Radar Scanning Indicator */}
        <div className="capturing-pulse">
          <div className="capturing-pulse-ring" />
          <div className="capturing-pulse-core" />
          <div className="capturing-pulse-scan-beam" />
        </div>

        <h1 className="capturing-title">{copy.title}</h1>
        <p className="kiosk-subtitle capturing-subtitle">{copy.instruction}</p>

        {/* Dedicated Sensor Instruction Cards */}
        <div className="capturing-guide-grid">
          {needsTemp && (
            <div className={`guide-card ${readings.temperatureC != null ? "guide-done" : "guide-scanning"}`}>
              <div className="guide-card-icon">
                <WristTempIcon />
              </div>
              <div className="guide-card-info">
                <span className="guide-card-tag">Temperature Sensor</span>
                <p className="guide-card-text">
                  Please place your wrist on the temperature sensor.
                </p>
                <div className="guide-status-row">
                  <span className="guide-status-dot" />
                  <span className="guide-status-label">
                    {readings.temperatureC != null 
                      ? `Captured: ${readings.temperatureC}°C (${isTempManual ? "Manual" : "Sensor"})` 
                      : "Scanning wrist temperature..."}
                  </span>
                </div>
              </div>
            </div>
          )}

          {needsPhysical && (
            <>
              <div className={`guide-card ${readings.weightKg != null ? "guide-done" : "guide-scanning"}`}>
                <div className="guide-card-icon">
                  <ScaleIcon />
                </div>
                <div className="guide-card-info">
                  <span className="guide-card-tag">Weight Sensor</span>
                  <p className="guide-card-text">
                    Step on the weighing scale properly.
                  </p>
                  <div className="guide-status-row">
                    <span className="guide-status-dot" />
                    <span className="guide-status-label">
                      {readings.weightKg != null 
                        ? `Captured: ${readings.weightKg} kg (${isWeightManual ? "Manual" : "Sensor"})` 
                        : "Measuring body weight..."}
                    </span>
                  </div>
                </div>
              </div>

              <div className={`guide-card ${readings.heightCm != null ? "guide-done" : "guide-scanning"}`}>
                <div className="guide-card-icon">
                  <HeightPlatformIcon />
                </div>
                <div className="guide-card-info">
                  <span className="guide-card-tag">Height Sensor</span>
                  <p className="guide-card-text">
                    Stand properly on the platform to capture accurate height.
                  </p>
                  <div className="guide-status-row">
                    <span className="guide-status-dot" />
                    <span className="guide-status-label">
                      {readings.heightCm != null 
                        ? `Captured: ${readings.heightCm} cm (${isHeightManual ? "Manual" : "Sensor"})` 
                        : "Calibrating height alignment..."}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Controls */}
        <div className="capturing-actions-row">
          {onManualEdit && (
            <button className="btn-kiosk btn-kiosk-muted capturing-manual-btn" onClick={onManualEdit}>
              Adjust Manually
            </button>
          )}
          <button className="btn-kiosk btn-kiosk-danger-outline capturing-cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}