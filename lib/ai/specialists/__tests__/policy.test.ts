import { evaluateSpecialistPolicy } from '@/lib/ai/specialists/policy'

describe('evaluateSpecialistPolicy', () => {
  it('denies unknown specialist ids', () => {
    const result = evaluateSpecialistPolicy({
      specialistId: 'missing-specialist',
      module: 'crm',
      requestedActionLevel: 'read',
      userRoles: ['admin'],
      userModules: ['crm'],
    })

    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('Unknown specialist')
  })

  it('denies unsupported action levels for a valid specialist', () => {
    const result = evaluateSpecialistPolicy({
      specialistId: 'marketing-strategist',
      module: 'marketing',
      requestedActionLevel: 'restricted',
      userRoles: ['admin'],
      userModules: ['marketing'],
    })

    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('does not support action level restricted')
  })

  it('denies guarded_write for non-elevated roles', () => {
    const result = evaluateSpecialistPolicy({
      specialistId: 'sales-copilot',
      module: 'crm',
      requestedActionLevel: 'guarded_write',
      userRoles: ['rep'],
      userModules: ['crm'],
    })

    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('Role is not allowed')
  })

  it('allows read access for licensed module with valid specialist', () => {
    const result = evaluateSpecialistPolicy({
      specialistId: 'sales-copilot',
      module: 'crm',
      requestedActionLevel: 'read',
      userRoles: ['rep'],
      userModules: ['crm'],
    })

    expect(result.allowed).toBe(true)
    expect(result.specialist?.id).toBe('sales-copilot')
  })
})

