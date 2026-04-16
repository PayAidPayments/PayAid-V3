import { assertContactMergeAllowedBy360Suggestions } from '@/lib/crm/contact-merge-guard'

const findFirstMock = jest.fn()

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    contact: {
      findFirst: (...args: unknown[]) => findFirstMock(...args),
    },
  },
}))

describe('assertContactMergeAllowedBy360Suggestions', () => {
  beforeEach(() => {
    findFirstMock.mockReset()
  })

  it('allows merge when bypassGuard is true and does not query db', async () => {
    const result = await assertContactMergeAllowedBy360Suggestions(
      'tenant_1',
      'p1',
      'd1',
      { bypassGuard: true }
    )

    expect(result).toEqual({ allowed: true })
    expect(findFirstMock).not.toHaveBeenCalled()
  })

  it('returns MERGE_CONTACT_NOT_FOUND when either contact is missing', async () => {
    findFirstMock.mockResolvedValueOnce(null)
    findFirstMock.mockResolvedValueOnce({
      id: 'd1',
      email: 'dup@example.com',
      phone: null,
      gstin: null,
    })

    const result = await assertContactMergeAllowedBy360Suggestions(
      'tenant_1',
      'p1',
      'd1',
      {}
    )

    expect(result).toEqual({
      allowed: false,
      status: 404,
      code: 'MERGE_CONTACT_NOT_FOUND',
      message: 'One or both contacts were not found in this workspace.',
    })
  })

  it('returns MERGE_GUARD_NO_PRIMARY_KEY when primary has no email/phone/gstin', async () => {
    findFirstMock.mockResolvedValueOnce({
      id: 'p1',
      email: ' ',
      phone: null,
      gstin: '',
    })
    findFirstMock.mockResolvedValueOnce({
      id: 'd1',
      email: 'dup@example.com',
      phone: null,
      gstin: null,
    })

    const result = await assertContactMergeAllowedBy360Suggestions(
      'tenant_1',
      'p1',
      'd1',
      {}
    )

    expect(result).toMatchObject({
      allowed: false,
      status: 409,
      code: 'MERGE_GUARD_NO_PRIMARY_KEY',
    })
  })

  it('allows merge when contacts share a duplicate key', async () => {
    findFirstMock.mockResolvedValueOnce({
      id: 'p1',
      email: null,
      phone: '9876543210',
      gstin: null,
    })
    findFirstMock.mockResolvedValueOnce({
      id: 'd1',
      email: null,
      phone: '9876543210',
      gstin: null,
    })

    const result = await assertContactMergeAllowedBy360Suggestions(
      'tenant_1',
      'p1',
      'd1',
      {}
    )

    expect(result).toEqual({ allowed: true })
  })

  it('returns MERGE_GUARD_NO_OVERLAP when keys do not overlap', async () => {
    findFirstMock.mockResolvedValueOnce({
      id: 'p1',
      email: 'primary@example.com',
      phone: '1111111111',
      gstin: null,
    })
    findFirstMock.mockResolvedValueOnce({
      id: 'd1',
      email: 'duplicate@example.com',
      phone: '9999999999',
      gstin: null,
    })

    const result = await assertContactMergeAllowedBy360Suggestions(
      'tenant_1',
      'p1',
      'd1',
      {}
    )

    expect(result).toMatchObject({
      allowed: false,
      status: 409,
      code: 'MERGE_GUARD_NO_OVERLAP',
    })
  })
})
