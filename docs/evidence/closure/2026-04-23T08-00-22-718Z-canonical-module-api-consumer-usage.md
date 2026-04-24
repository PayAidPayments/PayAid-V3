# Canonical module API consumer usage check

- Timestamp: 2026-04-23T08:00:22.718Z
- Consumers discovered: 29
- Overall: fail
- JSON artifact: `D:\Cursor Projects\PayAid V3\docs\evidence\closure\2026-04-23T08-00-22-718Z-canonical-module-api-consumer-usage.json`

## Per-file results

- FAIL `apps/dashboard/app/dashboard/admin/modules/page.tsx` (legacy=0, canonical=0)
- FAIL `apps/dashboard/app/dashboard/industries/agriculture/crops/page.tsx` (legacy=0, canonical=0)
- FAIL `apps/dashboard/app/dashboard/industries/automotive/job-cards/page.tsx` (legacy=0, canonical=0)
- FAIL `apps/dashboard/app/dashboard/industries/beauty/appointments/page.tsx` (legacy=0, canonical=0)
- FAIL `apps/dashboard/app/dashboard/industries/construction/projects/page.tsx` (legacy=0, canonical=0)
- FAIL `apps/dashboard/app/dashboard/industries/education/courses/page.tsx` (legacy=0, canonical=0)
- FAIL `apps/dashboard/app/dashboard/industries/education/students/page.tsx` (legacy=0, canonical=0)
- FAIL `apps/dashboard/app/dashboard/industries/events/events/page.tsx` (legacy=0, canonical=0)
- FAIL `apps/dashboard/app/dashboard/industries/financial/tax-filings/page.tsx` (legacy=0, canonical=0)
- FAIL `apps/dashboard/app/dashboard/industries/healthcare/lab-tests/page.tsx` (legacy=0, canonical=0)
- FAIL `apps/dashboard/app/dashboard/industries/healthcare/prescriptions/page.tsx` (legacy=0, canonical=0)
- FAIL `apps/dashboard/app/dashboard/industries/hospitality/bookings/page.tsx` (legacy=0, canonical=0)
- FAIL `apps/dashboard/app/dashboard/industries/legal/cases/page.tsx` (legacy=0, canonical=0)
- FAIL `apps/dashboard/app/dashboard/industries/logistics/shipments/page.tsx` (legacy=0, canonical=0)
- FAIL `apps/dashboard/app/dashboard/industries/page.tsx` (legacy=3, canonical=0)
- FAIL `apps/dashboard/app/dashboard/industries/real-estate/leads/page.tsx` (legacy=0, canonical=0)
- FAIL `apps/dashboard/app/dashboard/industries/restaurant/kitchen/page.tsx` (legacy=0, canonical=0)
- FAIL `apps/dashboard/app/dashboard/industries/restaurant/menu/page.tsx` (legacy=0, canonical=0)
- FAIL `apps/dashboard/app/dashboard/industries/restaurant/orders/page.tsx` (legacy=0, canonical=0)
- FAIL `apps/dashboard/app/dashboard/industries/restaurant/reservations/page.tsx` (legacy=0, canonical=0)
- FAIL `apps/dashboard/app/dashboard/industries/restaurant/tables/page.tsx` (legacy=0, canonical=0)
- FAIL `apps/dashboard/app/dashboard/industries/retail/products/page.tsx` (legacy=0, canonical=0)
- FAIL `apps/dashboard/app/dashboard/industries/wholesale/customers/page.tsx` (legacy=0, canonical=0)
- FAIL `apps/dashboard/app/dashboard/modules/page.tsx` (legacy=3, canonical=0)
- FAIL `apps/dashboard/app/dashboard/setup/industry/page.tsx` (legacy=0, canonical=0)
- FAIL `apps/dashboard/app/industries/[industry]/page.tsx` (legacy=2, canonical=0)
- FAIL `apps/dashboard/app/signup/page.tsx` (legacy=1, canonical=0)
- FAIL `components/freelancer/ProposalList.tsx` (legacy=0, canonical=0)
- FAIL `lib/api/test-utils.ts` (legacy=0, canonical=0)

## Raw payload

