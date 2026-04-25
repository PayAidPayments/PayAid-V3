import type { LeadSourceAdapter } from '../base/LeadSourceAdapter'

const registry = new Map<string, LeadSourceAdapter>()

export function registerLeadProvider(adapter: LeadSourceAdapter) {
  registry.set(adapter.name, adapter)
}

export function listLeadProviders(): LeadSourceAdapter[] {
  return Array.from(registry.values())
}

export function getLeadProvider(name: string): LeadSourceAdapter | undefined {
  return registry.get(name)
}
