'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, TrendingUp, TrendingDown, Calculator, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

interface ScenarioResult {
  scenarioType: string
  currentState: {
    revenue: number
    customerCount: number
    dealCount: number
  }
  projectedState: {
    revenue: number
    customerCount: number
    dealCount: number
    revenueChange: number
    revenueChangePercent: number
  }
  actions: Array<{
    type: string
    description: string
    impact: number
    priority: 'high' | 'medium' | 'low'
  }>
  recommendations: string[]
  confidence: number
}

export function ScenarioPlanner() {
  const { toast } = useToast()
  const [scenarioType, setScenarioType] = useState<string>('close-deals')
  const [dealIds, setDealIds] = useState<string>('')
  const [contactIds, setContactIds] = useState<string>('')
  const [closureRateImprovement, setClosureRateImprovement] = useState<string>('10')

  const scenarioMutation = useMutation<ScenarioResult, Error, any>({
    mutationFn: (data) =>
      apiRequest('/api/crm/analytics/scenarios', {
        method: 'POST',
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    onSuccess: (data) => {
      toast({
        title: 'Scenario Analysis Complete',
        description: `Revenue change: ₹${(data.data.projectedState.revenueChange / 100000).toFixed(1)}L (${data.data.projectedState.revenueChangePercent.toFixed(1)}%)`,
      })
    },
    onError: (error) => {
      toast({
        title: 'Scenario Analysis Failed',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleRunScenario = () => {
    const parameters: any = {}

    if (scenarioType === 'close-deals') {
      parameters.dealIds = dealIds.split(',').map((id) => id.trim()).filter(Boolean)
    } else if (scenarioType === 'lose-customers' || scenarioType === 'upsell-customers') {
      parameters.contactIds = contactIds.split(',').map((id) => id.trim()).filter(Boolean)
    } else if (scenarioType === 'improve-closure-rate') {
      parameters.closureRateImprovement = parseFloat(closureRateImprovement) || 10
    }

    scenarioMutation.mutate({
      scenarioType,
      parameters,
    })
  }

  const result = scenarioMutation.data?.data

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calculator className="h-5 w-5 mr-2" />
          Scenario Planner (What-If Analysis)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Scenario Type Selection */}
          <div>
            <Label htmlFor="scenario-type">Scenario Type</Label>
            <Select value={scenarioType} onValueChange={setScenarioType}>
              <SelectTrigger id="scenario-type">
                <SelectValue placeholder="Select scenario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="close-deals">Close Specific Deals</SelectItem>
                <SelectItem value="lose-customers">Lose Specific Customers</SelectItem>
                <SelectItem value="upsell-customers">Upsell Specific Customers</SelectItem>
                <SelectItem value="improve-closure-rate">Improve Closure Rate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Parameters based on scenario type */}
          {scenarioType === 'close-deals' && (
            <div>
              <Label htmlFor="deal-ids">Deal IDs (comma-separated)</Label>
              <Input
                id="deal-ids"
                value={dealIds}
                onChange={(e) => setDealIds(e.target.value)}
                placeholder="deal-id-1, deal-id-2, deal-id-3"
              />
            </div>
          )}

          {(scenarioType === 'lose-customers' || scenarioType === 'upsell-customers') && (
            <div>
              <Label htmlFor="contact-ids">Contact IDs (comma-separated)</Label>
              <Input
                id="contact-ids"
                value={contactIds}
                onChange={(e) => setContactIds(e.target.value)}
                placeholder="contact-id-1, contact-id-2"
              />
            </div>
          )}

          {scenarioType === 'improve-closure-rate' && (
            <div>
              <Label htmlFor="improvement">Closure Rate Improvement (%)</Label>
              <Input
                id="improvement"
                type="number"
                value={closureRateImprovement}
                onChange={(e) => setClosureRateImprovement(e.target.value)}
                placeholder="10"
              />
            </div>
          )}

          <Button
            onClick={handleRunScenario}
            disabled={scenarioMutation.isLoading}
            className="w-full"
          >
            {scenarioMutation.isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Scenario...
              </>
            ) : (
              <>
                <Calculator className="mr-2 h-4 w-4" />
                Run Scenario Analysis
              </>
            )}
          </Button>

          {/* Results */}
          {result && (
            <>
              <Separator className="my-4" />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Scenario Results</h3>

                {/* Current vs Projected */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-md">
                    <p className="text-sm text-muted-foreground mb-2">Current State</p>
                    <p className="text-2xl font-bold">₹{(result.currentState.revenue / 100000).toFixed(1)}L</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {result.currentState.customerCount} customers, {result.currentState.dealCount} deals
                    </p>
                  </div>
                  <div className="p-4 border rounded-md">
                    <p className="text-sm text-muted-foreground mb-2">Projected State</p>
                    <p className={`text-2xl font-bold ${result.projectedState.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{(result.projectedState.revenue / 100000).toFixed(1)}L
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {result.projectedState.customerCount} customers, {result.projectedState.dealCount} deals
                    </p>
                  </div>
                </div>

                {/* Revenue Change */}
                <div className="p-4 bg-gray-50 rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Revenue Change</span>
                    <div className="flex items-center space-x-2">
                      {result.projectedState.revenueChange >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`text-lg font-bold ${result.projectedState.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {result.projectedState.revenueChange >= 0 ? '+' : ''}
                        ₹{(result.projectedState.revenueChange / 100000).toFixed(1)}L
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    ({result.projectedState.revenueChangePercent >= 0 ? '+' : ''}
                    {result.projectedState.revenueChangePercent.toFixed(1)}%)
                  </p>
                </div>

                {/* Confidence */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Confidence</span>
                  <Badge variant={result.confidence >= 70 ? 'default' : 'secondary'}>
                    {result.confidence}%
                  </Badge>
                </div>

                {/* Actions */}
                {result.actions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Recommended Actions</h4>
                    <div className="space-y-2">
                      {result.actions.map((action, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                          <span className="text-sm">{action.description}</span>
                          <Badge
                            variant={
                              action.priority === 'high'
                                ? 'destructive'
                                : action.priority === 'medium'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {action.priority}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {result.recommendations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Recommendations</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {result.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
