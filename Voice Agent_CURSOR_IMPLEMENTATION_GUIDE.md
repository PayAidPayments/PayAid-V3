# PayAid V3 AI Voice Agent - CURSOR IMPLEMENTATION GUIDE
## Strict Development Instructions - Zero Deviations Allowed

**Document Version:** 1.0  
**Date:** January 9, 2026  
**Status:** PRODUCTION SPECIFICATION - FOLLOW EXACTLY  
**For:** Cursor AI Code Generation

---

## ⚠️ CRITICAL RULES

### RULE 1: STRICT ADHERENCE TO PHASE 1
- Do NOT implement Phase 2 or Phase 3 features
- Do NOT add extra features beyond Phase 1 MVP
- Do NOT optimize prematurely
- Do NOT build for scale yet (we test product-market fit first)

### RULE 2: TIMELINE IS IMMUTABLE
- Phase 1: Exactly 6 weeks
- Week 1-2: Infrastructure + Core APIs
- Week 3-4: LLM + Telephony Integration
- Week 5-6: Testing + Dashboard + Launch Prep
- NO extensions, NO delays

### RULE 3: BUDGET IS STRICT
- ₹50-65L Phase 1 budget (fixed)
- Cannot exceed without escalation
- Infrastructure: ₹8-10L (fixed)
- Development: ₹35-45L (fixed)
- No scope creep = no budget overrun

### RULE 4: TECHNOLOGY STACK IS LOCKED
- Use EXACTLY the tech stack specified (no alternatives without approval)
- Do NOT switch to competing technologies mid-project
- Do NOT experiment with newer frameworks
- Stick with proven, stable versions

### RULE 5: MVP SCOPE IS FROZEN
- Phase 1 = Hindi + English ONLY
- Phase 1 = Single agent per merchant
- Phase 1 = Manual call triggering (no workflows yet)
- Phase 1 = Basic dashboard (no drag-drop builder yet)
- NO exceptions, NO additions

---

## PHASE 1 SCOPE DEFINITION

### WHAT TO BUILD (Exactly This):

#### 1. Backend API (Node.js/TypeScript)
```
✓ Agent CRUD endpoints (create, read, update, delete)
✓ Call initiation endpoint
✓ Call status polling endpoint
✓ Basic analytics endpoint
✓ Webhook receiver for Exotel callbacks
✓ Authentication & authorization
✗ NO workflow engine
✗ NO advanced analytics
✗ NO sentiment analysis
✗ NO voice cloning
```

#### 2. Telephony Integration (Exotel)
```
✓ Phone number provisioning
✓ Outbound call initiation
✓ Call recording setup
✓ Basic call routing
✓ Webhook handling for call events
✓ Error handling + retry logic
✗ NO warm transfers (Phase 2)
✗ NO IVR (Phase 2)
✗ NO advanced routing (Phase 2)
```

#### 3. LLM Integration (Gemini 2.5 Live)
```
✓ Real-time voice conversation
✓ System prompt handling
✓ Knowledge base RAG
✓ Function calling (customer data lookup)
✓ Latency monitoring
✗ NO voice cloning
✗ NO sentiment analysis (real-time)
✗ NO multi-language optimization (Phase 2)
```

#### 4. Database
```
✓ PostgreSQL: Agents, Calls, Users, Merchants
✓ MongoDB: Call logs, transcripts
✓ Redis: Session cache, rate limiting
✗ NO Elasticsearch
✗ NO advanced analytics DB
✗ NO graph database
```

#### 5. Dashboard (Next.js/React)
```
✓ Login/authentication page
✓ Agent creation form (template-based)
✓ Agent configuration editor
✓ Call history table
✓ Basic analytics (count, duration, success rate)
✓ Settings page
✗ NO drag-drop builder (Phase 2)
✗ NO real-time monitoring (Phase 2)
✗ NO advanced charts (Phase 2)
✗ NO mobile app (Phase 3)
```

#### 6. Compliance
```
✓ DND pre-call checking
✓ Consent management (digital forms)
✓ Call recording compliance
✓ Audit logging
✓ Data localization (India only)
✗ NO advanced consent workflows (Phase 2)
✗ NO compliance reporting automation (Phase 2)
```

---

## WEEK-BY-WEEK STRICT CHECKLIST

### WEEK 1: INFRASTRUCTURE SETUP

