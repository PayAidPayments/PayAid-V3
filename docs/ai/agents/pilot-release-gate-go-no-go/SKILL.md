---
name: pilot-release-gate-go-no-go
description: Enforce PayAid pilot release gates with evidence-backed GO/NO-GO decisions. Use for internal pilot readiness, closure queues, blocker triage, and launch signoff checks.
---

# Pilot Release Gate Go-No-Go

## When to use

Use this skill for:

- pilot readiness checks
- release gate reviews
- go/no-go recommendation requests
- blocker-driven closure planning

## Mandatory routing

1. Run **PayAid Product Strategist** first.
2. Run **Platform Architect** if cross-module impacts exist.
3. Run **No-404 QA Specialist** and **Code Review Specialist** before final gate call.

## Gate checklist (copy and fill)

```markdown
## Pilot Gate Card
- Scope:
- Target environment:
- Decision date:

### Gate checks
- [ ] Acceptance criteria pass (Product Strategist)
- [ ] Cross-module contract safety pass (Platform Architect or N/A)
- [ ] Runtime route/page coverage pass (No-404)
- [ ] Regressions reviewed and resolved/accepted (Code Review)
- [ ] Data safety guardrails pass (tenant scope + auth)
- [ ] Migration/deploy sequencing validated (if schema touched)
- [ ] Evidence artifacts archived

### Decision
- GO / CONDITIONAL GO / NO-GO
- Blocking reasons:
- Required follow-up owner + date:
```

## Decision rules

- `GO`: all required gates pass with evidence.
- `CONDITIONAL GO`: non-critical gaps exist, with owner/date and risk accepted.
- `NO-GO`: any critical gate fails, evidence is missing, or blockers are unresolved.

## Required evidence

Attach or reference:

- checklist/runbook artifact (`docs/LAUNCH_CHECKLIST.md` and/or module gate docs)
- latest smoke or route-health evidence (`docs/evidence/...`)
- critical regression findings and disposition

If evidence is stale, mark as `NO-GO` until rerun.
