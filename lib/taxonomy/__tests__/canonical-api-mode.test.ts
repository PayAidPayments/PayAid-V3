import { isCanonicalOnlyApiMode, shouldIncludeLegacyModuleFields } from '@/lib/taxonomy/canonical-api-mode'

describe('canonical api mode', () => {
  const original = process.env.CANONICAL_MODULE_API_ONLY

  afterEach(() => {
    if (original === undefined) {
      delete process.env.CANONICAL_MODULE_API_ONLY
      return
    }
    process.env.CANONICAL_MODULE_API_ONLY = original
  })

  it('enables canonical-only mode only when set to 1', () => {
    process.env.CANONICAL_MODULE_API_ONLY = '1'
    expect(isCanonicalOnlyApiMode()).toBe(true)
    expect(shouldIncludeLegacyModuleFields()).toBe(false)
  })

  it('keeps legacy fields when the flag is missing or not 1', () => {
    delete process.env.CANONICAL_MODULE_API_ONLY
    expect(isCanonicalOnlyApiMode()).toBe(false)
    expect(shouldIncludeLegacyModuleFields()).toBe(true)

    process.env.CANONICAL_MODULE_API_ONLY = '0'
    expect(isCanonicalOnlyApiMode()).toBe(false)
    expect(shouldIncludeLegacyModuleFields()).toBe(true)
  })

  it('treats newline-padded flag values as enabled', () => {
    process.env.CANONICAL_MODULE_API_ONLY = '1\r\n'
    expect(isCanonicalOnlyApiMode()).toBe(true)
    expect(shouldIncludeLegacyModuleFields()).toBe(false)
  })
})
