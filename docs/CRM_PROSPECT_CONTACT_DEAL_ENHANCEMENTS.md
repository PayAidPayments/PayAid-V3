# CRM Prospect / Contact / Deal Page – Best-in-Market Enhancements

**Goal:** Make PayAid’s prospect, contact, and deal pages best-in-class (vs. Salesforce, HubSpot, Pipedrive, Zoho) while staying India SMB–focused (INR, GST, WhatsApp, local workflows).

---

## 1. Contact / Prospect Page

### Already in place
- Activity timeline (scoped to contact), Add activity (note, task, call, meeting)
- Quick actions (Create Deal, Task, Email, WhatsApp, Log Call, Invoice)
- AI Assist (enrich, generate email/WhatsApp from intent)
- Lead nurture (stage, recommended action, rescore with Groq)
- Lead allocation, nurture sequences, AI fit score

### High-impact enhancements

| # | Enhancement | Why it’s best-in-market | Effort |
|---|-------------|---------------------------|--------|
| 1 | **Unified communication strip** | Single strip: last email/WhatsApp/call + “Reply”, “Call”, “WhatsApp” without leaving the page. Inline compose (email/WhatsApp) and “Log call” form so reps don’t switch tabs. | 2–3 wks |
| 2 | **Contact 360 (account + related)** | One place: this contact + linked account (company) + other contacts at same account + all deals/orders for the account. Reduces context switching. | 2 wks |
| 3 | **Next-best-action card** | One clear card: “Suggested: Send proposal by Fri” or “No touch in 12 days – send follow-up” with one-click action (create task, open email, log call). Uses existing nurture + activity data. | 1–2 wks |
| 4 | **Meeting scheduler (Calendly-style)** | “Schedule meeting” opens a bookable link or slots; once booked, creates meeting + calendar event and logs on timeline. | 2 wks |
| 5 | **Document/attachment strip** | List of files (proposals, contracts, forms) linked to contact/account with upload + open. Optional: AI summary of last proposal. | 1–2 wks |
| 6 | **Bulk actions from list + smart filters** | From Contacts/Leads list: multi-select → “Add to sequence”, “Assign”, “Export”, “Merge”. Saved views (e.g. “No touch 7 days”, “High score unassigned”). | 2 wks |

### Medium-impact (polish)

- **Breadcrumb + keyboard nav:** Contact name breadcrumb; shortcuts (e.g. `E` = email, `T` = task, `N` = note).
- **Field-level history:** “Email changed from X to Y on date” for key fields (email, phone, company).
- **Duplicate detection:** On save, “Possible duplicate: [Contact B]” with merge option.
- **Tags / custom segments:** Tags or segments on contact; filter lists and use in sequences.

---

## 2. Deal Page

### High-impact enhancements

| # | Enhancement | Why it’s best-in-market | Effort |
|---|-------------|---------------------------|--------|
| 1 | **Visual pipeline stage (Kanban)** | Deal detail shows stage as a pipeline step; “Move to next stage” with one click; optional checklist (e.g. “Proposal sent”, “Demo done”) before moving. | 2 wks |
| 2 | **Deal timeline (milestones)** | Timeline of key events: created, stage changes, meetings, proposal sent, won/lost. Feeds from interactions + stage history. | 1–2 wks |
| 3 | **Win/loss + reason** | On close (won/lost): mandatory or optional “Reason” and “Competitor”. Report and AI insights on win/loss reasons. | 1 wk |
| 4 | **Revenue / forecasting link** | Deal value and stage feed into “Weighted pipeline” and “Forecast” (by rep/team/month). Deal page shows “Contributes ₹X to [month] forecast”. | 2 wks |
| 5 | **Approval / discount rules** | Discount above X% or deal above ₹Y requires approval. Deal page shows “Approval pending” and approver list. | 1–2 wks |
| 6 | **Product/line items on deal** | Deal has line items (products, qty, price, discount). Subtotal, tax (GST), total. Feeds quote/contract and invoice. | 2–3 wks |

### Medium-impact

- **Email/meeting from deal:** “Email contact” and “Schedule meeting” from deal header (contact pre-filled).
- **Clone deal:** “Duplicate deal” for repeat deals with same contact/account.
- **Deal health score:** Simple score from age, last activity, stage; traffic light or badge on card.

---

## 3. Cross-Cutting (Contact + Deal)

| # | Enhancement | Why it’s best-in-market | Effort |
|---|-------------|---------------------------|--------|
| 1 | **Page-level AI that acts** | “Ask PayAid AI” not only answers questions but can create task, draft email, suggest next step and run it (with confirm). | 2 wks |
| 2 | **Mobile-first detail view** | Responsive contact/deal detail with sticky CTA (Call / Email / WhatsApp), collapsible sections, and large tap targets. | 1–2 wks |
| 3 | **Audit trail** | “Who changed what when” for contact and deal (field-level or key fields). Link from page to audit log filtered by entity. | 1 wk |
| 4 | **Templates (email + WhatsApp)** | Saved templates for “Intro”, “Proposal follow-up”, “Post-demo”; pick from Quick Action or AI Assist; variables ({{contact.name}}, {{deal.value}}). | 1–2 wks |
| 5 | **INR + GST everywhere** | All amounts in ₹; GST breakdown on deal/quote; “Tax summary” where relevant. Align with existing formatINR() and GST rules. | Ongoing |

---

## 4. Suggested order (next 3–6 months)

**Phase A (quick wins)**  
1. Next-best-action card on contact (use existing nurture + activity).  
2. Win/loss + reason on deal close.  
3. Deal timeline (stage + key events).  
4. Email/WhatsApp templates (variables + picker).

**Phase B (differentiation)**  
5. Unified communication strip on contact (compose + log call inline).  
6. Visual pipeline stage + checklist on deal.  
7. Contact 360 (account + related contacts + deals).  
8. Product/line items on deal + GST.

**Phase C (scale)**  
9. Meeting scheduler.  
10. Bulk actions + saved views on lists.  
11. Page-level AI that can act (task, email, suggest).  
12. Approval/discount rules on deals.

---

## 5. Differentiators vs. global CRMs

- **India-first:** INR, GST on deal/quote, WhatsApp in the flow, UPI/payment links, Indian compliance (e.g. DPDP).  
- **Single surface:** Contact + deal + timeline + actions + AI on one page; fewer tabs.  
- **AI that does things:** Not only “why did we lose?” but “create follow-up task” and “draft WhatsApp for this deal”.  
- **SMB-friendly:** Fast load, clear CTAs, templates, and simple pipeline so small teams adopt quickly.

Use this as a product backlog: pick by impact vs. effort and align with the main roadmap (e.g. 13-roadmap.md) and your design system (unified layout, PageAIAssistant, StatCard/ChartCard).
