'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, Circle, FileCheck, CreditCard, Users, Settings } from 'lucide-react'

const STEPS = [
  { id: 'company', label: 'Company profile', href: '/dashboard/settings/tenant', icon: Settings },
  { id: 'kyc', label: 'KYC / Documents', href: '/dashboard/settings/kyc', icon: FileCheck },
  { id: 'billing', label: 'Billing & payment', href: '/admin/billing', icon: CreditCard },
  { id: 'users', label: 'Team & users', href: '/admin/users', icon: Users },
]

export default function AdminOnboardingPage() {
  const [progress, setProgress] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProgress()
  }, [])

  const fetchProgress = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings/tenant')
      if (res.ok) {
        const j = await res.json()
        const tenant = j.data || j
        setProgress({
          company: !!(tenant?.name),
          kyc: !!(tenant?.gstin || tenant?.address),
          billing: !!tenant?.subscriptionId,
          users: true,
        })
      }
    } catch {
      setProgress({})
    } finally {
      setLoading(false)
    }
  }

  const completed = Object.values(progress).filter(Boolean).length
  const total = STEPS.length
  const percent = total ? Math.round((completed / total) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Onboarding Checklist</h1>
        <p className="text-muted-foreground">
          Complete these steps to get your business fully set up
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
          <div className="flex items-center gap-4">
            <Progress value={percent} className="flex-1 max-w-xs h-3" />
            <span className="text-sm font-medium">{completed}/{total} completed</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {STEPS.map((step) => (
              <Link
                key={step.id}
                href={step.href}
                className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                {progress[step.id] ? (
                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
                <step.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="flex-1 font-medium">{step.label}</span>
                {progress[step.id] && <Badge variant="secondary">Done</Badge>}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
