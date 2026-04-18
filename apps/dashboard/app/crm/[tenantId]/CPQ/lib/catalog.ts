export type CatalogEntry = {
  name: string
  description: string
  defaultUnitPrice: number
}

/** Demo catalog: aligned with PRODUCT_CATALOG labels; prices are illustrative. */
export const CPQ_CATALOG_ENTRIES: CatalogEntry[] = [
  { name: 'Enterprise License', description: 'Annual enterprise seat license', defaultUnitPrice: 6500 },
  { name: 'Growth License', description: 'Growth tier per seat / month', defaultUnitPrice: 3200 },
  { name: 'Onboarding Pack', description: 'Implementation and onboarding bundle', defaultUnitPrice: 45000 },
  { name: 'Priority Support', description: 'Priority SLA support add-on', defaultUnitPrice: 12000 },
  { name: 'Success Manager', description: 'Named customer success', defaultUnitPrice: 9000 },
  { name: 'Data Migration', description: 'Legacy data migration package', defaultUnitPrice: 35000 },
  { name: 'Analytics Add-on', description: 'Advanced analytics module', defaultUnitPrice: 18000 },
  { name: 'API Integrations', description: 'API connectivity pack', defaultUnitPrice: 22000 },
  { name: 'Training Workshop', description: 'Live training sessions', defaultUnitPrice: 15000 },
  { name: 'Compliance Review', description: 'Compliance and security review', defaultUnitPrice: 28000 },
  { name: 'Implementation Sprint', description: 'Time-boxed implementation sprint', defaultUnitPrice: 55000 },
]

export const CPQ_CATALOG_BY_NAME: Record<string, CatalogEntry> = Object.fromEntries(
  CPQ_CATALOG_ENTRIES.map((e) => [e.name, e])
)
