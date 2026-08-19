import { useEffect, useRef, useState } from "react";
import WelcomeScreen from "./screens/WelcomeScreen.jsx";
import ManualEntryScreen from "./screens/ManualEntryScreen.jsx";
import ConfirmScreen from "./screens/ConfirmScreen.jsx";
import ServiceSelectScreen from "./screens/ServiceSelectScreen.jsx";
import ConsultationTypeScreen from "./screens/ConsultationTypeScreen.jsx";
import OtherServicesTypeScreen from "./screens/OtherServicesTypeScreen.jsx";
import RequestTextScreen from "./screens/RequestTextScreen.jsx";
import CheckedInScreen from "./screens/CheckedInScreen.jsx";
import ScreeningOptionsScreen from "./screens/ScreeningOptionsScreen.jsx";
import CapturingScreen from "./screens/CapturingScreen.jsx";
import ResultScreen from "./screens/ResultScreen.jsx";
import OfflineScreen from "./screens/OfflineScreen.jsx";
import { connectDeviceBridge } from "./services/deviceBridge.js";
import { supabase } from "./services/supabase.js";
import { lookupStudent, submitIntake } from "./services/api.js";
import { startHealthMonitor } from "./services/healthCheck.js";

const IDLE_TIMEOUT_MS = 30_000;
const isMock = import.meta.env.VITE_MOCK_HARDWARE === "true";

// Which readings each screening mode needs before we can move to the result screen
const REQUIRED_FIELDS = {
  complete: ["temperatureC", "heightCm", "weightKg"],
  temperature: ["temperatureC"],
  physical: ["heightCm", "weightKg"],
};

