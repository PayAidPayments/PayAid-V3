# Voice Agents – Roadmap & Blueprint

**Vision:** India's first SMB-grade voice AI platform — self-hosted TTS + native PayAid Payments + CRM sync.  
*(Core implementation and VEXYL-TTS are done.)*

---

## 1. One-off / setup (finish current stack)

| Item | Action |
|------|--------|
| **DB migration** | `npx prisma generate` then `npx prisma db push` |
| **Env vars** | Copy from `.env.example`: `CHROMA_URL`, optional `VEXYL_*`, `BHASHINI_*`, `INDICPARLER_*` |
| **Service checks** | Confirm Chroma, Ollama, AI Gateway (or TTS containers) are up |

---

## 2. Core Positioning

**"Voice Agents: Your 24×7 sales & support team"**

- **Inbound:** Answer calls, qualify leads, book meetings.
- **Outbound:** Reminder calls, collections, campaigns.
- **WhatsApp sync:** Lead interested → instant voice follow-up.
- **CRM auto-sync:** Call transcript → new deal + activity log.

**Zero-cost stack:** VEXYL-TTS + Twilio SIP + Groq LLM + Supabase.

---

## 3. Feature Masterplan (Priority Order)

### Updated Masterplan

| Phase | Scope | Timeline |
|-------|--------|----------|
| **Phase 0** | DND scrubbing + basic analytics | Today |
| **Phase 1** | Agent Builder + Inbound (current blueprint) | 1 week |
| **Phase 2** | Campaigns + WhatsApp sync + Transcription search | 3 days + |
| **Phase 3** | Voice cloning + barge-in + multi-channel | 1 week |

---

### Phase 0 (Today) — Compliance & Insights

- **DND scrubbing** — Pre-call TRAI compliance; auto-filter DND before campaigns.
- **Basic analytics** — Live call metrics, answered %, duration, conversion (see §3a).

### Phase 1: MVP (1 Week) — Inbound Voice Agent + Basic CRM Sync

1. **Agent Builder** (`/voice-agents/[tenantId]/builder` or `/studio`)
   - Drag-drop flow builder:
     - **Greeting** — e.g. "Namaste, PayAid se bol raha hun..." (TTS)
     - **Intent detection** — LLM classifies: invoice, support, sales
     - **Responses** — TTS text + quick replies
     - **Actions** — CRM lookup, create deal, transfer to human
     - **End call / WhatsApp handover**
2. **Numbers & Telephony**
   - Buy Twilio number → SIP trunk to VEXYL Gateway → PayAid agent.
   - Regional languages (Hindi, Tamil, etc.), voice selection (VEXYL 44 voices).
   - Call recording + transcription.
3. **CRM Integration**
   - Call ends → auto-create: Activity log in contact timeline; Deal if qualified (lead score >70); WhatsApp follow-up if needed.

### Phase 2: Campaigns (3 Days) + WhatsApp + Transcripts

**Outbound campaigns** from `/voice-agents/[tenantId]/campaigns`:

1. Reminder campaigns (invoices, appointments)
2. Lead nurturing (follow-up after website form)
3. Customer surveys ("How was your experience?")
4. Collections ("Your ₹5k invoice due tomorrow")

**Sequential dialer:** CSV upload → call list → pace control.

**+ Call transcription search** — Full-text search on transcripts; filters; playable snippets (§3a.3).

### Phase 3: Advanced (1 Week)

1. **Website triggers** — Form submit → instant outbound call
2. **WhatsApp sync** — "Interested" message → voice call 5 min later
3. **Lead scoring from calls** — Sentiment + keywords
4. **Human handover** — Transfer to manager
5. **A/B testing** — Different scripts/voices
6. **Voice cloning** — Upload 30s → custom voice per tenant (§3a.4)
7. **Barge-in** — Caller interrupts → AI stops instantly (§3a.5)
8. **Multi-channel sequences** — WhatsApp → no reply → Voice → Email (§3a.6)

---

## 3a. Six High-Impact Enhancements (Zero Cost)

### 1. Real-Time Call Analytics Dashboard

**Route:** `/voice-agents/[tenantId]/analytics` (extend existing Analytics page)

**Metrics (live updating):**
- Calls Today: 247 | Answered: 78% | Avg Duration: 2:14
- Conversion Rate: 23% (bookings/payments)
- Sentiment: 87% Positive
- Top Intent: "Invoice status" (42%)

**Charts:**
- Hourly call volume
- Conversion funnel
- Language breakdown (Hindi 62%, English 28%)
- Agent performance (Script A vs B)

