# PayAid NEXUS Ship Gate (Internal)

A missing required gate blocks shipping. There is no silent skip.

## Rules

1. Select exactly one runbook slug from `docs/ai/nexus/runbooks.json`.
2. Run agents in roster order for that runbook.
3. Each required agent writes a handoff under `docs/evidence/nexus/<ticket-id>/`.
4. Decision values:
   - `pass` — gate satisfied with evidence
   - `needs-follow-up` — may continue only if follow-up owner + date are recorded
   - `fail` / `blocked` / missing artifact — **ship blocked**
5. `reality-checker` defaults to **NOT READY**.
6. Update `docs/PAYAID_V3_PENDING_ITEMS_PRIORITY_CHECKLIST.md` in the same change set for significant work.

## Ship checklist (all required answers must be Yes or N/A-with-reason)

| Check | Yes / No / N/A | Evidence path |
|---|---|---|
| Runbook slug recorded | | |
| Product Strategist gate (or incident exception) | | |
| Platform Architect (if required by runbook/condition) | | |
| Domain specialist (if required) | | |
| Required project skills | | |
| No-404 QA (if routes/buttons/pages) | | |
| Evidence Collector artifacts present | | |
| Code Review Specialist | | |
| Reality Checker READY (release runbook) | | |
| Checklist update-log line added | | |

## Block conditions

Ship is **BLOCKED** when any of these are true:

- Required agent listed in runbook `shipBlockedWithout` has no `pass` handoff
- Required skill listed in `requiredSkills` is fail/unverified
- Reality Checker returns NOT READY on `release`
- No-404 QA fails on a touched route/button/page
- Code Review returns `block`
- Finance/HR/compliance/outbound path lacks draft-first + approval note

## Incident exception

During active `production-incident` containment, Product Strategist may run after contain/fix.  
Ship/redeploy still requires Incident Commander + Evidence Collector before calling the incident closed.
