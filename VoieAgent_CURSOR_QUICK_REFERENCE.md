# CURSOR QUICK REFERENCE - PHASE 1 AT A GLANCE

## 📋 THE 6-WEEK SPRINT (EXACTLY)

```
WEEK 1: AWS + Docker + Server Setup
        [Infra ready, API skeleton]

WEEK 2: Database Schema + Agent CRUD APIs
        [Agent management working]

WEEK 3: Gemini + Exotel Integration
        [Voice calling working]

WEEK 4: DND + Consent + Knowledge Base
        [Compliance layer done]

WEEK 5: Tests + Dashboard Frontend
        [MVP dashboard working]

WEEK 6: Launch + Beta Testing
        [Production ready]
```

---

## 🔧 TECH STACK (LOCKED)

**Backend:** Node.js 20.x, Express, TypeScript, PostgreSQL 16, Redis 7, MongoDB 7
**Frontend:** Next.js 14, React 18, Tailwind, Shadcn/ui
**AI:** Gemini 2.5 Live, Google STT, Azure TTS, Pinecone
**Telephony:** Exotel (primary), Twilio (backup)
**Infra:** AWS Mumbai region ONLY, ECS, RDS, ElastiCache, S3

---

## 🎯 PHASE 1 SCOPE (FROZEN)

**BUILD:**
✓ Agent CRUD (create, read, update, delete)
✓ Call initiation + status polling
✓ Gemini 2.5 Live integration
✓ Exotel telephony
✓ DND + Consent checking
✓ Knowledge base upload
✓ Basic dashboard
✓ Hindi + English ONLY
✓ Manual call triggering

**DO NOT BUILD:**
✗ Phase 2 features
✗ Workflows (N8N)
✗ Sentiment analysis
✗ Voice cloning
✗ Drag-drop builder
✗ Other languages
✗ Advanced features

---

## 💾 DATABASE (EXACT SCHEMA)

```sql
merchants (id, name, email, api_key)
agents (id, merchant_id, name, language, voice_id, system_prompt)
calls (id, agent_id, merchant_id, phone, status, duration, cost)
users (id, merchant_id, email, password_hash, role)
call_metadata (id, call_id, transcript, recording_url, sentiment)
```

---

## 📡 API ENDPOINTS (COMPLETE)

```
POST   /api/v1/agents              [Create agent]
GET    /api/v1/agents/{id}         [Get agent]
PUT    /api/v1/agents/{id}         [Update agent]
GET    /api/v1/agents              [List agents]
DELETE /api/v1/agents/{id}         [Delete agent]

POST   /api/v1/calls               [Initiate call]
GET    /api/v1/calls/{id}          [Get call status]
GET    /api/v1/calls               [List calls]

GET    /api/v1/analytics/dashboard [Dashboard metrics]
GET    /api/v1/analytics/revenue   [Revenue report]

POST   /api/v1/webhooks/exotel     [Exotel callback]

POST   /api/v1/auth/login          [Dashboard login]
POST   /api/v1/auth/verify         [Token verification]
```

---

## 🚦 CRITICAL PATH (DON'T SKIP)

1. **Week 1:** AWS setup → Server running → Tests passing
2. **Week 2:** Database → Agent CRUD working → Merchant can create agent
3. **Week 3:** Gemini working → Exotel working → First call completes
4. **Week 4:** DND checking → Consent form → Compliance verified
5. **Week 5:** Dashboard functional → All tests passing
6. **Week 6:** Launch → Beta merchants active → Metrics being tracked

---

## ✅ ACCEPTANCE CRITERIA

**By Day 42, these MUST be true:**

Technical:
- [ ] All CRUD endpoints working
- [ ] 80%+ test coverage
- [ ] <500ms p95 latency
- [ ] <2% error rate
- [ ] 99.9% uptime

Product:
- [ ] 50+ merchants onboarded
- [ ] 1,000+ test calls
- [ ] >85% completion rate
- [ ] NPS >40

Business:
- [ ] ₹0-30K/month revenue
- [ ] Positive unit economics
- [ ] <3 month payback

---

## ⚠️ NO DEVIATIONS ALLOWED

```
✗ Do not extend timeline
✗ Do not add features
✗ Do not change tech stack
✗ Do not skip compliance
✗ Do not reduce testing
✗ Do not optimize prematurely
✗ Do not deploy to non-India regions
✗ Do not skip security review
```

**IF BLOCKED → ESCALATE IMMEDIATELY**
Do not continue without unblocking.

---

## 📞 SUPPORT

- Blocked? → Ask immediately
- Unclear? → Ask immediately  
- Decision needed? → Ask immediately
- Rollback? → Press red button

**Escalation:** CTO → Tech Lead → Next senior engineer

---

## 🎯 THE ONLY GOAL

**A WORKING MVP BY DAY 42**

Not perfect. Not scalable. WORKING.

That's it. That's the win condition.

---

**Phase 1 = 6 weeks = Done. Move to Phase 2.**

