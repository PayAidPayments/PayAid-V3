'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CustomSelect, CustomSelectContent, CustomSelectItem, CustomSelectTrigger } from '@/components/ui/custom-select'
import { DashboardLoading } from '@/components/ui/loading'
import { TrendingUp, TrendingDown, AlertCircle, Lightbulb, Plus, X } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const PAYAID_PURPLE = '#53328A'
const PAYAID_GOLD = '#F5C700'

interface Scenario {
  id: string
  name: string
  description?: string
  type: 'pricing' | 'hiring' | 'product' | 'marketing' | 'custom'
  parameters: Record<string, any>
}

interface ScenarioResult {
  scenario: Scenario
  forecast: {
    total90Day: number
    dailyAverage: number
    projectionVsCurrent: number
    confidence: number
  }
  impact: {
    revenueChange: number
    absoluteChange: number
    affectedMetrics: string[]
  }
  assumptions: string[]
}

interface Comparison {
  bestScenario: ScenarioResult | null
  worstScenario: ScenarioResult | null
  averageImpact: number
  recommendations: string[]
}

export function WhatIfAnalysis() {
  const { token } = useAuthStore()
  const [scenarios, setScenarios] = useState<Scenario[]>([
    {
      id: 'scenario-1',
      name: 'Baseline',
      type: 'custom',
      parameters: { adjustmentFactor: 1.0 },
    },
  ])
  const [results, setResults] = useState<ScenarioResult[]>([])
  const [comparison, setComparison] = useState<Comparison | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeScenarioType, setActiveScenarioType] = useState<'pricing' | 'hiring' | 'product' | 'marketing' | 'custom'>('pricing')

  const addScenario = () => {
    const newScenario: Scenario = {
      id: `scenario-${Date.now()}`,
      name: `Scenario ${scenarios.length + 1}`,
      type: activeScenarioType,
      parameters: getDefaultParameters(activeScenarioType),
    }
    setScenarios([...scenarios, newScenario])
  }

  const removeScenario = (id: string) => {
    setScenarios(scenarios.filter((s) => s.id !== id))
  }

  const updateScenario = (id: string, updates: Partial<Scenario>) => {
    setScenarios(
      scenarios.map((s) => (s.id === id ? { ...s, ...updates } : s))
    )
  }

  const getDefaultParameters = (type: string): Record<string, any> => {
    switch (type) {
      case 'pricing':
        return { priceChangePercent: 0, elasticity: -1.5, retentionRate: 80 }
      case 'hiring':
        return { newReps: 0, revenuePerRep: 50000, rampUpMonths: 3 }
      case 'product':
        return { launchDate: new Date().toISOString(), expectedMonthlyRevenue: 100000, growthRate: 0.1 }
      case 'marketing':
        return { marketingSpend: 0, roas: 3.0, attributionWindow: 30 }
      default:
        return { adjustmentFactor: 1.0 }
    }
  }

  const runAnalysis = async () => {
    if (scenarios.length === 0) return

    setLoading(true)
    try {
      const response = await fetch('/api/ai/what-if', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenarios: scenarios.filter((s) => s.id !== 'baseline'),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to run analysis')
      }

      const data = await response.json()
      setResults(data.results)
      setComparison(data.comparison)
    } catch (error) {
      console.error('What-if analysis error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Prepare chart data
  const chartData = results.map((result, index) => ({
    name: result.scenario.name,
    revenue: result.forecast.total90Day,
    change: result.impact.revenueChange,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">What-If Analysis</h2>
        <Button onClick={runAnalysis} disabled={loading || scenarios.length === 0}>
          {loading ? 'Analyzing...' : 'Run Analysis'}
        </Button>
      </div>

      {/* Scenario Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Build Scenarios</CardTitle>
          <CardDescription>Create and compare different business scenarios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Label>Scenario Type:</Label>
            <CustomSelect value={activeScenarioType} onValueChange={(v: string) => setActiveScenarioType(v as any)} placeholder="Select scenario type">
              <CustomSelectTrigger className="w-[200px]">
              </CustomSelectTrigger>
              <CustomSelectContent>
                <CustomSelectItem value="pricing">Pricing Change</CustomSelectItem>
                <CustomSelectItem value="hiring">Hiring</CustomSelectItem>
                <CustomSelectItem value="product">Product Launch</CustomSelectItem>
                <CustomSelectItem value="marketing">Marketing Campaign</CustomSelectItem>
                <CustomSelectItem value="custom">Custom</CustomSelectItem>
              </CustomSelectContent>
            </CustomSelect>
            <Button onClick={addScenario} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Scenario
            </Button>
          </div>

          {/* Scenario List */}
          <div className="space-y-4">
            {scenarios.map((scenario) => (
              <Card key={scenario.id} className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={scenario.name}
                      onChange={(e) => updateScenario(scenario.id, { name: e.target.value })}
                      placeholder="Scenario name"
                      className="font-semibold"
                    />
                    <CustomSelect
                      value={scenario.type}
                      onValueChange={(v: string) =>
                        updateScenario(scenario.id, {
                          type: v as any,
                          parameters: getDefaultParameters(v as any),
                        })
                      }
                      placeholder="Select type"
                    >
                      <CustomSelectTrigger className="w-[200px]">
                      </CustomSelectTrigger>
                      <CustomSelectContent>
                        <CustomSelectItem value="pricing">Pricing</CustomSelectItem>
                        <CustomSelectItem value="hiring">Hiring</CustomSelectItem>
                        <CustomSelectItem value="product">Product</CustomSelectItem>
                        <CustomSelectItem value="marketing">Marketing</CustomSelectItem>
                        <CustomSelectItem value="custom">Custom</CustomSelectItem>
                      </CustomSelectContent>
                    </CustomSelect>
                  </div>
                  {scenario.id !== 'scenario-1' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeScenario(scenario.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Scenario-specific parameters */}
                {scenario.type === 'pricing' && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Price Change (%)</Label>
                      <Input
                        type="number"
                        value={scenario.parameters.priceChangePercent || 0}
                        onChange={(e) =>
                          updateScenario(scenario.id, {
                            parameters: {
                              ...scenario.parameters,
                              priceChangePercent: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Elasticity</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={scenario.parameters.elasticity || -1.5}
                        onChange={(e) =>
                          updateScenario(scenario.id, {
                            parameters: {
                              ...scenario.parameters,
                              elasticity: parseFloat(e.target.value) || -1.5,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {scenario.type === 'hiring' && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>New Reps</Label>
                      <Input
                        type="number"
                        value={scenario.parameters.newReps || 0}
                        onChange={(e) =>
                          updateScenario(scenario.id, {
                            parameters: {
                              ...scenario.parameters,
                              newReps: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Revenue per Rep (₹/month)</Label>
                      <Input
                        type="number"
                        value={scenario.parameters.revenuePerRep || 50000}
                        onChange={(e) =>
                          updateScenario(scenario.id, {
                            parameters: {
                              ...scenario.parameters,
                              revenuePerRep: parseFloat(e.target.value) || 50000,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {/* Add more parameter inputs for other scenario types */}
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <>
          {/* Comparison Summary */}
          {comparison && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Analysis Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {comparison.bestScenario && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="font-semibold">Best Scenario: {comparison.bestScenario.scenario.name}</span>
                    </div>
                    <p className="text-sm">
                      Projected {comparison.bestScenario.impact.revenueChange.toFixed(1)}% revenue increase
                      (₹{comparison.bestScenario.impact.absoluteChange.toLocaleString()})
                    </p>
                  </div>
                )}

                {comparison.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Recommendations:</h4>
                    {comparison.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Results Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Scenario Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `₹${value.toLocaleString()}`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke={PAYAID_PURPLE}
                    strokeWidth={2}
                    name="90-Day Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((result) => (
              <Card key={result.scenario.id}>
                <CardHeader>
                  <CardTitle>{result.scenario.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">90-Day Revenue:</span>
                    <span className="font-semibold">₹{result.forecast.total90Day.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Revenue Change:</span>
                    <span
                      className={`font-semibold ${
                        result.impact.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {result.impact.revenueChange >= 0 ? '+' : ''}
                      {result.impact.revenueChange.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Confidence:</span>
                    <span className="font-semibold">{(result.forecast.confidence * 100).toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
