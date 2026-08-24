import KioskHeader from "../components/KioskHeader.jsx";
import "../styles/screens/Capturing.css";

const MODE_COPY = {
  complete: { title: "Measuring temperature, height & weight", instruction: "Please stand still on the platform." },
  temperature: { title: "Measuring temperature", instruction: "Hold still — the thermal sensor is scanning." },
  physical: { title: "Measuring height & weight", instruction: "Please stand still on the platform." },
};

export default function CapturingScreen({
  mode,
  readings,
  manualFields = [],
  isMock,
  bridge,
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

      <div className="kiosk-content">
        <div className="capturing-pulse">
          <div className="capturing-pulse-ring" />
          <div className="capturing-pulse-core" />
        </div>

        <h1>{copy.title}</h1>
        <p className="kiosk-subtitle">{copy.instruction}</p>

        <div className="kiosk-card reading-status">
          {needsTemp && (
            <div className={"reading-row" + (readings.temperatureC != null ? " done" : "")}>
              <div className="reading-row-main">
                <span>{readings.temperatureC != null ? "✓" : "⏳"}</span>
                <span>Temperature: {readings.temperatureC != null ? `${readings.temperatureC}°C` : "scanning..."}</span>
              </div>
              {readings.temperatureC != null && (
                <span className={`reading-type-badge ${isTempManual ? "badge-type-manual" : "badge-type-sensor"}`}>
                  {isTempManual ? "Manual" : "Sensor"}
                </span>
              )}
            </div>
          )}
          {needsPhysical && (
            <>
              <div className={"reading-row" + (readings.heightCm != null ? " done" : "")}>
                <div className="reading-row-main">
                  <span>{readings.heightCm != null ? "✓" : "⏳"}</span>
                  <span>Height: {readings.heightCm != null ? `${readings.heightCm} cm` : "scanning..."}</span>
                </div>
                {readings.heightCm != null && (
                  <span className={`reading-type-badge ${isHeightManual ? "badge-type-manual" : "badge-type-sensor"}`}>
                    {isHeightManual ? "Manual" : "Sensor"}
                  </span>
                )}
              </div>
              <div className={"reading-row" + (readings.weightKg != null ? " done" : "")}>
                <div className="reading-row-main">
                  <span>{readings.weightKg != null ? "✓" : "⏳"}</span>
                  <span>Weight: {readings.weightKg != null ? `${readings.weightKg} kg` : "measuring..."}</span>
                </div>
                {readings.weightKg != null && (
                  <span className={`reading-type-badge ${isWeightManual ? "badge-type-manual" : "badge-type-sensor"}`}>
                    {isWeightManual ? "Manual" : "Sensor"}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {isMock && (
          <div className="mock-controls">
            <p className="mock-controls-label">Mock hardware controls (dev only)</p>
            <div className="mock-controls-row">
              {needsTemp && <button className="btn-kiosk-muted mock-btn" onClick={() => bridge.simulateTemperature(36.7)}>Simulate normal temp</button>}
              {needsTemp && <button className="btn-kiosk-muted mock-btn" onClick={() => bridge.simulateTemperature(38.2)}>Simulate fever temp</button>}
              {needsPhysical && <button className="btn-kiosk-muted mock-btn" onClick={() => bridge.simulateHeightWeight(170, 62)}>Simulate height/weight</button>}
            </div>
          </div>
        )}

        <div className="capturing-actions-row">
          {onManualEdit && (
            <button className="btn-kiosk btn-kiosk-muted capturing-manual-btn" onClick={onManualEdit}>
              ✏️ Enter / Adjust Manually
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