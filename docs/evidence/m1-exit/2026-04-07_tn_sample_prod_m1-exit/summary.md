# M1 Exit Evidence Summary

- Run date: 2026-04-07
- Tenant ID: tn_sample
- Environment: prod
- Window: 2026-03-31T00:00:00.000Z to 2026-04-07T00:00:00.000Z
- Collected by: payaid-repo-template (synthetic reference — replace with real prod capture)

## 1) Inbound Unibox Coverage

- Provider/webhook delivery count: 120
- Created Unibox conversation count: 120
- Coverage by channel:
  - email: 40
  - whatsapp: 30
  - sms: 20
  - web: 15
  - phone: 10
  - in_app: 5
- Gap notes (if any): template values for validator CI; replace with provider exports
- Artifact path(s): docs/evidence/m1-exit/2026-04-07_tn_sample_prod_m1-exit/inbound-coverage.csv

## 2) SLA Measurability

- First-response median: 11m
- First-response p95: 37m
- Breach count: 9
- Breach rate: 7.5%
- Unibox settings screenshot/export path: docs/evidence/m1-exit/2026-04-07_tn_sample_prod_m1-exit/sla-settings.png
- Artifact path(s): docs/evidence/m1-exit/2026-04-07_tn_sample_prod_m1-exit/sla-metrics.csv

## 3) SLA Enforceability

- Breach sample event id: evt_breach_prod_template_001
- Breach sample conversation id: conv_prod_template_1024
- Breached at: 2026-04-05T09:41:00.000Z
- Follow-up action id: act_prod_template_551
- Non-breach control sample id: conv_prod_template_0999
- Artifact path(s): docs/evidence/m1-exit/2026-04-07_tn_sample_prod_m1-exit/sla-enforcement-audit.json

## 4) Next-Action Acceptance

- Eligible recommendations: 80
- Accepted recommendations: 23
- Acceptance ratio: 28.75%
- Meets >20% target? (yes/no): yes
- Artifact path(s): docs/evidence/m1-exit/2026-04-07_tn_sample_prod_m1-exit/next-action-acceptance.csv

## Exit Decision

- Inbound conversations criterion met? (yes/no): yes
- SLA measurable/enforceable criterion met? (yes/no): yes
- Next-action acceptance criterion met? (yes/no): yes
- Reviewer: template-signoff
- Reviewed at: 2026-04-07T18:00:00.000Z
