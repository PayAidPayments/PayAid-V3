'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, Target, DollarSign, Users, Calendar } from 'lucide-react'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { GlassCard } from '@/components/modules/GlassCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AdvancedAnalyticsProps {
  tenantId: string
  stats?: any
}

export function AdvancedAnalytics({ tenantId, stats }: AdvancedAnalyticsProps) {
  const [forecastPeriod, setForecastPeriod] = useState<'30' | '60' | '90'>('30')

  // Revenue Forecast Data (mock - should come from API)
  const forecastData = [
    { month: 'Jan', actual: 450000, forecast: 480000, confidence: 'high' },
    { month: 'Feb', actual: 520000, forecast: 550000, confidence: 'high' },
    { month: 'Mar', actual: 480000, forecast: 510000, confidence: 'medium' },
    { month: 'Apr', actual: null, forecast: 540000, confidence: 'medium' },
    { month: 'May', actual: null, forecast: 580000, confidence: 'low' },
    { month: 'Jun', actual: null, forecast: 620000, confidence: 'low' },
  ]

  // Conversion Funnel Data
  const funnelData = [
    { stage: 'Leads', count: 1000, value: 0 },
    { stage: 'Qualified', count: 600, value: 0 },
    { stage: 'Proposal', count: 300, value: 0 },
    { stage: 'Negotiation', count: 150, value: 0 },
    { stage: 'Won', count: 75, value: 7500000 },
  ]

  // Win/Loss Analysis
  const winLossData = [
    { reason: 'Price', won: 25, lost: 15 },
    { reason: 'Features', won: 20, lost: 10 },
    { reason: 'Timing', won: 15, lost: 20 },
    { reason: 'Competitor', won: 10, lost: 25 },
    { reason: 'Other', won: 5, lost: 5 },
  ]

  return (
    <div className="space-y-8">
      {/* Revenue Forecasting */}
      <GlassCard>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Revenue Forecast</CardTitle>
              <CardDescription>Predictive revenue forecasting with confidence intervals</CardDescription>
            </div>
            <select
              value={forecastPeriod}
              onChange={(e) => setForecastPeriod(e.target.value as '30' | '60' | '90')}
              className="text-sm border rounded px-3 py-1"
            >
              <option value="30">30 Days</option>
              <option value="60">60 Days</option>
              <option value="90">90 Days</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={forecastData}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F5C700" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#F5C700" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: any) => formatINRForDisplay(value)} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="actual" 
                stroke="#059669" 
                fill="url(#colorActual)"
                name="Actual Revenue"
              />
              <Area 
                type="monotone" 
                dataKey="forecast" 
                stroke="#F5C700" 
                fill="url(#colorForecast)"
                strokeDasharray="5 5"
                name="Forecast"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </GlassCard>

      {/* Conversion Funnel */}
      <GlassCard>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Sales Conversion Funnel</CardTitle>
          <CardDescription>Lead to deal conversion rates by stage</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="stage" type="category" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#53328A" name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </GlassCard>

      {/* Win/Loss Analysis */}
      <GlassCard>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Win/Loss Analysis</CardTitle>
          <CardDescription>Deals won vs lost by reason</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={winLossData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="reason" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="won" fill="#059669" name="Won" />
              <Bar dataKey="lost" fill="#DC2626" name="Lost" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </GlassCard>

      {/* Sales Velocity Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Average Deal Cycle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">42 days</div>
            <p className="text-sm text-gray-500 mt-1">Down from 48 days</p>
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Sales Velocity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gold-600">₹2.1M</div>
            <p className="text-sm text-gray-500 mt-1">Per month</p>
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">7.5%</div>
            <p className="text-sm text-gray-500 mt-1">Leads to Won</p>
          </CardContent>
        </GlassCard>
      </div>
    </div>
  )
}
