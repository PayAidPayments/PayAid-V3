'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useContacts } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { format as formatDate } from 'date-fns'
import { LeadScoringBadge } from '@/components/LeadScoringBadge'
import { StageBadge } from '@/components/crm/StageBadge'
import { 
  Search, 
  Plus, 
  Bell, 
  HelpCircle, 
  Settings,
  Settings as SettingsIcon,
  ChevronDown,
  ChevronDown as ChevronDownIcon,
  Download,
  Upload,
  Trash2,
  Edit,
  Users,
  User,
  Tag,
  Mail,
  FileText,
  FileText as FileTextIcon,
  CheckCircle,
  Copy,
  Filter,
  MoreVertical,
  Facebook,
  Linkedin,
  Printer,
  Table as TableIcon,
  LogOut,
  X,
  Zap
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
// ModuleTopBar is now in layout.tsx
import { useRouter } from 'next/navigation'
import { PageLoading } from '@/components/ui/loading'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { EntityPageLayout } from '@/components/crm/layout/EntityPageLayout'
import { KPIBar } from '@/components/crm/layout/KPIBar'
import { EntityAIPanel } from '@/components/crm/layout/EntityAIPanel'
import { RowActionsMenu } from '@/components/crm/RowActionsMenu'
import { BulkActionsBar } from '@/components/crm/BulkActionsBar'

export default function CRMLeadsPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const { user, logout } = useAuthStore()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(100)
  const [search, setSearch] = useState('')
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false)
  const [createMenuOpen, setCreateMenuOpen] = useState(false)
  // Profile menu handled by ModuleTopBar in layout
  const [savedFiltersOpen, setSavedFiltersOpen] = useState(true)
  const [filterByOpen, setFilterByOpen] = useState(true)
  const [savedFilters, setSavedFilters] = useState<any[]>([])
  const [loadingFilters, setLoadingFilters] = useState(false)
  const [currentFilter, setCurrentFilter] = useState<any>(null) // Currently applied filter
  const [showSaveFilterModal, setShowSaveFilterModal] = useState(false)
  const [filterName, setFilterName] = useState('')
  const [activeFilters, setActiveFilters] = useState<any>({}) // Current filter criteria
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [leadToConvert, setLeadToConvert] = useState<any>(null)
  const [showMassConvertModal, setShowMassConvertModal] = useState(false)
  const [isMassConverting, setIsMassConverting] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [massTransferModalOpen, setMassTransferModalOpen] = useState(false)
  const [transferUserId, setTransferUserId] = useState<string>('')
  const [isTransferring, setIsTransferring] = useState(false)
  const [massUpdateModalOpen, setMassUpdateModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isEnriching, setIsEnriching] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'sheet'>('table')
  const [massUpdateData, setMassUpdateData] = useState({
    status: '',
    source: '',
    assignedToId: '',
    stage: '',
  })
  const [importProspectsModalOpen, setImportProspectsModalOpen] = useState(false)
  const [importNotesModalOpen, setImportNotesModalOpen] = useState(false)
  const [facebookSyncModalOpen, setFacebookSyncModalOpen] = useState(false)
  const [linkedinSyncModalOpen, setLinkedinSyncModalOpen] = useState(false)
  const [fieldFilters, setFieldFilters] = useState<Record<string, boolean>>({
    notes: false,
    products: false,
    purchaseOrders: false,
    quotes: false,
    salesOrders: false,
    solutions: false,
    tasks: false,
    vendors: false,
    hasEmail: false,
    hasPhone: false,
    hasCompany: false,
  })
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [sourceFilter, setSourceFilter] = useState<string>('')
  const [assignedToFilter, setAssignedToFilter] = useState<string>('')
  const [leadScoreMin, setLeadScoreMin] = useState<string>('')
  const [leadScoreMax, setLeadScoreMax] = useState<string>('')
  const [conversionData, setConversionData] = useState({
    createAccount: true,
    accountName: '',
    accountOwnerId: '',
    notifyAccountOwner: false,
    createContact: true,
    contactName: '',
    contactOwnerId: '',
    notifyContactOwner: false,
    createDeal: false,
    dealName: '',
    dealValue: '',
    dealOwnerId: '',
  })
  const [isConverting, setIsConverting] = useState(false)
  const actionsMenuRef = useRef<HTMLDivElement>(null)
  const createMenuRef = useRef<HTMLDivElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  // Use stage='prospect' instead of type='lead' for simplified flow
  const { data, isLoading } = useContacts({ page, limit, search, stage: 'prospect' })
  
  // Apply filters to leads
  const leads = data?.contacts || []
  const totalRecords = data?.pagination?.total || leads.length
  const pagination = data?.pagination
  const filteredLeads = leads.filter((lead: any) => {
    // Apply field filters
    if (fieldFilters.notes && !lead.notes && !lead.notesCount) return false
    if (fieldFilters.tasks && !lead.tasksCount) return false
    if (fieldFilters.hasEmail && !lead.email) return false
    if (fieldFilters.hasPhone && !lead.phone) return false
    if (fieldFilters.hasCompany && !lead.company) return false
    
    // Apply status filter
    if (statusFilter && lead.status !== statusFilter) return false
    
    // Apply source filter
    if (sourceFilter && lead.source !== sourceFilter) return false
    
    // Apply assigned to filter
    if (assignedToFilter) {
      if (assignedToFilter === 'unassigned' && lead.assignedToId) return false
      if (assignedToFilter !== 'unassigned' && lead.assignedToId !== assignedToFilter) return false
    }
    
    // Apply lead score range filter
    const leadScore = lead.leadScore || 0
    if (leadScoreMin && leadScore < parseFloat(leadScoreMin)) return false
    if (leadScoreMax && leadScore > parseFloat(leadScoreMax)) return false
    
    return true
  })

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

  // Fetch saved filters
  useEffect(() => {
    const fetchSavedFilters = async () => {
      try {
        setLoadingFilters(true)
        const token = useAuthStore.getState().token
        if (!token) return

        const response = await fetch(`/api/crm/saved-filters?entityType=lead`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setSavedFilters(data)
        }
      } catch (error) {
        console.error('Error fetching saved filters:', error)
      } finally {
        setLoadingFilters(false)
      }
    }

    fetchSavedFilters()
  }, [tenantId])

  // Fetch users for owner assignment
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = useAuthStore.getState().token
        if (!token) return

        const response = await fetch(`/api/crm/users`, {
          headers: {
            'Authorization': `Bearer ${token}`,
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
  }, [tenantId])

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

  // Get unique lead sources for filter
  const leadSources = Array.from(new Set(filteredLeads.map((lead: any) => lead.source).filter(Boolean))) as string[]
  const leadStatuses = Array.from(new Set(filteredLeads.map((lead: any) => lead.status || 'Active').filter(Boolean))) as string[]

  // Calculate KPI stats
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const newThisMonth = filteredLeads.filter((lead: any) => {
    if (!lead.createdAt) return false
    const created = new Date(lead.createdAt)
    return created >= monthStart
  }).length

  const activeProspects = filteredLeads.filter((lead: any) => lead.status !== 'Not Interested' && lead.status !== 'Lost').length
  const conversionRate = filteredLeads.length > 0 
    ? ((filteredLeads.filter((l: any) => l.stage === 'customer' || l.type === 'customer').length / filteredLeads.length) * 100).toFixed(1)
    : '0.0'

  if (isLoading) {
    return <PageLoading message="Loading leads..." fullScreen={false} />
  }

  // Open convert modal for a lead
  const openConvertModal = (lead: any) => {
    setLeadToConvert(lead)
    setConversionData({
      createAccount: true,
      accountName: lead.company || lead.name || '',
      accountOwnerId: lead.assignedToId || '',
      notifyAccountOwner: false,
      createContact: true,
      contactName: lead.name || '',
      contactOwnerId: lead.assignedToId || '',
      notifyContactOwner: false,
      createDeal: false,
      dealName: `Deal for ${lead.name || lead.company || 'Lead'}`,
      dealValue: '',
      dealOwnerId: lead.assignedToId || '',
    })
    setShowConvertModal(true)
  }

  // Mass convert leads
  const handleMassConvert = async () => {
    if (selectedLeads.length === 0) {
      alert('Please select at least one prospect to convert')
      return
    }

    // Initialize conversion data with defaults
    setConversionData({
      createAccount: true,
      accountName: '',
      accountOwnerId: '',
      notifyAccountOwner: false,
      createContact: true,
      contactName: '',
      contactOwnerId: '',
      notifyContactOwner: false,
      createDeal: false,
      dealName: 'Deal for {prospect_name}',
      dealValue: '',
      dealOwnerId: '',
    })

    setShowMassConvertModal(true)
  }

  // Execute mass convert
  const executeMassConvert = async () => {
    if (selectedLeads.length === 0) return

    try {
      setIsMassConverting(true)
      const token = useAuthStore.getState().token
      if (!token) {
        alert('Please log in to convert prospects')
        return
      }

      let successCount = 0
      let failCount = 0
      const errors: string[] = []

      // Convert each lead sequentially to avoid overwhelming the server
      for (const leadId of selectedLeads) {
        try {
          const lead = filteredLeads.find((l: any) => l.id === leadId)
          if (!lead) continue

          const response = await fetch('/api/crm/leads/convert', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              leadId: lead.id,
              createAccount: conversionData.createAccount,
              accountName: lead.company || lead.name || '',
              accountOwnerId: conversionData.accountOwnerId || lead.assignedToId || '',
              notifyAccountOwner: conversionData.notifyAccountOwner,
              createContact: conversionData.createContact,
              contactName: lead.name || '',
              contactOwnerId: conversionData.contactOwnerId || lead.assignedToId || '',
              notifyContactOwner: conversionData.notifyContactOwner,
              createDeal: conversionData.createDeal,
              dealName: conversionData.createDeal 
                ? (conversionData.dealName || 'Deal for {prospect_name}')
                    .replace('{prospect_name}', lead.name || 'Prospect')
                    .replace('{company_name}', lead.company || lead.name || 'Company')
                : undefined,
              dealValue: conversionData.dealValue ? parseFloat(conversionData.dealValue) : undefined,
              dealOwnerId: conversionData.dealOwnerId || lead.assignedToId || '',
            }),
          })

          if (response.ok) {
            successCount++
          } else {
            failCount++
            const error = await response.json().catch(() => ({}))
            errors.push(`${lead.name || leadId}: ${error.error || 'Failed to convert'}`)
          }
        } catch (error) {
          failCount++
          const lead = filteredLeads.find((l: any) => l.id === leadId)
          errors.push(`${lead?.name || leadId}: ${error instanceof Error ? error.message : 'Failed to convert'}`)
        }

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      setShowMassConvertModal(false)
      setSelectedLeads([])

      if (failCount === 0) {
        alert(`Successfully converted ${successCount} prospect(s)!`)
      } else {
        alert(`Converted ${successCount} prospect(s), ${failCount} failed.\n\nErrors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n...and ${errors.length - 5} more` : ''}`)
      }

      // Refresh the page
      window.location.reload()
    } catch (error) {
      console.error('Error in mass convert:', error)
      alert('Failed to convert prospects. Please try again.')
    } finally {
      setIsMassConverting(false)
    }
  }

  // Convert lead
  const handleConvertLead = async () => {
    if (!leadToConvert) return

    try {
      setIsConverting(true)
      const token = useAuthStore.getState().token
      if (!token) {
        alert('Please log in to convert leads')
        return
      }

      const response = await fetch('/api/crm/leads/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          leadId: leadToConvert.id,
          ...conversionData,
          dealValue: conversionData.dealValue ? parseFloat(conversionData.dealValue) : undefined,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Lead converted successfully! Created: ${[
          result.created.account ? 'Account' : null,
          result.created.contact ? 'Contact' : null,
          result.created.deal ? 'Deal' : null,
        ].filter(Boolean).join(', ')}`)
        setShowConvertModal(false)
        setLeadToConvert(null)
        // Refresh the leads list
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to convert lead')
      }
    } catch (error) {
      console.error('Error converting lead:', error)
      alert('Failed to convert lead')
    } finally {
      setIsConverting(false)
    }
  }

  // Handle mass transfer
  const handleMassTransfer = async () => {
    if (!transferUserId || selectedLeads.length === 0) {
      alert('Please select leads and a user to transfer to')
      return
    }

    setIsTransferring(true)
    try {
      const token = useAuthStore.getState().token
      if (!token) {
        alert('Please log in to perform this action')
        return
      }

      const response = await fetch('/api/crm/leads/mass-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          leadIds: selectedLeads,
          assignToUserId: transferUserId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to transfer leads')
      }

      const result = await response.json()
      alert(result.message || `Successfully transferred ${result.transferred} lead(s)`)
      setMassTransferModalOpen(false)
      setSelectedLeads([])
      setTransferUserId('')
      // Refresh the page or refetch data
      window.location.reload()
    } catch (error) {
      console.error('Mass transfer error:', error)
      alert(error instanceof Error ? error.message : 'Failed to transfer leads')
    } finally {
      setIsTransferring(false)
    }
  }

  // Handle mass delete
  const handleMassDelete = async () => {
    if (selectedLeads.length === 0) {
      alert('Please select at least one lead to delete')
      return
    }

    if (!confirm(`Are you sure you want to delete ${selectedLeads.length} lead(s)? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const token = useAuthStore.getState().token
      if (!token) {
        alert('Please log in to perform this action')
        return
      }

      const response = await fetch('/api/crm/leads/mass-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          leadIds: selectedLeads,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete leads')
      }

      const result = await response.json()
      alert(result.message || `Successfully deleted ${result.deleted} lead(s)`)
      setSelectedLeads([])
      setActionsMenuOpen(false)
      window.location.reload()
    } catch (error) {
      console.error('Mass delete error:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete leads')
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle mass update
  const handleMassUpdate = async () => {
    if (!massUpdateData.status && !massUpdateData.source && !massUpdateData.assignedToId && !massUpdateData.stage) {
      alert('Please select at least one field to update')
      return
    }

    setIsUpdating(true)
    try {
      const token = useAuthStore.getState().token
      if (!token) {
        alert('Please log in to perform this action')
        return
      }

      const updates: any = {}
      if (massUpdateData.status) updates.status = massUpdateData.status
      if (massUpdateData.source) updates.source = massUpdateData.source
      if (massUpdateData.assignedToId) updates.assignedToId = massUpdateData.assignedToId
      if (massUpdateData.stage) updates.stage = massUpdateData.stage

      const response = await fetch('/api/crm/leads/mass-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          leadIds: selectedLeads,
          updates,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update leads')
      }

      const result = await response.json()
      alert(result.message || `Successfully updated ${result.updated} lead(s)`)
      setMassUpdateModalOpen(false)
      setSelectedLeads([])
      setMassUpdateData({ status: '', source: '', assignedToId: '', stage: '' })
      setActionsMenuOpen(false)
      window.location.reload()
    } catch (error) {
      console.error('Mass update error:', error)
      alert(error instanceof Error ? error.message : 'Failed to update leads')
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle export leads
  const handleExportLeads = async (format: 'csv' | 'excel' = 'csv') => {
    if (isExporting) return

    setIsExporting(true)
    try {
      const token = useAuthStore.getState().token
      if (!token) {
        alert('Please log in to export leads')
        return
      }

      // Get all leads (or filtered leads)
      const leadsToExport = filteredLeads.length > 0 ? filteredLeads : leads

      if (format === 'csv') {
        // Generate CSV
        const headers = ['Name', 'Email', 'Phone', 'Company', 'Source', 'Status', 'Stage', 'Lead Score', 'Assigned To', 'Created At']
        const rows = leadsToExport.map((lead: any) => [
          lead.name || '',
          lead.email || '',
          lead.phone || '',
          lead.company || '',
          lead.source || '',
          lead.status || '',
          lead.stage || '',
          lead.leadScore?.toString() || '0',
          lead.assignedTo?.name || lead.assignedTo?.email || '',
          lead.createdAt ? formatDate(new Date(lead.createdAt), 'yyyy-MM-dd HH:mm:ss') : '',
        ])

        const csvContent = [
          headers.join(','),
          ...rows.map((row: any[]) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      setActionsMenuOpen(false)
      alert(`Successfully exported ${leadsToExport.length} lead(s) as ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export leads')
    } finally {
      setIsExporting(false)
    }
  }

  // Handle print view
  const handlePrintView = () => {
    window.print()
    setActionsMenuOpen(false)
  }

  // Handle lead enrichment
  const handleEnrichLeads = async () => {
    if (selectedLeads.length === 0) {
      alert('Please select at least one lead to enrich')
      return
    }

    setIsEnriching(true)
    try {
      const token = useAuthStore.getState().token
      if (!token) {
        alert('Please log in to perform this action')
        return
      }

      const response = await fetch('/api/crm/leads/enrich', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          leadIds: selectedLeads,
          provider: 'clearbit', // Default to Clearbit
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to enrich leads')
      }

      const result = await response.json()
      alert(result.message || `Successfully enriched ${result.enriched} lead(s)`)
      if (result.note) {
        console.info('Enrichment note:', result.note)
      }
      setSelectedLeads([])
      setActionsMenuOpen(false)
      window.location.reload()
    } catch (error) {
      console.error('Lead enrichment error:', error)
      alert(error instanceof Error ? error.message : 'Failed to enrich leads')
    } finally {
      setIsEnriching(false)
    }
  }

  // Apply a saved filter
  const applySavedFilter = async (filter: any) => {
    try {
      setCurrentFilter(filter)
      const filterCriteria = filter.filters as any
      
      // Apply filter criteria to active filters
      setActiveFilters(filterCriteria)
      
      // Update search and other filter states based on criteria
      if (filterCriteria.search) {
        setSearch(filterCriteria.search)
      }
      if (filterCriteria.status) {
        setStatusFilter(filterCriteria.status)
      }
      if (filterCriteria.source) {
        setSourceFilter(filterCriteria.source)
      }
      if (filterCriteria.assignedTo) {
        setAssignedToFilter(filterCriteria.assignedTo)
      }
      if (filterCriteria.leadScoreMin !== undefined) {
        setLeadScoreMin(filterCriteria.leadScoreMin.toString())
      }
      if (filterCriteria.leadScoreMax !== undefined) {
        setLeadScoreMax(filterCriteria.leadScoreMax.toString())
      }
      if (filterCriteria.fieldFilters) {
        setFieldFilters(filterCriteria.fieldFilters)
      }
    } catch (error) {
      console.error('Error applying filter:', error)
    }
  }

  // Save current filter
  const saveCurrentFilter = async () => {
    try {
      const token = useAuthStore.getState().token
      if (!token || !filterName.trim()) return

      const filterCriteria = {
        ...activeFilters,
        search: search || undefined,
      }

      const response = await fetch('/api/crm/saved-filters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: filterName,
          entityType: 'lead',
          filters: filterCriteria,
        }),
      })

      if (response.ok) {
        const newFilter = await response.json()
        setSavedFilters([...savedFilters, newFilter])
        setShowSaveFilterModal(false)
        setFilterName('')
        // Show success message
        alert('Filter saved successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save filter')
      }
    } catch (error) {
      console.error('Error saving filter:', error)
      alert('Failed to save filter')
    }
  }

  // Delete saved filter
  const deleteSavedFilter = async (filterId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent applying filter when clicking delete
    if (!confirm('Are you sure you want to delete this filter?')) return

    try {
      const token = useAuthStore.getState().token
      if (!token) return

      const response = await fetch(`/api/crm/saved-filters/${filterId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setSavedFilters(savedFilters.filter(f => f.id !== filterId))
        if (currentFilter?.id === filterId) {
          setCurrentFilter(null)
          setActiveFilters({})
          setStatusFilter('')
          setSourceFilter('')
          setAssignedToFilter('')
          setLeadScoreMin('')
          setLeadScoreMax('')
          setFieldFilters({
            notes: false,
            products: false,
            purchaseOrders: false,
            quotes: false,
            salesOrders: false,
            solutions: false,
            tasks: false,
            vendors: false,
            hasEmail: false,
            hasPhone: false,
            hasCompany: false,
          })
        }
      } else {
        alert('Failed to delete filter')
      }
    } catch (error) {
      console.error('Error deleting filter:', error)
      alert('Failed to delete filter')
    }
  }

  return (
    <>
      {/* Action buttons in header area */}
      <div className="fixed top-16 right-6 z-50 flex items-center gap-2">
          {/* Create Lead Dropdown */}
          <div className="relative" ref={createMenuRef}>
              <button
                onClick={() => setCreateMenuOpen(!createMenuOpen)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                Create Prospect
                <ChevronDown className="w-4 h-4" />
              </button>
              {createMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <button 
                      onClick={() => {
                        setImportProspectsModalOpen(true)
                        setCreateMenuOpen(false)
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                    >
                      <Upload className="w-4 h-4 mr-3" />
                      Import Prospects
                    </button>
                    <button 
                      onClick={() => {
                        setImportNotesModalOpen(true)
                        setCreateMenuOpen(false)
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                    >
                      <FileTextIcon className="w-4 h-4 mr-3" />
                      Import Notes
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button 
                      onClick={() => {
                        setFacebookSyncModalOpen(true)
                        setCreateMenuOpen(false)
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                    >
                      <Facebook className="w-4 h-4 mr-3" />
                      Facebook Ads Sync
                    </button>
                    <button 
                      onClick={() => {
                        setLinkedinSyncModalOpen(true)
                        setCreateMenuOpen(false)
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                    >
                      <Linkedin className="w-4 h-4 mr-3" />
                      LinkedIn Ads Sync
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
                        if (selectedLeads.length === 0) {
                          alert('Please select at least one lead to transfer')
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
                    <button 
                      onClick={handleMassDelete}
                      disabled={isDeleting || selectedLeads.length === 0}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4 mr-3" />
                      {isDeleting ? 'Deleting...' : 'Mass Delete'}
                    </button>
                    <button 
                      onClick={() => {
                        if (selectedLeads.length === 0) {
                          alert('Please select at least one lead to update')
                          return
                        }
                        setMassUpdateModalOpen(true)
                        setActionsMenuOpen(false)
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                    >
                      <Edit className="w-4 h-4 mr-3" />
                      Mass Update
                    </button>
                    <button 
                      onClick={() => {
                        if (selectedLeads.length === 0) {
                          alert('Please select at least one lead to convert')
                          return
                        }
                        alert(`Mass Convert: ${selectedLeads.length} lead(s) selected`)
                        setActionsMenuOpen(false)
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                    >
                      <CheckCircle className="w-4 h-4 mr-3" />
                      Mass Convert
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
                    <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left">
                      <FileText className="w-4 h-4 mr-3" />
                      Drafts
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left">
                      <Mail className="w-4 h-4 mr-3" />
                      Mass Email
                    </button>
                    <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left">
                      <Mail className="w-4 h-4 mr-3" />
                      Autoresponders
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left">
                      <CheckCircle className="w-4 h-4 mr-3" />
                      Approve Leads
                    </button>
                    <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left">
                      <Copy className="w-4 h-4 mr-3" />
                      Deduplicate Leads
                    </button>
                    <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left">
                      <Users className="w-4 h-4 mr-3" />
                      Add to Campaigns
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left">
                      <FileText className="w-4 h-4 mr-3" />
                      Create Client Script
                    </button>
                    <button 
                      onClick={handleEnrichLeads}
                      disabled={isEnriching || selectedLeads.length === 0}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Zap className="w-4 h-4 mr-3" />
                      {isEnriching ? 'Enriching...' : 'Enrich Leads'}
                    </button>
                    <button 
                      onClick={() => {
                        handleExportLeads('csv')
                        setActionsMenuOpen(false)
                      }}
                      disabled={isExporting}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="w-4 h-4 mr-3" />
                      {isExporting ? 'Exporting...' : 'Export Leads'}
                    </button>
                    <button 
                      onClick={() => {
                        setViewMode(viewMode === 'table' ? 'sheet' : 'table')
                        setActionsMenuOpen(false)
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                    >
                      <TableIcon className="w-4 h-4 mr-3" />
                      {viewMode === 'table' ? 'Sheet View' : 'Table View'}
                    </button>
                    <button 
                      onClick={handlePrintView}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                    >
                      <Printer className="w-4 h-4 mr-3" />
                      Print View
                    </button>
                  </div>
                </div>
              )}
          </div>
        </div>

      <EntityPageLayout
        title="Prospects"
        subtitle="Manage and track your sales prospects"
        kpiBar={
          <KPIBar
            items={[
              { label: 'Total Prospects', value: filteredLeads.length.toLocaleString() },
              { label: 'Active', value: activeProspects.toLocaleString() },
              { label: 'New This Month', value: newThisMonth.toLocaleString() },
              { label: 'Conversion Rate', value: `${conversionRate}%` },
            ]}
          />
        }
        leftSidebar={
          <div className="p-4 space-y-4">
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">
              Total Records: {filteredLeads.length.toLocaleString()}
              {filteredLeads.length !== totalRecords && (
                <span className="text-xs text-slate-400 dark:text-gray-500 ml-1">
                  (of {totalRecords.toLocaleString()})
                </span>
              )}
            </p>
          </div>

          {/* Saved Filters */}
          <div className="mb-6">
            <button
              onClick={() => setSavedFiltersOpen(!savedFiltersOpen)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-2"
            >
              <span>Saved Filters</span>
              <ChevronDown className={`w-4 h-4 transition-transform text-slate-400 dark:text-gray-500 ${savedFiltersOpen ? 'rotate-180' : ''}`} />
            </button>
            {savedFiltersOpen && (
              <div className="space-y-1">
                {loadingFilters ? (
                  <div className="text-sm text-gray-500 px-3 py-2">Loading filters...</div>
                ) : savedFilters.length === 0 ? (
                  <div className="text-sm text-gray-500 px-3 py-2">No saved filters yet</div>
                ) : (
                  savedFilters.map((filter) => (
                    <div
                      key={filter.id}
                      className={`group relative w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                        currentFilter?.id === filter.id
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <button
                        onClick={() => applySavedFilter(filter)}
                        className="w-full text-left"
                      >
                        {filter.name}: {filter.count?.toLocaleString() || 0}
                      </button>
                      <button
                        onClick={(e) => deleteSavedFilter(filter.id, e)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                        title="Delete filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Filter Leads by */}
          <div>
            <button
              onClick={() => setFilterByOpen(!filterByOpen)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide mb-2"
            >
              <span>Filter Prospects by</span>
              <ChevronDown className={`w-4 h-4 transition-transform text-slate-400 dark:text-gray-500 ${filterByOpen ? 'rotate-180' : ''}`} />
            </button>
            {filterByOpen && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search prospects..."
                    className="h-8 text-sm flex-1 rounded-lg border border-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setActiveFilters({ ...activeFilters, search: e.target.value })
                    }}
                  />
                  {(search || Object.keys(activeFilters).length > 0) && (
                    <button
                      onClick={() => setShowSaveFilterModal(true)}
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      title="Save this filter"
                    >
                      Save
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {/* Lead Status Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Lead Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full h-8 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1 dark:text-gray-100"
                    >
                      <option value="">All Statuses</option>
                      {leadStatuses.map((status: string) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  {/* Lead Source Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Lead Source
                    </label>
                    <select
                      value={sourceFilter}
                      onChange={(e) => setSourceFilter(e.target.value)}
                      className="w-full h-8 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1 dark:text-gray-100"
                    >
                      <option value="">All Sources</option>
                      {leadSources.map((source: string) => (
                        <option key={source} value={source}>{source}</option>
                      ))}
                    </select>
                  </div>

                  {/* Assigned To Filter */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Assigned To
                    </label>
                    <select
                      value={assignedToFilter}
                      onChange={(e) => setAssignedToFilter(e.target.value)}
                      className="w-full h-8 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1"
                    >
                      <option value="">All Users</option>
                      <option value="unassigned">Unassigned</option>
                      {users.map((user: any) => (
                        <option key={user.id} value={user.id}>{user.name || user.email}</option>
                      ))}
                    </select>
                  </div>

                  {/* Lead Score Range */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Lead Score Range
                    </label>
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={leadScoreMin}
                        onChange={(e) => setLeadScoreMin(e.target.value)}
                        className="h-8 text-xs flex-1 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={leadScoreMax}
                        onChange={(e) => setLeadScoreMax(e.target.value)}
                        className="h-8 text-xs flex-1 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                      />
                    </div>
                  </div>

                  {/* Quick Filters */}
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Filters</p>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                        <Checkbox 
                          id="hasEmail" 
                          checked={fieldFilters.hasEmail}
                          onCheckedChange={(checked) => {
                            setFieldFilters(prev => ({ ...prev, hasEmail: checked === true }))
                          }}
                        />
                        <span>Has Email</span>
                      </label>
                      <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                        <Checkbox 
                          id="hasPhone" 
                          checked={fieldFilters.hasPhone}
                          onCheckedChange={(checked) => {
                            setFieldFilters(prev => ({ ...prev, hasPhone: checked === true }))
                          }}
                        />
                        <span>Has Phone</span>
                      </label>
                      <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                        <Checkbox 
                          id="hasCompany" 
                          checked={fieldFilters.hasCompany}
                          onCheckedChange={(checked) => {
                            setFieldFilters(prev => ({ ...prev, hasCompany: checked === true }))
                          }}
                        />
                        <span>Has Company</span>
                      </label>
                      <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                        <Checkbox 
                          id="notes" 
                          checked={fieldFilters.notes}
                          onCheckedChange={(checked) => {
                            setFieldFilters(prev => ({ ...prev, notes: checked === true }))
                          }}
                        />
                        <span>Has Notes</span>
                      </label>
                      <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                        <Checkbox 
                          id="tasks" 
                          checked={fieldFilters.tasks}
                          onCheckedChange={(checked) => {
                            setFieldFilters(prev => ({ ...prev, tasks: checked === true }))
                          }}
                        />
                        <span>Has Tasks</span>
                      </label>
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  {(statusFilter || sourceFilter || assignedToFilter || leadScoreMin || leadScoreMax || 
                    fieldFilters.hasEmail || fieldFilters.hasPhone || fieldFilters.hasCompany || 
                    fieldFilters.notes || fieldFilters.tasks) && (
                    <button
                      onClick={() => {
                        setStatusFilter('')
                        setSourceFilter('')
                        setAssignedToFilter('')
                        setLeadScoreMin('')
                        setLeadScoreMax('')
                        setFieldFilters({
                          notes: false,
                          products: false,
                          purchaseOrders: false,
                          quotes: false,
                          salesOrders: false,
                          solutions: false,
                          tasks: false,
                          vendors: false,
                          hasEmail: false,
                          hasPhone: false,
                          hasCompany: false,
                        })
                      }}
                      className="w-full mt-2 px-3 py-1.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          </div>
        }
        mainContent={
          <div className="p-6">
            {/* Top Controls */}
            <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value={25}>25 Records Per Page</option>
                <option value={50}>50 Records Per Page</option>
                <option value={100}>100 Records Per Page</option>
                <option value={200}>200 Records Per Page</option>
              </select>
              {pagination && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
                  >
                    &lt;
                  </button>
                  <span>
                    Showing {filteredLeads.length} of {totalRecords} prospects
                    {(statusFilter || sourceFilter || assignedToFilter || leadScoreMin || leadScoreMax || 
                      fieldFilters.hasEmail || fieldFilters.hasPhone || fieldFilters.hasCompany || 
                      fieldFilters.notes || fieldFilters.tasks) && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 ml-1">(filtered)</span>
                    )}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(Math.ceil(totalRecords / limit), p + 1))}
                    disabled={page >= Math.ceil(totalRecords / limit)}
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300"
                  >
                    &gt;
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Leads Table */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-0">
              {filteredLeads.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">No leads found</p>
                  <Link href={`/crm/${tenantId}/Contacts/new`}>
                    <Button>Create Your First Lead</Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedLeads(filteredLeads.map((l: any) => l.id))
                              } else {
                                setSelectedLeads([])
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Lead Status</TableHead>
                        <TableHead className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Stage</TableHead>
                        <TableHead className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Last Activity</TableHead>
                        <TableHead className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Name</TableHead>
                        <TableHead className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Source</TableHead>
                        <TableHead className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Phone</TableHead>
                        <TableHead className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Email</TableHead>
                        <TableHead className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Company</TableHead>
                        <TableHead className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wide">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeads.map((lead: any) => {
                        const isSelected = selectedLeads.includes(lead.id)
                        const statusColor = lead.status === 'Not Contactable/Call unanswered' ? 'bg-orange-100 text-orange-800' :
                          lead.status === 'Proposal Sent' ? 'bg-purple-100 text-purple-800' :
                          lead.status === 'Yet to call' ? 'bg-green-100 text-green-800' :
                          lead.status === 'Under Followup' ? 'bg-orange-100 text-orange-800' :
                          lead.status === 'Not Interested' ? 'bg-blue-100 text-blue-800' :
                          lead.status === 'Reassigned' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'

                        return (
                          <TableRow key={lead.id} className={`hover:bg-indigo-50/40 dark:hover:bg-indigo-900/20 transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                            <TableCell className="px-4 py-3">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedLeads([...selectedLeads, lead.id])
                                  } else {
                                    setSelectedLeads(selectedLeads.filter(id => id !== lead.id))
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor} dark:bg-opacity-80`}>
                                {lead.status || 'Active'}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-3 whitespace-nowrap">
                              <StageBadge 
                                stage={lead.stage || (lead.type === 'lead' ? 'prospect' : lead.type === 'customer' ? 'customer' : 'contact')} 
                              />
                            </TableCell>
                            <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 dark:text-gray-400">
                              {lead.lastContactedAt 
                                ? formatDate(new Date(lead.lastContactedAt), 'MMM d, yyyy')
                                : lead.createdAt 
                                ? formatDate(new Date(lead.createdAt), 'MMM d, yyyy')
                                : '-'}
                            </TableCell>
                            <TableCell className="px-4 py-3 whitespace-nowrap">
                              <Link href={`/crm/${tenantId}/Contacts/${lead.id}`} className="font-medium text-slate-800 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400">
                                {lead.name}
                              </Link>
                            </TableCell>
                            <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-gray-400">
                              {lead.source || '-'}
                            </TableCell>
                            <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-gray-400">
                              {lead.phone || '-'}
                            </TableCell>
                            <TableCell className="px-4 py-3 whitespace-nowrap max-w-[200px] truncate text-sm text-slate-500 dark:text-gray-400">
                              {lead.email || '-'}
                            </TableCell>
                            <TableCell className="px-4 py-3 whitespace-nowrap max-w-[160px] truncate text-sm text-slate-500 dark:text-gray-400">
                              {lead.company || '-'}
                            </TableCell>
                            <TableCell className="px-4 py-3 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openConvertModal(lead)}
                                  className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                                  title="Convert Lead"
                                >
                                  Convert
                                </button>
                                <RowActionsMenu
                                  entityType="prospect"
                                  entityId={lead.id}
                                  tenantId={tenantId}
                                  onConvert={() => openConvertModal(lead)}
                                  onDelete={async () => {
                                    if (confirm('Are you sure you want to delete this prospect?')) {
                                      try {
                                        const token = useAuthStore.getState().token
                                        if (!token) return
                                        const response = await fetch(`/api/crm/contacts/${lead.id}`, {
                                          method: 'DELETE',
                                          headers: { 'Authorization': `Bearer ${token}` },
                                        })
                                        if (response.ok) {
                                          window.location.reload()
                                        }
                                      } catch (error) {
                                        console.error('Error deleting prospect:', error)
                                        alert('Failed to delete prospect')
                                      }
                                    }
                                  }}
                                  onCreateDeal={() => {
                                    router.push(`/crm/${tenantId}/Deals/new?contactId=${lead.id}`)
                                  }}
                                />
                              </div>
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
        }
        rightSidebar={<EntityAIPanel entityType="prospects" />}
      />

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedLeads.length}
        entityType="prospect"
        onEdit={() => {
          if (selectedLeads.length === 1) {
            router.push(`/crm/${tenantId}/Contacts/${selectedLeads[0]}/Edit`)
          } else {
            setMassUpdateModalOpen(true)
          }
        }}
        onDelete={handleMassDelete}
        onAssign={() => {
          if (selectedLeads.length > 0) {
            setMassTransferModalOpen(true)
          }
        }}
        onConvert={handleMassConvert}
        onExport={() => handleExportLeads('csv')}
        onClearSelection={() => setSelectedLeads([])}
      />

      {/* Convert Lead Modal */}
      {showConvertModal && leadToConvert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              Convert Lead: {leadToConvert.name} - {leadToConvert.company || 'No Company'}
            </h3>
            
            <div className="space-y-6">
              {/* Create New Account */}
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={conversionData.createAccount}
                    onChange={(e) => setConversionData({ ...conversionData, createAccount: e.target.checked })}
                    className="rounded"
                  />
                  <span className="font-medium">Create New Account: {leadToConvert.company || leadToConvert.name}</span>
                </label>
                {conversionData.createAccount && (
                  <div className="ml-6 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                      <Input
                        value={conversionData.accountName}
                        onChange={(e) => setConversionData({ ...conversionData, accountName: e.target.value })}
                        placeholder="Account name"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account Owner</label>
                      <select
                        value={conversionData.accountOwnerId}
                        onChange={(e) => setConversionData({ ...conversionData, accountOwnerId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select owner</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name || u.email} {u.role && `(${u.role})`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={conversionData.notifyAccountOwner}
                        onChange={(e) => setConversionData({ ...conversionData, notifyAccountOwner: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-600">Notify record owner</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Create New Contact */}
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={conversionData.createContact}
                    onChange={(e) => setConversionData({ ...conversionData, createContact: e.target.checked })}
                    className="rounded"
                  />
                  <span className="font-medium">Create New Contact: {leadToConvert.name}</span>
                </label>
                {conversionData.createContact && (
                  <div className="ml-6 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                      <Input
                        value={conversionData.contactName}
                        onChange={(e) => setConversionData({ ...conversionData, contactName: e.target.value })}
                        placeholder="Contact name"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Owner</label>
                      <select
                        value={conversionData.contactOwnerId}
                        onChange={(e) => setConversionData({ ...conversionData, contactOwnerId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select owner</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name || u.email} {u.role && `(${u.role})`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={conversionData.notifyContactOwner}
                        onChange={(e) => setConversionData({ ...conversionData, notifyContactOwner: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-600">Notify record owner</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Create New Deal */}
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={conversionData.createDeal}
                    onChange={(e) => setConversionData({ ...conversionData, createDeal: e.target.checked })}
                    className="rounded"
                  />
                  <span className="font-medium">Create a new Deal for this Account</span>
                </label>
                {conversionData.createDeal && (
                  <div className="ml-6 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Deal Name</label>
                      <Input
                        value={conversionData.dealName}
                        onChange={(e) => setConversionData({ ...conversionData, dealName: e.target.value })}
                        placeholder="Deal name"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Deal Value (₹)</label>
                      <Input
                        type="number"
                        value={conversionData.dealValue}
                        onChange={(e) => setConversionData({ ...conversionData, dealValue: e.target.value })}
                        placeholder="0.00"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Deal Owner</label>
                      <select
                        value={conversionData.dealOwnerId}
                        onChange={(e) => setConversionData({ ...conversionData, dealOwnerId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select owner</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name || u.email} {u.role && `(${u.role})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-4 border-t">
                <button
                  onClick={() => {
                    setShowConvertModal(false)
                    setLeadToConvert(null)
                  }}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConvertLead}
                  disabled={isConverting || (!conversionData.createAccount && !conversionData.createContact)}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isConverting ? 'Converting...' : 'Convert'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mass Convert Modal */}
      {showMassConvertModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[600px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Mass Convert {selectedLeads.length} Prospect(s)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Configure how to convert {selectedLeads.length} selected prospect(s). These settings will be applied to all selected prospects.
            </p>
            
            <div className="space-y-6">
              {/* Create New Account */}
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={conversionData.createAccount}
                    onChange={(e) => setConversionData({ ...conversionData, createAccount: e.target.checked })}
                    className="rounded"
                  />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Create New Account for each prospect</span>
                </label>
                {conversionData.createAccount && (
                  <div className="ml-6 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Owner</label>
                      <select
                        value={conversionData.accountOwnerId}
                        onChange={(e) => setConversionData({ ...conversionData, accountOwnerId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">Use prospect's current owner</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name || u.email} {u.role && `(${u.role})`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={conversionData.notifyAccountOwner}
                        onChange={(e) => setConversionData({ ...conversionData, notifyAccountOwner: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Notify record owner</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Create New Contact */}
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={conversionData.createContact}
                    onChange={(e) => setConversionData({ ...conversionData, createContact: e.target.checked })}
                    className="rounded"
                  />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Create New Contact for each prospect</span>
                </label>
                {conversionData.createContact && (
                  <div className="ml-6 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Owner</label>
                      <select
                        value={conversionData.contactOwnerId}
                        onChange={(e) => setConversionData({ ...conversionData, contactOwnerId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">Use prospect's current owner</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name || u.email} {u.role && `(${u.role})`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={conversionData.notifyContactOwner}
                        onChange={(e) => setConversionData({ ...conversionData, notifyContactOwner: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Notify record owner</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Create New Deal */}
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={conversionData.createDeal}
                    onChange={(e) => setConversionData({ ...conversionData, createDeal: e.target.checked })}
                    className="rounded"
                  />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Create a new Deal for each Account</span>
                </label>
                {conversionData.createDeal && (
                  <div className="ml-6 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deal Name Template</label>
                      <Input
                        value={conversionData.dealName}
                        onChange={(e) => setConversionData({ ...conversionData, dealName: e.target.value })}
                        placeholder="Deal for {prospect_name}"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Use {'{prospect_name}'} or {'{company_name}'} as placeholders</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Deal Value (₹)</label>
                      <Input
                        type="number"
                        value={conversionData.dealValue}
                        onChange={(e) => setConversionData({ ...conversionData, dealValue: e.target.value })}
                        placeholder="0.00"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deal Owner</label>
                      <select
                        value={conversionData.dealOwnerId}
                        onChange={(e) => setConversionData({ ...conversionData, dealOwnerId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">Use prospect's current owner</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name || u.email} {u.role && `(${u.role})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowMassConvertModal(false)
                  }}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={executeMassConvert}
                  disabled={isMassConverting || (!conversionData.createAccount && !conversionData.createContact)}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isMassConverting ? `Converting ${selectedLeads.length} prospect(s)...` : `Convert ${selectedLeads.length} Prospect(s)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Filter Modal */}
      {showSaveFilterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4">Save Filter</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter Name
                </label>
                <Input
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  placeholder="e.g., Google Leads, Pending Leads"
                  className="w-full"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowSaveFilterModal(false)
                    setFilterName('')
                  }}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCurrentFilter}
                  disabled={!filterName.trim()}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Save Filter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mass Transfer Modal */}
      <Dialog open={massTransferModalOpen} onOpenChange={setMassTransferModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mass Transfer Leads</DialogTitle>
            <DialogDescription>
              Transfer {selectedLeads.length} selected lead(s) to another user
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
                {isTransferring ? 'Transferring...' : 'Transfer Leads'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mass Update Modal */}
      <Dialog open={massUpdateModalOpen} onOpenChange={setMassUpdateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mass Update Leads</DialogTitle>
            <DialogDescription>
              Update {selectedLeads.length} selected lead(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="status-update">Status</Label>
              <select
                id="status-update"
                value={massUpdateData.status}
                onChange={(e) => setMassUpdateData({ ...massUpdateData, status: e.target.value })}
                className="mt-2 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <option value="">No change</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="qualified">Qualified</option>
                <option value="unqualified">Unqualified</option>
              </select>
            </div>
            <div>
              <Label htmlFor="source-update">Source</Label>
              <Input
                id="source-update"
                value={massUpdateData.source}
                onChange={(e) => setMassUpdateData({ ...massUpdateData, source: e.target.value })}
                placeholder="Leave empty for no change"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="stage-update">Stage</Label>
              <select
                id="stage-update"
                value={massUpdateData.stage}
                onChange={(e) => setMassUpdateData({ ...massUpdateData, stage: e.target.value })}
                className="mt-2 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <option value="">No change</option>
                <option value="prospect">Prospect</option>
                <option value="contact">Contact</option>
                <option value="customer">Customer</option>
              </select>
            </div>
            <div>
              <Label htmlFor="assign-update">Assign To</Label>
              <select
                id="assign-update"
                value={massUpdateData.assignedToId}
                onChange={(e) => setMassUpdateData({ ...massUpdateData, assignedToId: e.target.value })}
                className="mt-2 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <option value="">No change</option>
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
                  setMassUpdateModalOpen(false)
                  setMassUpdateData({ status: '', source: '', assignedToId: '', stage: '' })
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleMassUpdate}
                disabled={isUpdating || (!massUpdateData.status && !massUpdateData.source && !massUpdateData.assignedToId && !massUpdateData.stage)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isUpdating ? 'Updating...' : 'Update Leads'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Prospects Modal */}
      <Dialog open={importProspectsModalOpen} onOpenChange={setImportProspectsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Prospects</DialogTitle>
            <DialogDescription>
              Import prospects from a CSV or Excel file
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              This feature is coming soon. You will be able to upload a CSV or Excel file to import multiple prospects at once.
            </p>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setImportProspectsModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Notes Modal */}
      <Dialog open={importNotesModalOpen} onOpenChange={setImportNotesModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Notes</DialogTitle>
            <DialogDescription>
              Import notes for prospects from a file
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              This feature is coming soon. You will be able to import notes for multiple prospects.
            </p>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setImportNotesModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Facebook Ads Sync Modal */}
      <Dialog open={facebookSyncModalOpen} onOpenChange={setFacebookSyncModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Facebook Ads Sync</DialogTitle>
            <DialogDescription>
              Sync leads from Facebook Ads campaigns
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              This feature is coming soon. You will be able to connect your Facebook Ads account and automatically sync leads from your campaigns.
            </p>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setFacebookSyncModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* LinkedIn Ads Sync Modal */}
      <Dialog open={linkedinSyncModalOpen} onOpenChange={setLinkedinSyncModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>LinkedIn Ads Sync</DialogTitle>
            <DialogDescription>
              Sync leads from LinkedIn Ads campaigns
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              This feature is coming soon. You will be able to connect your LinkedIn Ads account and automatically sync leads from your campaigns.
            </p>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setLinkedinSyncModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
