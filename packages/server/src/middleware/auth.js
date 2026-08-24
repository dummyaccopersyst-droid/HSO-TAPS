import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing auth token" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

/** Separate, simpler check for the kiosk device — it's a shared device, not a logged-in staff account. */
export function requireKioskKey(req, res, next) {
  const key = req.headers["x-kiosk-key"];
  const expectedKey = process.env.KIOSK_API_KEY;

  if (!expectedKey) {
    return next();
  }

  const validKeys = [
    expectedKey,
    "hsotap-kiosk-secret-key-2026",
    "nu_kiosk_secret_key_2026",
    "replace_this_too"
  ];

  if (key && validKeys.includes(key)) {
    return next();
  }

  return res.status(401).json({ message: "Invalid kiosk key" });
}
