# Voice Agent Implementation - Pending Items

Based on the Voice Agent documentation review, here's what's **PENDING** for Phase 1 MVP (6-week timeline):

## 🚨 CRITICAL STATUS: **NOT STARTED**

The Voice Agent system as specified in the documents is **NOT IMPLEMENTED**. Only basic call infrastructure exists.

---

## 📋 WEEK 1: INFRASTRUCTURE SETUP (PENDING)

### AWS Infrastructure
- [ ] **AWS Account setup** (ap-south-1 Mumbai region ONLY)
  - [ ] VPC created with private subnets
  - [ ] RDS PostgreSQL 16 cluster
  - [ ] ElastiCache Redis cluster
  - [ ] S3 buckets for recordings
  - [ ] KMS encryption keys
  - [ ] IAM roles and policies
  - [ ] CloudWatch monitoring

### Docker Setup
- [ ] Dockerfile created (Node.js 20)
- [ ] docker-compose.yml for local development
- [ ] .dockerignore configured

### Secrets Manager
- [ ] AWS Secrets Manager configured
- [ ] All API keys stored (NOT in code)
- [ ] Access policies set

### Server Setup
- [ ] Express.js server structure
  - [ ] Basic server setup (Port: 3000)
  - [ ] CORS configured
  - [ ] Security headers (helmet.js)
  - [ ] Request logging middleware
- [ ] Database connections
  - [ ] PostgreSQL connection pooling
  - [ ] MongoDB connection (optional)
  - [ ] Redis connection
  - [ ] Connection health checks
- [ ] Environment configuration
  - [ ] Config loader (dotenv for local, AWS Secrets for prod)
  - [ ] Environment validation on startup
- [ ] API structure
  - [ ] Base route: `/api/v1`
  - [ ] Error handling middleware
  - [ ] Request validation middleware
  - [ ] Response formatting middleware

**DELIVERABLE:** Server starts, responds to health check

---

## 📋 WEEK 2: DATABASE + CORE API (PENDING)

### Database Schema (PostgreSQL)
- [ ] **merchants table** (id, name, email, api_key, api_secret, status, webhook_url)
- [ ] **agents table** (id, merchant_id, name, language, voice_id, system_prompt, phone_number, status)
- [ ] **calls table** (id, agent_id, merchant_id, phone, status, duration, cost, dnd_checked, dnd_status)
- [ ] **call_metadata table** (id, call_id, transcript, recording_url, sentiment, actions_executed)
- [ ] **users table** (id, merchant_id, email, password_hash, role)
- [ ] Migrations set up (Knex.js or Prisma migrations)

### Authentication & Authorization
- [ ] JWT token generation (HS256, 24hr expiry)
- [ ] API key + secret validation (merchant auth)
- [ ] Middleware for protected routes
- [ ] Rate limiting (express-rate-limit)
- [ ] CORS whitelist per merchant

### Core Agent API Endpoints
- [ ] **POST /api/v1/agents** - Create agent
  - [ ] Validation: name, language (hi/en only), voice_id
  - [ ] Store in PostgreSQL
  - [ ] Return agent_id
- [ ] **GET /api/v1/agents/{agent_id}** - Get agent
  - [ ] Fetch from DB
  - [ ] Return full config
  - [ ] Include phone number if assigned
- [ ] **PUT /api/v1/agents/{agent_id}** - Update agent
  - [ ] Validate updates
  - [ ] Update DB
  - [ ] Clear cache
- [ ] **GET /api/v1/agents** - List agents
  - [ ] Filter by merchant_id
  - [ ] Pagination (limit 50)
  - [ ] Return array
- [ ] **DELETE /api/v1/agents/{agent_id}** - Delete agent
  - [ ] Soft delete (set status=deleted)

### Testing Setup
- [ ] Jest configured
- [ ] Supertest for API testing
- [ ] Database seeding for tests
- [ ] Test fixtures created
- [ ] Unit tests for Agent API (all CRUD operations)

**DELIVERABLE:** All agent CRUD endpoints working + passing tests

---

## 📋 WEEK 3: LLM + TELEPHONY INTEGRATION (PENDING)

### Gemini 2.5 Live Integration
- [ ] API key setup (AWS Secrets Manager)
- [ ] Audio streaming configuration
- [ ] System prompt templating
- [ ] Function calling setup (for API integrations)
- [ ] Error handling (timeouts, rate limits)
- [ ] Latency tracking (<300ms p95 target)

### Function Calling Framework
- [ ] Define function schema
- [ ] `get_customer_status` function (example)
  - [ ] Takes customer_id parameter
  - [ ] Calls external API
  - [ ] Returns status + amount
- [ ] `log_call_outcome` function (example)
- [ ] Middleware to handle function calls during conversation

### Exotel Integration
- [ ] API client setup
- [ ] Phone number provisioning endpoint
- [ ] Outbound call initiation
- [ ] Webhook receiver for call events
- [ ] Call status mapping (queued → ringing → answered → completed)
- [ ] Error handling + retries
- [ ] Logging all call events

