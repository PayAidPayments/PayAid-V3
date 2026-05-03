# PayAid V3 Lead Intelligence - Data Model and Workflow Specification

## 1) Product goal

Lead Intelligence is a standalone PayAid V3 workspace, not a CRM subpage.

Its primary system contract is:

`discover -> enrich -> qualify -> activate`

The module must discover companies and contacts from live/public sources, enrich and verify missing data, score records against ICP + intent, and only then activate qualified rows into downstream systems (CRM, email, WhatsApp, calls, appointments, and sequences).

## 2) Scope and non-negotiable rules

### In scope

- Dedicated module navigation and homepage.
- Multi-source discovery (company and people).
- Enrichment and verification engine.
- URL scraping/research ingestion.
- Qualification/scoring engine.
- Activation queue and export center.
- Full provenance + audit logging + retry/error controls.

### Non-negotiable rules

- Do not bury Lead Intelligence inside CRM navigation.
- Do not ship a passive table-only/manual-entry experience.
- Do not skip live-source discovery and URL scraping support.
- Do not activate unqualified rows.
- Do not lose provenance/confidence data.
- Do not allow duplicate records without merge logic.

## 3) Core entities

### 3.1 `icp_profile`

Purpose: Defines targeting and exclusion logic for search planning and scoring.

Fields:

- `id` (string, pk)
- `tenant_id` (string, indexed)
- `name` (string)
- `description` (string, nullable)
- `target_industries` (json array)
- `target_titles` (json array)
- `geo_rules` (json)
- `company_size_rules` (json)
- `revenue_band_rules` (json)
- `exclusion_rules` (json)
- `technographic_rules` (json)
- `buying_signal_rules` (json)
- `lead_source_preferences` (json)
- `compliance_restrictions` (json)
- `status` (enum: `draft|active|archived`)
- `created_by` (string)
- `created_at` / `updated_at` (datetime)

### 3.2 `lead_search`

Purpose: User-level search request and orchestrator parent.

Fields:

- `id` (string, pk)
- `tenant_id` (string, indexed)
- `icp_profile_id` (fk -> `icp_profile.id`, nullable for ad-hoc)
- `query_text` (string)
- `query_type` (enum: `natural_language|structured|industry_preset|csv_enrichment|url_research`)
- `source_scope` (json)
- `filters_json` (json)
- `status` (enum: `draft|planned|running|paused|completed|failed|cancelled`)
- `result_count` (int)
- `created_by` (string)
- `created_at` / `updated_at` (datetime)

### 3.3 `source_connector`

Purpose: Source registry + per-tenant credential and health state.

Fields:

- `id` (string, pk)
- `tenant_id` (string, indexed)
- `source_type` (enum: `google_maps|linkedin_company|linkedin_people|job_board|website|ecommerce|funding_news|tech_stack|public_directory|custom_url`)
- `connection_mode` (enum: `public|api_key|oauth|partner_feed`)
- `status` (enum: `active|degraded|disabled`)
- `rate_limit_policy_json` (json)
- `last_health_check_at` (datetime, nullable)
- `last_health_status` (enum: `ok|warn|fail`, nullable)
- `config_ref` (string, nullable)
- `created_at` / `updated_at` (datetime)

### 3.4 `discovery_job`

Purpose: Per-source execution job for a search.

Fields:

- `id` (string, pk)
- `tenant_id` (string, indexed)
- `lead_search_id` (fk -> `lead_search.id`)
- `source_connector_id` (fk -> `source_connector.id`)
- `source_type` (enum mirror)
- `source_url` (string, nullable)
- `query_payload_json` (json)
- `job_status` (enum: `queued|planning|running|retrying|completed|partial|failed|cancelled`)
- `attempt_count` (int)
- `max_attempts` (int)
- `started_at` / `finished_at` (datetime, nullable)
- `error_log` (json array, nullable)

### 3.5 `company_record`

Purpose: Canonical company-level row after normalization and dedupe.

Fields:

- `id` (string, pk)
- `tenant_id` (string, indexed)
- `canonical_domain` (string, indexed, nullable)
- `name` (string)
- `website` (string, nullable)
- `industry` (string, nullable)
- `sub_industry` (string, nullable)
- `size` (string, nullable)
- `revenue_band` (string, nullable)
- `location` (json, nullable)
- `tech_stack` (json array, nullable)
- `phone` (string, nullable)
- `email_domain` (string, nullable)
- `confidence_score` (decimal)
- `fit_score_latest` (decimal, nullable)
- `intent_score_latest` (decimal, nullable)
- `source_count` (int)
- `last_verified_at` (datetime, nullable)
- `source_provenance` (json)
- `dedupe_cluster_id` (string, nullable)
- `created_at` / `updated_at` (datetime)

### 3.6 `contact_record`

