# Feedback Loop Pipeline Spec (Ranking/Recommendations)

Defines how user feedback and outcome signals are collected and used to improve recommendation ranking logic.

---

## 1) Goal

Continuously improve recommendation quality by learning from:

- explicit feedback (accept/reject + optional notes)
- implicit outcomes (follow-through, conversion, revenue impact)
- confidence/policy behavior

## 2) Signal Inputs

### Explicit signals

- `POST /api/v1/revenue/feedback` payloads:
  - `recommendation_id`
  - `deal_id`
  - `accepted`
  - `note` (optional)

### Implicit signals (suggested)

- Deal progression after recommendation:
  - stage advanced/regressed
  - time-to-next-update
  - won/lost outcome
- Interaction freshness after suggestion:
  - follow-up activity created
  - communication sent

## 3) Pipeline Stages

1. **Ingest**
   - capture feedback and outcome events into audit/feature tables
2. **Feature build**
   - join recommendation + deal context + outcome horizon windows
3. **Labeling**
   - positive/negative labels (e.g., accepted + improved outcome)
4. **Train/evaluate**
   - rank model or score recalibration (offline)
5. **Promote**
   - gated rollout by tenant cohort + prompt/policy version
6. **Monitor**
   - acceptance rate, conversion lift, error regressions

## 4) Data Contract (training row)

Suggested training dataset row:

- `tenant_id`
- `recommendation_id`
- `deal_id`
- `action_type`
- `risk_score`
- `confidence_score`
- `accepted` (bool)
- `outcome_won_within_30d` (bool)
- `stage_advanced_within_14d` (bool)
- `time_to_next_update_hours`
- `label` (0/1)
- `feature_version`
- `created_at`

## 5) Model/Rule Update Strategy

- Start with score calibration and threshold tuning.
- Move to ranking model once sufficient labeled volume is available.
- Keep fallback heuristic path active for safe rollback.

## 6) Governance + Safety

- Tenant isolation in feature generation and evaluation.
- PII redaction in exported datasets.
- Version every artifact:
  - `feature_version`
  - `model_version`
  - `policy_version`
  - `prompt_version`

## 7) Evaluation Metrics

- recommendation acceptance rate
- precision@k for accepted + positive-outcome recommendations
- won-rate lift for exposed vs control cohort
- latency and failure rate impact

## 8) Rollout Plan

1. Build daily aggregation job for feedback + outcome joins.
2. Publish evaluation report endpoint / internal dashboard.
3. Introduce candidate model under feature flag.
4. Roll out internal -> pilot -> GA using staged rollout strategy.

