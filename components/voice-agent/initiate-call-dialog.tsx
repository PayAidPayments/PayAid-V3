'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/lib/stores/auth'

interface InitiateCallDialogProps {
  agentId: string
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function InitiateCallDialog({
  agentId,
  open,
  onClose,
  onSuccess,
}: InitiateCallDialogProps) {
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [customerName, setCustomerName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token) {
      alert('You must be logged in to initiate a call')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/v1/voice-agents/${agentId}/calls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone: phoneNumber,
          customerName: customerName || undefined,
        }),
      })

      if (response.ok) {
        onSuccess()
        onClose()
        setPhoneNumber('')
        setCustomerName('')
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to initiate call')
      }
    } catch (error) {
      console.error('Failed to initiate call:', error)
      alert('Failed to initiate call')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Initiate Voice Call</DialogTitle>
          <DialogDescription>
            Start a new voice call with this agent
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              placeholder="+919876543210"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name (Optional)</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="John Doe"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Initiating...' : 'Start Call'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

