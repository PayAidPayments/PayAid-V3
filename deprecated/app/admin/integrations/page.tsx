'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const integrations = [
  { id: 'whatsapp', name: 'WhatsApp', status: 'optional' },
  { id: 'email', name: 'Email (SMTP/API)', status: 'optional' },
  { id: 'payment', name: 'Payment gateway', status: 'optional' },
  { id: 'accounting', name: 'Accounting', status: 'optional' },
  { id: 'webhooks', name: 'Webhooks', status: 'optional' },
]

export default function AdminIntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">WhatsApp, Email, Payment, Accounting, Webhooks</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {integrations.map((i) => (
          <Card key={i.id}>
            <CardHeader>
              <CardTitle className="text-base">{i.name}</CardTitle>
              <Badge variant="secondary">{i.status}</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Configure in settings.</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