**Monday-Wednesday:**
```
[ ] GitHub repository created (private)
[ ] Branch strategy defined (main, develop, feature/*)
[ ] Node.js 20.x LTS environment setup
[ ] TypeScript configuration (tsconfig.json)
[ ] .env template created (NO secrets in repo)
[ ] .gitignore configured (node_modules, .env, dist)

[ ] AWS Account setup (ap-south-1 Mumbai region ONLY)
  [ ] VPC created with private subnets
  [ ] RDS PostgreSQL 16 cluster
  [ ] ElastiCache Redis
  [ ] S3 buckets for recordings
  [ ] KMS encryption keys
  [ ] IAM roles and policies
  [ ] CloudWatch monitoring

[ ] Docker setup
  [ ] Dockerfile created (Node.js 20)
  [ ] docker-compose.yml for local development
  [ ] .dockerignore configured

[ ] Secrets Manager setup
  [ ] AWS Secrets Manager configured
  [ ] All API keys stored (NOT in code)
  [ ] Access policies set

[ ] Monitoring setup
  [ ] CloudWatch namespaces created
  [ ] Log groups configured
  [ ] Dashboards created
```

**Thursday-Friday:**
```
[ ] Express.js server structure
  [ ] Basic server setup
  [ ] Port: 3000
  [ ] CORS configured (for dashboard domain only)
  [ ] Security headers (helmet.js)
  [ ] Request logging middleware

[ ] Database connections
  [ ] PostgreSQL connection pooling (node-postgres)
  [ ] MongoDB connection (if using)
  [ ] Redis connection
  [ ] Connection health checks

[ ] Environment configuration
  [ ] Config loader (dotenv for local, AWS Secrets for prod)
  [ ] Environment validation on startup
  [ ] Failed startup if config invalid

[ ] API structure
  [ ] Base route: /api/v1
  [ ] Error handling middleware
  [ ] Request validation middleware
  [ ] Response formatting middleware

**DELIVERABLE: Server starts, responds to health check**
```

### WEEK 2: CORE DATABASE + API LAYER

**Monday-Wednesday:**
```
[ ] Database Schema (PostgreSQL)
  [ ] merchants table (id, name, email, api_key, status)
  [ ] agents table (id, merchant_id, name, language, voice_id, system_prompt)
  [ ] calls table (id, agent_id, merchant_id, phone, status, duration, cost)
  [ ] call_metadata table (timestamps, transcript, actions)
  [ ] users table (id, merchant_id, email, role)
  [ ] migrations set up (Knex.js)

[ ] Authentication & Authorization
  [ ] JWT token generation (HS256, 24hr expiry)
  [ ] API key + secret validation (merchant auth)
  [ ] Middleware for protected routes
  [ ] Rate limiting (express-rate-limit)
  [ ] CORS whitelist per merchant

[ ] Core Agent API
  POST /agents
  [ ] Validation: name, language (hi/en only), voice_id
  [ ] Store in PostgreSQL
  [ ] Return agent_id
  
  GET /agents/{agent_id}
  [ ] Fetch from DB
  [ ] Return full config
  [ ] Include phone number if assigned
  
  PUT /agents/{agent_id}
  [ ] Validate updates
  [ ] Update DB
  [ ] Clear cache
  
  GET /agents (list)
  [ ] Filter by merchant_id
  [ ] Pagination (limit 50)
  [ ] Return array
  
  DELETE /agents/{agent_id}
  [ ] Soft delete (set status=deleted)
  [ ] Don't actually remove records
```

**Thursday-Friday:**
```
[ ] Testing setup
  [ ] Jest configured
  [ ] Supertest for API testing
  [ ] Database seeding for tests
  [ ] Test fixtures created

[ ] Unit tests for Agent API
  [ ] Create agent - valid input
  [ ] Create agent - invalid language
  [ ] Create agent - missing fields
  [ ] Get agent - 200 response
  [ ] Get agent - 404 not found
  [ ] Update agent - success
  [ ] Delete agent - soft delete

[ ] Documentation
  [ ] API endpoint documentation (README.md)
  [ ] Database schema documentation
  [ ] Local development setup guide

**DELIVERABLE: All agent CRUD endpoints working + passing tests**
```

### WEEK 3: LLM + TELEPHONY INTEGRATION

