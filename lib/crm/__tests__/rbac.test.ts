import { assertCrmRoleAllowed, CrmRoleError } from '@/lib/crm/rbac'

describe('assertCrmRoleAllowed', () => {
  it('allows when user has one of allowed roles', () => {
    expect(() =>
      assertCrmRoleAllowed(['manager'], ['admin', 'manager'], 'bulk task complete')
    ).not.toThrow()
  })

  it('is case-insensitive for roles', () => {
    expect(() =>
      assertCrmRoleAllowed(['ADMIN'], ['admin'], 'settings write')
    ).not.toThrow()
  })

  it('throws CrmRoleError when role is not allowed', () => {
    expect(() =>
      assertCrmRoleAllowed(['read-only'], ['admin', 'manager'], 'contact delete')
    ).toThrow(CrmRoleError)
  })
})
