# PayAid V3 - Comprehensive Project Documentation Prompt for Cursor

## System Instruction
You are a technical documentation specialist tasked with creating comprehensive project documentation for PayAid V3, a fintech and business automation SaaS platform. This documentation will be used for:
1. External technical review and code audit by AI systems (Perplexity)
2. Project improvement recommendations (ZERO-COST or build-it-ourselves focused)
3. Architecture and design pattern analysis
4. Best practices alignment and optimization
5. Self-hosted deployment strategy review

**SCOPE CLARIFICATION:**
- PayAid V3 is a UNIFIED SaaS platform for payments, CRM, automation, and business tools
- GemShopify, FashionE, TradeFurnish, UrbanCentr, EnhexWardrobe are SEPARATE e-commerce projects (NOT part of PayAid V3)
- Currency: Indian Rupee (INR) ONLY
- Payment Gateway: PayAid Payments ONLY (no Razorpay, Stripe, CCAvenue integration)
- Infrastructure: Self-hosted priority to minimize costs and maximize profit margin
- Monetization: Sell the platform to users and business owners at reasonable prices
- Cost Philosophy: Prefer open-source, self-hosted, and in-house solutions over paid SaaS tools

---

## Documentation Generation Request

### PART 1: PROJECT OVERVIEW & CONTEXT

Generate a comprehensive overview document that includes:

1. **Project Identity**
   - Project Name: PayAid V3
   - Project Type: Self-Hosted SaaS Fintech Platform
   - Primary Purpose: Unified platform for payments (INR), CRM, business automation, AI workflows, and admin tools
   - Current Stage of Development
   - Target Users/Personas (Indian SMEs, startups, businesses)
   - Geographic Focus: India-first (Tier 1, 2, 3 cities)
   - B2B2C Model: Sell to businesses who use it for their own customers

2. **Core Value Propositions**
   - What problem does PayAid V3 solve for Indian businesses?
   - Competitive differentiation vs. ZOHO, HubSpot, Razorpay Dashboard, standalone solutions
   - Unique selling features (all-in-one platform, self-hosted option, local currency support)
   - Target business segments (e-commerce, SMEs, agencies, consultants, service providers)
   - Why self-hosted is the advantage (data sovereignty, cost control, customization)