**Monday-Wednesday:**
```
[ ] Gemini 2.5 Live Integration
  [ ] API key setup (AWS Secrets Manager)
  [ ] Audio streaming configuration
  [ ] System prompt templating
  [ ] Function calling setup (for API integrations)
  [ ] Error handling (timeouts, rate limits)
  [ ] Latency tracking (<300ms p95 target)

[ ] Function calling framework
  [ ] Define function schema
  [ ] get_customer_status (example function)
    [ ] Takes customer_id parameter
    [ ] Calls external API
    [ ] Returns status + amount
    [ ] Error handling
  [ ] log_call_outcome (example function)
  [ ] Middleware to handle function calls during conversation

[ ] Exotel Integration
  [ ] API client setup
  [ ] Phone number provisioning endpoint
  [ ] Outbound call initiation
  [ ] Webhook receiver for call events
  [ ] Call status mapping (queued → ringing → answered → completed)
  [ ] Error handling + retries
  [ ] Logging all call events

[ ] Speech Recognition (STT)
  [ ] Google Speech-to-Text API
  [ ] Language selection (hi, en)
  [ ] Confidence score tracking
  [ ] Fallback to English if language detection fails

[ ] Text-to-Speech (TTS)
  [ ] Azure Neural Voices API
  [ ] Voice selection per language
  [ ] Audio encoding (opus codec)
  [ ] Latency optimization
  [ ] Fallback logic
```

**Thursday-Friday:**
```
[ ] Call Initiation Endpoint
  POST /calls
  [ ] Validate phone number (+91 format)
  [ ] Check DND (pre-call blocking)
  [ ] Enqueue call job (Bull queue)
  [ ] Return call_id + status
  [ ] Webhook field (optional)

[ ] Call Status Endpoint
  GET /calls/{call_id}
  [ ] Return call state
  [ ] Include transcript if completed
  [ ] Include cost calculation
  [ ] Include sentiment (if analyzed)

[ ] Webhook Handler
  POST /webhooks/exotel
  [ ] Verify signature
  [ ] Parse call events
  [ ] Update call status in DB
  [ ] Queue transcription job
  [ ] Send merchant webhook (if configured)

[ ] Call Flow Integration Test
  [ ] Merchant creates agent
  [ ] Merchant initiates call
  [ ] Mock Exotel returns call answered
  [ ] Mock Gemini returns response
  [ ] Call marked completed
  [ ] Transcript stored
  [ ] Cost calculated

[ ] Latency Testing
  [ ] Measure: Call initiation to Exotel
  [ ] Measure: Exotel to agent response
  [ ] Measure: STT latency
  [ ] Measure: LLM response latency
  [ ] Measure: TTS generation time
  [ ] Total p95 latency: target <500ms

**DELIVERABLE: End-to-end call working with real Exotel + Gemini**
```

### WEEK 4: COMPLIANCE + KNOWLEDGE BASE

**Monday-Wednesday:**
```
[ ] DND Registry Integration
  [ ] Fetch DND list (daily sync)
  [ ] Check customer phone before calling
  [ ] Log all DND checks
  [ ] Block call if in DND list
  [ ] Error handling if DND service down

[ ] Consent Management
  [ ] Digital consent form (HTML)
  [ ] Store consent (PostgreSQL)
  [ ] Consent verification before calling
  [ ] Expiry tracking
  [ ] Consent withdrawal endpoint

[ ] Call Recording Compliance
  [ ] IVR announcement: "This call is being recorded..."
  [ ] Consent capture before recording
  [ ] Recording to S3 (encrypted)
  [ ] Metadata logging
  [ ] 90-day retention policy

[ ] Audit Logging
  [ ] Log all DND checks
  [ ] Log all consent interactions
  [ ] Log all calls (CDR format)
  [ ] Log all API calls (audit trail)
  [ ] Tamper-proof logging

[ ] Knowledge Base (RAG)
  [ ] Pinecone Vector DB setup
  [ ] Document chunking (LangChain.js)
  [ ] Embedding generation (Gemini)
  [ ] Semantic search implementation
  [ ] RAG prompt construction
  [ ] Knowledge base upload endpoint

POST /agents/{agent_id}/knowledge-base
  [ ] Accept PDF/TXT files
  [ ] Parse documents
  [ ] Generate embeddings
  [ ] Store in Pinecone
  [ ] Index by agent_id
```

