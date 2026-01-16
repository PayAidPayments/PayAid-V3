'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Ticket, 
  Plus, 
  Search, 
  Filter,
  MessageSquare,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  ArrowRight,
  BookOpen
} from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'
import { format } from 'date-fns'

interface SupportTicket {
  id: string
  ticketNumber: string
  subject: string
  description: string
  customerId?: string
  customerName?: string
  customerEmail?: string
  status: 'new' | 'open' | 'pending' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignedToId?: string
  assignedToName?: string
  channel: 'email' | 'chat' | 'phone' | 'whatsapp' | 'web'
  aiResolved: boolean
  aiConfidence?: number
  tags: string[]
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  responseTime?: number
}

export default function TicketsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [filter, setFilter] = useState<'all' | 'new' | 'open' | 'resolved'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateTicket, setShowCreateTicket] = useState(false)

  useEffect(() => {
    fetchTickets()
  }, [tenantId, token, filter])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      if (!token) return

      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.append('status', filter)
      }

      const response = await fetch(`/api/support/tickets?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setTickets(data.tickets || [])
      } else {
        setTickets([])
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'open':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'pending':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  if (loading) {
    return <PageLoading message="Loading support tickets..." fullScreen={false} />
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = searchQuery === '' || 
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesSearch
  })

  const stats = {
    total: tickets.length,
    new: tickets.filter(t => t.status === 'new').length,
    open: tickets.filter(t => t.status === 'open').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    aiResolved: tickets.filter(t => t.aiResolved).length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Support Tickets</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            AI-assisted ticket management with auto-resolve, routing, and booking
          </p>
        </div>
        <Button
          onClick={() => setShowCreateTicket(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Ticket
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.total}
                </p>
              </div>
              <Ticket className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">New</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.new}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Open</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {stats.open}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.resolved}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">AI Resolved</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.aiResolved}
                </p>
              </div>
              <Zap className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tickets..."
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('new')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === 'new'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                New
              </button>
              <button
                onClick={() => setFilter('open')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === 'open'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                Open
              </button>
              <button
                onClick={() => setFilter('resolved')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === 'resolved'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                Resolved
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets</CardTitle>
          <CardDescription>Manage customer support requests with AI assistance</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTickets.length > 0 ? (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          #{ticket.ticketNumber} - {ticket.subject}
                        </h3>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status}
                        </Badge>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        {ticket.aiResolved && (
                          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            <Zap className="h-3 w-3 mr-1" />
                            AI Resolved
                            {ticket.aiConfidence && (
                              <span className="ml-1">({(ticket.aiConfidence * 100).toFixed(0)}%)</span>
                            )}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        {ticket.customerName && (
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {ticket.customerName}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {ticket.channel}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {format(new Date(ticket.createdAt), 'MMM dd, yyyy HH:mm')}
                        </span>
                        {ticket.assignedToName && (
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            Assigned to: {ticket.assignedToName}
                          </span>
                        )}
                        {ticket.responseTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Response: {ticket.responseTime}m
                          </span>
                        )}
                      </div>
                      {ticket.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {ticket.tags.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                      {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                        <Button variant="outline" size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No tickets found. Create your first support ticket or tickets will be auto-created from customer inquiries.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
