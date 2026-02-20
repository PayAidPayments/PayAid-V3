'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Edit, Copy, RefreshCw, Search } from 'lucide-react'

export interface PlanRow {
  id: string
  name: string
  description: string | null
  tier: string
  monthlyPrice: number
  annualPrice: number | null
  modules: string[]
  maxUsers: number | null
  maxStorage: number | null
  isActive: boolean
  isSystem: boolean
}

interface PlansModulesTableProps {
  plans: PlanRow[]
  loading?: boolean
  onRefresh?: () => void
  onEdit: (plan: PlanRow) => void
  onDuplicate: (plan: PlanRow) => void
}

export function PlansModulesTable({
  plans,
  loading,
  onRefresh,
  onEdit,
  onDuplicate,
}: PlansModulesTableProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPlans = plans.filter((plan) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      plan.name.toLowerCase().includes(query) ||
      plan.tier.toLowerCase().includes(query) ||
      plan.description?.toLowerCase().includes(query) ||
      plan.modules.some((m) => m.toLowerCase().includes(query))
    )
  })

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Modules</TableHead>
                <TableHead>Limits</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-16" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search plans by name, tier, or modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {onRefresh && (
          <Button variant="outline" onClick={onRefresh} size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Monthly Price</TableHead>
              <TableHead>Annual Price</TableHead>
              <TableHead>Modules</TableHead>
              <TableHead>Limits</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No plans match your search' : 'No plans found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredPlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{plan.name}</div>
                      {plan.description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {plan.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {plan.tier}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatPrice(plan.monthlyPrice)}</TableCell>
                  <TableCell>
                    {plan.annualPrice ? formatPrice(plan.annualPrice) : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {plan.modules.length > 0 ? (
                        plan.modules.slice(0, 3).map((module) => (
                          <Badge key={module} variant="secondary" className="text-xs">
                            {module}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-xs">None</span>
                      )}
                      {plan.modules.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{plan.modules.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs space-y-1">
                      {plan.maxUsers && <div>Users: {plan.maxUsers}</div>}
                      {plan.maxStorage && (
                        <div>Storage: {plan.maxStorage}GB</div>
                      )}
                      {!plan.maxUsers && !plan.maxStorage && (
                        <span className="text-muted-foreground">Unlimited</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {plan.isSystem && (
                      <Badge variant="outline" className="ml-1 text-xs">
                        System
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(plan)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!plan.isSystem && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDuplicate(plan)}
                          className="h-8 w-8 p-0"
                          title="Duplicate plan"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