```json
{
  "check": "canonical-module-api-consumer-usage",
  "timestamp": "2026-04-23T08:00:22.718Z",
  "discoveredConsumers": 29,
  "overallOk": false,
  "failures": [
    {
      "file": "apps/dashboard/app/dashboard/admin/modules/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/agriculture/crops/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/automotive/job-cards/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/beauty/appointments/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/construction/projects/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/education/courses/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/education/students/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/events/events/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/financial/tax-filings/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/healthcare/lab-tests/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/healthcare/prescriptions/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/hospitality/bookings/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/legal/cases/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/logistics/shipments/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/page.tsx",
      "legacyMatches": 3,
      "canonicalMatches": 0,
      "legacyPatterns": [
        {
          "pattern": "/\\.industry\\b/g",
          "count": 3
        }
      ],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/real-estate/leads/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/restaurant/kitchen/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/restaurant/menu/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/restaurant/orders/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/restaurant/reservations/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/restaurant/tables/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/retail/products/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/wholesale/customers/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/modules/page.tsx",
      "legacyMatches": 3,
      "canonicalMatches": 0,
      "legacyPatterns": [
        {
          "pattern": "/\\.base\\b/g",
          "count": 1
        },
        {
          "pattern": "/\\.recommended\\b/g",
          "count": 1
        },
        {
          "pattern": "/\\.industry\\b/g",
          "count": 1
        }
      ],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/setup/industry/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/industries/[industry]/page.tsx",
      "legacyMatches": 2,
      "canonicalMatches": 0,
      "legacyPatterns": [
        {
          "pattern": "/\\.coreModules\\b/g",
          "count": 1
        },
        {
          "pattern": "/\\.industry\\b/g",
          "count": 1
        }
      ],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/signup/page.tsx",
      "legacyMatches": 1,
      "canonicalMatches": 0,
      "legacyPatterns": [
        {
          "pattern": "/\\.coreModules\\b/g",
          "count": 1
        }
      ],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "components/freelancer/ProposalList.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "lib/api/test-utils.ts",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    }
  ],
  "results": [
    {
      "file": "apps/dashboard/app/dashboard/admin/modules/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/agriculture/crops/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/automotive/job-cards/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/beauty/appointments/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/construction/projects/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/education/courses/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/education/students/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/events/events/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/financial/tax-filings/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/healthcare/lab-tests/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/healthcare/prescriptions/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/hospitality/bookings/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/legal/cases/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/logistics/shipments/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/page.tsx",
      "legacyMatches": 3,
      "canonicalMatches": 0,
      "legacyPatterns": [
        {
          "pattern": "/\\.industry\\b/g",
          "count": 3
        }
      ],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/real-estate/leads/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/restaurant/kitchen/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/restaurant/menu/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/restaurant/orders/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/restaurant/reservations/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/restaurant/tables/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/retail/products/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/industries/wholesale/customers/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/modules/page.tsx",
      "legacyMatches": 3,
      "canonicalMatches": 0,
      "legacyPatterns": [
        {
          "pattern": "/\\.base\\b/g",
          "count": 1
        },
        {
          "pattern": "/\\.recommended\\b/g",
          "count": 1
        },
        {
          "pattern": "/\\.industry\\b/g",
          "count": 1
        }
      ],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/dashboard/setup/industry/page.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/industries/[industry]/page.tsx",
      "legacyMatches": 2,
      "canonicalMatches": 0,
      "legacyPatterns": [
        {
          "pattern": "/\\.coreModules\\b/g",
          "count": 1
        },
        {
          "pattern": "/\\.industry\\b/g",
          "count": 1
        }
      ],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "apps/dashboard/app/signup/page.tsx",
      "legacyMatches": 1,
      "canonicalMatches": 0,
      "legacyPatterns": [
        {
          "pattern": "/\\.coreModules\\b/g",
          "count": 1
        }
      ],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "components/freelancer/ProposalList.tsx",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    },
    {
      "file": "lib/api/test-utils.ts",
      "legacyMatches": 0,
      "canonicalMatches": 0,
      "legacyPatterns": [],
      "canonicalPatterns": [],
      "ok": false
    }
  ],
  "notes": [
    "Scans endpoint consumers for legacy response-field usage.",
    "Pass requires at least one consumer file, zero legacy matches, and canonical-field matches per consumer."
  ]
}
```
