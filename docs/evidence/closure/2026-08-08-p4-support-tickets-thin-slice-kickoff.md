# P4 Support — tickets thin slice kickoff (2026-08-08)

## Status

**KICKOFF** — Product ACCEPTED. Implementing smallest useful slice only.

## Slice marker

`p4-support-tickets-smallest`

## Surfaces

| Kind | Path |
|------|------|
| API | `GET/POST /api/support/tickets/slice` |
| Dashboard mirror | `apps/dashboard/app/api/support/tickets/slice/route.ts` |
| Root mirror | `app/api/support/tickets/slice/route.ts` |

## Flow

1. Create ticket (`status=new`, optional `contactId`)
2. List for tenant
3. Status: `new → open → resolved|closed`

## Proof order

1. Contract smoke  
2. DB smoke  
3. Slim ship + hosted Ready smoke  
4. Product accept API proof  
5. Thin UI **only if** Tickets hub still stubby  

## Smokes

- `npm run smoke:p4-support-tickets-slice-contract`
- `npm run smoke:p4-support-tickets-slice`
- `npm run smoke:p4-support-tickets-slice-hosted`

## Gates preserved

Finance CLOSED · Projects CLOSED · Appointments FROZEN · Voice4 FROZEN · Email/WhatsApp CLOSED · bridge-v2 CLOSED · LI separate · migrations controlled-reconcile only.
