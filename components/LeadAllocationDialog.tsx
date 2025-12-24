'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface RepSuggestion {
  rep: {
    id: string
    name: string
    email: string
    specialization: string | null
    conversionRate: number
    assignedLeadsCount: number
  }
  score: number
  reasons: string[]
}

interface LeadAllocationDialogProps {
  contactId: string
  contactName: string
  currentRep?: {
    id: string
    name: string
  } | null
  onAssign: (repId: string) => void
  onClose: () => void
}

export function LeadAllocationDialog({
  contactId,
  contactName,
  currentRep,
  onAssign,
  onClose,
}: LeadAllocationDialogProps) {
  const [suggestions, setSuggestions] = useState<RepSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState<string | null>(null)

  useEffect(() => {
    loadSuggestions()
  }, [contactId])

  const loadSuggestions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/leads/${contactId}/allocation-suggestions`)
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async (repId: string) => {
    try {
      setAssigning(repId)
      const response = await fetch(`/api/leads/${contactId}/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repId, autoAssign: true }),
      })

      if (response.ok) {
        const data = await response.json()
        onAssign(repId)
        onClose()
      } else {
        throw new Error('Failed to assign lead')
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to assign lead')
    } finally {
      setAssigning(null)
    }
  }

  const handleAutoAssign = async () => {
    try {
      setAssigning('auto')
      const response = await fetch(`/api/leads/${contactId}/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoAssign: true }),
      })

      if (response.ok) {
        const data = await response.json()
        onAssign(data.rep.id)
        onClose()
      } else {
        throw new Error('Failed to auto-assign lead')
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to auto-assign lead')
    } finally {
      setAssigning(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Assign Lead: {contactName}</CardTitle>
          <CardDescription>
            {currentRep
              ? `Currently assigned to: ${currentRep.name}`
              : 'Select a sales rep to assign this lead'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Auto-Assign Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleAutoAssign}
              disabled={loading || assigning === 'auto'}
              className="bg-green-600 hover:bg-green-700"
            >
              {assigning === 'auto' ? 'Assigning...' : '🤖 Auto-Assign Best Match'}
            </Button>
          </div>

          {/* Suggestions */}
          {loading ? (
            <div className="text-center py-8">Loading suggestions...</div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No sales reps available
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Top Suggestions:</h3>
              {suggestions.map((suggestion, index) => (
                <Card
                  key={suggestion.rep.id}
                  className={`border-2 ${
                    index === 0 ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-lg">
                            {index === 0 && '🏆 '}
                            {suggestion.rep.name}
                          </h4>
                          {index === 0 && (
                            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                              Best Match
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            <strong>Email:</strong> {suggestion.rep.email}
                          </p>
                          {suggestion.rep.specialization && (
                            <p>
                              <strong>Specialization:</strong>{' '}
                              {suggestion.rep.specialization}
                            </p>
                          )}
                          <p>
                            <strong>Conversion Rate:</strong>{' '}
                            {(suggestion.rep.conversionRate * 100).toFixed(1)}%
                          </p>
                          <p>
                            <strong>Current Leads:</strong>{' '}
                            {suggestion.rep.assignedLeadsCount}
                          </p>
                          <p>
                            <strong>Match Score:</strong> {Math.round(suggestion.score)}
                          </p>
                        </div>
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-gray-700 mb-1">
                            Why this rep:
                          </p>
                          <ul className="text-xs text-gray-600 list-disc list-inside">
                            {suggestion.reasons.map((reason, i) => (
                              <li key={i}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleAssign(suggestion.rep.id)}
                        disabled={assigning === suggestion.rep.id}
                        className="ml-4"
                        variant={index === 0 ? 'default' : 'outline'}
                      >
                        {assigning === suggestion.rep.id ? 'Assigning...' : 'Assign'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
