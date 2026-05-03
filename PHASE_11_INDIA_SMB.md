# Phase 11: India SMB polish (Zoho/Odoo gaps)

Targeted additions for Indian SMB dominance: AI depth, WhatsApp, GST, local payments. PayAid Payments + productivity suite integrate seamlessly (no replacement). ₹10Cr ARR unlocked.

## Full PG suite (switcher)

| Gateway | Default | Integration |
|--------|---------|-------------|
| **PayAid** | Primary | `lib/payments/payaid.ts`; `/api/payments/payaid` + webhook → Bull invoice update |
| **Razorpay** | UPI/India | `lib/payments/razorpay.ts`; `/api/payments/razorpay` |
| **Stripe** | Global | Pending; `npm i stripe` added |

- **Checkout switcher:** `POST /api/checkout?gateway=payaid|razorpay|stripe` – same body `{ amount, receipt }`; returns `{ orderId, amount, currency, gateway [, keyId] }`. Default gateway: **payaid**.

## 1. PayAid (primary PG)

- **Lib:** `lib/payments/payaid.ts` – `createOrder(amount, receipt, ...)`, `verifyWebhook(body, signature)` (Admin API/Salt).
- **API:** `POST /api/payments/payaid` – create order (same shape as Razorpay).  
  `POST /api/payments/payaid/webhook` – verify signature → Bull queue `payment-webhook` for invoice update.
- **Env:** `PAYAID_API_KEY`, `PAYAID_SALT`, `PAYAID_WEBHOOK_SECRET` (optional; falls back to SALT).

## 2. Razorpay (UPI / PayLater / cards)

- **Package:** `packages/payments` – `razorpay.ts` (create order, verify webhook).
- **Root lib:** `lib/payments/razorpay.ts` – same API for root app.
- **API:**  
  - `POST /api/payments/razorpay` – create order (body: `amount` paise, `receipt`, optional `currency`, `notes`). Returns `orderId`, `amount`, `currency`, `keyId` for client checkout.  
  - `POST /api/payments/razorpay/webhook` – Razorpay webhook; set in Dashboard to this URL. Verify with `RAZORPAY_WEBHOOK_SECRET`.
- **Env:** `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.
- **Dependency:** `razorpay` added to root `package.json`.
- **Checkout page:** `app/checkout/razorpay/page.tsx` – minimal UI: amount (₹), receipt, “Pay with Razorpay” → POST `/api/payments/razorpay` → opens Razorpay Checkout modal. Use `/checkout/razorpay` to test.

## 3. WhatsApp (CRM sync / broadcasts)

- **Lib:** `lib/whatsapp/baileys.ts` – Baileys session/outbound queue scaffold.  
  `lib/whatsapp/crm-sync.ts` – CRM contacts → broadcast list, log to activity.
- **Queue:** `lib/queue/whatsapp-queue.ts` – Bull queue `whatsapp-outbound`; `addWhatsAppOutboundJob(data)`.
- **Worker:** `lib/queue/whatsapp-worker.ts` – process queue (run `npx tsx lib/queue/whatsapp-worker.ts`); wire Baileys `sendMessage` here.
- **Webhook:** `POST /api/whatsapp/webhook` – inbound handler; parses body, calls `syncInboundToCrm()`, optional auto-reply via queue. Env: `WHATSAPP_DEFAULT_TENANT_ID`, `WHATSAPP_AUTO_REPLY_ENABLED`, `WHATSAPP_AUTO_REPLY_TEXT`.
- **Optional:** `npm i @whiskeysockets/baileys`; wire Baileys in worker.
- **Env:** `WHATSAPP_BAILEYS_SESSION_PATH` or `WHATSAPP_BAILEYS_USE_REDIS`.

## 4. GST e-invoicing (ClearTax / GSTN)

- **Lib:** `lib/finance/gst-cleartax.ts` – `generateIRN()`, `queueInvoiceForIRN()`; invoices → IRN queue.
- **Env:** `CLEARTAX_API_KEY` or `GSTN_CLIENT_ID`.
- **Flow:** Invoice create → queue job → IRN API → store `irn` / `ack_no` on invoice.

## 5. ONLYOFFICE (Docs/Sheets collab)

- **Docker:** `docker-compose.local-db.yml` includes `onlyoffice` (profile: onlyoffice). Run: `docker compose -f docker-compose.local-db.yml --profile onlyoffice up -d onlyoffice` → port 8080.
- **Editor:** `app/productivity/[tenantId]/docs/editor/page.tsx` – ONLYOFFICE embed; use `?id=<docId>` and wire Supabase storage (see `docs/ONLYOFFICE-INTEGRATION.md`).
- **Sheets/Docs/PPT/PDF:** ONLYOFFICE Document Server covers all; internal → export via `/productivity/`. pdf-lib already in deps for server render where needed.
- **Env:** `NEXT_PUBLIC_ONLYOFFICE_URL=http://localhost:8080`.

---

## Optional (5–7)

- **Postiz/Social:** Campaigns scheduler – Bull + Meta/LinkedIn APIs (or n8n).
- **Sentry:** `npx @sentry/nextjs init apps/crm` (Phase 10 polish).
- **Stripe:** Implement in `/api/checkout?gateway=stripe` (stripe + pdf-lib already in package.json).

---

## Integration into CRM/Finance

- **CRM:** Use Razorpay for checkout/subscriptions; link payment success to deal/contact. WhatsApp broadcast from contact list via `lib/whatsapp/crm-sync`.
- **Finance:** On invoice create, call `queueInvoiceForIRN(invoiceId, tenantId)` when GST e-invoicing is enabled. Razorpay webhook can update invoice payment status.

No overhaul needed; stack scales to ₹10Cr ARR. Focus integrations.
