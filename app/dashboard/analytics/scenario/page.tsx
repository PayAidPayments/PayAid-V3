'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TrendingUp, Calculator, AlertCircle } from 'lucide-react'

export default function ScenarioPlanningPage() {
  const [scenario, setScenario] = useState('')
  const [parameters, setParameters] = useState<Record<string, number>>({})

  const scenarioMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/ai/analytics/scenario', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Scenario analysis failed')
      }
      return res.json()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    scenarioMutation.mutate({ scenario, parameters })
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calculator className="h-7 w-7 text-purple-600" />
          Scenario Planning
        </h1>
        <p className="text-gray-600 mt-1">
          Analyze "what if" scenarios for your business decisions
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Define Scenario</CardTitle>
            <CardDescription>Describe what you want to analyze</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="scenario">Scenario Description</Label>
              <Textarea
                id="scenario"
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                placeholder="e.g., What if I increase prices by 10%? What if I close 20% more deals?"
                rows={3}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="increasePercent">Price Increase % (optional)</Label>
                <Input
                  id="increasePercent"
                  type="number"
                  value={parameters.increasePercent || ''}
                  onChange={(e) =>
                    setParameters({
                      ...parameters,
                      increasePercent: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="closePercent">Deal Close % (optional)</Label>
                <Input
                  id="closePercent"
                  type="number"
                  value={parameters.closePercent || ''}
                  onChange={(e) =>
                    setParameters({
                      ...parameters,
                      closePercent: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="mt-1"
                />
              </div>
            </div>
            <Button type="submit" disabled={!scenario.trim() || scenarioMutation.isPending}>
              {scenarioMutation.isPending ? 'Analyzing...' : 'Run Scenario'}
            </Button>
          </CardContent>
        </Card>
      </form>

      {scenarioMutation.data && (
        <Card>
          <CardHeader>
            <CardTitle>Scenario Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Baseline</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Current Revenue</div>
                  <div className="text-lg font-semibold">
                    ₹{Number(scenarioMutation.data.baseline.revenue).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Pipeline Value</div>
                  <div className="text-lg font-semibold">
                    ₹{Number(scenarioMutation.data.baseline.pipeline).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Projected
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Projected Revenue</div>
                  <div className="text-lg font-semibold text-green-600">
                    ₹{Number(scenarioMutation.data.projected.revenue).toLocaleString('en-IN')}
                  </div>
                  <div className="text-sm text-gray-500">
                    {scenarioMutation.data.change.revenuePercent > 0 ? '+' : ''}
                    {scenarioMutation.data.change.revenuePercent.toFixed(1)}% change
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Revenue Change</div>
                  <div className={`text-lg font-semibold ${scenarioMutation.data.change.revenue > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {scenarioMutation.data.change.revenue > 0 ? '+' : ''}
                    ₹{Number(scenarioMutation.data.change.revenue).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>

            {scenarioMutation.data.assumptions.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Assumptions</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  {scenarioMutation.data.assumptions.map((a: string, i: number) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}

            {scenarioMutation.data.impact.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Impact</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  {scenarioMutation.data.impact.map((i: string, idx: number) => (
                    <li key={idx}>{i}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {scenarioMutation.error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span>
                {scenarioMutation.error instanceof Error
                  ? scenarioMutation.error.message
                  : 'Analysis failed'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
