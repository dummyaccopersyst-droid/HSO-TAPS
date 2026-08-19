# HSO-TAP
IoT-Enabled Self-Service Kiosk + Web-Based Clinic Management System for NU Fairview Health Services Office.

## Status

| Component | Status |
|---|---|
| Kiosk app — UI/design | ✅ Styled, matches design mockups (all 12 screens) |
| Kiosk app — core flow | ✅ RFID/manual check-in, service routing, capture, offline fallback |
| Admin portal — UI/design | ✅ Styled (Login, Dashboard, EMR, Analytics, Forms, Admin) |
| Admin portal — feature wiring | 🟡 In progress — not all actions verified end-to-end |
| Server/API | 🟡 Models, routes, sockets, queue numbering in place; not fully tested |
| Device bridge | 🟡 Mock mode works; real hardware integration untested |
| Firmware (ESP32) | 🟡 Written, not yet verified on physical sensors |
| Automated tests | ✅ Implemented (Selenium WebDriver E2E test suite in `packages/tests`) |

This is an active student/prototype project, not production-ready — see `docs/` for architecture notes and known gaps.

## Monorepo layout

```
hso-tap/
├── packages/
│   ├── server/          Express + MongoDB API, real-time queue via Socket.IO
│   ├── kiosk-app/        React touchscreen UI (runs full-screen on the kiosk's Raspberry Pi)
│   ├── admin-portal/     React staff/admin portal (Dashboard, EMR, Analytics, Forms, Admin)
│   └── device-bridge/    Local Node service on the kiosk Pi — reads RFID/thermal/scale
│                         data from the ESP32 over serial and relays it to kiosk-app + server
├── firmware/             Arduino/ESP32 sketches for each sensor
└── docs/                 Architecture, MongoDB schema, hardware setup notes
```

## Why this shape
- **server** is the single source of truth (MongoDB). Both `kiosk-app` and `admin-portal` only
  talk to it over REST/WebSocket — neither touches the database directly.
- **device-bridge** isolates all serial/hardware code from the UI. The kiosk React app never
  talks to a COM port directly; it just listens on a local WebSocket. This means you can develop
  and demo the kiosk UI on a laptop with zero hardware attached (see "mock mode" in
  `docs/HARDWARE_SETUP.md`).
- **firmware** is kept out of the Node packages since it's compiled separately (Arduino IDE / PlatformIO).

## Quick start (software only, no hardware needed yet)
```bash
# 1. Start MongoDB (see docker-compose.yml) and the API
docker compose up -d mongodb
cd packages/server && cp .env.example .env && npm install && npm run dev

# 2. Start the admin portal
cd packages/admin-portal && npm install && npm run dev

# 3. Start the kiosk app (mock hardware mode is on by default)
cd packages/kiosk-app && npm install && npm run dev
```

See `docs/ARCHITECTURE.md`, `docs/MONGODB_SCHEMA.md`, and `docs/HARDWARE_SETUP.md` for details.