### Speech Recognition (STT)
- [ ] Google Speech-to-Text API integration
- [ ] Language selection (hi, en)
- [ ] Confidence score tracking
- [ ] Fallback to English if language detection fails

### Text-to-Speech (TTS)
- [ ] Azure Neural Voices API integration
- [ ] Voice selection per language
- [ ] Audio encoding (opus codec)
- [ ] Latency optimization
- [ ] Fallback logic

### Call Initiation Endpoint
- [ ] **POST /api/v1/calls** - Initiate call
  - [ ] Validate phone number (+91 format)
  - [ ] Check DND (pre-call blocking)
  - [ ] Enqueue call job (Bull queue)
  - [ ] Return call_id + status
  - [ ] Webhook field (optional)

### Call Status Endpoint
- [ ] **GET /api/v1/calls/{call_id}** - Get call status
  - [ ] Return call state
  - [ ] Include transcript if completed
  - [ ] Include cost calculation
  - [ ] Include sentiment (if analyzed)

### Webhook Handler
- [ ] **POST /api/v1/webhooks/exotel** - Exotel callback
  - [ ] Verify signature (HMAC-SHA256)
  - [ ] Parse call events
  - [ ] Update call status in DB
  - [ ] Queue transcription job
  - [ ] Send merchant webhook (if configured)

**DELIVERABLE:** End-to-end call working with real Exotel + Gemini

---

## 📋 WEEK 4: COMPLIANCE + KNOWLEDGE BASE (PENDING)

### DND Registry Integration
- [ ] Fetch DND list (daily sync)
- [ ] Check customer phone before calling
- [ ] Log all DND checks
- [ ] Block call if in DND list
- [ ] Error handling if DND service down

### Consent Management
- [ ] Digital consent form (HTML)
- [ ] Store consent (PostgreSQL)
- [ ] Consent verification before calling
- [ ] Expiry tracking
- [ ] Consent withdrawal endpoint

### Call Recording Compliance
- [ ] IVR announcement: "This call is being recorded..."
- [ ] Consent capture before recording
- [ ] Recording to S3 (encrypted)
- [ ] Metadata logging
- [ ] 90-day retention policy

### Audit Logging
- [ ] Log all DND checks
- [ ] Log all consent interactions
- [ ] Log all calls (CDR format)
- [ ] Log all API calls (audit trail)
- [ ] Tamper-proof logging

### Knowledge Base (RAG)
- [ ] Pinecone Vector DB setup
- [ ] Document chunking (LangChain.js)
- [ ] Embedding generation (Gemini)
- [ ] Semantic search implementation
- [ ] RAG prompt construction
- [ ] **POST /api/v1/agents/{agent_id}/knowledge-base** - Upload knowledge base
  - [ ] Accept PDF/TXT files
  - [ ] Parse documents
  - [ ] Generate embeddings
  - [ ] Store in Pinecone
  - [ ] Index by agent_id

### TRAI Compliance Validation
- [ ] Phone number format validation
- [ ] Merchant KYC verification
- [ ] DND check before every call
- [ ] Consent on file
- [ ] Call recording enabled
- [ ] Audit trail maintained

**DELIVERABLE:** All compliance checks integrated + tested

---

## 📋 WEEK 5: TESTING + DASHBOARD (PENDING)

### Comprehensive Testing
- [ ] Unit tests: All API endpoints (100% coverage target)
- [ ] Integration tests: Full call flow
- [ ] Database migration tests
- [ ] Compliance tests (DND, consent, recording)
- [ ] Telephony integration tests
- [ ] Latency tests (p95 < 500ms)
- [ ] Security tests (auth, CORS, rate limiting)

### Load Testing
- [ ] Set up load testing (Artillery or k6)
- [ ] Simulate 50 concurrent calls
- [ ] Measure: Latency, throughput, errors
- [ ] Target: <500ms p95 latency
- [ ] Target: <2% error rate

### Dashboard Frontend (Next.js/React)
- [ ] **Login page** (email/password)
- [ ] **Agent creation form**
  - [ ] Name input
  - [ ] Language dropdown (Hindi, English)
  - [ ] Voice selection
  - [ ] System prompt text area
  - [ ] Knowledge base upload
  - [ ] Submit button
- [ ] **Agent list view**
  - [ ] Table of merchant's agents
  - [ ] Columns: name, language, status, phone_number
  - [ ] Delete button per agent
  - [ ] Edit link per agent
- [ ] **Call history page**
  - [ ] Table of recent calls
  - [ ] Columns: phone, duration, language, status, cost, timestamp
  - [ ] Pagination
  - [ ] Filter by agent
  - [ ] Filter by date range
- [ ] **Analytics page (basic)**
  - [ ] Total calls (today/week/month)
  - [ ] Success rate (%)
  - [ ] Average duration
  - [ ] Total cost
  - [ ] Calls by agent (pie chart)
- [ ] **Settings page**
  - [ ] Webhook URL configuration
  - [ ] API key display (masked)
  - [ ] Merchant profile info

### Analytics API Endpoints
- [ ] **GET /api/v1/analytics/dashboard** - Dashboard metrics
  - [ ] Query: period (today/week/month), agent_id
  - [ ] Returns: call count, success rate, cost, sentiment breakdown