**Thursday-Friday:**
```
[ ] TRAI Compliance Validation
  [ ] Phone number format validation
  [ ] Merchant KYC verification
  [ ] DND check before every call
  [ ] Consent on file
  [ ] Call recording enabled
  [ ] Audit trail maintained

[ ] Compliance Testing
  [ ] Test DND blocking (call blocked if in list)
  [ ] Test consent form (before calling)
  [ ] Test call recording (enabled, stored)
  [ ] Test audit logs (all events logged)
  [ ] Test recording retention (90 days)

[ ] Compliance Documentation
  [ ] Compliance checklist (TRAI requirements)
  [ ] Data protection policy
  [ ] Call recording disclosure
  [ ] Privacy statement

**DELIVERABLE: All compliance checks integrated + tested**
```

### WEEK 5: TESTING + DASHBOARD

**Monday-Wednesday:**
```
[ ] Comprehensive Testing
  [ ] Unit tests: All API endpoints (100% coverage)
  [ ] Integration tests: Full call flow
  [ ] Database migration tests
  [ ] Compliance tests (DND, consent, recording)
  [ ] Telephony integration tests
  [ ] Latency tests (p95 < 500ms)
  [ ] Security tests (auth, CORS, rate limiting)

[ ] Load Testing
  [ ] Set up load testing (Artillery or k6)
  [ ] Simulate 50 concurrent calls
  [ ] Measure: Latency, throughput, errors
  [ ] Target: <500ms p95 latency
  [ ] Target: <2% error rate

[ ] Dashboard Frontend (Next.js/React)
  [ ] Login page (email/password)
  [ ] Agent creation form
    [ ] Name input
    [ ] Language dropdown (Hindi, English)
    [ ] Voice selection
    [ ] System prompt text area
    [ ] Knowledge base upload
    [ ] Submit button
  
  [ ] Agent list view
    [ ] Table of merchant's agents
    [ ] Columns: name, language, status, phone_number
    [ ] Delete button per agent
    [ ] Edit link per agent
  
  [ ] Call history page
    [ ] Table of recent calls
    [ ] Columns: phone, duration, language, status, cost, timestamp
    [ ] Pagination
    [ ] Filter by agent
    [ ] Filter by date range
  
  [ ] Analytics page (basic)
    [ ] Total calls (today/week/month)
    [ ] Success rate (%)
    [ ] Average duration
    [ ] Total cost
    [ ] Calls by agent (pie chart)
  
  [ ] Settings page
    [ ] Webhook URL configuration
    [ ] API key display (masked)
    [ ] Merchant profile info
```

**Thursday-Friday:**
```
[ ] Dashboard Testing
  [ ] Login works
  [ ] Can create agent
  [ ] Can view agents
  [ ] Can initiate test call
  [ ] Can see call history
  [ ] Can see analytics
  [ ] Mobile responsive (not required, but test on mobile)

[ ] Production Readiness
  [ ] All tests passing
  [ ] No console errors
  [ ] Error messages user-friendly
  [ ] Loading states implemented
  [ ] Empty states handled
  [ ] 404/500 error pages
  [ ] Accessibility basics (ARIA labels)

[ ] Documentation
  [ ] User guide for merchants
  [ ] API documentation (Swagger/OpenAPI)
  [ ] Deployment guide
  [ ] Troubleshooting guide
  [ ] Operational runbook

**DELIVERABLE: Fully functional MVP with dashboard + all tests passing**
```

### WEEK 6: LAUNCH PREPARATION + HARDENING

**Monday-Wednesday:**
```
[ ] Security Hardening
  [ ] SQL injection prevention (parameterized queries)
  [ ] XSS prevention (input sanitization)
  [ ] CSRF tokens (if using sessions)
  [ ] Secrets rotation (API keys, database passwords)
  [ ] SSL/TLS certificates (HTTPS only)
  [ ] Security headers (HSTS, CSP, X-Frame-Options)
  [ ] Rate limiting (100 req/min per IP)

[ ] Performance Optimization
  [ ] Database query optimization (add indexes)
  [ ] Caching strategy (Redis for agent configs)
  [ ] CDN for dashboard assets
  [ ] Minification of frontend assets
  [ ] Gzip compression for API responses

[ ] Monitoring & Alerting
  [ ] CloudWatch dashboards
  [ ] Error rate alerts (>2% = page)
  [ ] Latency alerts (p95 > 500ms = page)
  [ ] Uptime monitoring
  [ ] Log aggregation (CloudWatch Logs)

[ ] Operational Setup
  [ ] On-call runbook
  [ ] Incident response procedure
  [ ] Rollback procedure
  [ ] Database backup automation
  [ ] Deployment checklist
```

