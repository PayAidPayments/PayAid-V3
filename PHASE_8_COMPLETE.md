# Phase 8 – Playwright QA (CTO Demo) – Complete

## Summary

Phase 8 adds Playwright projects for each app (crm/hr/voice/dashboard), a CTO demo spec (dashboard → contacts → new → back, health, TTS), and the **test:demo** script. Run after **turbo dev --parallel** (no auto web server for demo).

---

## 1. Playwright config

- **playwright.config.ts**
  - **projects** extended with: **crm** (baseURL 3001), **hr** (3002), **voice** (3003), **dashboard** (3000).
  - Default project remains **chromium** (baseURL from env or 3000).

---

## 2. Demo spec

- **tests/e2e.demo.spec.ts**
  - **CTO Demo** (serial): baseURL 3001 → goto dashboard → click contacts → expect "Contacts" heading → click "New Contact" → expect "New Contact" heading or contact-form → click "Cancel" → expect URL /Contacts.
  - **CTO Demo**: GET /api/health → ok, body has db and ai.
  - **CTO Demo HR** (serial): baseURL 3002 → goto /hr/demo-business-pvt-ltd → body visible.
  - **CTO Demo Voice** (serial): baseURL 3003 → GET /api/tts?text=test&lang=en → 200, audio or JSON fallback.

---

## 3. Script

- **package.json**
  - **"test:demo"**: `PLAYWRIGHT_NO_WEB_SERVER=1 playwright test tests/e2e.demo.spec.ts`
  - Assumes apps are already running (e.g. **npm run dev:parallel**).

---

## 4. How to run

```bash
# Terminal 1: start all apps
npm run dev:parallel

# Terminal 2: run demo flows
npm run test:demo
```

---

**Commit:** `phase-8-qa`
