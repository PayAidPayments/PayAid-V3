import { describe, it } from '@jest/globals'

/**
 * M1 connector-level reliability scaffold.
 *
 * Keep this skipped until provider webhook adapters are implemented.
 * Target scenarios:
 * 1) valid provider signature + fresh timestamp => accepted
 * 2) invalid signature => rejected (401/403)
 * 3) stale timestamp outside replay window => rejected
 * 4) provider retry (same delivery id / idempotency key) => deduplicated
 * 5) transient downstream error => retry policy and eventual dedupe behavior
 */
describe.skip('M1 connector webhook reliability (template)', () => {
  it('accepts valid signed webhook within replay window', async () => {
    // TODO: wire provider adapter route + signature verification helper.
  })

  it('rejects invalid signature and stale replay attempts', async () => {
    // TODO: assert explicit 401/403 and replay-window errors.
  })

  it('deduplicates repeated provider deliveries', async () => {
    // TODO: send same delivery id twice and assert 201 then 200 deduped.
  })
})
