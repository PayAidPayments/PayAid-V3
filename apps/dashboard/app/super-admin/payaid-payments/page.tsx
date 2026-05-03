'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, IndianRupee, Users, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default function PayAidPaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">PayAid Payments</h1>
        <p className="text-muted-foreground">
          Our company tenant dashboard
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <IndianRupee className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹12.5L</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Payment Success</CardTitle>
            <BarChart3 className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.7%</div>
            <p className="text-xs text-muted-foreground">Success rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">WhatsApp</CardTitle>
            <MessageSquare className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4K</div>
            <p className="text-xs text-muted-foreground">Messages sent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Active users</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Button asChild variant="outline" className="h-auto py-4">
          <Link href="/crm">
            <div className="text-left">
              <div className="font-semibold">CRM Dashboard</div>
              <div className="text-sm text-muted-foreground">Manage contacts and deals</div>
            </div>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4">
          <Link href="/finance">
            <div className="text-left">
              <div className="font-semibold">Billing Dashboard</div>
              <div className="text-sm text-muted-foreground">Invoices and payments</div>
            </div>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4">
          <Link href="/admin">
            <div className="text-left">
              <div className="font-semibold">Admin Settings</div>
              <div className="text-sm text-muted-foreground">Users and modules</div>
            </div>
          </Link>
        </Button>
      </div>
    </div>
  )
}