**Thursday-Friday:**
```
[ ] Beta Launch Preparation
  [ ] Merchant onboarding docs
  [ ] Support email setup
  [ ] FAQ document
  [ ] Known issues list
  [ ] Feature roadmap (Phase 2/3)

[ ] Beta Merchant Selection
  [ ] 3-5 merchants identified
  [ ] Onboarding calls scheduled
  [ ] Merchant success playbook created
  [ ] Feedback form prepared

[ ] Launch Checklist
  [ ] All tests passing ✓
  [ ] Security review complete ✓
  [ ] Compliance review complete ✓
  [ ] Performance acceptable (<500ms) ✓
  [ ] Database backups working ✓
  [ ] Monitoring active ✓
  [ ] Runbooks documented ✓
  [ ] Team trained ✓

[ ] Post-Launch
  [ ] Daily health checks (Week 1)
  [ ] Merchant feedback collection
  [ ] Bug tracking (Jira/GitHub Issues)
  [ ] Weekly team sync
  [ ] Success metrics tracking

**DELIVERABLE: Production-ready MVP launched with beta merchants**
```

---

## TECHNOLOGY STACK (LOCKED - NO CHANGES)

### Backend
```
✓ Node.js 20.x LTS (NOT 21.x, NOT 22.x)
✓ Express.js 4.18.x
✓ TypeScript 5.x
✓ PostgreSQL 16.x (AWS RDS)
✓ MongoDB 7.x (optional, for call logs)
✓ Redis 7.x (AWS ElastiCache)
✓ Bull 4.x (job queue)
✓ Jest 29.x (testing)
✓ Winston 3.x (logging)
✓ Joi 17.x (validation)

✗ Do NOT use: Python, Go, Rust, Java
✗ Do NOT use: DynamoDB, Cassandra, Elasticsearch
✗ Do NOT use: GraphQL (use REST only)
```

### Frontend
```
✓ Next.js 14.x (App Router)
✓ React 18.x
✓ TypeScript 5.x
✓ Tailwind CSS 3.x
✓ Shadcn/ui components
✓ Zustand (state management)
✓ TanStack Query 5.x (data fetching)
✓ Vitest + React Testing Library

✗ Do NOT use: Vue, Svelte, Angular
✗ Do NOT use: Redux, Context API
✗ Do NOT use: Bootstrap, Material-UI (use Shadcn/ui only)
```

### AI/ML
```
✓ Google Gemini 2.5 Live API
✓ Google Speech-to-Text (STT)
✓ Azure Cognitive Services (TTS)
✓ Pinecone Vector DB
✓ LangChain.js
✓ node-fetch (HTTP client)

✗ Do NOT use: OpenAI GPT-4
✗ Do NOT use: Anthropic Claude (Phase 2 only, as fallback)
✗ Do NOT use: ElevenLabs (Phase 2 only, as fallback)
```

### Telephony
```
✓ Exotel REST API
✓ Twilio SIP (backup only, not primary)
✓ axios (HTTP client for API calls)

✗ Do NOT use: Vonage, Plivo, Bandwidth
```

### Infrastructure
```
✓ AWS ap-south-1 (Mumbai region ONLY)
✓ AWS EC2 + ECS (for app)
✓ AWS RDS PostgreSQL
✓ AWS ElastiCache Redis
✓ AWS S3 (recordings)
✓ AWS KMS (encryption)
✓ AWS CloudWatch (monitoring)
✓ GitHub (version control)
✓ GitHub Actions (CI/CD)
✓ Docker (containerization)

✗ Do NOT use: GCP, Azure (primary)
✗ Do NOT use: Other regions
✗ Do NOT use: Kubernetes (ECS only)
```

---

## API ENDPOINTS (COMPLETE SPECIFICATION)

### Authentication
```
POST /api/v1/auth/login
- Email + password (for dashboard users)
- Returns JWT token + refresh token
- 24-hour expiry

POST /api/v1/auth/verify
- Bearer token validation
- Returns decoded token data
```

