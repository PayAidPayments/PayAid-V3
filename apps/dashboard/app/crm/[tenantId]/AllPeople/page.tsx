'use client'

import { useState, useMemo, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useContacts } from '@/lib/hooks/use-api'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, isWithinInterval } from 'date-fns'
import { StagePromotionButton } from '@/components/crm/StagePromotionButton'
import { 
  Search, 
  Plus, 
  Download,
  Edit,
  Users,
  CheckCircle,
  Filter,
  MessageSquare,
  UserPlus,
  TrendingUp,
  Target,
  ArrowUpRight,
  BarChart3
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { PageLoading } from '@/components/ui/loading'
import { LeadAllocationDialog } from '@/components/LeadAllocationDialog'
import { RowActionsMenu } from '@/components/crm/RowActionsMenu'
import { useToast } from '@/components/ui/toast'

type StageFilter = 'all' | 'prospect' | 'contact' | 'customer'

export default function CRMAllPeoplePage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const queryClient = useQueryClient()
  const { toast, ToastContainer: PageToastContainer } = useToast()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(100)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<StageFilter>('all')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [search])
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [contactToAssign, setContactToAssign] = useState<{ id: string; name: string; currentRep?: { id: string; name: string } | null } | null>(null)
  const [timePeriod, setTimePeriod] = useState<'month' | 'quarter' | 'financial-year' | 'year'>('month')
  const [selectedStatCard, setSelectedStatCard] = useState<string | null>(null)

  // Fetch all contacts for stats calculation (single source for tab counts)
  const { data: allContactsData, isLoading: isLoadingAll } = useContacts({ page: 1, limit: 10000, tenantId: tenantId || undefined })
  const allContacts = allContactsData?.contacts || []

  // Fetch contacts based on stage filter for table (uses debounced search to avoid per-keystroke requests)
  const contactParams: any = { page, limit, search: debouncedSearch, tenantId: tenantId || undefined }
  if (stageFilter !== 'all') {
    contactParams.stage = stageFilter
  }

  const { data, isLoading, error } = useContacts(contactParams)
  
  const contacts = data?.contacts || []
  const pagination = data?.pagination

  // Calculate stats based on time period
  const stats = useMemo(() => {
    const now = new Date()
    let period: { start: Date; end: Date; label: string }
    switch (timePeriod) {
      case 'month':
        period = {
          start: startOfMonth(now),
          end: endOfMonth(now),
          label: 'This Month',
        }
        break
      case 'quarter':
        period = {
          start: startOfQuarter(now),
          end: endOfQuarter(now),
          label: 'This Quarter',
        }
        break
      case 'financial-year': {
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth()
        const fyStartYear = currentMonth >= 3 ? currentYear : currentYear - 1
        const fyEndYear = fyStartYear + 1
        period = {
          start: new Date(fyStartYear, 3, 1),
          end: new Date(fyEndYear, 2, 31, 23, 59, 59, 999),
          label: 'This Financial Year',
        }
        break
      }
      case 'year':
        period = {
          start: startOfYear(now),
          end: endOfYear(now),
          label: 'This Year',
        }
        break
      default:
        period = {
          start: startOfMonth(now),
          end: endOfMonth(now),
          label: 'This Month',
        }
    }
    
    // Categorize all contacts
    const categorized = {
      all: allContacts,
      prospects: allContacts.filter((c: any) => {
        const stage = c.stage || (c.type === 'lead' ? 'prospect' : c.type === 'customer' ? 'customer' : 'contact')
        return stage === 'prospect'
      }),
      contacts: allContacts.filter((c: any) => {
        const stage = c.stage || (c.type === 'lead' ? 'prospect' : c.type === 'customer' ? 'customer' : 'contact')
        return stage === 'contact'
      }),
      customers: allContacts.filter((c: any) => {
        const stage = c.stage || (c.type === 'lead' ? 'prospect' : c.type === 'customer' ? 'customer' : 'contact')
        return stage === 'customer'
      }),
    }

    // Calculate new contacts in period
    const newInPeriod = allContacts.filter((c: any) => {
      if (!c.createdAt) return false
      const createdDate = new Date(c.createdAt)
      return isWithinInterval(createdDate, { start: period.start, end: period.end })
    })

    // Calculate conversion rate (prospects to customers)
    const totalProspects = categorized.prospects.length
    const totalCustomers = categorized.customers.length
    const conversionRate = totalProspects > 0 
      ? ((totalCustomers / (totalProspects + totalCustomers)) * 100).toFixed(1)
      : '0.0'

    // Calculate new by stage in period
    const newProspects = newInPeriod.filter((c: any) => {
      const stage = c.stage || (c.type === 'lead' ? 'prospect' : c.type === 'customer' ? 'customer' : 'contact')
      return stage === 'prospect'
    }).length

    const newContacts = newInPeriod.filter((c: any) => {
      const stage = c.stage || (c.type === 'lead' ? 'prospect' : c.type === 'customer' ? 'customer' : 'contact')
      return stage === 'contact'
    }).length

    const newCustomers = newInPeriod.filter((c: any) => {
      const stage = c.stage || (c.type === 'lead' ? 'prospect' : c.type === 'customer' ? 'customer' : 'contact')
      return stage === 'customer'
    }).length

    return {
      total: categorized.all.length,
      prospects: categorized.prospects.length,
      contacts: categorized.contacts.length,
      customers: categorized.customers.length,
      newInPeriod: newInPeriod.length,
      newProspects,
      newContacts,
      newCustomers,
      conversionRate,
      periodLabel: period.label
    }
  }, [allContacts, timePeriod])

  // Tab counts from same source (stats) so they stay consistent when switching tabs
  const stageCounts = {
    all: stats.total,
    prospect: stats.prospects,
    contact: stats.contacts,
    customer: stats.customers,
  }

  // Handle stat card click
  const handleStatCardClick = (cardType: string) => {
    if (selectedStatCard === cardType) {
      setSelectedStatCard(null)
      setStageFilter('all')
    } else {
      setSelectedStatCard(cardType)
      if (cardType === 'prospects') {
        setStageFilter('prospect')
      } else if (cardType === 'contacts') {
        setStageFilter('contact')
      } else if (cardType === 'customers') {
        setStageFilter('customer')
      } else {
        setStageFilter('all')
      }
    }
  }


  const getStageBadge = (stage: string) => {
    const stageColors: Record<string, string> = {
      prospect: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      contact: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      customer: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    }
    const color = stageColors[stage] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    const label = stage === 'prospect' ? 'Prospect' : stage === 'contact' ? 'Contact' : stage === 'customer' ? 'Customer' : stage
    return (
      <Badge className={color}>
        {label}
      </Badge>
    )
  }

  if (isLoading || isLoadingAll) {
    return <PageLoading message="Loading contacts..." fullScreen={true} />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-600">
          <p>Error loading contacts</p>
          <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col flex-1 min-w-0 bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 min-w-0 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto w-full min-w-0">
          {/* Page Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">All People</h1>
              <p className="text-gray-600 dark:text-gray-400">View and manage all contacts across all stages</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 border border-purple-200 dark:border-purple-800 rounded-lg px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30">
                <Filter className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <select
                  value={timePeriod}
                  onChange={(e) => {
                    setTimePeriod(e.target.value as 'month' | 'quarter' | 'financial-year' | 'year')
                    setSelectedStatCard(null)
                  }}
                  className="text-sm font-medium text-purple-700 dark:text-purple-300 bg-transparent border-0 focus:outline-none cursor-pointer"
                >
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="financial-year">This Financial Year</option>
                  <option value="year">This Year</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Contacts */}
            <Card 
              className={`border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 hover:shadow-xl transition-all cursor-pointer hover:scale-105 ${
                selectedStatCard === 'total' ? 'ring-2 ring-indigo-500 shadow-xl' : ''
              }`}
              onClick={() => handleStatCardClick('total')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-200">Total Contacts</CardTitle>
                <div className="p-2 bg-indigo-500/20 dark:bg-indigo-500/30 rounded-lg">
                  <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {stats.total}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">All contacts in system</p>
              </CardContent>
            </Card>

            {/* Prospects */}
            <Card 
              className={`border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 hover:shadow-xl transition-all cursor-pointer hover:scale-105 ${
                selectedStatCard === 'prospects' ? 'ring-2 ring-blue-500 shadow-xl' : ''
              }`}
              onClick={() => handleStatCardClick('prospects')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-200">Prospects</CardTitle>
                <div className="p-2 bg-blue-500/20 dark:bg-blue-500/30 rounded-lg">
                  <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {stats.prospects}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3 text-green-600 dark:text-green-400" />
                  <span className="text-green-600 dark:text-green-400 font-medium">+{stats.newProspects} {stats.periodLabel}</span>
                </p>
              </CardContent>
            </Card>

            {/* Contacts */}
            <Card 
              className={`border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 hover:shadow-xl transition-all cursor-pointer hover:scale-105 ${
                selectedStatCard === 'contacts' ? 'ring-2 ring-purple-500 shadow-xl' : ''
              }`}
              onClick={() => handleStatCardClick('contacts')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-200">Active Contacts</CardTitle>
                <div className="p-2 bg-purple-500/20 dark:bg-purple-500/30 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {stats.contacts}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3 text-green-600 dark:text-green-400" />
                  <span className="text-green-600 dark:text-green-400 font-medium">+{stats.newContacts} {stats.periodLabel}</span>
                </p>
              </CardContent>
            </Card>

            {/* Customers */}
            <Card 
              className={`border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 hover:shadow-xl transition-all cursor-pointer hover:scale-105 ${
                selectedStatCard === 'customers' ? 'ring-2 ring-green-500 shadow-xl' : ''
              }`}
              onClick={() => handleStatCardClick('customers')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-200">Customers</CardTitle>
                <div className="p-2 bg-green-500/20 dark:bg-green-500/30 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {stats.customers}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3 text-green-600 dark:text-green-400" />
                  <span className="text-green-600 dark:text-green-400 font-medium">+{stats.newCustomers} {stats.periodLabel}</span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* New This Period */}
            <Card 
              className={`border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 hover:shadow-xl transition-all cursor-pointer hover:scale-105 ${
                selectedStatCard === 'new' ? 'ring-2 ring-orange-500 shadow-xl' : ''
              }`}
              onClick={() => handleStatCardClick('new')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-200">New {stats.periodLabel}</CardTitle>
                <div className="p-2 bg-orange-500/20 dark:bg-orange-500/30 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {stats.newInPeriod}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">New contacts added</p>
              </CardContent>
            </Card>

            {/* Conversion Rate */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/30 dark:to-cyan-800/30 hover:shadow-xl transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-200">Conversion Rate</CardTitle>
                <div className="p-2 bg-cyan-500/20 dark:bg-cyan-500/30 rounded-lg">
                  <Target className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {stats.conversionRate}%
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Prospect to Customer</p>
              </CardContent>
            </Card>

            {/* Stage Distribution */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-800/30 hover:shadow-xl transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-200">Pipeline Health</CardTitle>
                <div className="p-2 bg-pink-500/20 dark:bg-pink-500/30 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {stats.prospects} → {stats.contacts} → {stats.customers}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Prospect → Contact → Customer</p>
              </CardContent>
            </Card>
          </div>

          {/* Stage Filter Tabs */}
          <div className="mb-6">
            <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setStageFilter('all')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  stageFilter === 'all'
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                All ({stageCounts.all})
              </button>
              <button
                onClick={() => setStageFilter('prospect')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  stageFilter === 'prospect'
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Prospects ({stageCounts.prospect})
              </button>
              <button
                onClick={() => setStageFilter('contact')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  stageFilter === 'contact'
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Contacts ({stageCounts.contact})
              </button>
              <button
                onClick={() => setStageFilter('customer')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  stageFilter === 'customer'
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Customers ({stageCounts.customer})
              </button>
            </div>
          </div>

          {/* Search and Actions */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search by name, email, phone, or company..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Link href={`/crm/${tenantId}/Contacts/new`}>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </Link>
            </div>
          </div>

          {/* Contacts Table - full width, Name and Company use empty space */}
          <Card className="flex-1 min-w-0 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto min-w-0">
                <Table className="w-full table-auto text-sm">
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700">
                      <TableHead className="w-11 py-3 pl-4 pr-2">
                        <Checkbox
                          checked={selectedContacts.length === contacts.length && contacts.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedContacts(contacts.map((c: any) => c.id))
                            } else {
                              setSelectedContacts([])
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead className="min-w-[220px] py-3 px-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Name</TableHead>
                      <TableHead className="w-[90px] py-3 px-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Stage</TableHead>
                      <TableHead className="min-w-[180px] py-3 px-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Email</TableHead>
                      <TableHead className="min-w-[120px] py-3 px-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Phone</TableHead>
                      <TableHead className="min-w-[200px] py-3 px-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Company</TableHead>
                      <TableHead className="min-w-[140px] py-3 px-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Owner</TableHead>
                      <TableHead className="w-[100px] py-3 px-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Created</TableHead>
                      <TableHead className="w-[100px] py-3 pl-3 pr-4 text-right text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 dark:divide-gray-700">
                    {contacts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-gray-500 dark:text-gray-400">
                          {search ? 'No contacts found matching your search.' : `No ${stageFilter === 'all' ? 'contacts' : stageFilter + 's'} found.`}
                        </TableCell>
                      </TableRow>
                    ) : (
                      contacts.map((contact: any) => {
                        const isSelected = selectedContacts.includes(contact.id)
                        const contactStage = contact.stage || (contact.type === 'lead' ? 'prospect' : contact.type === 'customer' ? 'customer' : 'contact')

                        return (
                          <TableRow 
                            key={contact.id} 
                            className={isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                          >
                            <TableCell className="py-3 pl-4 pr-2">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedContacts([...selectedContacts, contact.id])
                                  } else {
                                    setSelectedContacts(selectedContacts.filter(id => id !== contact.id))
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell className="py-3 px-3 min-w-0">
                              <Link 
                                href={`/crm/${tenantId}/Contacts/${contact.id}`}
                                className="font-medium text-blue-600 dark:text-blue-400 hover:underline block truncate"
                                title={contact.name}
                              >
                                {contact.name}
                              </Link>
                            </TableCell>
                            <TableCell className="py-3 px-3 whitespace-nowrap">
                              {getStageBadge(contactStage)}
                            </TableCell>
                            <TableCell className="py-3 px-3 min-w-0 text-gray-600 dark:text-gray-400 text-sm">
                              <span className="block truncate" title={contact.email || undefined}>{contact.email || '-'}</span>
                            </TableCell>
                            <TableCell className="py-3 px-3 min-w-0 text-gray-600 dark:text-gray-400 text-sm">
                              <span className="block truncate" title={contact.phone || undefined}>{contact.phone || '-'}</span>
                            </TableCell>
                            <TableCell className="py-3 px-3 min-w-0 text-gray-600 dark:text-gray-400 text-sm">
                              <span className="block truncate" title={contact.company || undefined}>{contact.company || '-'}</span>
                            </TableCell>
                            <TableCell className="py-3 px-3 min-w-0 text-gray-600 dark:text-gray-400 text-sm">
                              <span className="block truncate" title={contact.assignedTo?.name || contact.assignedTo?.user?.name || undefined}>
                                {contact.assignedTo?.name || contact.assignedTo?.user?.name || '-'}
                              </span>
                            </TableCell>
                            <TableCell className="py-3 px-3 text-gray-600 dark:text-gray-400 whitespace-nowrap text-sm">
                              {contact.createdAt ? format(new Date(contact.createdAt), 'MMM d, yyyy') : '-'}
                            </TableCell>
                            <TableCell className="py-3 pl-3 pr-4">
                              <div className="flex items-center gap-2">
                                <StagePromotionButton
                                  contactId={contact.id}
                                  currentStage={contactStage as 'prospect' | 'contact' | 'customer'}
                                  onPromoted={() => {
                                    // Refresh the page to show updated stage
                                    window.location.reload()
                                  }}
                                />
                                <Link href={`/crm/${tenantId}/Contacts/${contact.id}`}>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </Link>
                                {(contactStage === 'prospect' || contact.type === 'lead') && (
                                  <RowActionsMenu
                                    entityType="prospect"
                                    entityId={contact.id}
                                    tenantId={tenantId}
                                    onAssign={() => {
                                      setContactToAssign({
                                        id: contact.id,
                                        name: contact.name,
                                        currentRep: contact.assignedTo
                                          ? {
                                              id: contact.assignedTo.id,
                                              name: contact.assignedTo.name || contact.assignedTo.user?.name || 'Unknown',
                                            }
                                          : null,
                                      })
                                    }}
                                  />
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} contacts
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Page {page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                      disabled={page === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {contactToAssign && (
        <LeadAllocationDialog
          contactId={contactToAssign.id}
          contactName={contactToAssign.name}
          tenantId={tenantId}
          currentRep={contactToAssign.currentRep || null}
          onAssign={({ repId, repName, repEmail }) => {
            queryClient.setQueriesData(
              { queryKey: ['contacts'] },
              (previous: any) => {
                if (!previous || !Array.isArray(previous.contacts)) return previous
                return {
                  ...previous,
                  contacts: previous.contacts.map((row: any) =>
                    row.id === contactToAssign.id
                      ? {
                          ...row,
                          assignedTo: {
                            id: repId,
                            name: repName,
                            user: { name: repName, email: repEmail || '' },
                          },
                        }
                      : row
                  ),
                }
              }
            )
            queryClient.invalidateQueries({ queryKey: ['contacts'] })
            toast.success('Owner updated', `${contactToAssign.name} is now assigned to ${repName}.`)
            setContactToAssign(null)
          }}
          onClose={() => setContactToAssign(null)}
        />
      )}
      {PageToastContainer}
    </div>
  )
}

