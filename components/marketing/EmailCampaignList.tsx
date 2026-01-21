'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import type { EmailCampaign } from '@/types/base-modules'

interface EmailCampaignListProps {
  organizationId: string
}

export function EmailCampaignList({ organizationId }: EmailCampaignListProps) {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  useEffect(() => {
    fetchCampaigns()
  }, [organizationId, page])

  async function fetchCampaigns() {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/marketing/email-campaigns?organizationId=${organizationId}&page=${page}&pageSize=${pageSize}`
      )
      const data = await response.json()
      
      if (data.success) {
        setCampaigns(data.data.campaigns)
        setTotal(data.data.total)
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-4">Loading campaigns...</div>
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 dark:bg-green-900'
      case 'scheduled':
        return 'bg-blue-100 dark:bg-blue-900'
      default:
        return 'bg-gray-100 dark:bg-gray-700'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Email Campaigns</h2>
        <Button onClick={() => {/* Open create modal */}}>Create Campaign</Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Subject</th>
              <th className="p-4 text-left">Recipients</th>
              <th className="p-4 text-left">Open Rate</th>
              <th className="p-4 text-left">Click Rate</th>
              <th className="p-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="p-4 font-medium">{campaign.name}</td>
                <td className="p-4">{campaign.subject}</td>
                <td className="p-4">{campaign.recipientCount}</td>
                <td className="p-4">
                  {campaign.metrics.totalSent > 0
                    ? `${((campaign.metrics.opened / campaign.metrics.totalSent) * 100).toFixed(1)}%`
                    : '-'}
                </td>
                <td className="p-4">
                  {campaign.metrics.totalSent > 0
                    ? `${((campaign.metrics.clicked / campaign.metrics.totalSent) * 100).toFixed(1)}%`
                    : '-'}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-sm ${getStatusColor(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {total > pageSize && (
          <div className="p-4 flex justify-between">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {Math.ceil(total / pageSize)}
            </span>
            <Button
              variant="outline"
              disabled={page >= Math.ceil(total / pageSize)}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
