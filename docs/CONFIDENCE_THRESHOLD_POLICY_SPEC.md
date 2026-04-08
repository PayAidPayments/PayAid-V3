# Confidence Threshold Policy Spec (Action Types)

Defines mandatory confidence thresholds and explanation requirements for AI-suggested actions.

---

## 1) Goal

Ensure AI actions are:

- confidence-scored consistently
- explainable to operators/users
- blocked or downgraded when confidence is below policy

## 2) Policy Model (suggested)

Entity: `ConfidencePolicy`

- `action_type` (e.g., `follow_up`, `re_qualify`, `advance_stage`, `review_pricing`)
- `min_confidence` (0.0 to 1.0)
- `requires_explanation` (boolean)
- `status` (`active`, `draft`, `archived`)
- `updated_by`, `updated_at`

Optional scope:

- global default policy
- module/page override
- tenant override

## 3) Runtime Decision Rules

For each recommendation:

1. Compute/receive `confidence` score.
2. Resolve policy by `action_type` (+ optional tenant override).
3. If `confidence < min_confidence`:
   - do not auto-apply
   - mark recommendation as `low_confidence`
   - require explicit user confirmation if still shown
4. If `requires_explanation = true`, include non-empty rationale text.
5. Reject response payload if explanation missing where required.

## 4) Mandatory Explanation Schema

Each recommendation should include:

- `confidence_score` (number)
- `explanation_summary` (short human-readable why)
- `evidence_signals` (array of key factors, max N)
- `policy_evaluation`:
  - `threshold`
  - `passed` (boolean)
  - `action_on_fail` (`hide`, `warn`, `manual_confirm`)

## 5) API/Contract Impact (suggested)

Applicable response shapes should include policy fields, for example in revenue recommendations:

- `risk_score` (existing)
- `confidence_score` (new)
- `explanation_summary` (new)
- `policy_evaluation` (new object)

Potential admin API:

- `GET /api/v1/ai/confidence-policies`
- `POST /api/v1/ai/confidence-policies`
- `POST /api/v1/ai/confidence-policies/:id/activate`

## 6) UI Behavior

- Show confidence badge + explanation for each suggestion.
- If below threshold:
  - show warning state
  - disable one-click auto-apply
  - require explicit confirmation or hide recommendation per policy

## 7) Audit and Analytics

Log per recommendation decision:

- `action_type`
- `confidence_score`
- `threshold`
- `policy_passed`
- `explanation_present`
- `user_accepted` / `user_rejected`

Track:

- acceptance rate by confidence bucket
- false-positive complaints by action type
- threshold override frequency

## 8) Rollout Plan

1. Add policy config with safe defaults.
2. Enforce explanation-required validation in contracts.
3. Add UI badges/warnings for low-confidence suggestions.
4. Tune thresholds from observed acceptance + outcome metrics.

