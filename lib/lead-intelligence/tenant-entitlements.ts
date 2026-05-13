/**
 * Tenant license helpers for Lead Intelligence vs downstream PayAid activation targets.
 */

function modSet(mods?: readonly string[] | null): Set<string> {
  return new Set((mods ?? []).map((id) => id.trim().toLowerCase()).filter(Boolean))
}

export function tenantHasLeadIntelligenceLicense(licensedModules?: readonly string[] | null): boolean {
  return modSet(licensedModules).has('lead-intelligence')
}

export function tenantHasCrmLicense(licensedModules?: readonly string[] | null): boolean {
  return modSet(licensedModules).has('crm')
}

export function tenantHasMarketingLicense(licensedModules?: readonly string[] | null): boolean {
  return modSet(licensedModules).has('marketing')
}

export function tenantHasCommunicationLicense(licensedModules?: readonly string[] | null): boolean {
  return modSet(licensedModules).has('communication')
}
