# Phase 1A — Testing Checklist

Use this before soft launch (Week 4) or any demo. Ensure `GROQ_API_KEY` is set (Vercel + local) and Phase 1A migration has been applied to the database.

---

## 1. Database and env

| # | Check | How to verify | Pass |
|---|--------|----------------|-----|
| 1.1 | Phase 1A migration applied | Run: `SELECT column_name FROM information_schema.columns WHERE table_name = 'Contact' AND column_name IN ('whatsappStatus','nurtureStage','predictedRevenue');` → 3 rows | ☐ |
| 1.2 | `GROQ_API_KEY` set | In Vercel env and local `.env`; app uses it for lead scoring and Retail agent | ☐ |
| 1.3 | CRM module enabled for tenant | Contact/Leads and score APIs work for test tenant | ☐ |

---

## 2. Lead scoring (Groq)

| # | Check | How to verify | Pass |
|---|--------|----------------|-----|
| 2.1 | GET score with Groq | `GET /api/leads/score?contactId=<valid-contact-id>&useGroq=true` (with auth). Response has `score`, `stage`, `nurture_action`, `predicted_mrr` | ☐ |
| 2.2 | POST rescore with Groq | `POST /api/leads/score` body `{ "contactId": "<id>", "useGroq": true }`. Response 200; contact’s `leadScore`, `nurtureStage`, `predictedRevenue` updated in DB | ☐ |
| 2.3 | Score without Groq (fallback) | `GET /api/leads/score?contactId=<id>` (no useGroq). Response has `score`, `components` (no Groq-specific fields required) | ☐ |
| 2.4 | Batch score | `POST /api/leads/score` body `{ "batch": true }`. All leads for tenant scored; no 5xx | ☐ |

---

## 3. Contact detail UI (Lead Nurture Flow)

| # | Check | How to verify | Pass |
|---|--------|----------------|-----|
| 3.1 | Nurture card visible for prospect | Open a contact with stage prospect/lead. Right column shows “Nurture flow” card | ☐ |
| 3.2 | Nurture card shows stage and action | After loading, card shows stage (hot/warm/cold), “Recommended action” text, and “Rescore with AI (Groq)” button | ☐ |
| 3.3 | Predicted MRR in ₹ | If `predicted_mrr` > 0, display shows “Predicted MRR ₹X,XXX” (Indian format) | ☐ |
| 3.4 | Rescore button works | Click “Rescore with AI (Groq)”. Button shows loading then updates stage/action/score without error | ☐ |
| 3.5 | Not shown for customer | Contact with stage “customer” does not show Nurture flow card | ☐ |

---

## 4. WhatsApp webhook and rescore

| # | Check | How to verify | Pass |
|---|--------|----------------|-----|
| 4.1 | Webhook accepts incoming message | Send a WhatsApp message to the connected number. `POST /api/whatsapp/webhooks/message` returns 200 | ☐ |
| 4.2 | Contact created/linked | For the sender number, Contact exists and is linked via WhatsappContactIdentity | ☐ |
| 4.3 | whatsappStatus updated on reply | After webhook run, contact’s `whatsappStatus` is `{ sent: true, opened: true, replied: true }` (or equivalent) | ☐ |
| 4.4 | Rescore triggered in background | With GROQ_API_KEY set, after a reply the same contact’s `leadScore` / `nurtureStage` / `predictedRevenue` update shortly after (may check DB or UI after refresh) | ☐ |

---

## 5. Retail Inventory Agent (Agent #1)

| # | Check | How to verify | Pass |
|---|--------|----------------|-----|
| 5.1 | Agent endpoint requires auth | `POST /api/agents/retail-inventory` without auth → 401 | ☐ |
| 5.2 | Agent runs successfully | `POST /api/agents/retail-inventory` with valid CRM auth. Response 200 with `reorderItems`, `totalInr`, `summaryMessage`, `whatsappSupplierMessage`, `triggeredAt` | ☐ |
| 5.3 | No low-stock case | If no products at or below reorder level, `reorderItems` is `[]`, `summaryMessage` indicates no reorder needed | ☐ |
| 5.4 | Low-stock case | Create a product with stock ≤ reorder level (or use InventoryLocation). Run agent again; `reorderItems` has at least one item; amounts in ₹ | ☐ |
| 5.5 | Supplier message in Indian format | `whatsappSupplierMessage` contains “₹” and no “$” or “USD” | ☐ |

---

## 6. Regression and performance

| # | Check | How to verify | Pass |
|---|--------|----------------|-----|
| 6.1 | Existing lead list loads | CRM Leads page loads without error; table/sheet view works | ☐ |
| 6.2 | Contact detail loads | Open any contact; no console errors; existing cards (timeline, AI Fit, Quick actions) work | ☐ |
| 6.3 | Vercel build | `npm run build` (or Vercel build) succeeds | ☐ |
| 6.4 | No TypeScript errors | `npm run type-check` (or equivalent) passes | ☐ |

---

## Sign-off

- **Tester:** ________________  
- **Date:** ________________  
- **Environment:** ☐ Staging  ☐ Production  
- **All critical checks passed:** ☐ Yes  ☐ No (list failures): ________________  

**Notes:**  
_________________________________________________________________  
_________________________________________________________________
