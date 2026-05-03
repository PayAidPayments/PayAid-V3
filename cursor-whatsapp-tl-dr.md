# PayAid WhatsApp Module: Quick Summary for Cursor
## TL;DR - What to Build

**Investment:** ₹0 (self-hosted)  
**Tech:** Node.js + Express + Prisma + PostgreSQL + WAHA  
**Timeline:** 2-3 weeks for complete implementation  
**Gateway:** WAHA (open-source WhatsApp Web wrapper)

---

## 🎯 WHAT TO BUILD

A complete WhatsApp module inside PayAid that lets businesses:
1. Connect WhatsApp sessions (scan QR with phone)
2. Send/receive WhatsApp messages
3. Link messages to CRM contacts (auto-create if needed)
4. Create support tickets from WhatsApp conversations
5. Track usage per employee
6. Use templates for common messages
7. Receive analytics + reporting

---

## 📊 DATABASE (8 New Models)

```
WhatsappAccount
├─ businessId (link to Business)
├─ channelType: 'web' (WAHA/Evolution)
├─ wahaBaseUrl (where WAHA is deployed)
├─ wahaApiKey (for auth)
└─ isActive, status

WhatsappSession (per employee or shared)
├─ accountId (link to WhatsappAccount)
├─ employeeId (optional, for personal session)
├─ providerSessionId (session name in WAHA)
├─ status: 'pending_qr' | 'connected' | 'disconnected'
├─ phoneNumber (WhatsApp number)
└─ dailySentCount, dailyRecvCount

WhatsappContactIdentity (link WhatsApp → CRM Contact)
├─ contactId (link to Contact)
├─ whatsappNumber (E.164 format, +919876543210)
└─ verified

WhatsappConversation (chat thread)
├─ accountId
├─ contactId
├─ sessionId (preferred agent)
├─ ticketId (optional, if converted to ticket)
├─ status: 'open' | 'closed' | 'archived'
└─ lastMessageAt, unreadCount

WhatsappMessage (individual messages)
├─ conversationId
├─ sessionId (which session sent/received)
├─ employeeId (which agent sent it)
├─ direction: 'in' | 'out'
├─ messageType: 'text' | 'image' | 'document' | 'template'
├─ text, mediaUrl
├─ status: 'sent' | 'delivered' | 'read' | 'failed'
└─ timestamps

WhatsappTemplate (message templates)
├─ accountId
├─ name, category, languageCode
├─ bodyTemplate (mustache-style: "Hi {{1}}, order {{2}}")
├─ createdById (which user created)
└─ isMetaBacked: false (future for Meta Cloud API)

WhatsappContactIdentity, WhatsappAuditLog (audit trail)
```

---

## 🔌 API ENDPOINTS (15 Total)

**Account Management:**
- `POST /api/whatsapp/accounts` - Connect WAHA instance
- `GET /api/whatsapp/accounts` - List accounts

**Sessions (QR + Devices):**
- `POST /api/whatsapp/sessions` - Create session (get QR)
- `GET /api/whatsapp/sessions/:accountId` - List sessions
- `GET /api/whatsapp/sessions/:sessionId/status` - Check connection

**Messages:**
- `POST /api/whatsapp/messages/send` - Send message
- `GET /api/whatsapp/conversations/:conversationId/messages` - Get thread (paginated)

**Conversations:**
- `GET /api/whatsapp/conversations` - List (filterable)
- `GET /api/whatsapp/conversations/:conversationId` - Get one
- `PATCH /api/whatsapp/conversations/:conversationId` - Update (assign agent, ticket)
- `POST /api/whatsapp/conversations/:conversationId/create-ticket` - Convert to ticket

**Templates:**
- `GET /api/whatsapp/templates` - List
- `POST /api/whatsapp/templates` - Create

**Analytics:**
- `GET /api/whatsapp/analytics` - Usage metrics per employee/session

**Webhooks:**
- `POST /api/whatsapp/webhooks/message` - WAHA sends incoming messages
- `POST /api/whatsapp/webhooks/status` - WAHA sends status updates

---

## ⚙️ HOW IT WORKS (User Flow)

### Setup:
1. Admin: `POST /api/whatsapp/accounts` with WAHA server details
2. Admin: `POST /api/whatsapp/sessions` to get QR code
3. Employee: Scan QR with WhatsApp on phone → Session connected