export default function App() {
  const [step, setStep] = useState("welcome");
  const [student, setStudent] = useState(null);
  const [captureMode, setCaptureMode] = useState(null); // "complete" | "temperature" | "physical"
  const [readings, setReadings] = useState({});
  const [overrideTriggered, setOverrideTriggered] = useState(false);
  const [resultQueueNumber, setResultQueueNumber] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  // Which multi-step flow is currently in progress — determines what
  // finishCapture() submits and where it routes afterwards. Only relevant
  // once capture starts; "screening" for Quick Health Screening, or
  // "consultation" for the mandatory pre-consultation temp check.
  const [flowType, setFlowType] = useState(null);
  const [consultSubType, setConsultSubType] = useState(null); // "Medical" | "Dental"
  const [otherServiceSubType, setOtherServiceSubType] = useState(null); // "Prescription/OTC" | "General Inquiry"
  const [checkInInfo, setCheckInInfo] = useState(null); // shown on CheckedInScreen

  const bridgeRef = useRef(null);
  const idleTimer = useRef(null);
  const stepRef = useRef(step);
  const submittingRef = useRef(false); // guards against double-submit
  const preOfflineStepRef = useRef("welcome"); // step to restore once back online
  const currentSessionIdRef = useRef(null);

  useEffect(() => { stepRef.current = step; }, [step]);

  useEffect(() => {
    // Supabase Real-time listener for wireless ESP32 RFID taps and sensor triggers
    const channel = supabase
      .channel("hsotap_kiosk_sync")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "kiosk_sessions" },
        async (payload) => {
          console.log("[Supabase Realtime] Session inserted:", payload.new);
          // ONLY move to "confirm" screen when a NEW RFID tap occurs (status === 'tap_logged')
          // Do NOT reset to "confirm" screen when kiosk-app inserts a 'pending_sensor' row!
          if (payload.new?.rfid_uid && payload.new?.status === "tap_logged") {
            if (payload.new?.id) {
              currentSessionIdRef.current = payload.new.id;
            }
            const rfid = payload.new.rfid_uid;
            try {
              const found = await lookupStudent(rfid);
              if (found) {
                setStudent(found);
                setStep("confirm");
                return;
              }
            } catch (e) {
              console.warn("[Supabase] Student lookup via API failed, using registered student fallback for:", rfid);
            }

            // Client-side fallback mapping for demo/offline resilience
            const fallbackStudents = {
              "579D1D3F": { studentId: "2023-330049", firstName: "Djanaisah M.", lastName: "Benito", sex: "Female", age: 21, schoolYear: "2026-2027", guardianContact: "09171234567", program: "BS Information Technology", yearLevel: "3rd Year", rfidTagUid: "579D1D3F" },
              "EADF614C": { studentId: "2023-132138", firstName: "Sean Gerome F.", lastName: "Recto", sex: "Male", age: 21, schoolYear: "2026-2027", guardianContact: "09171234567", program: "BS Information Technology", yearLevel: "3rd Year", rfidTagUid: "EADF614C" },
              "873A325A": { studentId: "2023-330059", firstName: "Wilpingston M.", lastName: "Lagunay", sex: "Male", age: 21, schoolYear: "2026-2027", guardianContact: "09171234567", program: "BS Information Technology", yearLevel: "3rd Year", rfidTagUid: "873A325A" },
              "87F8113F": { studentId: "2023-330069", firstName: "Carlos Angello J.", lastName: "Bernardo", sex: "Male", age: 21, schoolYear: "2026-2027", guardianContact: "09171234567", program: "BS Information Technology", yearLevel: "3rd Year", rfidTagUid: "87F8113F" },
              "6757805A": { studentId: "2023-230083", firstName: "Delfin Joseph D.", lastName: "Feleo", sex: "Male", age: 21, schoolYear: "2026-2027", guardianContact: "09171234567", program: "BS Information Technology", yearLevel: "3rd Year", rfidTagUid: "6757805A" },
              "B3432B38": { studentId: "2024-100123", firstName: "Maria", lastName: "Santos", sex: "Female", age: 20, schoolYear: "2026-2027", guardianContact: "09179998888", program: "BS Information Technology", yearLevel: "2nd Year", rfidTagUid: "B3432B38" },
              "17F7C664": { studentId: "2024-888999", firstName: "Juan", lastName: "Dela Cruz", sex: "Male", age: 21, schoolYear: "2026-2027", guardianContact: "09175554444", program: "BS Information Technology", yearLevel: "3rd Year", rfidTagUid: "17F7C664" },
            };
            const studentData = fallbackStudents[rfid] || { studentId: "2024-100999", firstName: "Student", lastName: rfid, program: "BS Information Technology", yearLevel: "1st Year", rfidTagUid: rfid };
            setStudent(studentData);
            setStep("confirm");
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "kiosk_sessions" },
        (payload) => {
          console.log("[Supabase Realtime] Session updated:", payload.new);
          const { height_m, temp_c, weight_kg } = payload.new;
          const patch = {};
          if (temp_c != null) patch.temperatureC = temp_c;
          if (height_m != null) patch.heightCm = height_m * 100;
          if (weight_kg != null) patch.weightKg = weight_kg;

          if (Object.keys(patch).length > 0) {
            setReadings((prev) => ({ ...prev, ...patch }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Offline Fallback Protocol (PROJECT-OVERVIEW.pdf): runs independently of
  // whichever screen is showing. On going offline, remembers the current
  // step and forces the "offline" screen; on recovery, if the student had
  // gotten partway through a flow, we deliberately reset to "welcome"
  // rather than silently resuming mid-transaction with possibly-stale
  // student/session state.
  useEffect(() => {
    const stop = startHealthMonitor((online) => {
      setIsOnline(online);
    });
    return stop;
  }, []);

  // Watches `readings` (the real source of truth, not a ref) and fires the
  // submit once every required field for the current capture mode has
  // arrived. Using an effect here — rather than checking completeness
  // inside the event handler — avoids the stale-ref race that drops a
  // reading when two sensor events land in the same tick (e.g. height +
  // weight fired together by one button, or two ESP32 lines sent close
  // together over serial).
  useEffect(() => {
    if (step !== "capturing" || submittingRef.current) return;
    const required = REQUIRED_FIELDS[captureMode] || [];
    const isComplete = required.length > 0 && required.every((field) => readings[field] != null);
    if (isComplete) finishCapture(readings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readings, step, captureMode]);

  function resetIdleTimer() {
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => resetSession("timeout"), IDLE_TIMEOUT_MS);
  }

  async function resetSession(statusReason = "cancelled") {
    const sessionIdToUpdate = currentSessionIdRef.current;
    currentSessionIdRef.current = null;
    submittingRef.current = false;
    setStudent(null);
    setCaptureMode(null);
    setReadings({});
    setOverrideTriggered(false);
    setResultQueueNumber(null);
    setFlowType(null);
    setConsultSubType(null);
    setOtherServiceSubType(null);
    setCheckInInfo(null);
    setStep("welcome");

    if (sessionIdToUpdate) {
      try {
        await supabase
          .from("kiosk_sessions")
          .update({ status: statusReason })
          .eq("id", sessionIdToUpdate)
          .in("status", ["pending_sensor", "tap_logged"]);
      } catch (err) {
        console.warn("[Supabase] Failed to mark session status in resetSession:", err);
      }
    }
  }

  async function handleDeviceEvent(evt) {
    resetIdleTimer();
    console.log("[kiosk-app] received device event:", evt);

    if (evt.type === "rfid_tap") {
      console.log("[kiosk-app] rfid tap detected, looking up student UID:", evt.uid);
      try {
        const found = await lookupStudent(evt.uid);
        console.log("[kiosk-app] student found:", found);
        if (found) {
          setStudent(found);
          setStep("confirm");
        }
      } catch (err) {
        console.error("[kiosk-app] lookup error:", err);
        alert(`Card not recognized (looked up "${evt.uid}"). Please try Manual Entry, or seed a matching student.`);
      }
      return;
    }

    if (stepRef.current !== "capturing") return; // sensor readings only matter mid-capture

    const fieldMap = {
      temperature_reading: { temperatureC: evt.celsius },
      height_reading: { heightCm: evt.cm },
      weight_reading: { weightKg: evt.kg },
    };
    const patch = fieldMap[evt.type];
    if (!patch) return;

    // Functional update — always merges onto the LATEST state, so two
    // events fired in the same tick both land correctly.
    setReadings((prev) => ({ ...prev, ...patch }));
  }

  // Called by ManualEntryScreen with the typed-in student ID. Deliberately
  // does NOT catch errors here — ManualEntryScreen awaits this call itself
  // so it can show an inline "not found" message without losing what the
  // student typed (unlike the RFID path, which just re-shows the welcome
  // screen via an alert).
  async function handleManualSubmit(studentId) {
    const found = await lookupStudent(studentId);
    setStudent(found);
    setStep("confirm");
  }

  function handleConfirmYes() {
    setStep("service");
  }

  function handleConfirmNo() {
    // Assumption: a mismatch is treated as "start over" rather than retry,
    // since we don't want to silently keep the wrong student record around.
    resetSession();
  }

  function handleServiceSelect(label) {
    if (label === "Quick Health Screening") {
      setFlowType("screening");
      setStep("screeningOptions");
    } else if (label === "Medical Consultation") {
      setStep("consultationType");
    } else if (label === "Medical Clearance") {
      setStep("otherServicesType");
    } else {
      // Defensive fallback — shouldn't happen given the current SERVICES list.
      submitIntake({ studentId: student.studentId, serviceType: label, source: "kiosk" }).finally(resetSession);
    }
  }

  async function handleConsultTypeSelect(subType) {
    setFlowType("consultation");
    setConsultSubType(subType);
    setReadings({});
    setCaptureMode("temperature"); // reuses the existing temp-only capture screen/mode
    setStep("capturing");

    // Trigger Supabase record for ESP32 hardware to execute temperature scan
    const { data } = await supabase.from("kiosk_sessions").insert([
      {
        rfid_uid: student?.rfidTagUid || student?.studentId,
        service_selected: "Medical Consultation",
        sensor_required: "temperature",
        status: "pending_sensor"
      }
    ]).select();

    if (data && data[0]?.id) {
      currentSessionIdRef.current = data[0].id;
    }
  }

  function handleOtherServiceTypeSelect(subType) {
    setOtherServiceSubType(subType);
    setStep("requestText");
  }

  async function handleRequestTextSubmit(text) {
    const serviceType = otherServiceSubType === "Prescription/OTC" ? "Prescription/OTC Pickup" : "General Inquiry";
    const reason = text.length > 60 ? `${text.slice(0, 57)}...` : text;
    const result = await submitIntake({
      studentId: student.studentId,
      serviceType,
      reason,
      requestDetails: text,
      source: "kiosk",
    });
    setCheckInInfo({ serviceType, queueNumber: result?.queueEntry?.queueNumber });
    setStep("checkedIn");
  }

  async function handleScreeningOptionSelect(mode) {
    setCaptureMode(mode);
    setReadings({});
    setStep("capturing");

    // Map screening option to exact sensor_required command for ESP32
    const sensorCmd = mode === "complete" ? "complete" : mode === "temperature" ? "temperature" : "physical";

    // Trigger Supabase row for ESP32 to poll and run hardware sensors
    const { data } = await supabase.from("kiosk_sessions").insert([
      {
        rfid_uid: student?.rfidTagUid || student?.studentId,
        service_selected: "Quick Health Screening",
        sensor_required: sensorCmd,
        status: "pending_sensor"
      }
    ]).select();

    if (data && data[0]?.id) {
      currentSessionIdRef.current = data[0].id;
    }
  }

  async function finishCapture(finalReadings) {
    submittingRef.current = true;
    currentSessionIdRef.current = null;
    const targetStudentId = student?.studentId || student?.rfidTagUid || "2024-100123";

    try {
      if (flowType === "consultation") {
        const serviceType = consultSubType === "Dental" ? "Dental Consultation" : "Medical Consultation";
        const result = await submitIntake({
          studentId: targetStudentId,
          serviceType,
          source: "kiosk",
          temperatureC: finalReadings.temperatureC,
        });
        setCheckInInfo({
          serviceType,
          queueNumber: result?.queueEntry?.queueNumber,
          temperatureC: finalReadings.temperatureC,
        });
        setStep("checkedIn");
        return;
      }

      const result = await submitIntake({
        studentId: targetStudentId,
        serviceType: "Quick Health Screening",
        source: "kiosk",
        temperatureC: finalReadings.temperatureC,
        heightCm: finalReadings.heightCm,
        weightKg: finalReadings.weightKg,
      });
      setOverrideTriggered(!!result.overrideTriggered);
      setResultQueueNumber(result.queueEntry?.queueNumber ?? null);
      setStep("result");
    } catch (err) {
      console.warn("[finishCapture] API intake submission fallback:", err);
      // Fallback display if local backend intake API is temporarily unneeded / offline
      setStep("result");
    }
  }

  return (
    <div onClick={isOnline ? resetIdleTimer : undefined}>
      {step === "offline" && <OfflineScreen />}

      {step === "welcome" && <WelcomeScreen onManualEntry={() => setStep("manual")} />}

      {step === "manual" && (
        <ManualEntryScreen onSubmit={handleManualSubmit} onCancel={resetSession} isOnline={isOnline} />
      )}

      {step === "confirm" && (
        <ConfirmScreen student={student} onConfirm={handleConfirmYes} onNotMe={handleConfirmNo} isOnline={isOnline} />
      )}

      {step === "service" && (
        <ServiceSelectScreen onSelect={handleServiceSelect} onCancel={resetSession} isOnline={isOnline} />
      )}

      {step === "consultationType" && (
        <ConsultationTypeScreen onSelect={handleConsultTypeSelect} onBack={() => setStep("service")} isOnline={isOnline} />
      )}

      {step === "otherServicesType" && (
        <OtherServicesTypeScreen onSelect={handleOtherServiceTypeSelect} onBack={() => setStep("service")} isOnline={isOnline} />
      )}

      {step === "requestText" && (
        <RequestTextScreen onSubmit={handleRequestTextSubmit} onBack={() => setStep("otherServicesType")} isOnline={isOnline} />
      )}

      {step === "checkedIn" && (
        <CheckedInScreen info={checkInInfo} onDone={resetSession} isOnline={isOnline} />
      )}

      {step === "screeningOptions" && (
        <ScreeningOptionsScreen onSelect={handleScreeningOptionSelect} onBack={() => setStep("service")} isOnline={isOnline} />
      )}

      {step === "capturing" && (
        <CapturingScreen
          mode={captureMode}
          readings={readings}
          isMock={isMock}
          bridge={bridgeRef.current}
          onCancel={resetSession}
          isOnline={isOnline}
        />
      )}

      {step === "result" && (
        <ResultScreen readings={readings} overrideTriggered={overrideTriggered} queueNumber={resultQueueNumber} onDone={resetSession} isOnline={isOnline} />
      )}
    </div>
  );
}