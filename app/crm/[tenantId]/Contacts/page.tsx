'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useContacts, useDeleteContact } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { LeadScoringBadge } from '@/components/LeadScoringBadge'
import { 
  Search, 
  Plus, 
  Bell, 
  HelpCircle, 
  Settings, 
  ChevronDown,
  Download,
  Upload,
  Trash2,
  Edit,
  Users,
  Tag,
  Mail,
  FileText,
  CheckCircle,
  Copy,
  Filter,
  MoreVertical,
  Phone,
  Calendar,
  FileIcon,
  ArrowUpDown,
  X,
  MessageSquare,
  Mic,
  Phone as PhoneIcon,
  Sparkles,
  LogOut,
  ChevronDown as ChevronDownIcon,
  Settings as SettingsIcon
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
// ModuleTopBar is now in layout.tsx
import { useRouter } from 'next/navigation'
import { AIChatModal } from '@/components/AIChatModal'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { StagePromotionButton } from '@/components/crm/StagePromotionButton'
import { StageBadge } from '@/components/crm/StageBadge'
import { PageLoading } from '@/components/ui/loading'
import { Badge } from '@/components/ui/badge'

export default function CRMContactsPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const { user, logout } = useAuthStore()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(100)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false)
  const [createMenuOpen, setCreateMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [filterByOpen, setFilterByOpen] = useState(true)
  const [systemFiltersOpen, setSystemFiltersOpen] = useState(true)
  const [fieldFiltersOpen, setFieldFiltersOpen] = useState(true)
  const [chatModalOpen, setChatModalOpen] = useState(false)
  const [massTransferModalOpen, setMassTransferModalOpen] = useState(false)
  const [transferUserId, setTransferUserId] = useState<string>('')
  const [users, setUsers] = useState<any[]>([])
  const [isTransferring, setIsTransferring] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [systemFilters, setSystemFilters] = useState<Record<string, boolean>>({
    touched: false,
    untouched: false,
    recordAction: false,
    relatedAction: false,
    scoring: false,
    locked: false,
    emailStatus: false,
    activities: false,
    campaigns: false,
    cadences: false,
  })
  const actionsMenuRef = useRef<HTMLDivElement>(null)
  const createMenuRef = useRef<HTMLDivElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  const { data, isLoading, error } = useContacts({ page, limit, search, type: typeFilter || undefined })
  
  // Apply filters to contacts
  const contacts = data?.contacts || []
  const filteredContacts = contacts.filter((contact: any) => {
    // Apply system filters
    if (systemFilters.touched && !contact.lastActivityDate) return false
    if (systemFilters.untouched && contact.lastActivityDate) return false
    if (systemFilters.locked && !contact.locked) return false
    if (systemFilters.emailStatus && !contact.email) return false
    if (systemFilters.activities && !contact.activitiesCount) return false
    if (systemFilters.campaigns && !contact.campaignsCount) return false
    return true
  })
  const deleteContact = useDeleteContact()
  const authStore = useAuthStore()

  // Fetch users for mass transfer
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = authStore.token
        if (!token) return

        const response = await fetch('/api/crm/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setUsers(data.users || [])
        }
      } catch (error) {
        console.error('Error fetching users:', error)
      }
    }

    fetchUsers()
  }, [authStore.token])

  // Keyboard shortcut for chat (Ctrl+Space)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault()
        setChatModalOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  // Close menus when clicking outside (profile menu handled by ModuleTopBar)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setActionsMenuOpen(false)
      }
      if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
        setCreateMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Logout handled by ModuleTopBar in layout
  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const getUserInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return 'U'
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      try {
        await deleteContact.mutateAsync(id)
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to delete contact')
      }
    }
  }

  const handleMassTransfer = async () => {
    if (!transferUserId || selectedContacts.length === 0) {
      alert('Please select contacts and a user to transfer to')
      return
    }

    setIsTransferring(true)
    try {
      const token = authStore.token
      if (!token) {
        alert('Please log in to perform this action')
        return
      }

      const response = await fetch('/api/crm/contacts/mass-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contactIds: selectedContacts,
          assignToUserId: transferUserId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to transfer contacts')
      }

      const result = await response.json()
      alert(result.message || `Successfully transferred ${result.transferred} contact(s)`)
      setMassTransferModalOpen(false)
      setSelectedContacts([])
      setTransferUserId('')
      // Refresh the page or refetch data
      window.location.reload()
    } catch (error) {
      console.error('Mass transfer error:', error)
      alert(error instanceof Error ? error.message : 'Failed to transfer contacts')
    } finally {
      setIsTransferring(false)
    }
  }

  const handleExportContacts = async (format: 'csv' | 'excel' = 'excel') => {
    if (isExporting) return

    setIsExporting(true)
    try {
      const token = authStore.token
      if (!token) {
        alert('Please log in to export contacts')
        return
      }

      const params = new URLSearchParams({
        format,
        type: typeFilter || 'all',
        search: search || '',
      })

      const response = await fetch(`/api/crm/contacts/export?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to export contacts')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `contacts_export_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      alert(`Contacts exported successfully as ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Export error:', error)
      alert(error instanceof Error ? error.message : 'Failed to export contacts')
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return <PageLoading message="Loading contacts..." fullScreen={false} />
  }

  if (error) {
    return <div className="flex items-center justify-center h-64 text-red-600">Error loading contacts</div>
  }

  const pagination = data?.pagination
  const totalRecords = pagination?.total || filteredContacts.length

  // Get status color
  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'Not Interested': 'bg-red-100 text-red-800',
      'Sold & Closed': 'bg-green-100 text-green-800',
      'Yet to contact': 'bg-purple-100 text-purple-800',
      'Decline': 'bg-red-100 text-red-800',
      'Partial Documents Shared by Client': 'bg-blue-100 text-blue-800',
      'Go-Live Integration Done': 'bg-green-100 text-green-800',
      'Close (Won)': 'bg-green-100 text-green-800',
      'Proposal Sent': 'bg-orange-100 text-orange-800',
      'Verification in Process': 'bg-yellow-100 text-yellow-800',
      'Call Not Answering': 'bg-red-100 text-red-800',
    }
    return statusColors[status] || 'bg-gray-100 text-gray-800'
  }

  // Get icon for contact (calendar for dates, file for documents)
  const getContactIcon = (contact: any) => {
    if (contact.lastContactedAt || contact.nextFollowUp) {
      return <Calendar className="w-4 h-4 text-blue-600" />
    }
    return <FileIcon className="w-4 h-4 text-gray-600" />
  }

  // Get date for icon
  const getContactDate = (contact: any) => {
    if (contact.nextFollowUp) {
      return format(new Date(contact.nextFollowUp), 'MMM d, yyyy')
    }
    if (contact.lastContactedAt) {
      return format(new Date(contact.lastContactedAt), 'MMM d, yyyy')
    }
    if (contact.createdAt) {
      return format(new Date(contact.createdAt), 'MMM d, yyyy')
    }
    return null
  }

  return (
    <div className="w-full bg-gray-50 relative" style={{ zIndex: 1 }}>
      {/* ModuleTopBar is now in layout.tsx */}

            {/* Create Contact Dropdown */}
            <div className="relative" ref={createMenuRef}>
              <button
                onClick={() => setCreateMenuOpen(!createMenuOpen)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                Create Contact
                <ChevronDown className="w-4 h-4" />
              </button>
              {createMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <Link href={`/crm/${tenantId}/Contacts/new`} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                      <Plus className="w-4 h-4 mr-3 inline" />
                      New Contact
                    </Link>
                    <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left">
                      <Upload className="w-4 h-4 mr-3" />
                      Import Contacts
                    </button>
                    <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left">
                      <FileText className="w-4 h-4 mr-3" />
                      Import Notes
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Actions Dropdown */}
            <div className="relative" ref={actionsMenuRef}>
              <button
                onClick={() => setActionsMenuOpen(!actionsMenuOpen)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                Actions
                <ChevronDown className="w-4 h-4" />
              </button>
              {actionsMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 max-h-96 overflow-y-auto">
                  <div className="py-1">
                    <button 
                      onClick={() => {
                        if (selectedContacts.length === 0) {
                          alert('Please select at least one contact to transfer')
                          return
                        }
                        setMassTransferModalOpen(true)
                        setActionsMenuOpen(false)
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                    >
                      <Users className="w-4 h-4 mr-3" />
                      Mass Transfer
                    </button>
                    <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left">
                      <Trash2 className="w-4 h-4 mr-3" />
                      Mass Delete
                    </button>
                    <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left">
                      <Edit className="w-4 h-4 mr-3" />
                      Mass Update
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left">
                      <Tag className="w-4 h-4 mr-3" />
                      Manage Tags
                    </button>
                    <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left">
                      <Users className="w-4 h-4 mr-3" />
                      Assignment Rules
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left">
                      <Mail className="w-4 h-4 mr-3" />
                      Mass Email
                    </button>
                    <button 
                      onClick={() => {
                        handleExportContacts('excel')
                        setActionsMenuOpen(false)
                      }}
                      disabled={isExporting}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left disabled:opacity-50"
                    >
                      <Download className="w-4 h-4 mr-3" />
                      {isExporting ? 'Exporting...' : 'Export Contacts'}
                    </button>
                    <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left">
                      <FileText className="w-4 h-4 mr-3" />
                      Print View
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                  {getUserInitials()}
                </div>
                <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        router.push('/dashboard/settings')
                        setProfileMenuOpen(false)
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                    >
                      <SettingsIcon className="w-4 h-4 mr-3" />
                      Profile Settings
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">All Contacts</h1>
        <div className="flex items-center gap-4">
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            <option value={25}>25 Records Per Page</option>
            <option value={50}>50 Records Per Page</option>
            <option value={100}>100 Records Per Page</option>
            <option value={200}>200 Records Per Page</option>
          </select>
          {pagination && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>
                {((page - 1) * limit) + 1} - {Math.min(page * limit, totalRecords)}
              </span>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &lt;
              </button>
              <button
                onClick={() => setPage(p => Math.min(Math.ceil(totalRecords / limit), p + 1))}
                disabled={page >= Math.ceil(totalRecords / limit)}
                className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex">
        {/* Left Sidebar - Filters */}
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700">Total Records: {totalRecords.toLocaleString()}</p>
          </div>

          {/* Filter Contacts by */}
          <div className="mb-6">
            <button
              onClick={() => setFilterByOpen(!filterByOpen)}
              className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 mb-2"
            >
              <span>Filter Contacts by</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${filterByOpen ? 'rotate-180' : ''}`} />
            </button>
            {filterByOpen && (
              <div className="space-y-3">
                <Input
                  placeholder="Q Search..."
                  className="h-8 text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* System Defined Filters */}
          <div className="mb-6">
            <button
              onClick={() => setSystemFiltersOpen(!systemFiltersOpen)}
              className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 mb-2"
            >
              <span>System Defined Filters</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${systemFiltersOpen ? 'rotate-180' : ''}`} />
            </button>
            {systemFiltersOpen && (
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                  <Checkbox 
                    id="touched" 
                    checked={systemFilters.touched}
                    onCheckedChange={(checked) => {
                      setSystemFilters(prev => ({ ...prev, touched: checked === true }))
                    }}
                  />
                  <span>Touched Records</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                  <Checkbox 
                    id="untouched" 
                    checked={systemFilters.untouched}
                    onCheckedChange={(checked) => {
                      setSystemFilters(prev => ({ ...prev, untouched: checked === true }))
                    }}
                  />
                  <span>Untouched Records</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                  <Checkbox 
                    id="record-action" 
                    checked={systemFilters.recordAction}
                    onCheckedChange={(checked) => {
                      setSystemFilters(prev => ({ ...prev, recordAction: checked === true }))
                    }}
                  />
                  <span>Record Action</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                  <Checkbox 
                    id="related-action" 
                    checked={systemFilters.relatedAction}
                    onCheckedChange={(checked) => {
                      setSystemFilters(prev => ({ ...prev, relatedAction: checked === true }))
                    }}
                  />
                  <span>Related Records Action</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                  <Checkbox 
                    id="scoring" 
                    checked={systemFilters.scoring}
                    onCheckedChange={(checked) => {
                      setSystemFilters(prev => ({ ...prev, scoring: checked === true }))
                    }}
                  />
                  <span>Scoring Rules</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                  <Checkbox 
                    id="locked" 
                    checked={systemFilters.locked}
                    onCheckedChange={(checked) => {
                      setSystemFilters(prev => ({ ...prev, locked: checked === true }))
                    }}
                  />
                  <span>Locked</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                  <Checkbox 
                    id="email-status" 
                    checked={systemFilters.emailStatus}
                    onCheckedChange={(checked) => {
                      setSystemFilters(prev => ({ ...prev, emailStatus: checked === true }))
                    }}
                  />
                  <span>Latest Email Status</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                  <Checkbox 
                    id="activities" 
                    checked={systemFilters.activities}
                    onCheckedChange={(checked) => {
                      setSystemFilters(prev => ({ ...prev, activities: checked === true }))
                    }}
                  />
                  <span>Activities</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                  <Checkbox 
                    id="campaigns" 
                    checked={systemFilters.campaigns}
                    onCheckedChange={(checked) => {
                      setSystemFilters(prev => ({ ...prev, campaigns: checked === true }))
                    }}
                  />
                  <span>Campaigns</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                  <Checkbox 
                    id="cadences" 
                    checked={systemFilters.cadences}
                    onCheckedChange={(checked) => {
                      setSystemFilters(prev => ({ ...prev, cadences: checked === true }))
                    }}
                  />
                  <span>Cadences</span>
                </label>
              </div>
            )}
          </div>

          {/* Filter By Fields */}
          <div>
            <button
              onClick={() => setFieldFiltersOpen(!fieldFiltersOpen)}
              className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 mb-2"
            >
              <span>Filter By Fields</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${fieldFiltersOpen ? 'rotate-180' : ''}`} />
            </button>
            {fieldFiltersOpen && (
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                  <Checkbox id="followup1" />
                  <span>1st Follow up</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                  <Checkbox id="followup2" />
                  <span>2nd Follow up</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
                  <Checkbox id="followup3" />
                  <span>3rd Follow up</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          {/* Contacts Table */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-0">
              {filteredContacts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">No contacts found</p>
                  <Link href={`/crm/${tenantId}/Contacts/new`}>
                    <Button>Create Your First Contact</Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedContacts(filteredContacts.map((c: any) => c.id))
                              } else {
                                setSelectedContacts([])
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead className="w-16"></TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            Lead Status
                            <ArrowUpDown className="w-3 h-3 text-gray-400" />
                            <Filter className="w-3 h-3 text-gray-400" />
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            <select className="text-xs border-0 bg-transparent font-semibold">
                              <option>All</option>
                              <option>Customers</option>
                              <option>Leads</option>
                            </select>
                            Contact Name
                            <ArrowUpDown className="w-3 h-3 text-gray-400" />
                            <Filter className="w-3 h-3 text-gray-400" />
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            Account Name
                            <ArrowUpDown className="w-3 h-3 text-gray-400" />
                            <Filter className="w-3 h-3 text-gray-400" />
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            Email
                            <ArrowUpDown className="w-3 h-3 text-gray-400" />
                            <Filter className="w-3 h-3 text-gray-400" />
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            Phone
                            <ArrowUpDown className="w-3 h-3 text-gray-400" />
                            <Filter className="w-3 h-3 text-gray-400" />
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            Contact Owner
                            <ArrowUpDown className="w-3 h-3 text-gray-400" />
                            <Filter className="w-3 h-3 text-gray-400" />
                          </div>
                        </TableHead>
                        <TableHead>
                          <ArrowUpDown className="w-3 h-3 text-gray-400" />
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContacts.map((contact: any) => {
                        const isSelected = selectedContacts.includes(contact.id)
                        const contactDate = getContactDate(contact)
                        const status = contact.status || 'Active'

                        return (
                          <TableRow key={contact.id} className={isSelected ? 'bg-blue-50' : ''}>
                            <TableCell>
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
                            <TableCell>
                              {contactDate && (
                                <div className="flex flex-col items-center">
                                  {getContactIcon(contact)}
                                  <span className="text-xs text-gray-500 mt-1">{contactDate}</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                                {status}
                              </span>
                            </TableCell>
                            <TableCell>
                              <StageBadge 
                                stage={contact.stage || (contact.type === 'lead' ? 'prospect' : contact.type === 'customer' ? 'customer' : 'contact')} 
                              />
                            </TableCell>
                            <TableCell>
                              <Link href={`/crm/${tenantId}/Contacts/${contact.id}`} className="font-medium text-blue-600 hover:underline">
                                {contact.name}
                              </Link>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {contact.company || '-'}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {contact.email || '-'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {contact.phone ? (
                                <div className="flex items-center gap-1">
                                  <Phone className="w-4 h-4 text-green-600" />
                                  <span>{contact.phone}</span>
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {contact.assignedTo?.name || contact.assignedToId || '-'}
                            </TableCell>
                            <TableCell>
                              <button className="p-1 hover:bg-gray-100 rounded">
                                <MoreVertical className="w-4 h-4 text-gray-600" />
                              </button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Bar - Smart Chat */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Here is your Smart Chat (Ctrl+Space)</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setChatModalOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
            title="Chat"
          >
            <MessageSquare className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Microphone">
            <Mic className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Phone">
            <PhoneIcon className="w-5 h-5 text-gray-600" />
          </button>
          <button 
            onClick={() => setChatModalOpen(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2" 
            title="AI Assistant"
          >
            <Sparkles className="w-4 h-4" />
            AI
          </button>
        </div>
      </div>

      {/* AI Chat Modal */}
      <AIChatModal
        isOpen={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        context={{
          module: 'crm',
          entityType: 'contacts',
        }}
      />

      {/* Mass Transfer Modal */}
      <Dialog open={massTransferModalOpen} onOpenChange={setMassTransferModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mass Transfer Contacts</DialogTitle>
            <DialogDescription>
              Transfer {selectedContacts.length} selected contact(s) to another user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="user-select">Transfer to User</Label>
              <select
                id="user-select"
                value={transferUserId}
                onChange={(e) => setTransferUserId(e.target.value)}
                className="mt-2 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <option value="">Select a user</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email} {u.role && `(${u.role})`}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setMassTransferModalOpen(false)
                  setTransferUserId('')
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleMassTransfer}
                disabled={!transferUserId || isTransferring}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isTransferring ? 'Transferring...' : 'Transfer Contacts'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