- [ ] **GET /api/v1/analytics/revenue** - Revenue report
  - [ ] Query: period, start_date, end_date
  - [ ] Returns: monthly data with MRR

**DELIVERABLE:** Fully functional MVP with dashboard + all tests passing

---

## 📋 WEEK 6: LAUNCH PREPARATION (PENDING)

### Security Hardening
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (input sanitization)
- [ ] CSRF tokens (if using sessions)
- [ ] Secrets rotation (API keys, database passwords)
- [ ] SSL/TLS certificates (HTTPS only)
- [ ] Security headers (HSTS, CSP, X-Frame-Options)
- [ ] Rate limiting (100 req/min per IP)

### Performance Optimization
- [ ] Database query optimization (add indexes)
- [ ] Caching strategy (Redis for agent configs)
- [ ] CDN for dashboard assets
- [ ] Minification of frontend assets
- [ ] Gzip compression for API responses

### Monitoring & Alerting
- [ ] CloudWatch dashboards
- [ ] Error rate alerts (>2% = page)
- [ ] Latency alerts (p95 > 500ms = page)
- [ ] Uptime monitoring
- [ ] Log aggregation (CloudWatch Logs)

### Operational Setup
- [ ] On-call runbook
- [ ] Incident response procedure
- [ ] Rollback procedure
- [ ] Database backup automation
- [ ] Deployment checklist

### Beta Launch Preparation
- [ ] Merchant onboarding docs
- [ ] Support email setup
- [ ] FAQ document
- [ ] Known issues list
- [ ] Feature roadmap (Phase 2/3)
- [ ] Beta merchant selection (3-5 merchants)
- [ ] Onboarding calls scheduled

**DELIVERABLE:** Production-ready MVP launched with beta merchants

---

## 🔧 ENVIRONMENT VARIABLES NEEDED

Add to `env.example`:
```bash
# Voice Agent - Gemini
GEMINI_API_KEY=""
GOOGLE_STT_API_KEY=""

# Voice Agent - TTS
AZURE_TTS_API_KEY=""
AZURE_TTS_REGION="eastus"

# Voice Agent - Telephony
EXOTEL_API_KEY=""
EXOTEL_API_TOKEN=""
EXOTEL_SID=""
EXOTEL_WEBHOOK_SECRET=""

# Voice Agent - Vector DB
PINECONE_API_KEY=""
PINECONE_INDEX="payaid-voice"

# Voice Agent - AWS (if separate from main)
VOICE_AWS_REGION="ap-south-1"
VOICE_S3_BUCKET="payaid-voice-recordings"
```

---

## 📊 CURRENT STATE vs REQUIRED STATE

### ✅ What EXISTS:
- Basic `AICall` model in Prisma schema
- Basic `/api/calls` endpoints (GET, POST)
- Basic call webhook handler (Twilio-based, not Exotel)
- Call recording and transcript models

### ❌ What's MISSING:
- **ALL** Voice Agent specific features
- Agent CRUD APIs (`/api/v1/agents/*`)
- Exotel integration (currently using Twilio)
- Gemini 2.5 Live integration
- DND checking
- Consent management
- Knowledge base/RAG system
- Voice Agent dashboard
- Analytics endpoints
- Compliance features
- AWS infrastructure setup
- Separate database schema for voice agents

---

## 🎯 PRIORITY ORDER

1. **WEEK 1** (Critical Path): Infrastructure + Server Setup
2. **WEEK 2** (Critical Path): Database Schema + Agent CRUD APIs
3. **WEEK 3** (Critical Path): Gemini + Exotel Integration
4. **WEEK 4**: Compliance + Knowledge Base
5. **WEEK 5**: Testing + Dashboard
6. **WEEK 6**: Launch Prep

---

## ⚠️ CRITICAL NOTES

1. **This is a COMPLETE NEW MODULE** - Not an extension of existing call system
2. **Separate API namespace**: `/api/v1/*` (not `/api/calls/*`)
3. **Separate database tables**: `agents`, `merchants`, `calls` (voice agent specific)
4. **Different telephony provider**: Exotel (not Twilio)
5. **Different LLM**: Gemini 2.5 Live (not current AI setup)
6. **India-only**: AWS Mumbai region, TRAI compliance required
7. **Phase 1 scope**: Hindi + English ONLY, manual triggering, basic dashboard

---

## 📝 NEXT IMMEDIATE STEPS

1. **Create new module structure**: `lib/voice-agent/`
2. **Set up separate API routes**: `app/api/v1/agents/`, `app/api/v1/calls/`
3. **Create database migrations** for voice agent tables
4. **Set up Exotel account** and get API credentials
5. **Set up Gemini 2.5 Live** API access
6. **Create AWS infrastructure** (if not already done)

---

**Status:** 🚨 **NOT STARTED** - Requires full implementation from scratch

**Estimated Effort:** 6 weeks (as per documentation) with dedicated team

**Blockers:** 
- AWS infrastructure setup
- Exotel account and API access
- Gemini 2.5 Live API access
- Team allocation for 6-week sprint