### Agents
```
POST /api/v1/agents
- Create agent
- Required: name, language (hi/en), voice_id, system_prompt
- Returns: agent_id, status, phone_number
- Response code: 201

GET /api/v1/agents/{agent_id}
- Fetch agent config
- Returns: full config + statistics
- Response code: 200

PUT /api/v1/agents/{agent_id}
- Update agent
- Allowed: system_prompt, voice_tone, knowledge_base
- Returns: updated config
- Response code: 200

GET /api/v1/agents
- List merchant's agents
- Query params: status, language, limit, offset
- Returns: array of agents
- Response code: 200

DELETE /api/v1/agents/{agent_id}
- Soft delete agent
- Returns: { status: "deleted" }
- Response code: 200

POST /api/v1/agents/{agent_id}/knowledge-base
- Upload knowledge base
- Body: FormData with PDF/TXT files
- Returns: { indexed: true, documents: N }
- Response code: 200
```

### Calls
```
POST /api/v1/calls
- Initiate outbound call
- Required: agent_id, phone, customer (name, id)
- Optional: context, webhook_url, retry_config
- Returns: call_id, status (queued)
- Response code: 202

GET /api/v1/calls/{call_id}
- Fetch call status + details
- Returns: call state, transcript, sentiment, cost
- Response code: 200

GET /api/v1/calls
- List calls
- Query: agent_id, status, date_from, date_to, limit, offset
- Returns: array of calls
- Response code: 200
```

### Analytics
```
GET /api/v1/analytics/dashboard
- Dashboard metrics
- Query: period (today/week/month), agent_id
- Returns: call count, success rate, cost, sentiment breakdown
- Response code: 200

GET /api/v1/analytics/revenue
- Revenue report
- Query: period, start_date, end_date
- Returns: monthly data with MRR
- Response code: 200
```

### Webhooks
```
POST /api/v1/webhooks/exotel
- Exotel callback receiver
- Body: Exotel call event
- Verify signature (HMAC-SHA256)
- Returns: 200 OK
- Response code: 200
```

---

## DATABASE SCHEMA (EXACT)

### PostgreSQL

```sql
-- Merchants table
CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  api_key VARCHAR(255) UNIQUE NOT NULL,
  api_secret VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  webhook_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX (api_key)
);

-- Agents table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  language VARCHAR(20) NOT NULL,  -- 'hi' or 'en' for Phase 1
  voice_id VARCHAR(100) NOT NULL,
  voice_tone VARCHAR(50),
  system_prompt TEXT NOT NULL,
  phone_number VARCHAR(20),
  status VARCHAR(50) DEFAULT 'active',  -- active, paused, deleted
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX (merchant_id, status),
  INDEX (id, status)
);

-- Calls table (CDR)
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  phone VARCHAR(20) NOT NULL,
  customer_name VARCHAR(255),
  customer_id VARCHAR(255),
  status VARCHAR(50) NOT NULL,  -- queued, ringing, answered, completed, failed
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  duration_seconds INT,
  language_used VARCHAR(20),
  dnd_checked BOOLEAN DEFAULT false,
  dnd_status VARCHAR(50),
  cost_rupees DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX (merchant_id, status, created_at),
  INDEX (agent_id, created_at),
  INDEX (phone, created_at)
);

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',  -- admin, user
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX (merchant_id, email)
);

-- Call metadata (MongoDB is fine, but can use PostgreSQL JSONB)
CREATE TABLE call_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES calls(id),
  transcript TEXT,
  recording_url TEXT,
  recording_duration INT,
  sentiment VARCHAR(50),
  sentiment_score DECIMAL(3, 2),
  actions_executed JSONB,  -- array of executed functions
  llm_provider VARCHAR(50),
  tts_latency_ms INT,
  stt_confidence DECIMAL(3, 2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## ENVIRONMENT VARIABLES (EXACT)

```bash
# Required for Phase 1 (store in AWS Secrets Manager, NOT .env)

# Database
DATABASE_URL=postgresql://user:pass@payaid-db.xxx.amazonaws.com/payaid_voice
REDIS_URL=redis://payaid-redis.xxx.amazonaws.com:6379

# API Keys (External Services)
GEMINI_API_KEY=xxx
GOOGLE_STT_API_KEY=xxx
AZURE_TTS_API_KEY=xxx
AZURE_TTS_REGION=eastus

EXOTEL_API_KEY=xxx
EXOTEL_API_TOKEN=xxx
EXOTEL_SID=xxx

PINECONE_API_KEY=xxx
PINECONE_INDEX=payaid-voice

# App Configuration
NODE_ENV=production
APP_PORT=3000
APP_URL=https://voice.payaid.com
DASHBOARD_URL=https://dashboard.voice.payaid.com

# AWS
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
S3_BUCKET=payaid-voice-recordings

# JWT
JWT_SECRET=xxx
JWT_EXPIRY=24h

