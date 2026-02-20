'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp } from 'lucide-react'

interface AIBillingAdvisorCardProps {
  usagePct?: number
  suggestion?: string
}

export function AIBillingAdvisorCard({
  usagePct = 0,
  suggestion,
}: AIBillingAdvisorCardProps) {
  const tip =
    suggestion ??
    (usagePct > 80
      ? 'You are often hitting limits. Consider upgrading your plan.'
      : usagePct < 20
        ? 'Usage is low. You might save with a lower plan.'
        : 'Your current plan fits your usage well.')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4" />
          AI billing advisor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">{tip}</p>
        <Button variant="outline" size="sm">
          View plans
        </Button>
      </CardContent>
    </Card>
  )
}
