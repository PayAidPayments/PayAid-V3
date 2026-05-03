import {
  contactHasMergeGuardKey,
  contactsShare360DuplicateKey,
} from '@/lib/crm/contact-merge-key'

describe('contactHasMergeGuardKey', () => {
  it('is false when all identifiers empty or missing', () => {
    expect(contactHasMergeGuardKey({})).toBe(false)
    expect(contactHasMergeGuardKey({ email: '', phone: '   ', gstin: null })).toBe(false)
  })

  it('is true when any identifier is non-empty after trim', () => {
    expect(contactHasMergeGuardKey({ email: 'a@b.com' })).toBe(true)
    expect(contactHasMergeGuardKey({ phone: ' 98765 ' })).toBe(true)
    expect(contactHasMergeGuardKey({ gstin: '22AAAAA0000A1Z5' })).toBe(true)
  })
})

describe('contactsShare360DuplicateKey', () => {
  it('matches on trimmed email equality', () => {
    expect(
      contactsShare360DuplicateKey({ email: 'A@B.COM' }, { email: 'A@B.COM' })
    ).toBe(true)
    expect(contactsShare360DuplicateKey({ email: 'a@b.com' }, { email: 'x@y.com' })).toBe(false)
  })

  it('matches on trimmed phone equality', () => {
    expect(contactsShare360DuplicateKey({ phone: ' 999 ' }, { phone: '999' })).toBe(true)
    expect(contactsShare360DuplicateKey({ phone: '111' }, { phone: '222' })).toBe(false)
  })

  it('matches on trimmed GSTIN equality', () => {
    expect(contactsShare360DuplicateKey({ gstin: ' AB ' }, { gstin: 'AB' })).toBe(true)
    expect(contactsShare360DuplicateKey({ gstin: 'X' }, { gstin: 'Y' })).toBe(false)
  })

  it('does not match when one side is empty', () => {
    expect(contactsShare360DuplicateKey({ email: 'a@b.com' }, { email: '' })).toBe(false)
    expect(contactsShare360DuplicateKey({ email: '' }, { email: 'a@b.com' })).toBe(false)
  })
})