# Exotel Webhook
EXOTEL_WEBHOOK_SECRET=xxx

# Logging
LOG_LEVEL=info
LOG_DESTINATION=cloudwatch
```

---

## TESTING REQUIREMENTS (MANDATORY)

### Unit Tests
```
Coverage Target: 80% minimum
Files to test:
- API endpoints (all CRUD operations)
- Authentication middleware
- Error handling
- Database queries
- Validation logic

Command: npm run test
Report: Coverage report in /coverage
```

### Integration Tests
```
Scenarios:
1. Create agent → Get agent → Update agent → Delete agent
2. Initiate call → Poll status → Mark completed
3. DND check → Block call if in list
4. Consent check → Proceed only if consent on file
5. Knowledge base upload → Query during call
6. Webhook receipt → Call status update → Send merchant webhook

Tool: Jest + Supertest
Database: Test PostgreSQL (separate DB)
```

### Performance Tests
```
Load: 50 concurrent calls
Duration: 10 minutes
Target p95 latency: <500ms
Target error rate: <2%

Tool: Artillery or k6
Command: npm run load-test
Report: JSON output with metrics
```

---

## DEPLOYMENT PROCEDURE (STRICT)

### Pre-Deployment Checklist
```
[ ] All tests passing (npm run test)
[ ] No console errors or warnings
[ ] Load test passing (p95 < 500ms)
[ ] Security scan passing
[ ] Database migration tested on staging
[ ] Secrets verified in AWS Secrets Manager
[ ] Monitoring dashboards created
[ ] Rollback procedure documented
[ ] Team trained on runbook
[ ] Stakeholders notified
```

### Deployment Steps
```
1. Merge feature branch to main (GitHub)
2. GitHub Actions triggers:
   - Run all tests
   - Build Docker image
   - Push to ECR
   - Deploy to ECS staging
   - Run smoke tests
   - If all pass: Deploy to production (blue-green)
3. Monitoring checks:
   - API responding
   - Database healthy
   - Redis healthy
   - Error rate normal
   - Latency normal
4. If issues: Automatic rollback to previous version
5. Alert team when deployment complete
```

### Rollback Procedure (If Needed)
```
If error rate > 5% for 5 minutes:
1. Automatic rollback triggers
2. Previous ECS task definition deployed
3. Database connection revalidated
4. Health checks run
5. Team paged with incident details
6. Manual investigation post-incident

Command: aws ecs update-service --rollback
```

---

## METRICS & MONITORING (REQUIRED)

### CloudWatch Dashboards
```
Real-time Metrics:
- API request count (per endpoint)
- API latency (p50, p95, p99)
- Error count + rate
- Database connection pool
- Redis hit rate
- Call success rate
- Cost tracking

Alerts:
- Error rate > 2% (warning), > 5% (critical)
- Latency p95 > 500ms (warning), > 1000ms (critical)
- Database CPU > 80%
- Redis memory > 80%
- Uptime < 99.9% SLA
```

### KPIs to Track
```
Daily:
- Total calls initiated
- Call completion rate (target: >85%)
- Average latency (target: <500ms)
- Error rate (target: <2%)
- Cost per call (target: <₹3)

Weekly:
- Merchant count
- Active merchants (engaged)
- NPS (collect from merchants)
- Churn rate (should be 0 in Phase 1)
- Revenue (cumulative)

Monthly:
- Total calls
- Merchant growth rate
- Success rate trends
- Cost trends
- Feature adoption
```

---

## SUPPORT & OPERATIONS (PHASE 1)

### Support Channels
```
Email: support@voice.payaid.com
Response time: <4 hours during business hours
Status page: status.voice.payaid.com