Purpose: Canonical person-level row tied to company record.

Fields:

- `id` (string, pk)
- `tenant_id` (string, indexed)
- `company_record_id` (fk -> `company_record.id`)
- `full_name` (string)
- `title` (string, nullable)
- `seniority` (string, nullable)
- `department` (string, nullable)
- `email` (string, nullable)
- `email_verification_status` (enum: `unknown|valid|invalid|catch_all|risky`)
- `phone` (string, nullable)
- `phone_verification_status` (enum: `unknown|valid|invalid`)
- `linkedin_url` (string, nullable)
- `location` (json, nullable)
- `decision_role_score` (decimal)
- `confidence_score` (decimal)
- `source_trace` (json)
- `created_at` / `updated_at` (datetime)

### 3.7 `enrichment_field`

Purpose: Dynamic enrichment values for any entity.

Fields:

- `id` (string, pk)
- `tenant_id` (string, indexed)
- `entity_type` (enum: `company|contact`)
- `entity_id` (string, indexed)
- `field_name` (string)
- `field_value` (json/string)
- `source` (string)
- `verified` (boolean)
- `confidence_score` (decimal)
- `updated_at` (datetime)

### 3.8 `scrape_job`

Purpose: URL extraction job and structured output capture.

Fields:

- `id` (string, pk)
- `tenant_id` (string, indexed)
- `lead_search_id` (fk -> `lead_search.id`, nullable)
- `source_url` (string)
- `template_type` (enum: `team_page|directory|conference|pricing|service_listing|custom`)
- `parse_status` (enum: `queued|running|retrying|completed|partial|failed|cancelled`)
- `extracted_entities` (json)
- `confidence_score` (decimal)
- `attempt_count` (int)
- `max_attempts` (int)
- `error_log` (json array, nullable)
- `started_at` / `finished_at` (datetime, nullable)

### 3.9 `intent_signal`

Purpose: Captures observed buying/intent signals with recency.

Fields:

- `id` (string, pk)
- `tenant_id` (string, indexed)
- `record_type` (enum: `company|contact`)
- `record_id` (string, indexed)
- `signal_type` (enum: `job_posting|hiring_spike|funding_news|website_change|pricing_change|social_activity|review_trend|tech_stack_change|form_fill|page_visit`)
- `signal_strength` (decimal)
- `signal_payload_json` (json)
- `observed_at` (datetime)
- `source` (string)

### 3.10 `fit_score`

Purpose: Stores scoring outputs and reason traces for explainability.

Fields:

- `id` (string, pk)
- `tenant_id` (string, indexed)
- `record_type` (enum: `company|contact`)
- `record_id` (string, indexed)
- `icp_profile_id` (fk -> `icp_profile.id`)
- `score_total` (decimal)
- `score_breakdown_json` (json)
- `reason_text` (string)
- `qualified` (boolean)
- `threshold_used` (decimal)
- `created_at` (datetime)

### 3.11 `activation_rule`

Purpose: Defines how qualified prospects route into downstream systems.

Fields:

- `id` (string, pk)
- `tenant_id` (string, indexed)
- `name` (string)
- `trigger_conditions_json` (json)
- `destination_module` (enum: `crm|email|whatsapp|calls|appointments|sequences|campaigns`)
- `action_type` (string)
- `owner_assignment_rule` (json)
- `status` (enum: `active|paused|archived`)
- `created_at` / `updated_at` (datetime)

### 3.12 `export_job`

Purpose: Export generation and lineage.

Fields:

- `id` (string, pk)
- `tenant_id` (string, indexed)
- `lead_search_id` (fk -> `lead_search.id`, nullable)
- `segment_filter_json` (json)
- `format` (enum: `csv|xlsx|crm_import`)
- `status` (enum: `queued|running|completed|failed|cancelled`)
- `row_count` (int, nullable)
- `file_ref` (string, nullable)
- `created_by` (string)
- `created_at` / `finished_at` (datetime, nullable)

### 3.13 `audit_log`

Purpose: Immutable operational trace of user/system actions.

Fields:

- `id` (string, pk)
- `tenant_id` (string, indexed)
- `actor_type` (enum: `user|system|job`)
- `actor_id` (string, nullable)
- `event_type` (string)
- `entity_type` (string)
- `entity_id` (string)
- `payload_json` (json)
- `created_at` (datetime)

## 4) Relationships

- `icp_profile` 1..n `lead_search`
- `lead_search` 1..n `discovery_job`
- `lead_search` 1..n `scrape_job`
- `source_connector` 1..n `discovery_job`
- `company_record` 1..n `contact_record`
- `company_record|contact_record` 1..n `enrichment_field`
- `company_record|contact_record` 1..n `intent_signal`
- `company_record|contact_record` 1..n `fit_score`
- `lead_search` 1..n `export_job`
- `tenant` 1..n all entities
- `activation_rule` applies to qualified `fit_score` + selected records

