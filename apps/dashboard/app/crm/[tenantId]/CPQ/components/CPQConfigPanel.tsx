import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { CatalogEntry } from '../lib/catalog'
import { formatINR } from './utils'

type CPQConfigPanelProps = {
  catalogSearch: string
  onCatalogSearchChange: (value: string) => void
  filteredCatalog: CatalogEntry[]
  onAddCatalogEntry: (entry: CatalogEntry) => void
}

export function CPQConfigPanel({
  catalogSearch,
  onCatalogSearchChange,
  filteredCatalog,
  onAddCatalogEntry,
}: CPQConfigPanelProps) {
  return (
    <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800" data-testid="cpq-config-panel">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Configuration Studio</CardTitle>
        <CardDescription>Search the catalog and add SKUs to the quote.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2">Product catalog</p>
          <Input
            placeholder="Search products, bundles, add-ons..."
            value={catalogSearch}
            onChange={(e) => onCatalogSearchChange(e.target.value)}
          />
          <div className="mt-2 space-y-1 max-h-48 overflow-auto">
            {filteredCatalog.map((entry) => (
              <div
                key={entry.name}
                className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-2 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{entry.name}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{entry.description}</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    {formatINR(entry.defaultUnitPrice)} · unit
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  data-testid={`cpq-catalog-add-${entry.name.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => onAddCatalogEntry(entry)}
                  title={`Add ${entry.name} as a line item`}
                >
                  Add
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500">Packages & terms</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" type="button">
              Base plan
            </Button>
            <Button variant="outline" size="sm" type="button">
              Add-ons
            </Button>
            <Button variant="outline" size="sm" type="button">
              Services
            </Button>
            <Button variant="outline" size="sm" type="button">
              Contract terms
            </Button>
          </div>
        </div>
        <p className="text-[11px] text-slate-500">
          Approval and pricing rules are summarized in the inspector after you configure line items.
        </p>
      </CardContent>
    </Card>
  )
}
