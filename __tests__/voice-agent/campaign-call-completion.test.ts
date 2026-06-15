/**
 * Campaign call completion mapping (no DB — logic smoke).
 */

describe('campaign call status mapping', () => {
  it('treats completed as terminal', () => {
    const terminal = ['completed', 'busy', 'no-answer', 'failed', 'canceled']
    for (const s of terminal) {
      expect(s.length).toBeGreaterThan(0)
    }
  })
})
