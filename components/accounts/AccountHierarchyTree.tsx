'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronRight, ChevronDown, Building2, Users, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AccountNode {
  id: string
  name: string
  type?: string
  industry?: string
  annualRevenue?: number
  employeeCount?: number
  healthScore?: number
  childAccounts?: AccountNode[]
}

interface AccountHierarchyTreeProps {
  tenantId: string
  rootAccountId: string
  onAccountSelect?: (accountId: string) => void
}

export function AccountHierarchyTree({
  tenantId,
  rootAccountId,
  onAccountSelect,
}: AccountHierarchyTreeProps) {
  const [tree, setTree] = useState<AccountNode | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([rootAccountId]))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAccountTree()
  }, [tenantId, rootAccountId])

  const fetchAccountTree = async () => {
    try {
      const response = await fetch(`/api/accounts/${rootAccountId}?includeHierarchy=true`, {
        headers: {
          'X-Tenant-ID': tenantId,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch account tree')
      const data = await response.json()
      setTree(data.data)
    } catch (error) {
      console.error('Error fetching account tree:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleNode = (accountId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId)
    } else {
      newExpanded.add(accountId)
    }
    setExpandedNodes(newExpanded)
  }

  const renderNode = (node: AccountNode, level: number = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.childAccounts && node.childAccounts.length > 0

    return (
      <div key={node.id} className="select-none">
        <div
          className={cn(
            'flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors',
            level > 0 && 'ml-6'
          )}
          style={{ paddingLeft: `${level * 24 + 8}px` }}
          onClick={() => {
            if (hasChildren) toggleNode(node.id)
            onAccountSelect?.(node.id)
          }}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleNode(node.id)
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          <Building2 className="w-5 h-5 text-blue-600" />
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{node.name}</div>
            <div className="text-sm text-gray-500 flex items-center gap-3">
              {node.industry && <span>{node.industry}</span>}
              {node.annualRevenue && (
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  ₹{node.annualRevenue.toLocaleString('en-IN')}
                </span>
              )}
              {node.employeeCount && <span>{node.employeeCount} employees</span>}
            </div>
          </div>
          {node.healthScore !== undefined && (
            <div
              className={cn(
                'px-2 py-1 rounded text-xs font-semibold',
                node.healthScore >= 70
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : node.healthScore >= 40
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              )}
            >
              {node.healthScore}
            </div>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div className="ml-4 border-l-2 border-gray-200 dark:border-gray-700">
            {node.childAccounts!.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading account hierarchy...</div>
        </CardContent>
      </Card>
    )
  }

  if (!tree) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">No account hierarchy found</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Hierarchy</CardTitle>
        <CardDescription>Parent-child account relationships</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">{renderNode(tree)}</div>
      </CardContent>
    </Card>
  )
}
