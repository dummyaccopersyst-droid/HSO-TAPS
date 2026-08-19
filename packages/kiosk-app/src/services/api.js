import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
  headers: { "x-kiosk-key": import.meta.env.VITE_KIOSK_API_KEY || "hsotap-kiosk-secret-key-2026" },
});

export const lookupStudent = (studentId) => api.get(`/students/lookup/${studentId}`).then((r) => r.data);

export const submitIntake = (payload) => api.post("/kiosk/intake", payload).then((r) => r.data);
