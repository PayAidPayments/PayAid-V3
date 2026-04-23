import {
  buildCanonicalModuleAccessMap,
  normalizeLicensedModuleIds,
  normalizeRequestedModuleAccess,
} from '@/lib/tenant/user-module-access'

describe('user module access normalization', () => {
  it('keeps only canonical licensed module ids', () => {
    const out = normalizeLicensedModuleIds(['crm', 'finance', 'unknown-module'])
    expect(out.has('crm')).toBe(true)
    expect(out.has('finance')).toBe(true)
    expect(out.has('unknown-module')).toBe(false)
  })

  it('normalizes aliases into canonical licensed ids', () => {
    const requested = {
      support: true, // -> communication
      'help-center': true, // -> communication
      'ai-chat': true, // -> ai-studio
      appointments: true, // -> crm
      random: true, // ignored
    }

    const granted = normalizeRequestedModuleAccess(requested, [
      'crm',
      'communication',
      'ai-studio',
      'finance',
    ])

    expect(Array.from(granted).sort()).toEqual(['ai-studio', 'communication', 'crm'])
  })

  it('filters requested modules that are not tenant-licensed', () => {
    const requested = {
      support: true, // communication required but missing in tenant license
      'ai-chat': true, // ai-studio required but missing
      appointments: true, // crm required and present
    }

    const granted = normalizeRequestedModuleAccess(requested, ['crm'])
    expect(Array.from(granted)).toEqual(['crm'])
  })

  it('builds canonical response map with force-all option', () => {
    const licensed = ['crm', 'finance', 'ai-studio']
    const granted = new Set(['crm'])

    const regular = buildCanonicalModuleAccessMap(licensed, granted, false)
    expect(regular).toEqual({ crm: true, finance: false, 'ai-studio': false })

    const forced = buildCanonicalModuleAccessMap(licensed, granted, true)
    expect(forced).toEqual({ crm: true, finance: true, 'ai-studio': true })
  })
})