### Incoming Message:
1. Customer sends WhatsApp to business number
2. WAHA receives it, sends webhook to PayAid
3. `POST /api/whatsapp/webhooks/message` triggered
4. If contact doesn't exist in CRM → create it
5. If conversation doesn't exist → create it
6. Store message in DB
7. Agent sees in inbox, can reply

### Outgoing Message:
1. Agent in PayAid types reply
2. `POST /api/whatsapp/messages/send` called
3. Request sent to WAHA
4. WAHA sends via WhatsApp
5. Message stored in DB
6. Status updates tracked (sent → delivered → read)

### Convert to Ticket:
1. Agent clicks "Create Ticket" button
2. `POST /api/whatsapp/conversations/:conversationId/create-ticket`
3. Ticket created, linked to conversation
4. All future WhatsApp messages in conversation added to ticket

---

## 💻 TECH STACK

**Backend:**
- Express.js (routing)
- Prisma (ORM)
- PostgreSQL (database)
- Axios (HTTP client to WAHA)
- Redis (caching, optional)

**Infrastructure:**
- Docker container for WAHA
- Self-hosted on same server as email
- No third-party paid services

**Frontend:**
- React components
- Real-time message updates (polling or WebSocket)
- Simple inbox UI (like WhatsApp Web)

---

## 🚀 WHAT CURSOR NEEDS TO DO

### Phase 1: Database (Day 1)
- [ ] Add 8 Prisma models to schema
- [ ] Run migration
- [ ] Generate Prisma client

### Phase 2: Backend API (Days 2-4)
- [ ] Create `src/routes/whatsapp.ts`
- [ ] Implement 15 endpoints
- [ ] Add webhook handlers for incoming/status
- [ ] Error handling + validation on all endpoints
- [ ] Test each endpoint

### Phase 3: Frontend (Days 5-6)
- [ ] Create `WhatsAppAdmin.tsx` component
- [ ] Create `WhatsAppInbox.tsx` component
- [ ] Integrate into PayAid UI

### Phase 4: Testing (Day 7)
- [ ] Deploy WAHA container
- [ ] Test full flow: QR → connect → send/receive → see in inbox
- [ ] Test ticket creation from conversation

---

## 📝 KEY IMPLEMENTATION NOTES

### Error Handling:
- All endpoints must have try-catch
- All errors logged to console
- All HTTP errors returned with proper status codes

### Validation:
- accountId must belong to user's business
- All required fields validated
- WAHA connectivity tested before saving

### Security:
- API key authentication on all endpoints
- Business ID checks everywhere
- No hardcoded secrets

### Database:
- All indexes applied (see schema)
- Cascade deletes for linked data
- Efficient queries with Prisma include/select

### Real-Time:
- Webhooks from WAHA automatically update DB
- Frontend polls `/api/whatsapp/conversations` every 5 seconds
- Or use WebSocket for real-time (optional upgrade)

---

## 🔄 WAHA Configuration

After deploying WAHA container, configure webhook:

```bash
curl -X POST http://waha-server:3000/api/webhooks \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "url": "https://payaid.com/api/whatsapp/webhooks/message",
    "events": ["message:received", "message:ack"]
  }'
```

---

## ✅ COMPLETION CHECKLIST

- [ ] All 8 database models created
- [ ] Migration runs without errors
- [ ] All 15 API endpoints implemented
- [ ] All endpoints tested and working
- [ ] Webhook handlers receiving data from WAHA
- [ ] React components rendering
- [ ] Full flow tested: connect → send → receive → ticket
- [ ] No TypeScript errors
- [ ] No runtime errors
- [ ] Error handling complete
- [ ] Logging present
- [ ] Security checks in place

---

## ⏱️ ESTIMATED TIME

- Database schema: 1 day
- Backend API: 3 days
- Frontend components: 1 day
- Testing + fixes: 1 day
- **Total: 1 week**

---

## 💡 REMEMBER

1. **No paid services** - Everything is self-hosted or free tier
2. **Follow spec exactly** - Don't add extra features
3. **Production-ready** - Error handling, validation, security
4. **Zero cost** - WAHA is free, Prisma is free, PostgreSQL is free
5. **High margin** - Offer WhatsApp for free or ₹99/month while cost is ₹0

---

## NEXT STEPS

1. Send this document to Cursor
2. Cursor reads the full spec: `cursor-whatsapp-implementation-spec.md`
3. Cursor asks clarifying questions (if any)
4. Cursor implements exactly as specified
5. You test and verify
6. Move to production

---

**Reference Document:** `cursor-whatsapp-implementation-spec.md` (70+ pages, complete spec)