**Cursor:** Create analytics page with Recharts + Supabase queries from call logs / `VoiceAgentCall`.

---

### 2. Free DND Scrubbing (TRAI Compliance)

**Pre-call DND check:**
- Free API: e.g. [manthanitsolutions.com/dnd/api](https://manthanitsolutions.com/dnd/api) (1000/day free), or [easygosms DND Search API](https://easygosms.com/DND-Search-API.php)
- Self-host option: [github.com/shyammohankanojia/dndchecker](https://github.com/shyammohankanojia/dndchecker)

**Flow:** Campaign upload → auto-filter DND numbers → SMS fallback for DND.

**Cursor:** Add `/voice-agents/[tenantId]/campaigns/dnd-scrub` (or `/api/voice/campaigns/dnd-scrub`) + campaign setting **"Auto-remove DND"**.

---

### 3. Call Transcription Search

**Route:** `/voice-agents/[tenantId]/transcripts`

**Features:**
- Full-text search: e.g. "invoice", "meeting", "complaint"
- Filters: Date, Language, Sentiment, Outcome
- Play snippet on hover
- Export conversations CSV

**Cursor:** Full-text search on `call_transcript` (or equivalent) + sentiment tags; playable audio links.

---

### 4. Voice Cloning (Your Voice)

**Flow:** Upload 30s recording → custom voice for your agents.

**Options:** VEXYL custom speaker training, or Coqui-TTS (free).

**Cursor:** Voice upload → `YourVoice-{tenantId}` → select in agent config (new voice option in builder).

---

### 5. Barge-In & Interruption Handling

**Behaviour:** Caller interrupts → AI stops talking instantly.

**Implementation:** Use VEXYL Gateway VAD (voice activity detection); wire barge-in events → reset LLM context / stop TTS.

**Cursor:** Wire VEXYL barge-in events → reset LLM context; ensure TTS stream can be cut immediately.

---

### 6. Multi-Channel Sequences

**Campaigns span channels**, e.g.:
1. WhatsApp → no reply → Voice call → still no → Email

**Data:** Add `channel_sequence` array to campaigns table (e.g. `["whatsapp", "voice", "email"]` with delays/rules).

**Cursor:** Add `channel_sequence` to campaign schema + executor that runs next channel when previous has no reply/timeout.

---

## 4. Technical Stack (Self-Hosted, ~₹2k/mo)

| Layer | Choice | Cost |
|-------|--------|------|
| **Telephony** | Twilio SIP | Paid per min (Twilio India) |
| **STT** | Whisper (Groq free tier) | ~₹0.10/min |
| **LLM** | Llama 3.1 / Grok (Groq) | ~₹0.50/min |
| **TTS** | VEXYL-TTS | ₹0 (electricity) |
| **Orchestration** | Next.js API | — |
| **Data** | Supabase (existing) | — |

**Total:** ~₹1/min → **10x cheaper** than Retell/ElevenLabs.

---

## 5. UI/UX Blueprint

### Agent Studio (`/voice-agents/[tenantId]/studio`)

- **Left:** Flow builder (drag-drop canvas)
- **Center:** Live preview
- **Right:** Test calls

**Flow nodes:**

1. **Greeting** — TTS dropdown (e.g. Hindi-Divya, Tamil-Priya)
2. **Intent LLM** — "invoice enquiry", "support", "sales"
3. **CRM Lookup** — Find contact by phone
4. **Responses** — Script editor
5. **Actions** — Create deal, send WhatsApp, end call
6. **Human Transfer**

**Voice preview:** Click node → hear TTS sample.

### Campaign Manager

| Campaign Type     | Contacts | Status      | Conversion |
|-------------------|----------|-------------|------------|
| Invoice Reminder  | 1,247    | 78% complete| 23% paid   |
| Lead Follow-up    | 456      | Paused      | 12% booked |
| NPS Survey        | 892      | Complete    | 4.2 avg    |

**[New Campaign]** → Upload CSV → Select Agent → Schedule → Launch

---

## 6. Competitor Features → PayAid Winners

| Competitor | Feature | PayAid implementation |
|------------|---------|------------------------|
| **Cloopen** | Multilingual IVR | VEXYL 22 langs + drag-drop flows |
| **Verloop** | WhatsApp sync | Native PayAid WhatsApp → voice handoff |
| **Retell** | CRM function calling | Supabase writes during call (deal creation) |
| **ElevenLabs** | Voice cloning | VEXYL speaker selection (44 voices) |
| **Ringg** | Campaigns | Sequential dialer + A/B testing |

**PayAid edge:** Full Business OS context — Voice Agent sees CRM deals, Finance invoices, HR employee data.

---

## 7. Cursor Implementation Roadmap

### Step 1: Agent Builder (2 days)

- **Route:** `/voice-agents/[tenantId]/studio`
- Drag-drop canvas (e.g. React Flow)
- Nodes: Greeting (TTS), Intent (LLM), CRM Lookup, Response, Actions
- Right panel: Live voice preview (Web Speech API fallback)
- Save as JSON workflow → e.g. `/api/voice/agents` or extend existing agent API
- Deploy button → assign Twilio number

### Step 2: Telephony Backend (2 days)

- `POST /api/voice/inbound` → VEXYL Gateway → LLM → Supabase writes
- `POST /api/voice/outbound` → Twilio queue → agent execution

### Step 3: Campaigns (1 day)

- `/voice-agents/[tenantId]/campaigns`
- CSV upload → contact list → agent assignment → scheduler

---

## 7a. Cursor Enhancement Prompts (Copy-Paste)

### DND Scrubbing

```
Add `/voice-agents/[tenantId]/campaigns/dnd-scrub` (or API `/api/voice/campaigns/dnd-scrub`):

1. CSV upload → check each number via free DND API (e.g. manthanitsolutions.com/dnd/api, 1000/day free)
2. Output: dnd.csv (remove), non_dnd.csv (use for campaign)
3. Campaign setting: "Auto-scrub DND before launch" (checkbox)
```

### Analytics Dashboard

```
Create or extend `/voice-agents/[tenantId]/analytics`:

1. Live metrics cards: calls today, answered %, avg duration, conversion rate
2. Charts: Hourly volume, language breakdown, sentiment trend (Recharts)
3. Tables: Top intents, agent performance (Script A vs B)
4. Filters: Date range, campaign, language
5. Data: Supabase queries from call_logs / VoiceAgentCall
```

### Transcription Search

```
Add `/voice-agents/[tenantId]/transcripts`:

1. Full-text search on call transcript column
2. Filters: Date, Language, Sentiment, Outcome
3. Playable audio snippets on hover/click
4. Export conversations to CSV
```

---

## 7b. WebRTC Voice Demo Blueprint (Production-Ready)

**Positioning:** WebRTC demo is production-ready. No phone numbers needed. Visitors talk directly in the browser and experience full Voice Agent capabilities instantly. **Zero telephony cost.** **Real conversation.** **Full agent capabilities.**

**Target:** Instant demo → instant leads. No signup friction. **10x conversion** vs "contact sales".

---

### 7b.1 PayAid Payments Tele-Sales Demo Agent (Management Demo)

**Purpose:** Female tele-sales agent for **PayAid Payments Pvt Ltd** to demo to the Management Team. She calls (or is demo’d in-browser) as a professional sales rep who qualifies leads and sells **domestic and cross-border payment gateway** solutions.

**Agent profile:**
- **Name:** Priya – PayAid Payments Tele-Sales
- **Voice:** Female (VEXYL: `divya-calm` or `priya-warm`)
- **Language:** English (primary for management demo); optional Hindi.
- **Purpose:** Sales

**What she is trained on:**
- **Company:** PayAid Payments Pvt Ltd – payment gateway and payment solutions.
- **Products:** Domestic payment acceptance (INR, cards, UPI, wallets) and **cross-border payment acceptance** (multi-currency, international cards, settlements).
- **Discovery questions:** (1) Do you sell any products online? (2) Do you have a website? (3) Who is your existing payment gateway?
- **Pitch:** PayAid Payments for domestic + cross-border acceptance; ease of integration, settlement, compliance, and support.

**Create in app (Voice Agents → New):**

| Tab | Field | Value |
|-----|--------|--------|
| **Basics** | Agent Name | `Priya - PayAid Payments Tele-Sales` |
| | Purpose | Sales |
| | Language | English |
| | Voice | Divya (Female, Calm) or Priya (Female, Warm) |
| | Greeting Script | See below |
| **Script** | invoice | N/A (use sales) |
| | support | One-line support pitch + offer to connect. |
| | sales | See “Sales script” below |
| **CRM** | Objections | See “Objections” below |

**Greeting script (copy-paste):**

```
Hello, this is Priya calling from PayAid Payments. We help businesses accept payments online – both in India and from customers abroad. Do you currently sell any products or services online? And do you have a website? I’d love to understand who you use for payments today and see if we can help you with domestic or cross-border acceptance. Would you have two minutes to chat?
```

**Sales script (intent: sales):**

```
We at PayAid Payments offer a single integration for both domestic payments – UPI, cards, wallets in INR – and cross-border payments so you can accept international cards and settle in your currency. We focus on easy integration, quick settlement, and compliance. If you share your website or business type, I can tell you exactly how we’d fit in and what we’d need from you to get started.
```

**Objection handling (use in Create Agent → CRM tab):**

| App field | Objection | Response (paste into form) |
|-----------|-----------|----------------------------|
| **No money** | Not interested | No problem. If you ever think about changing your payment gateway or adding cross-border, we’re here. Can I leave you our name – PayAid Payments – so you can look us up when you’re ready? |
| **Wrong number** | Already have a gateway | That’s great. Do you also accept payments from outside India? If not, we can add cross-border on top of your current setup. Would that be useful? |
| **Talk to boss** | Send email / Call back later | Sure. For email – could you share your address? I’ll send a one-pager on domestic and cross-border. For callback – what day and time works? I’ll note it and call you then. May I have your name to confirm? |

**System prompt (for reference; app builds from tabs):**

- You are Priya, a professional Sales agent for **PayAid Payments Pvt Ltd**.
- Company: PayAid Payments – payment gateway for **domestic** (INR, UPI, cards, wallets) and **cross-border** (international cards, multi-currency) acceptance.
- Always ask: (1) Do you sell online? (2) Do you have a website? (3) Who is your existing payment gateway?
- Pitch: one integration for domestic + cross-border; easy integration, settlement, compliance.
- Keep replies short and natural for voice; be polite and professional.
- Handle objections as in the table above.

**Demo flow for Management:**
1. Open **Voice Agents → Demo**, select **Priya - PayAid Payments Tele-Sales**.
2. Click **Start Talking**; hear the greeting.
3. Say: *"Yes, we sell online. We have a website. We use Razorpay right now."*
4. She should respond with the PayAid Payments pitch (domestic + cross-border) and next steps.
5. Try: *"We’re not interested"* or *"Send details by email"* to show objection handling.

**Optional:** Run `npx ts-node scripts/seed-payaid-payments-demo-agent.ts` (with `TENANT_ID` set) to create this agent in the DB for your tenant.

### URLs

- `/voice-agents/[tenantId]/demo` (tenant-scoped)
- Or `/demo/voice-agent/[agentId]` (public / landing)

### Flow

```
Browser Mic → WebRTC → VEXYL Gateway → STT → LLM → TTS → Browser Speakers
```

### User Experience

**Landing:**
- Headline: "Test our Voice Agent live — no phone needed!"
- **Large mic button:** "Start Voice Demo"
- **Language:** Hindi ▾ English ▾ Tamil ▾
- **Agent:** Sales Demo | Support Demo | Collections

**Conversation:**
- Agent: *"Namaste! PayAid se bol raha hun. Aapko kis tarah madad kar sakta hun?"*
- User speaks → real-time transcript below
- Agent response (TTS) auto-plays
- **[End Demo]** **[Share Experience]**

**Post-demo:**
- "Like what you heard? Get your own agent →"
- **[Get Started Free]** **[Watch Full Features]**

### Technical Stack (Zero New Cost)

| Layer | Choice |
|-------|--------|
| Mic / STT | Web Speech API (free, built-in) |
| LLM | Existing Groq / Ollama |
| TTS | VEXYL-TTS (your server) |
| WebRTC | Native browser (no libs needed) |

**Backend:** `POST /api/voice/demo` — agentId + transcript → existing LLM pipeline → VEXYL TTS → return audio buffer. Log demo conversations (non-PII).

### Production Enhancements

- **Multi-language:** Set `recognition.lang`: hi-IN, en-IN, ta-IN, te-IN, kn-IN, ml-IN.
- **Agent selection:** Sales (qualify → book meeting) | Support (invoice lookup → resolution) | Collections (polite reminder).
- **Demo scenarios:** "Invoice status?" → "Your invoice INV-123 is due Mar 15…" | "Book demo" → "Available slots: Mar 10 3PM?" | "Support issue" → "Let me check… fixed."

### Landing Page Integration

- **Hero:** "Voice Agents that convert calls to revenue"
- **Embedded demo widget:** "Talk to our agent now → [Mic Button]"
- **Under:** "See how it works → [Video of real call]"
- **Conversion:** Demo talk → "Want this for your business?" → [Get Your Agent Free] → Agent Builder. No signup barrier → instant value.

### Cursor Instructions (Copy-Paste)

```
CREATE WEBRTC VOICE DEMO at /demo/voice-agent/[agentId] or /voice-agents/[tenantId]/demo:

1. Layout:
   - Hero: "Test Voice Agent live — speak now!"
   - Language selector (Hindi / English / Tamil)
   - Agent selector (Sales / Support / Collections)
   - Large pulsing mic button

2. WebRTC core:
   - Web Speech API for STT (webkitSpeechRecognition)
   - POST transcript → /api/voice/demo → VEXYL TTS → play audio
   - Real-time transcript display
   - Auto-play TTS response

3. Backend /api/voice/demo:
   - agentId → predefined personality/prompt
   - STT text → LLM → VEXYL TTS → return audio buffer
   - Log demo conversations (non-PII)

4. Polish:
   - Loading states, error handling
   - End demo button
   - "Get your own agent" CTA
   - Mobile responsive (HTTPS required for mic)

5. Demo scripts:
   - Sales: Qualify lead → book meeting
   - Support: Invoice lookup → resolution
   - Collections: Polite reminder

Use existing LLM/TTS pipeline. No new services.
```

### Bonus: Viral Sharing

- Post-demo: "Share your experience → [Record short clip]"
- Users record 10s reaction → auto-share to LinkedIn / Twitter.

---

## 8. Revenue Model

| Plan | Minutes/mo | Price |
|------|------------|--------|
| **Starter** | 100 min | ₹999 |
| **Growth** | 1,000 min | ₹4,999 |
| **Enterprise** | Unlimited | ₹19,999 |

**~₹0.50/min margin** → **~₹5L/mo at 10k min**.

---

## 9. Go-to-Market

**Landing copy:**  
"Voice Agents: Answer calls, book meetings, collect payments — 24×7 in Hindi & regional languages."

**SMB use cases:**

1. **Restaurants** — Table booking confirmations
2. **Retail** — Delivery updates
3. **Services** — Lead qualification
4. **Collections** — Invoice reminders

---

## 10. Other Pending (from existing docs)

- **Settings** — `/voice-agents/[tenantId]/Settings` (future)
- **Knowledge Base UI** — `/voice-agents/[tenantId]/KnowledgeBase` (API exists; dedicated page future)
- **HR Voice Payslip** — "Play my Feb payslip" → TTS reads breakdown (VEXYL Phase 2)
- **DND checking** — Now covered by Phase 0 DND scrubbing + campaign auto-scrub
- **Migration guides** — VAPI_MIGRATION_GUIDE, ARCHITECTURE_COMPARISON, CURSOR_STRICT_INSTRUCTIONS (to be created when doing full telephony migration)

---

## 11. Gaps Fixed & Next

| Gap | Fix |
|-----|-----|
| **Compliance** | DND scrubbing (Phase 0) |
| **Insights** | Live analytics + transcription search |
| **Personalisation** | Voice cloning (Phase 3) |
| **UX** | Barge-in, multi-channel sequences |

**Result:** Enterprise-complete at **~₹0.50/min**.  
**ROI:** Analytics → ~30% higher conversion from data-driven optimisation.

**Next:** Deploy DND + Analytics → test with 10 campaigns → full launch.

---

## 12. Summary

- **Done:** Core orchestrator, STT/LLM/TTS (multi-provider + VEXYL), CRUD APIs, decoupled routes, call history, analytics shell, knowledge-base API, DND/sentiment code.
- **Pending setup:** DB migration, env, service verification.
- **Blueprint:** Phase 0 (DND + analytics) → Phase 1 (Agent Builder + Inbound) → Phase 2 (Campaigns + WhatsApp + transcripts) → Phase 3 (Voice cloning + barge-in + multi-channel).
- **6 enhancements:** Real-time analytics, DND scrubbing, transcription search, voice cloning, barge-in, multi-channel sequences — all in roadmap with Cursor prompts (§3a, §7a). Use this doc as the single roadmap reference.
- **WebRTC Voice Demo (§7b):** Production-ready browser demo — no phone needed. URLs: `/voice-agents/[tenantId]/demo` or `/demo/voice-agent/[agentId]`. Web Speech API + existing LLM + VEXYL TTS. Copy-paste Cursor instructions in §7b for layout, backend `/api/voice/demo`, and conversion CTA. Target: 10x conversion vs contact sales.
