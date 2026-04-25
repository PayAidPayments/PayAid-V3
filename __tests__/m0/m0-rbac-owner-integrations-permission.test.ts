import { can } from '@/lib/rbac'
import type { AuthUser } from '@/types/auth'

function makeUser(role: string): AuthUser {
  return {
    id: 'u_owner_1',
    email: 'owner@example.com',
    name: 'Owner',
    role,
    roles: [role],
    permissions: [],
    tenantId: 't_owner_1',
    tenant_id: 't_owner_1',
  }
}

describe('RBAC owner integrations permission regression', () => {
  it('allows lowercase owner to manage integrations', () => {
    const user = makeUser('owner')
    expect(can({ user, permission: 'admin.integrations.manage', businessId: 't_owner_1' })).toBe(true)
  })

  it('allows uppercase OWNER to manage integrations', () => {
    const user = makeUser('OWNER')
    expect(can({ user, permission: 'admin.integrations.manage', businessId: 't_owner_1' })).toBe(true)
  })
})
