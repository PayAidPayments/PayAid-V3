'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'

interface OnboardingFunnelChartProps {
  data?: Array<{
    step: string
    applications: number
    kycStarted: number
    approved: number
    firstPayment: number
  }>
  loading?: boolean
}

export function OnboardingFunnelChart({ data, loading }: OnboardingFunnelChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  const chartData = data || [
    { step: 'Applications', applications: 100, kycStarted: 85, approved: 65, firstPayment: 60 },
    { step: 'KYC Started', applications: 0, kycStarted: 85, approved: 65, firstPayment: 60 },
    { step: 'Approved', applications: 0, kycStarted: 0, approved: 65, firstPayment: 60 },
    { step: 'First Payment', applications: 0, kycStarted: 0, approved: 0, firstPayment: 60 },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Onboarding Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="step" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="applications" fill="#3B82F6" name="Applications" />
            <Bar dataKey="kycStarted" fill="#10B981" name="KYC Started" />
            <Bar dataKey="approved" fill="#8B5CF6" name="Approved" />
            <Bar dataKey="firstPayment" fill="#F59E0B" name="First Payment" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
