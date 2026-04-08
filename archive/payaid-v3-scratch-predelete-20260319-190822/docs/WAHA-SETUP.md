# WAHA WhatsApp HTTP API – PayAid Setup

**WAHA** = self-hosted WhatsApp multi-device API (no phone number limits). PayAid uses it for Marketing (Mautic) campaigns and Sales Studio (Frappe) inbound relay.

---

## Prerequisites

- Docker + Docker Compose
- Business or personal WhatsApp number
- Port **3000** free (or change in compose)

---

## 1. Run WAHA

From repo root:

```bash
cd waha
docker compose up -d
```

Or single session (no compose):

```bash
docker run -d --name waha -p 3000:3000 -v waha_session:/app/session devlikeapro/waha:latest
```

**Verify:**

```bash
curl http://localhost:3000/health
# → {"status": "ok"}
```

---

## 2. Pair WhatsApp (QR)

- **Browser:** http://localhost:3000/qr → scan with WhatsApp (Linked Devices).
- **API:** `curl http://localhost:3000/sessions` → use `qr` from response.

Multi-session (e.g. per tenant):

```bash
curl -X POST http://localhost:3000/sessions -H "Content-Type: application/json" -d '{"name": "business1"}'
# New QR for session "business1"
```

---

## 3. PayAid env

In `apps/web/.env`:

```env
PAYAID_WAHA_URL=http://localhost:3000
PAYAID_MARKETING_WEBHOOK_TOKEN=your_secret_for_mautic_webhook
```

---

## 4. Webhook (inbound → PayAid → Frappe)

Point WAHA at the PayAid shell so incoming messages are relayed to Sales Studio (Frappe):

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-payaid-domain/api/webhooks/whatsapp",
    "events": ["message", "reaction"]
  }'
```

Replace `https://your-payaid-domain` with your real shell URL (e.g. `https://app.payaid.com`). Local dev: use ngrok or similar so WAHA can reach your machine.

---

## 5. Mautic → WhatsApp (outbound)

**Campaign webhook in Mautic:**

- **URL:** `https://your-payaid-domain/api/marketing/whatsapp/send`
- **Method:** POST
- **Headers:** `Authorization: Bearer your_secret_for_mautic_webhook` (same as `PAYAID_MARKETING_WEBHOOK_TOKEN`)
- **Body (example):**

```json
{
  "session": "default",
  "contacts": [{"phone": "919876543210", "firstName": "Phani"}],
  "template": "lead_nurture",
  "templateParams": ["Quote image", "₹50K deal"],
  "media_url": "https://example.com/quote.jpg",
  "buttons": ["YES", "NO", "LATER"]
}
```

- **Plain text (no template):** use `"text": "Hello {{1}}"` and omit `template`.
- **Image only:** use `media_url` and optional `text` as caption.

Templates must be Meta-approved (WhatsApp Manager → Template Manager).

---

## 6. Test flow

1. WAHA running → http://localhost:3000/qr → scan.
2. `curl -X POST http://localhost:3000/api/sendText -H "Content-Type: application/json" -d '{"session":"default","chatId":"919876543210@c.us","text":"Test from PayAid"}'`
3. Reply on WhatsApp → webhook fires → PayAid forwards to Frappe (if configured).
4. Mautic campaign → webhook → PayAid → WAHA → WhatsApp.

---

## Troubleshooting

| Issue           | Fix |
|-----------------|-----|
| No QR           | `curl http://localhost:3000/sessions` to force new QR |
| Disconnected    | Re-scan QR (Linked Devices) |
| Flood wait      | Rate limit: ~1 msg/sec between sends |
| No delivery     | Use chatId format `919876543210@c.us` (no +) |
| 503 WAHA not set| Set `PAYAID_WAHA_URL` in `apps/web/.env` |

Multi-tenant: one WAHA instance, **one session per tenant** (e.g. `tenant1_session`, `business1`).