## 5) Screen-to-object mapping

1. Lead Intelligence Home -> `lead_search`, `discovery_job`, `scrape_job`, `fit_score`, `export_job`, activation queue metrics.
2. ICP Builder -> `icp_profile`.
3. Industry Explorer -> `icp_profile` presets + `lead_search` templates.
4. Company Discovery -> `lead_search`, `discovery_job`, `company_record`.
5. People Discovery -> `contact_record`, `discovery_job`, `company_record`.
6. Data Enrichment -> `enrichment_field`, `company_record`, `contact_record`.
7. Web Scraping Research -> `scrape_job`, `company_record`, `contact_record`, `enrichment_field`.
8. Qualification & Scoring -> `fit_score`, `intent_signal`, `icp_profile`.
9. Activation Queue -> `activation_rule`, `fit_score`, downstream action logs (`audit_log`).
10. Export Center -> `export_job`, `lead_search`, `fit_score`.

## 6) Workflow definitions

### 6.1 Workflow A - Prompt to prospects

1. User submits natural-language prompt.
2. System creates/attaches `lead_search` and optional `icp_profile`.
3. Planner emits source-specific query plan.
4. Per-source `discovery_job` records are queued.
5. Discovery outputs normalize into canonical `company_record` and `contact_record`.
6. Dedupe merges duplicates into canonical rows.
7. Enrichment fills high-priority missing fields.
8. Intent + fit scoring writes `fit_score`.
9. Qualified rows appear in activation queue.
10. User activates selected rows to destinations.

### 6.2 Workflow B - CSV enrichment

1. Upload CSV and map columns.
2. Create `lead_search` (`query_type=csv_enrichment`).
3. Match records to existing canonical entities.
4. Run enrichment passes for missing fields.
5. Verify contact points (email/phone status).
6. Score rows and mark qualification.
7. Export or activate qualified selection.

### 6.3 Workflow C - URL scraping/research

1. Submit one or many URLs.
2. Create `scrape_job` rows per URL.
3. Extract entities by template and fallback parser.
4. Normalize entities into canonical records.
5. Attach provenance and confidence.
6. Run enrichment/scoring passes.
7. Route qualified outputs to activation queue.

### 6.4 Workflow D - Activation

1. Prospect passes threshold (`fit_score.qualified=true`).
2. User/system selects destination action.
3. Apply matching `activation_rule`.
4. Create destination records/tasks/sequences.
5. Persist action outcome + external IDs.
6. Emit `audit_log` event for each action.

## 7) State machines

### 7.1 Discovery job state machine

- `queued -> planning -> running -> completed`
- `running -> partial` (some source pages failed)
- `running -> retrying -> running`
- `running|retrying -> failed` (max attempts exhausted)
- `queued|planning|running|retrying -> cancelled`

Transition guards:

- Retry only for retriable errors (`429`, timeout, transient network).
- Hard-fail for non-retriable auth/schema errors unless operator override.

### 7.2 Enrichment job state machine (logical pipeline state)

- `pending -> running -> completed`
- `running -> partial` (some fields unresolved)
- `running -> retrying -> running`
- `running|retrying -> failed`
- Any pre-completion state -> `cancelled`

Field-level merge rule:

- Prefer verified source over unverified.
- If both verified, keep newest `updated_at`.
- Keep full source history in provenance.

### 7.3 Scoring/qualification state machine

- `not_scored -> scored -> qualified`
- `scored -> disqualified`
- `qualified|disqualified -> rescored` (new data/ICP changes)
- `rescored -> qualified|disqualified`

Qualification guard:

- Activation eligibility requires `qualified=true` and confidence above minimum confidence threshold.

## 8) Source ingestion plan

### Source classes

- Search/discovery sources (maps, directories, social/company pages).
- Professional graph sources (company/people profiles).
- Signals sources (job boards, funding/news, tech stack changes).
- User-provided URL sources (custom pages/directories).

### Ingestion layers

1. Connector layer (`source_connector`) with auth/rate limits.
2. Fetch layer with source-specific parsers.
3. Normalization layer to canonical schema.
4. Validation layer (required fields + type checks).
5. Provenance writer (source, URL, fetched_at, parser_version).
6. Dedupe layer (company + person matching).

### Provenance minimum

Every imported field must carry:

- `source_type`
- `source_url` or source reference
- `fetched_at`
- `confidence`
- `parser_version`

## 9) Dedupe and normalization logic

### Company dedupe keys (priority order)

1. Exact normalized domain.
2. Exact name + city/state/country.
3. Fuzzy name + phone/domain similarity above threshold.

### Contact dedupe keys (priority order)

1. Verified email exact match.
2. LinkedIn URL exact match.
3. Name + company + title similarity above threshold.