3. **Technology Stack - Self-Hosted Focused**
   - Frontend Framework (Next.js, React, Vue.js, etc.)
   - Backend Technology (Node.js, Python, PHP, Go, etc.)
   - Database(s) (PostgreSQL, MySQL, MongoDB - self-hosted instances)
   - Caching Layer (Redis - self-hosted)
   - Search & Indexing (Elasticsearch, Meilisearch, or in-DB full-text search)
   - AI/ML Integration (Ollama for local LLM, local RAG, no dependence on paid APIs)
   - Message Queue/Background Jobs (Bull Queue with Redis, RabbitMQ, or Celery)
   - File Storage (S3-compatible local storage, Minio, or filesystem-based)
   - Container Orchestration (Docker, Docker Compose, or lightweight alternatives)
   - Reverse Proxy (Nginx, Caddy)
   - SSL/TLS (Let's Encrypt for HTTPS)
   - Monitoring & Logging (Open-source tools: Prometheus, Grafana, ELK Stack, or Loki)
   - Authentication (JWT, OAuth2, LDAP/AD integration for enterprises)
   - Payment Processing (PayAid Payments API integration - internal system)

4. **Repository Structure**
   - List all repositories/monorepos
   - Which repos are PayAid V3 core vs. supporting projects
   - Directory structure and organization logic
   - Monorepo or multi-repo strategy
   - File naming conventions
   - Configuration management approach (environment files, secrets management)
   - Docker Compose files for self-hosted deployment

5. **Self-Hosted Deployment Architecture**
   - Single-server vs. distributed setup options
   - Recommended hardware specifications for different user volumes
   - Scaling strategy (vertical scaling first, horizontal if needed)
   - Backup and disaster recovery strategy
   - Data persistence and volume management
   - Network architecture and port management

---

### PART 2: SYSTEM ARCHITECTURE & DESIGN

Generate detailed architectural documentation covering:

1. **High-Level Architecture (Self-Hosted)**
   - Monolithic vs. Microservices approach
   - Service-to-service communication patterns
   - Data flow overview (user input → processing → storage → output)
   - External system integrations (only PayAid Payments gateway, no third-party payment processors)
   - API Gateway architecture (if applicable)
   - Request flow from frontend → backend → database → response

2. **Frontend Architecture**
   - UI/UX framework and component library (if any)
   - State management (Redux, Zustand, Context, etc.)
   - Authentication/Authorization on frontend
   - Real-time updates (WebSockets, polling, or Server-Sent Events)
   - Responsive design approach
   - Accessibility considerations
   - Performance optimization (code splitting, lazy loading, etc.)
   - Offline capabilities (if any)

3. **Backend Architecture**
   - API design (REST, GraphQL, or both)
   - Service layers and organization
   - Database connection pooling
   - Request validation and sanitization
   - Error handling and HTTP status codes
   - Logging and request tracing
   - Rate limiting and throttling
   - Queue-based async processing
   - Cron jobs and scheduled tasks

4. **Module Breakdown - Complete List**
   For EACH module, document:
   
   **A. Module Identity**
   - Module Name
   - Module Purpose/Responsibility
   - Status (Active/In Development/Planned)
   - Dependencies on other modules
   - Frontend & Backend separation (if any)
   
   **B. Frontend Components (if applicable)**
   - Component hierarchy
   - Pages/Routes involved
   - UI/UX flows specific to this module
   - Forms and validations
   - Data visualization components
   - User interactions
   
   **C. Backend Architecture**
   - Controllers/Handlers/Routes
   - Business logic layer
   - Data access layer (Models, Repositories, Queries)
   - Database schema (tables, relationships, indexes)
   - API endpoints
   - External integrations (PayAid Payments for payment module)
   - Event emission/subscription
   
   **D. Data Models**
   - Primary entities/collections
   - Database schema details
   - Relationships (one-to-one, one-to-many, many-to-many)
   - Indexes for performance
   - Data validation rules
   - Data retention and cleanup policies
   
   **E. API Endpoints (if public-facing)**
   - List of endpoints with HTTP method, path, and purpose
   - Request/response schemas (JSON examples)
   - Authentication requirements
   - Authorization (which roles can access)
   - Rate limiting policies
   - Error responses
   - Pagination, filtering, sorting (if applicable)

5. **All Modules in PayAid V3**
   Please document the following (expand based on actual modules):
   
   - **Authentication & Authorization Module**
     - User registration/login/logout flows
     - Email verification process
     - Password reset/recovery
     - Token generation and management (JWT)
     - Session management
     - RBAC implementation (see Part 3)
     - Multi-organization/tenant support
     - Frontend: Login page, registration form, forgot password flow
     - Backend: Auth service, JWT middleware, permission checks
   
   - **Payment Processing Module**
     - Payment initiation flow
     - Integration with PayAid Payments API
     - Transaction tracking and status updates
     - Invoice generation
     - Payment history and receipts
     - Refund processing
     - Reconciliation logic
     - Webhook handling from PayAid Payments
     - Currency: INR only
     - Frontend: Payment form, transaction history, invoice view
     - Backend: Payment service, reconciliation engine, webhook handler
   
   - **CRM Module**
     - Customer/Contact database
     - Contact creation, update, deletion
     - Customer segmentation
     - Interaction history (calls, emails, meetings)
     - Pipeline/deal management (if applicable)
     - Notes and comments on contacts
     - Search and filtering
     - Frontend: Contact list, contact detail view, forms, dashboards
     - Backend: Contact service, interaction tracking, search indexing
   
   - **Business Automation & Workflow Module**
     - Workflow builder/visual editor
     - Workflow trigger types (time-based, event-based, manual)
     - Actions library (send email, SMS, create contact, etc.)
     - Conditional logic (if-else branches)
     - Workflow execution engine
     - Execution history and logs
     - Error handling in workflows
     - Frontend: Workflow builder UI, workflow list, execution history
     - Backend: Workflow definition parser, execution engine, action handlers
   
   - **AI Agent Orchestration Module**
     - AI agent framework (Ollama integration for local LLM)
     - Individual AI agent specifications (18+ agents)
     - Agent-to-agent communication
     - Agent invocation and response handling
     - Prompt engineering and system prompts
     - Local knowledge base/RAG using open-source tools
     - Agent performance monitoring
     - Frontend: Agent interaction UI, agent status dashboard
     - Backend: Agent orchestration, LLM integration, knowledge base indexing
   
   - **Notification Module**
     - Email sending (self-hosted mail server or free SMTP)
     - SMS integration (free/low-cost SMS APIs for India)
     - WhatsApp messaging (if using WhatsApp Business API)
     - In-app notifications
     - Notification templates and variables
     - Notification scheduling and queueing
     - Delivery status tracking
     - Frontend: Notification display, preferences
     - Backend: Notification queue, delivery handlers, template engine
   
   - **Reporting & Analytics Module**
     - Dashboard creation (pre-built and custom dashboards)
     - Report generation (PDF, Excel, CSV exports)
     - Metrics and KPI tracking
     - Data visualization (charts, graphs, tables)
     - Scheduled report delivery
     - Data drill-down and filtering
     - Frontend: Dashboard builder, report viewer, export UI
     - Backend: Analytics engine, data aggregation, export generation
   
   - **Admin & Settings Module**
     - Organization/Tenant management
     - User management (create, update, delete, roles)
     - System configuration (company details, branding, etc.)
     - Feature flags and feature management
     - Audit logging
     - API key management
     - Billing and usage tracking (if applicable)
     - System health and monitoring dashboard
     - Frontend: Admin panel, settings pages, user management
     - Backend: Admin service, configuration storage, audit logger
   
   - **Integration Hub Module**
     - Third-party API connector framework
     - Webhook management (incoming and outgoing)
     - Data mapping and transformation
     - Sync scheduling
     - Connection testing and status
     - Error logging for failed integrations
     - Frontend: Integration settings, connection status, webhook management
     - Backend: Webhook receiver, API client, sync scheduler
   
   - **Document Management Module** (if applicable)
     - File upload and storage
     - File versioning
     - File sharing and permissions
     - Document templates
     - E-signature support (if needed)
     - Frontend: File browser, upload UI, sharing dialog
     - Backend: File service, storage handling, versioning
   
   - [ADD ANY OTHER MODULES SPECIFIC TO YOUR IMPLEMENTATION]

---

### PART 3: ROLE-BASED ACCESS CONTROL (RBAC)

Generate complete RBAC documentation:

1. **Role Hierarchy**
   - List all roles in the system (e.g., Super Admin, Org Admin, Team Lead, User, Read-Only, Custom Roles)
   - Role descriptions and responsibilities
   - Role inheritance structure
   - Role assignment workflow
   - Default roles vs. custom roles
   
2. **Permissions Matrix**
   - For each module, list all available permissions (create, read, update, delete, execute, etc.)
   - Permission naming convention/pattern (e.g., `module:action`, `contacts:create`, `payments:approve`)
   - Permission dependency rules (e.g., `payments:create` requires `contacts:view`)
   - Dynamic vs. Static permissions
   - Organization-level permissions vs. object-level permissions
   
3. **Permission Implementation**
   - Middleware/decorator approach for enforcing permissions in backend
   - Frontend permission checks (showing/hiding UI elements)
   - Permission evaluation logic
   - Caching strategy for role/permission lookups (Redis or in-memory)
   - Real-time permission updates across sessions
   
4. **Granularity Levels**
   - Organization-level access (multi-tenant isolation)
   - Module-level access (which modules user can access)
   - Object-level permissions (user can only see their own contacts, or team contacts)
   - Field-level permissions (hide sensitive fields like salary, passwords)
   - Data visibility rules by role (e.g., Sales team sees only their deals)
   - Record ownership and sharing logic
   
5. **Special Cases**
   - Custom roles creation by organization admins
   - Permission delegation (can user A grant their permissions to user B)
   - Time-based access restrictions (access only during business hours)
   - IP-based restrictions (access only from office IP)
   - Two-factor authentication requirements
   - Guest/temporary user access

---

### PART 4: USER FLOWS & WORKFLOWS

Generate flowcharts and descriptions for both FRONTEND and BACKEND:

1. **Authentication Flows**
   - User registration flow (email entry → email verification → profile setup → login)
   - Login/logout flow (email + password → JWT generation → session setup)
   - Password reset flow (forgot password link → email verification → new password)
   - Session management (token expiry, refresh token logic, concurrent session handling)
   - OAuth/SSO integration flows (if applicable)
   - Frontend: UI screens involved, form validations, error messages
   - Backend: API calls, database operations, email sending, token generation

2. **Core Business Flows**
   For each major feature, document:
   - Entry point (user action/API call)
   - Step-by-step process (with decision points)
   - Integrations triggered
   - Database queries and updates
   - Frontend state changes
   - Response/Output to user
   - Error scenarios and handling
   - Edge cases
   
   **Examples to include:**
   - **Customer Creation Flow**: User clicks "Add Contact" → Form → Validation → Save to DB → Update list view → Show confirmation
   - **Payment Initiation Flow**: User selects amount → Choose payment method → Generate invoice → Integrate with PayAid Payments → Wait for webhook → Update payment status → Send receipt email
   - **Workflow Automation Execution**: Trigger condition met → Retrieve workflow definition → Parse actions → Execute each action sequentially → Log execution → Handle errors → Notify user
   - **AI Agent Invocation**: User asks question → Route to appropriate agent → Local Ollama LLM processing → RAG lookup if needed → Generate response → Display to user
   - **Report Generation**: User selects report type and filters → Query database → Aggregate data → Apply calculations → Generate PDF/Excel → Email or download

3. **Admin Workflows**
   - Organization/User management (create org, invite users, assign roles)
   - System configuration (set company details, feature flags, integrations)
   - Feature enablement/disablement
   - Audit log review and investigation
   - System monitoring and alerts

4. **Integration Workflows**
   - Third-party webhook receipt and validation
   - Payment gateway webhook handling (PayAid Payments)
   - Incoming webhook processing and action triggering
   - Outgoing webhook sending and retry logic
   - Sync scheduling between systems
   - Error handling and notification

---

### PART 5: DATA FLOW & SECURITY

Generate documentation on:

1. **End-to-End Data Flow**
   - Data entry points (API, webhooks, file uploads, scheduled tasks)
   - Transformation pipeline (validation, normalization, enrichment)
   - Storage layers (primary DB, cache, file storage)
   - Output/Export paths (API response, reports, webhooks)
   - Data deletion/archival policies
   - Data flow diagram for critical operations

2. **Security Implementation**
   - **Authentication**
     - JWT structure and payload
     - Token expiry and refresh logic
     - Password hashing algorithm (bcrypt, Argon2, etc.)
     - Session token management
   
   - **Encryption**
     - Encryption at rest (algorithm: AES-256, key management)
     - Encryption in transit (TLS 1.3, certificate management via Let's Encrypt)
     - Field-level encryption (for sensitive data like payment info)
   
   - **Authorization & Access Control**
     - API authentication methods (JWT, API keys)
     - Permission enforcement in middleware
     - Row-level security (filtering data by organization/user)
   
   - **Input Validation & Output Encoding**
     - SQL injection prevention (parameterized queries, ORM)
     - XSS protection (HTML escaping, CSP headers)
     - CSRF protection (tokens, SameSite cookies)
     - File upload validation (type, size, virus scanning if needed)
   
   - **Secrets Management**
     - How API keys and credentials are stored (environment variables, secret vaults)
     - Key rotation procedures
     - Access control to secrets
   
   - **PCI DSS Compliance** (if handling payment card data)
     - Never store full card numbers (rely on PayAid Payments tokenization)
     - Compliance with payment data security standards
   
   - **Data Privacy Compliance**
     - India Data Protection (DPDP Act compliance)
     - Data retention policies
     - User data export/deletion requests
     - Privacy policy implementation
   
   - **Audit & Logging**
     - Who accessed what, when, and from where
     - Audit log retention and rotation
     - Admin activity logging
     - Failed login attempt logging
   
   - **DDoS & Rate Limiting**
     - Rate limiting per IP and per user
     - Distributed rate limiting (if multiple servers)
     - Captcha or challenge-response mechanisms

3. **Multi-Tenancy & Isolation**
   - Tenant isolation strategy (row-level, schema, or database isolation)
   - Cross-tenant data leak prevention measures
   - Shared vs. isolated resources
   - Backup and recovery per tenant
   - Tenant data segregation in logs and analytics

---

### PART 6: AI AGENT SYSTEM DOCUMENTATION

Generate comprehensive AI agent documentation:

1. **AI Agent Framework Overview**
   - Framework architecture (custom-built, Ollama, CrewAI, or LangChain)
   - Local LLM setup (Ollama with open-source models like Llama 2, Mistral, etc.)
   - Agent communication protocol (REST API, message queue, or direct function calls)
   - Task assignment and routing logic
   - Result aggregation mechanism for multi-agent tasks
   - Fallback and error handling (timeout, hallucination detection, etc.)
   - Cost considerations (zero-cost with local Ollama)

2. **Individual Agent Specifications (18+ Agents)**
   For EACH agent, document:
   
   - **Agent Identity**
     - Agent Name and ID
     - Primary Purpose and Responsibility
     - Input Types Expected (text, structured data, user context, etc.)
     - Output Format (text, JSON, action commands)
     - Latency SLA (expected response time)
   
   - **Configuration**
     - LLM Model Used (Ollama model name, e.g., `llama2:7b`, `mistral:7b`)
     - Model Size (7B, 13B, 70B parameters) - consider inference speed vs. quality
     - Model Parameters (temperature: 0.7 for creative, 0.1 for precise; max_tokens, top_p)
     - System Prompt/Instructions (what persona and instructions to follow)
     - Tools/Functions Available (API calls this agent can make)
     - Knowledge Base Integration (if using RAG, which documents/databases to search)
     - Context window limit and handling
   
   - **Trigger Conditions**
     - When is this agent invoked? (user request, scheduled, event-based)
     - Automatic vs. manual triggers
     - User/role permissions required
     - Rate limiting (how often can it be called)
   
   - **Integration Points**
     - APIs called by this agent (PayAid Payments, CRM, etc.)
     - Data sources accessed (database tables, documents, external APIs)
     - Actions it can perform (create contact, send email, update status, etc.)
     - Notifications it sends upon completion
   
   - **Performance Metrics**
     - Success rate (% of requests answered correctly)
     - Average response time (latency)
     - Cost per invocation (local Ollama = free; if using cloud LLM, document cost)
     - User satisfaction/feedback
     - Hallucination rate (how often it makes up false information)
   
   - **Training & Improvement**
     - How is the agent trained/fine-tuned?
     - Feedback loop for improvement
     - Model update frequency

3. **Agent Examples**
   - Real-world examples of agent interactions
   - Sample input: "I want to create an invoice for customer XYZ for $1000"
   - Expected output: Agent creates invoice in system and returns confirmation
   - Edge cases: What if customer doesn't exist? Currency mismatch? etc.

4. **Agent Workflow Orchestration**
   - How agents work together to accomplish complex tasks
   - Agent chaining (Agent A output feeds to Agent B input)
   - Multi-agent conversation/debate (multiple agents reasoning together)
   - Conflict resolution between agent outputs
   - Distributed task execution

5. **Knowledge Base & RAG (Retrieval-Augmented Generation)**
   - How is knowledge base structured (documents, database records, embeddings)?
   - Embedding generation (using free open-source models like `sentence-transformers`)
   - Vector database or similarity search mechanism
   - Relevance scoring and ranking
   - Knowledge base update frequency

---

### PART 7: CONFIGURATION & DEPLOYMENT (SELF-HOSTED)

Generate documentation on:

1. **Environment Configuration**
   - Development environment setup (local development with Docker Compose)
   - Staging environment specifications (pre-production testing)
   - Production environment specifications (actual user environment)
   - Environment variables list (database URL, API keys, etc. - list names, not values)
   - Configuration file structure
   - Secrets management approach (`.env` files, Docker secrets, or vault)
   - Feature flags and how they're configured

2. **Self-Hosted Deployment Process**
   - **Prerequisites**: Hardware requirements (CPU, RAM, Storage for different user counts)
   - **Installation**: Docker Compose up process, database initialization, seed data
   - **Configuration**: Setting up environment variables, SSL certificates
   - **Health Checks**: How to verify system is running correctly
   - **Pre-deployment Checklist**: What to verify before going live
   - **Deployment Steps**: Step-by-step process to deploy updates
   - **Rollback Procedures**: How to revert to previous version if something breaks
   - **Database Migrations**: How to run migrations without downtime
   - **Zero-Downtime Deployment**: Blue-green deployment or similar strategies

3. **Database Setup & Management**
   - Database choice and why (PostgreSQL, MySQL, MongoDB)
   - Database initialization scripts
   - Backup strategy (automated backups, backup retention)
   - Disaster recovery plan (RTO, RPO targets)
   - Database performance tuning (indexes, query optimization)
   - Connection pooling configuration
   - Storage volume management

4. **Scaling & Performance**
   - Vertical scaling options (upgrade server hardware)
   - Horizontal scaling options (if applicable, multiple backend instances with load balancer)
   - Load balancing approach (Nginx, HAProxy)
   - Database optimization and indexing strategy
   - Caching layers and strategy (Redis for session cache, query results)
   - CDN usage for static assets (or self-hosted static file server)
   - Performance benchmarks (requests per second, concurrent users supported)

5. **Monitoring & Logging**
   - Logging framework (Winston, Pino, Bunyan for Node.js; Python logging, etc.)
   - Log levels and what gets logged
   - Log aggregation strategy (file rotation, centralized logging with ELK or Loki)
   - Error tracking (Sentry integration for error reporting, or self-hosted)
   - Performance monitoring (Prometheus + Grafana for metrics)
   - Application Performance Monitoring (APM) - self-hosted solutions
   - Health check endpoints
   - Alert thresholds and notification mechanisms
   - Dashboard setup for operational insights

6. **Data Backup & Disaster Recovery**
   - Backup frequency (daily, hourly, continuous)
   - Backup destination (local, off-site, cloud - choose cost-effective option)
   - Backup restoration testing procedure
   - RTO (Recovery Time Objective) and RPO (Recovery Point Objective)
   - Disaster recovery runbook

---

### PART 8: EXTERNAL DEPENDENCIES & INTEGRATIONS

Generate a comprehensive list:

1. **Payment Gateway Integration**
   - PayAid Payments API integration (internal system)
   - API endpoints for payment initiation and status checking
   - Webhook handling for payment status updates
   - Error handling for payment failures
   - Reconciliation process
   - Currency: INR only

2. **Communication Channels**
   - **Email**: SMTP server (self-hosted Postfix/Sendmail or free SMTP like Gmail)
   - **SMS**: Integration with India-based SMS providers (free/low-cost options: Fast2SMS, MSG91 free tier, etc.)
   - **WhatsApp**: WhatsApp Business API (if using, costs involved; consider free alternatives like WhatsApp webhooks)
   - **In-app Notifications**: Built-in notification system

3. **Data & Analytics**
   - Webhook sources (incoming webhooks from PayAid Payments)
   - Data export destinations (CSV, Excel, PDF generation)
   - Analytics platform (Plausible, Fathom, or Google Analytics alternatives)
   - Reporting tool connections

4. **Third-Party APIs**
   - List of all external API calls
   - API usage quotas and rate limits
   - Rate limiting handling (backoff, retry logic)
   - Fallback mechanisms (what happens if third-party API is down)
   - Cost estimation per API (or zero-cost open-source alternatives)

5. **Open Source & Paid Services**
   - **Frontend**: React, Vue, Angular, Svelte (all free)
   - **Backend**: Node.js, Python, Go, PHP (all free)
   - **Database**: PostgreSQL, MySQL (free and self-hosted)
   - **Caching**: Redis (free)
   - **Message Queue**: Bull Queue (Node.js, free), RabbitMQ (free), Celery (Python, free)
   - **LLM**: Ollama with open-source models (free)
   - **Search**: Meilisearch (free) or Elasticsearch (free community edition)
   - **Monitoring**: Prometheus, Grafana, Loki (all free)
   - **Reverse Proxy**: Nginx, Caddy (all free)
   - **SSL/TLS**: Let's Encrypt (free)
   - **Logging**: ELK Stack (free), Loki (free)
   - **Error Tracking**: Sentry (free tier available)
   - **Email**: Self-hosted mail server or Gmail SMTP (free for low volumes)
   - **SMS**: Evaluate free tiers or low-cost Indian SMS APIs
   - **Paid Services to AVOID**: Stripe, Razorpay (use PayAid Payments instead), SendGrid, Auth0, Datadog, PagerDuty
   - **License Compliance**: Document all open-source licenses (MIT, Apache 2.0, GPL, etc.) and ensure compliance

---

### PART 9: FRONTEND ARCHITECTURE

Generate comprehensive frontend documentation:

1. **UI/UX Framework & Design System**
   - Design system or component library (Material-UI, Tailwind, custom components)
   - Component hierarchy and structure
   - Design tokens (colors, typography, spacing, shadows)
   - Responsive design breakpoints
   - Accessibility standards (WCAG 2.1 AA compliance)
   - Dark mode support (if applicable)

2. **State Management**
   - State management solution (Redux, Zustand, Context API, Jotai, etc.)
   - Store structure and organization
   - Async state handling (API calls, loading states, error states)
   - Local state vs. global state strategy
   - State persistence (localStorage, sessionStorage)

3. **Routing & Navigation**
   - Routing library and configuration
   - Route hierarchy
   - Protected routes and permission-based navigation
   - Breadcrumb implementation
   - URL structure and deep linking support

4. **API Integration**
   - HTTP client library (Axios, Fetch, Apollo Client for GraphQL)
   - API base URL configuration (development vs. production)
   - Authentication token handling and refresh logic
   - Error handling and user feedback
   - Request/response interceptors
   - Loading and error states

5. **Real-Time Features** (if applicable)
   - WebSocket or Server-Sent Events for real-time updates
   - Connection management and auto-reconnect
   - Real-time notifications display

6. **Performance Optimization**
   - Code splitting and lazy loading
   - Bundle size monitoring
   - Image optimization (lazy loading, responsive images)
   - Memoization and React.memo usage
   - Virtual scrolling for large lists

7. **Testing**
   - Unit testing framework (Jest, Vitest)
   - Component testing library (React Testing Library, Enzyme)
   - E2E testing (Cypress, Playwright, Selenium)
   - Test coverage targets

8. **Forms & Validation**
   - Form library (React Hook Form, Formik, etc.)
   - Validation library and rules
   - Async validation (checking username availability, etc.)
   - Error display and user feedback

---

### PART 10: BACKEND ARCHITECTURE & BEST PRACTICES

Generate comprehensive backend documentation:

1. **API Design**
   - REST API design principles (HTTP methods, status codes, error responses)
   - API versioning strategy (URL path versioning, header versioning)
   - Request/response format (JSON structure, pagination, filtering, sorting)
   - Authentication header format (Bearer token format for JWT)
   - CORS configuration
   - API rate limiting configuration

2. **Service Layer Architecture**
   - Service organization (domain-driven design, feature-based, or layer-based)
   - Service dependencies and injection
   - Transaction handling and ACID compliance
   - Error handling and custom error codes

3. **Data Access Layer**
   - ORM/Query builder choice (Sequelize, TypeORM, Prisma, etc.)
   - Query optimization (N+1 problem, query profiling)
   - Database connection management and pooling
   - Transaction management and rollback strategy
   - Data validation at database level (constraints, triggers)

4. **Caching Strategy**
   - Cache invalidation strategy
   - Cache key naming convention
   - TTL (Time-To-Live) for different cache types
   - Cache hit/miss monitoring

5. **Async Processing & Background Jobs**
   - Job queue system configuration
   - Job retry logic and exponential backoff
   - Job scheduling (cron jobs)
   - Dead letter queue handling
   - Job monitoring and failure alerts

6. **Security Best Practices**
   - Input validation on every endpoint
   - SQL injection prevention
   - CORS security
   - HTTPS enforcement
   - Security headers (HSTS, CSP, X-Frame-Options, etc.)
   - CSRF protection
   - Rate limiting configuration
   - DDoS mitigation

7. **Testing**
   - Unit testing framework and structure
   - Integration testing approach
   - Test data and fixtures
   - Test database setup
   - API contract testing

---

### PART 11: CODE QUALITY & DEVELOPMENT STANDARDS

Generate documentation on:

1. **Code Style & Structure**
   - Naming conventions (variables, functions, classes, files, database tables)
   - Function/method size guidelines (max lines of code)
   - Module organization principles (cohesion, coupling)
   - DRY principle implementation
   - Single Responsibility Principle (SRP) usage
   - Design patterns used (Factory, Observer, Strategy, etc.)

2. **Development Workflow**
   - Git workflow (Git Flow, GitHub Flow, or Trunk-Based Development)
   - Branching strategy (main, develop, feature branches naming)
   - Commit message format and conventions
   - Code review process and checklist
   - Pull request template
   - Merge strategy (squash, rebase, or merge commits)

3. **Testing Standards**
   - Unit test coverage targets (e.g., 70% coverage)
   - Test file organization and naming
   - Test data and mocking strategies
   - Integration test approach
   - E2E test scenarios
   - Load testing and performance benchmarks

4. **Linting & Formatting**
   - ESLint configuration (for JavaScript)
   - Prettier configuration (for code formatting)
   - Pre-commit hooks (Husky for running linters)
   - CI/CD linting checks
   - Code smell detection tools (SonarQube, CodeFactor, etc.)

5. **Error Handling & Logging**
   - Error classification (client errors vs. server errors vs. business logic errors)
   - Error logging standards (what to log, what not to log)
   - Log levels usage (error, warn, info, debug)
   - User-facing error messages (avoid technical jargon)
   - Error recovery mechanisms and fallbacks

6. **Documentation Standards**
   - Code comments expectations (why, not what)
   - Function/method documentation (JSDoc, Python docstrings)
   - API documentation tool (Swagger/OpenAPI, Postman collection)
   - README requirements (setup, running, testing, deployment)
   - Architecture Decision Records (ADRs)
   - Changelog maintenance

---

### PART 12: KNOWN ISSUES, TECHNICAL DEBT & OPTIMIZATION OPPORTUNITIES

Generate documentation on:

1. **Known Bugs & Limitations**
   - Current issues and their impact on users
   - Workarounds in place (if any)
   - Planned fixes and timeline
   - Issue tracking system (GitHub Issues, JIRA, etc.)

2. **Technical Debt**
   - Areas needing refactoring
   - Code sections with poor quality
   - Deprecated dependencies
   - Legacy code sections
   - Test coverage gaps
   - Documentation gaps

3. **Performance Issues & Optimization Opportunities**
   - Slow API endpoints (identify with metrics)
   - Database query optimization opportunities (identify N+1 queries, missing indexes)
   - Frontend performance optimization needs
   - Bundle size reduction opportunities
   - Caching opportunities (API responses, database queries)
   - Background job performance improvements

4. **Scalability Concerns**
   - Current bottlenecks
   - Data growth implications
   - User load scaling limits
   - Database scaling strategy

5. **Security & Compliance Gaps**
   - Unmet compliance requirements
   - Security audit findings
   - Missing security implementations
   - Data protection improvements needed

---

### PART 13: ROADMAP & FUTURE CONSIDERATIONS

Generate documentation on:

1. **Planned Features (Next 3-6 months)**
   - Features in active development
   - Planned features with timeline
   - User stories and acceptance criteria
   - Estimated effort and priority

2. **Medium-term Vision (6-12 months)**
   - Research/exploration phase items
   - Technology upgrades planned
   - Scaling initiatives
   - New module ideas

3. **Long-term Strategy (1+ year)**
   - Market expansion plans
   - Product evolution vision
   - Technology modernization roadmap

4. **Cost Optimization Roadmap**
   - Infrastructure cost reduction opportunities
   - SaaS service elimination or replacement with open-source
   - Profit margin improvement strategies
   - Pricing strategy (self-hosted vs. managed)

5. **Compliance & Governance**
   - Regulatory compliance roadmap (DPDP Act, RBI regulations if applicable)
   - Data governance improvements
   - Security certification targets (ISO 27001, SOC 2, etc.)

---

## OUTPUT FORMAT

Generate the above documentation in the following structure:

### Recommended Structure:
1. Create a **single comprehensive markdown document** (all sections), OR
2. Create **separate markdown files** for each section (Part 1-13) organized as:
   ```
   docs/
   ├── 01-project-overview.md
   ├── 02-system-architecture.md
   ├── 03-rbac.md
   ├── 04-user-flows.md
   ├── 05-data-flow-security.md
   ├── 06-ai-agents.md
   ├── 07-deployment-self-hosted.md
   ├── 08-external-dependencies.md
   ├── 09-frontend-architecture.md
   ├── 10-backend-architecture.md
   ├── 11-code-quality.md
   ├── 12-technical-debt.md
   └── 13-roadmap.md
   ```

### For Each Document:
- Use clear headings and subheadings (h1, h2, h3, h4)
- Include code snippets where relevant (JSON examples, SQL schema, API responses)
- Use tables for structured information (endpoints, permissions, integrations, roles)
- Include ASCII diagrams or text descriptions for complex flows
- Provide practical examples for workflows and user interactions
- Be specific and concrete (reference actual code, files, configurations)
- Include file paths and line numbers for key implementations where applicable

### Critical Requirements:
- **Frontend + Backend**: Document both frontend (UI/UX) and backend (API/Business Logic) for every module
- **Data Models**: Include actual database schema with table names, column names, relationships
- **API Endpoints**: List actual endpoints with HTTP method, path, parameters, responses
- **Actual Roles & Permissions**: Document the real roles and permissions in your system
- **Real Integrations**: List actual integrations (PayAid Payments, communication channels)
- **Self-Hosted Specifics**: Focus on Docker, Docker Compose, hardware requirements, single-server setup
- **Cost Awareness**: For every external service mentioned, note if it's free/paid and suggest free alternatives if available
- **No Placeholder Data**: Don't use fake examples; refer to actual implementation

---

## Additional Instructions for Generation

1. **Interview the Codebase Thoroughly**: 
   - Scan all source files to understand actual implementation
   - Extract real configurations, not assumptions
   - Identify actual patterns used
   - Find all API endpoints actually implemented
   - List all actual roles and permissions in use
   - Document actual database tables and relationships
   - List actual npm/pip packages and their licenses

2. **Be Comprehensive & Specific**:
   - Don't skip any module, feature, or component
   - Include even small utilities and helpers if they're important
   - Document all integrations, even minor ones
   - List all dependencies and their versions
   - Instead of "uses authentication", document: "JWT-based authentication with RS256 algorithm, 1-hour expiry, 30-day refresh token"
   - Instead of "logs errors", document: "Winston logger, log level ERROR for failures, stored in /logs directory, rotated daily, 30-day retention"

3. **Prioritize Information for Perplexity Review**:
   - Information that helps understand the system comprehensively
   - Information needed for maintenance and debugging
   - Information needed for performance optimization
   - Information needed for security audits
   - Information needed for scalability planning
   - Information needed for cost optimization

4. **Cost Consciousness**:
   - Flag every paid service or subscription
   - Suggest open-source alternatives for paid tools
   - Document current and potential cost savings
   - Highlight opportunities for zero-cost improvements

---

## Quality Checklist

Before finalizing documentation, verify:

- [ ] All 11-13 sections are documented
- [ ] All modules (frontend and backend) are documented
- [ ] All major user flows are described (with screenshots or text descriptions)
- [ ] All API endpoints are listed with request/response examples
- [ ] All integrations are listed with cost analysis
- [ ] All roles and permissions are documented accurately
- [ ] Technology stack is completely specified
- [ ] Deployment and scaling strategy is clear and self-hosted focused
- [ ] Security measures are documented comprehensively
- [ ] Database schema is documented with relationships
- [ ] Known issues and technical debt are disclosed
- [ ] Documentation is specific, not generic (references actual code)
- [ ] Code examples are provided where helpful
- [ ] Diagrams or flow descriptions help clarify complexity
- [ ] Frontend and backend architecture are balanced in documentation
- [ ] Cost analysis and free alternatives are mentioned
- [ ] Self-hosted deployment procedures are clear
- [ ] Future considerations and roadmap are clear
- [ ] AI Agent system is well-documented (18+ agents specified)
- [ ] No proprietary secrets exposed (API keys, credentials)
- [ ] Documentation is review-ready for external technical audit

---

## Review & Feedback Preparation

This documentation will be reviewed by Perplexity AI for:

1. **Architecture Review**: Is the overall design sound? Are there better patterns for self-hosted deployment?
2. **Best Practices Alignment**: Are established patterns being followed? Any architectural improvements?
3. **Performance Optimization**: Are there efficiency improvements? Database query optimization? Caching strategies?
4. **Security Assessment**: Are all security considerations covered? Any vulnerabilities or gaps?
5. **Cost Optimization**: Are there zero-cost or low-cost improvements? Can we reduce paid SaaS dependencies?
6. **Self-Hosted Readiness**: Is the system designed for self-hosted deployment? Hardware requirements clear? Scaling documented?
7. **Scalability Analysis**: Can the system scale as intended? Bottlenecks identified? Horizontal scaling strategy clear?
8. **AI Agent Quality**: Are the 18+ agents well-designed? Are they using optimal models? Performance acceptable?
9. **Maintainability**: Is the codebase maintainable and well-documented? Code quality standards clear?
10. **Compliance**: Are regulatory requirements met? (India Data Protection Act, RBI guidelines if applicable)

---

## Notes for Cursor

- **Focus on Reality**: Document the system as it actually exists, not as it should be.
- **Be Thorough**: This documentation will be the basis for comprehensive technical review by Perplexity.
- **Include Context**: Explain not just what, but why certain decisions were made.
- **Gap Identification**: If you discover that documentation doesn't exist for a component, note that gap explicitly.
- **Suggestions Welcome**: If you identify documentation improvements or potential enhancements, suggest them as part of this output.
- **Currency & Payment**: Remember INR currency only, PayAid Payments integration only.
- **Self-Hosted**: Emphasize self-hosted architecture, Docker Compose setup, free tools preference.
- **No E-commerce Projects**: Keep GemShopify, FashionE, etc. completely separate; they're not PayAid V3.
- **User-Centric**: Document from perspective of users/businesses who will deploy and use this platform.