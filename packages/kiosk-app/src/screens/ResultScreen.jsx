import KioskHeader from "../components/KioskHeader.jsx";
import "../styles/screens/Result.css";

function computeBmi(heightCm, weightKg) {
  if (!heightCm || !weightKg) return null;
  const m = heightCm / 100;
  const val = +(weightKg / (m * m)).toFixed(1);
  let category = "Normal";
  if (val < 18.5) category = "Underweight";
  else if (val >= 25.0 && val < 30.0) category = "Overweight";
  else if (val >= 30.0) category = "Obese";

  return { value: val, category };
}

export default function ResultScreen({ readings, overrideTriggered, queueNumber, onDone, isOnline }) {
  const bmi = computeBmi(readings.heightCm, readings.weightKg);
  const isFever = readings.temperatureC != null && Number(readings.temperatureC) >= 37.5;
  const hasFeverAlert = isFever || overrideTriggered;

  return (
    <div className="kiosk-shell">
      <KioskHeader isOnline={isOnline} />

      <div className="kiosk-content">
        {hasFeverAlert ? (
          <div className="fever-alert-banner">
            <div className="result-icon result-icon-alert">🚨</div>
            <h1 className="result-title-alert">Please proceed inside the clinic immediately.</h1>
            <p className="kiosk-subtitle fever-subtitle">
              ⚠️ <strong>High Temperature / Fever Detected ({readings.temperatureC}°C)</strong>
              <br />
              Please immediately proceed inside the clinic for direct attention of the nurse.
            </p>
            {queueNumber && (
              <div className="checkin-queue-block result-queue-block">
                <span className="checkin-queue-label">Priority Queue Number</span>
                <span className="checkin-queue-number">{queueNumber}</span>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="result-icon result-icon-ok">✓</div>
            <h1>All done — here are your results</h1>
          </>
        )}

        <div className="reading-summary-grid">
          {readings.temperatureC != null && (
            <div className={`reading-summary-stat ${isFever ? "stat-fever" : ""}`}>
              <span className="reading-summary-label">Body Temp</span>
              <span className="reading-summary-value">{readings.temperatureC}°C</span>
              <span className={`reading-badge ${isFever ? "badge-fever" : "badge-normal"}`}>
                {isFever ? "🔥 Fever Detected" : "✓ Normal"}
              </span>
            </div>
          )}
          {readings.heightCm != null && (
            <div className="reading-summary-stat">
              <span className="reading-summary-label">Height</span>
              <span className="reading-summary-value">{readings.heightCm} cm</span>
            </div>
          )}
          {readings.weightKg != null && (
            <div className="reading-summary-stat">
              <span className="reading-summary-label">Weight</span>
              <span className="reading-summary-value">{readings.weightKg} kg</span>
            </div>
          )}
          {bmi != null && (
            <div className="reading-summary-stat">
              <span className="reading-summary-label">BMI Reading</span>
              <span className="reading-summary-value">{bmi.value}</span>
              <span className="reading-badge badge-bmi">{bmi.category}</span>
            </div>
          )}
        </div>

        <button className="btn-kiosk btn-kiosk-primary result-done-btn" onClick={onDone}>
          Done
        </button>
      </div>
    </div>
  );
}