### Merge policy

- Preserve canonical id.
- Merge non-conflicting attributes.
- Resolve conflicts by verification > recency > source reliability.
- Keep merged record lineage in provenance.

## 10) Enrichment engine plan

Enrichment stages:

1. Firmographic (industry, size, revenue, HQ, locations).
2. Technographic (stack, providers, website technologies).
3. Contact resolution (decision-makers, role mapping, emails, phones).
4. Intent signals (hiring, funding/news, activity deltas).
5. Verification (email/phone status, confidence updates).

Execution behavior:

- Field-priority queue (high-value fields first).
- Batch processing with per-source limits.
- Retry with backoff for transient failures.
- Persist partial progress continuously.

## 11) Scraping and research plan

### Supported templates

- Team/about pages
- Directory listings
- Conference speaker pages
- Pricing/service pages
- Franchise/location pages
- Custom extraction template

### Extraction outputs

- Company entities
- Contact entities
- Signals (pricing changes, service expansions, hiring cues)
- Raw evidence snippets for traceability

### Guardrails

- Respect robots/access policies where required by configuration.
- Deduplicate extracted rows before canonical write.
- Mark low-confidence extractions for review queue.

## 12) Scoring model and thresholds

### Score components (0-100)

- `fit_score` (0-40): ICP industry, geo, size, title, exclusions.
- `intent_score` (0-25): recent activity and buying signals.
- `completeness_score` (0-15): key fields present/verified.
- `freshness_score` (0-10): recency of source verification.
- `source_reliability_score` (0-10): confidence in source mix.

`score_total = fit + intent + completeness + freshness + reliability`

### Qualification policy (default)

- `qualified` if:
  - `score_total >= 70`
  - `confidence_score >= 0.65`
  - mandatory contactability fields available for chosen activation path

## 13) Activation rules and destinations

### Destinations

- CRM: create/update account/contact/lead/opportunity
- Email: start sequence/campaign enrollment
- WhatsApp: queue outreach template/cadence
- Calls: create call tasks or dial queue entry
- Appointments: create booking task/link
- Campaigns: audience list add/update

### Activation invariants

- No activation when `qualified=false`.
- Idempotency key required per activation action.
- Owner assignment resolved before write.
- Each activation emits audit event with source records and rule id.

## 14) Error handling, retries, and observability

### Error classes

- `validation_error` (non-retriable by default)
- `auth_error` (non-retriable until connector fix)
- `rate_limited` (retriable with backoff)
- `timeout` (retriable with capped attempts)
- `parse_error` (retriable if parser fallback exists)
- `dependency_error` (retriable)

### Retry policy baseline

- Exponential backoff with jitter.
- `max_attempts` configurable per source/job type.
- Dead-letter status after final failure.

### Required audit events

- Search created/updated
- Discovery job state changes
- Enrichment job state changes
- Dedupe merge events
- Score computed/recomputed
- Activation attempted/succeeded/failed
- Export requested/completed/failed

## 15) QA acceptance checklist

### Module-level acceptance

- [ ] Lead Intelligence exists as standalone module in navigation.
- [ ] Home explains module as discover/enrich/activate workflow.
- [ ] CRM is only an activation destination, not the search workspace.

### Discovery acceptance

- [ ] Natural-language search creates runnable search plan.
- [ ] Multi-source discovery runs with per-source job status.
- [ ] Industry explorer provides broad vertical entry points.

### Data quality acceptance

- [ ] Dedupe/merge runs and records lineage.
- [ ] Provenance exists for all enriched critical fields.
- [ ] Email/phone verification status is persisted.

### Qualification acceptance

- [ ] Scoring stores breakdown + reason text.
- [ ] Qualification threshold is enforced before activation.
- [ ] Re-score occurs when ICP or source data changes.

### Activation/export acceptance

- [ ] Qualified rows can activate to CRM/email/WhatsApp/calls/appointments.
- [ ] Unqualified rows cannot activate.
- [ ] Export center supports CSV/XLSX/CRM import formats.

### Reliability acceptance

- [ ] Failed jobs retry per policy and show terminal state.
- [ ] Audit log includes discovery/enrichment/scoring/activation events.
- [ ] Operators can inspect per-job error reasons and provenance.

## 16) Delivery phases

### Phase 1 - Foundation contracts

- Entity schemas, relation contracts, state machines, audit events.

### Phase 2 - Discovery + normalization

- Source connectors, discovery orchestration, canonical company/contact writes, dedupe.

### Phase 3 - Enrichment + scraping

- Enrichment engine, URL extraction templates, verification signals.

### Phase 4 - Scoring + activation

- Qualification model, activation rules, downstream connectors.

### Phase 5 - UX depth and optimization

- Industry presets, saved searches, operator controls, quality/ranking tuning.
