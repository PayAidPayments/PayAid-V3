# SOLO-T04 Support Map — Merge and Duplicate Errors

Date: 2026-04-15  
Owner: Phani  
Audience: support and QA triage during Day 4 closure.

## Quick lookup

| Code | Typical HTTP | Meaning | First action |
|---|---:|---|---|
| `DUPLICATE_EMAIL` | 409 | Email already used by another contact in same tenant | Ask user to open existing contact or use a unique email |
| `DUPLICATE_PHONE` | 409 | Phone already used by another contact in same tenant | Verify number format and existing contact ownership |
| `DUPLICATE_CONTACT_FIELDS` | 409 | Multiple duplicate key fields detected | Review response payload and resolve collisions before retry |
| `MERGE_SAME_CONTACT` | 400 | Primary and secondary IDs are the same | Retry with two distinct contact IDs |
| `MERGE_CONTACT_NOT_FOUND` | 404 | One or both merge contacts are missing | Re-fetch contact list and confirm IDs are valid in tenant |
| `MERGE_GUARD_NO_OVERLAP` | 409 | Contacts fail overlap rule for safe merge | Validate merge criteria and only merge true duplicates |
| `MERGE_GUARD_NO_PRIMARY_KEY` | 409 | Primary-key safety rule not satisfied | Correct key mapping before merge |

## Triage steps

1. Confirm tenant context in request and UI path.
2. Capture failing request/response pair (status + code + payload snippet).
3. Cross-check expected behavior in `docs/CRM_GA_SOLO_T04_QA_RUNBOOK.md`.
4. If mismatch from expected behavior, attach evidence in `docs/evidence/closure/` and escalate.

## Related docs

- Discovery map: `docs/CRM_GA_SOLO_T04_PREP_DISCOVERY.md`
- QA runbook: `docs/CRM_GA_SOLO_T04_QA_RUNBOOK.md`
- Queue log: `docs/CRM_GA_CLOSURE_EXECUTION_LOG.md`
