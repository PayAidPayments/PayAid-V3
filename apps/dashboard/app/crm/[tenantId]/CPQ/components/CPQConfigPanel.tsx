import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type CPQConfigPanelProps = {
  catalogSearch: string
  onCatalogSearchChange: (value: string) => void
  filteredCatalog: string[]
  approvalRequired: boolean
  approvalReason: string
}

export function CPQConfigPanel({
  catalogSearch,
  onCatalogSearchChange,
  filteredCatalog,
  approvalRequired,
  approvalReason,
}: CPQConfigPanelProps) {
  return (
    <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800" data-testid="cpq-config-panel">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Configuration Studio</CardTitle>
        <CardDescription>Configure the commercial package with rule hints.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2">Product Catalog Search</p>
          <Input
            placeholder="Search products, bundles, add-ons..."
            value={catalogSearch}
            onChange={(e) => onCatalogSearchChange(e.target.value)}
          />
          <div className="mt-2 space-y-1 max-h-40 overflow-auto">
            {filteredCatalog.map((p) => (
              <div key={p} className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 flex items-center justify-between">
                <span>{p}</span>
                <Badge variant="outline" className="text-[10px]">add-on</Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500">Packages & Terms</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm">Base Plan</Button>
            <Button variant="outline" size="sm">Add-ons</Button>
            <Button variant="outline" size="sm">Services</Button>
            <Button variant="outline" size="sm">Contract Terms</Button>
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <p className="font-semibold mb-1">Rule Validation</p>
          <p>{approvalRequired ? `Approval required: ${approvalReason}.` : 'No blocking configuration rules found.'}</p>
        </div>
      </CardContent>
    </Card>
  )
}
