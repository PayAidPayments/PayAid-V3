'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { formatINR } from '@/lib/currency'
import type { Proposal } from '@/modules/freelancer/types'

interface ProposalListProps {
  organizationId: string
}

export function ProposalList({ organizationId }: ProposalListProps) {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProposals()
  }, [organizationId])

  async function fetchProposals() {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/industries/freelancer/proposals?organizationId=${organizationId}`
      )
      const data = await response.json()
      
      if (data.success) {
        setProposals(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch proposals:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-4">Loading proposals...</div>
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 dark:bg-green-900'
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900'
      case 'sent':
        return 'bg-blue-100 dark:bg-blue-900'
      case 'expired':
        return 'bg-gray-100 dark:bg-gray-700'
      default:
        return 'bg-yellow-100 dark:bg-yellow-900'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Proposals</h2>
        <Button onClick={() => {/* Open create modal */}}>Create Proposal</Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {proposals.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No proposals yet. Create your first proposal to get started.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left">Title</th>
                <th className="p-4 text-left">Client</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Expires</th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((proposal) => (
                <tr key={proposal.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="p-4 font-medium">{proposal.title}</td>
                  <td className="p-4">{proposal.clientId}</td>
                  <td className="p-4 text-right font-medium">
                    {formatINR(proposal.totalAmount)}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-sm ${getStatusColor(proposal.status)}`}>
                      {proposal.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {proposal.expiresAt
                      ? new Date(proposal.expiresAt).toLocaleDateString('en-IN')
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