Common Issues:
- "Call not connecting" → Check DND status, check Exotel account
- "Agent not responding" → Check Gemini API, check latency
- "No recording saved" → Check S3 permissions, check encryption
```

### On-Call Rotation (Phase 1)
```
- Tech lead: Always on-call (first point of contact)
- Backend engineer: Escalation
- DevOps: Infrastructure issues
- On-call hours: 24/7 during first month
- Page via: Slack + SMS
```

---

## ACCEPTANCE CRITERIA (PHASE 1 COMPLETE)

### Technical
```
✓ All CRUD endpoints working
✓ All tests passing (80%+ coverage)
✓ p95 latency < 500ms
✓ Error rate < 2%
✓ Uptime 99.9% (measured over 1 week)
✓ Zero data breaches
✓ All compliance requirements met
```

### Product
```
✓ 50+ merchants onboarded
✓ 1,000+ test calls completed
✓ >85% call completion rate
✓ NPS >40 from beta merchants
✓ Merchant activation < 30 minutes
✓ First call within 5 minutes of agent creation
```

### Business
```
✓ Revenue: ₹0-30K/month
✓ Unit economics: Positive (revenue > COGS)
✓ CAC payback: < 3 months
✓ Churn rate: 0% (Phase 1 beta merchants stay)
```

---

## WHAT NOT TO DO (CRITICAL)

### Forbidden Actions
```
✗ Do NOT add Phase 2 features
✗ Do NOT optimize for scale (we test PMF first)
✗ Do NOT add voice cloning
✗ Do NOT add sentiment analysis (real-time)
✗ Do NOT add multi-language support beyond Hi/En
✗ Do NOT build drag-drop agent builder
✗ Do NOT add N8N workflow engine
✗ Do NOT build admin dashboard
✗ Do NOT add CRM integrations
✗ Do NOT build mobile app
✗ Do NOT add SMS fallback
✗ Do NOT implement white-label
✗ Do NOT add advanced analytics
✗ Do NOT change technology stack mid-project
✗ Do NOT deploy to non-India regions
✗ Do NOT skip compliance checks
✗ Do NOT extend timeline
✗ Do NOT increase budget
✗ Do NOT add team members without approval
```

---

## SUCCESS CRITERIA CHECKLIST (SIGN-OFF)

**By Day 42 (6 weeks), the following must be TRUE:**

```
Development:
[ ] GitHub repository with clean history
[ ] All code reviewed and merged to main
[ ] 80%+ test coverage
[ ] Zero critical security issues
[ ] All endpoints tested and working
[ ] API documentation complete
[ ] Database migrations complete
[ ] Deployment scripts working

Infrastructure:
[ ] AWS infrastructure operational (Mumbai region)
[ ] RDS PostgreSQL healthy
[ ] Redis cluster healthy
[ ] S3 backups working
[ ] CloudWatch monitoring active
[ ] Secrets Manager configured

Product:
[ ] Dashboard fully functional
[ ] 50 merchants onboarded
[ ] 3-5 merchants actively using
[ ] >85% call completion rate
[ ] NPS >40 from beta merchants

Compliance:
[ ] DND integration verified
[ ] Consent management working
[ ] Call recording enabled
[ ] Audit logs maintained
[ ] Data localization confirmed (India only)

Operations:
[ ] Runbook documented
[ ] On-call process defined
[ ] Support email working
[ ] Monitoring dashboards live
[ ] Rollback procedure tested

Business:
[ ] Merchant onboarding playbook created
[ ] FAQ document ready
[ ] Product roadmap (Phase 2/3) documented
[ ] Success metrics being tracked
```

**SIGN-OFF REQUIRED FROM:**
- CTO/Tech Lead
- Product Manager
- Compliance Officer
- Finance (budget check)

---

## IMMEDIATE NEXT STEPS FOR CURSOR

### Day 1:
1. Create GitHub repository
2. Initialize Node.js project (npm init)
3. Install dependencies (listed above)
4. Create .env.template
5. Create Dockerfile
6. Push initial commit

### Days 2-3:
1. Set up AWS infrastructure
2. Create database schema
3. Initialize Express server
4. Set up CI/CD (GitHub Actions)
5. Deploy to staging

### Days 4-7:
1. Build agent CRUD APIs
2. Build authentication
3. Add tests
4. Deploy staging
5. Prepare for Week 2

---

## FINAL REMINDER: NO DEVIATIONS

This plan is NOT a guideline. It is a SPECIFICATION.

**Every requirement must be met. Every timeline must be respected. Every budget must be honored.**

If you encounter blockers, ESCALATE IMMEDIATELY. Do not:
- Extend timeline
- Add scope
- Change technology
- Skip compliance
- Reduce testing

Ask for help early. Ask for decisions quickly. Move forward only when unblocked.

**The goal is a working MVP by Day 42. Not a perfect system. Not a scalable system. A WORKING MVP.**

This is the only metric that matters for Phase 1.

---

**Status:** READY FOR CURSOR IMPLEMENTATION
**Prepared by:** Product & Engineering
**Date:** January 9, 2026
**Next Review:** Weekly (every Friday at 5 PM IST)

