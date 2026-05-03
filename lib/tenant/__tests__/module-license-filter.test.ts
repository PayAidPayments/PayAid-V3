import {
  isModuleListedForTenantLicense,
  normalizeSelectedModuleIds,
  resolveLicenseModuleId,
} from '@/lib/tenant/module-license-filter'

describe('module license filter', () => {
  const tenantId = 'tn_demo'

  it('resolves AI sub-surfaces to ai-studio license', () => {
    expect(resolveLicenseModuleId('ai-chat')).toBe('ai-studio')
    expect(resolveLicenseModuleId('ai-cofounder')).toBe('ai-studio')
    expect(resolveLicenseModuleId('voice-agents')).toBe('ai-studio')
  })

  it('resolves support/capability aliases to canonical licenses', () => {
    expect(resolveLicenseModuleId('support')).toBe('communication')
    expect(resolveLicenseModuleId('help-center')).toBe('communication')
    expect(resolveLicenseModuleId('workflow-automation')).toBe('projects')
    expect(resolveLicenseModuleId('appointments')).toBe('crm')
    expect(resolveLicenseModuleId('industry-intelligence')).toBe('analytics')
  })

  it('allows aliased surfaces when canonical license is active', () => {
    expect(isModuleListedForTenantLicense('support', tenantId, ['communication'])).toBe(true)
    expect(isModuleListedForTenantLicense('ai-chat', tenantId, ['ai-studio'])).toBe(true)
    expect(isModuleListedForTenantLicense('workflow-automation', tenantId, ['projects'])).toBe(
      true
    )
  })

  it('hides aliased surfaces when canonical license is missing', () => {
    expect(isModuleListedForTenantLicense('support', tenantId, ['crm'])).toBe(false)
    expect(isModuleListedForTenantLicense('ai-chat', tenantId, ['crm'])).toBe(false)
    expect(isModuleListedForTenantLicense('appointments', tenantId, ['finance'])).toBe(false)
  })

  it('keeps always-visible modules accessible', () => {
    expect(isModuleListedForTenantLicense('home', tenantId, ['crm'])).toBe(true)
    expect(isModuleListedForTenantLicense('dashboard', tenantId, [])).toBe(true)
  })

  it('normalizes raw selections to canonical licensed module ids', () => {
    const normalized = normalizeSelectedModuleIds([
      'support',
      'help-center',
      'ai-chat',
      'appointments',
      'unknown-surface',
      'crm',
    ])
    expect(normalized.sort()).toEqual(['ai-studio', 'communication', 'crm'])
  })
})
