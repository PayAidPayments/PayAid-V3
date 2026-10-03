import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { CustomerSpecialistCatalog } from './types'

const CATALOG_RELATIVE_PATH = join('docs', 'ai', 'customer', 'agents.json')

let cachedCatalog: CustomerSpecialistCatalog | null = null

/**
 * Loads the customer specialist catalog from docs (source of truth).
 * Safe for Node/runtime paths that can read the repo docs tree.
 */
export function loadCustomerSpecialistCatalog(repoRoot = process.cwd()): CustomerSpecialistCatalog {
  if (cachedCatalog) return cachedCatalog
  const fullPath = join(repoRoot, CATALOG_RELATIVE_PATH)
  const parsed = JSON.parse(readFileSync(fullPath, 'utf8')) as CustomerSpecialistCatalog
  if (parsed.pack !== 'customer' || !Array.isArray(parsed.agents)) {
    throw new Error(`Invalid customer specialist catalog at ${CATALOG_RELATIVE_PATH}`)
  }
  cachedCatalog = parsed
  return parsed
}

export function resetCustomerSpecialistCatalogCache() {
  cachedCatalog = null
}

export { CATALOG_RELATIVE_PATH }
