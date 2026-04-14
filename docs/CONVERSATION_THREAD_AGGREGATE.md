# ConversationThread aggregate (Unibox)

This document is the **aggregate contract** for a full thread view beyond `uniboxConversationPublicSchema` + `uniboxMessagePublicSchema` (list/detail + chronological messages).

## Scope

| Layer | Source | Notes |
| --- | --- | --- |
| Thread identity | `UniboxConversation` | `id`, `tenantId`, `channel`, `status`, `externalConversationId` (if any) |
| Participants | Derived | **Owner:** `ownerUserId` → user display name (from `User`). **Customer:** `customer_ref` + last known contact/lead id from ingest metadata when present. |
| Messages | `UniboxMessage` | Ordered by `createdAt`; each row maps to `uniboxMessagePublicSchema`. |
| SLA (thread-level) | `computeUniboxSlaPresentation` | First-response SLA on the **conversation** from `resolveSlaDueAtFromIngest` / tenant defaults (`GET/PUT /api/v1/conversations/settings`). Fields: `due_at`, `due_in_seconds`, `breached`. |
| SLA per turn | Optional extension | When product requires **per-message** SLA, store `sla_due_at` on outbound agent messages or compute from `first_response_sla_minutes` anchored to prior inbound `occurred_at`. Not required for M1 exit APIs. |

## API mapping

- `GET /api/v1/conversations/:id` — conversation envelope + thread-level SLA.
- `GET /api/v1/conversations/:id/messages` — message list; aggregate UI merges both for the thread panel.

## Client aggregate shape (reference)

```typescript
type ConversationThreadAggregate = {
  conversation: UniboxConversationPublic // from GET .../:id
  messages: UniboxMessagePublic[]
  participants: {
    owner: { user_id: string; display_name: string | null } | null
    customer_label: string | null
  }
}
```

## Tenant-level SLA defaults

Stored defaults are implemented via `getTenantUniboxSlaSettings` / `updateTenantUniboxSlaSettings` (`lib/ai-native/m1-conversation-service.ts`) and `GET/PUT /api/v1/conversations/settings`.
