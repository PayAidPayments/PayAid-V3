/**
 * Navigation for the Lead Intelligence module (standalone prospecting workspace).
 */

export interface LeadIntelligenceTopBarItem {
  name: string
  href: string
}

export function getLeadIntelligenceTopBarItems(tenantId: string): LeadIntelligenceTopBarItem[] {
  if (!tenantId || typeof tenantId !== 'string' || !tenantId.trim()) {
    return []
  }
  const base = `/lead-intelligence/${tenantId}`
  return [
    { name: 'Home', href: `${base}/Home` },
    { name: 'Search', href: `${base}/search` },
    { name: 'ICP', href: `${base}/icp` },
    { name: 'Industries', href: `${base}/industries` },
    { name: 'Companies', href: `${base}/companies` },
    { name: 'People', href: `${base}/people` },
    { name: 'Enrichment', href: `${base}/enrichment` },
    { name: 'Scraping', href: `${base}/scraping` },
    { name: 'Scoring', href: `${base}/scoring` },
    { name: 'Review', href: `${base}/review` },
    { name: 'Activation', href: `${base}/activation` },
    { name: 'Exports', href: `${base}/exports` },
    { name: 'Saved', href: `${base}/saved-searches` },
    { name: 'Watchlists', href: `${base}/watchlists` },
  ]
}
