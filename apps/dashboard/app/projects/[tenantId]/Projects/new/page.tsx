'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CustomSelect, CustomSelectContent, CustomSelectItem, CustomSelectTrigger } from '@/components/ui/custom-select'
import { getAuthHeaders } from '@/lib/api/client'
import { ArrowLeft } from 'lucide-react'

export default function NewProjectPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    status: 'PLANNING',
    priority: 'MEDIUM',
    startDate: '',
    endDate: '',
    budget: '',
    clientId: '',
    tags: '',
  })
  const [serviceTemplateId, setServiceTemplateId] = useState('')
  const [seedServiceTemplate, setSeedServiceTemplate] = useState(true)
  const [flowProfile, setFlowProfile] = useState<'all' | 'software' | 'outsourcing' | 'agency'>('all')
  const [currentStep, setCurrentStep] = useState(0)
  const [profileDefaultsApplied, setProfileDefaultsApplied] = useState(false)
  const [profileMeta, setProfileMeta] = useState({
    outsourcingSlaHours: '',
    outsourcingRenewalCadence: 'quarterly',
    softwareReleaseCadence: 'biweekly',
    softwareUatOwner: '',
    agencyReportingCadence: 'monthly',
    agencyPrimaryChannel: 'email',
  })

  type ServiceTemplateDto = {
    id: string
    label: string
    phaseNames: string[]
    milestoneNames: string[]
    milestoneDefaults: Array<{
      name: string
      billingTrigger: 'NONE' | 'ON_COMPLETE' | 'ON_APPROVE'
      approvalRequired: boolean
    }>
    deliveryTypeDefault: string
    billingModelDefault: string
  }

  const { data: templatesPayload } = useQuery({
    queryKey: ['projects', tenantId, 'service-templates'],
    queryFn: async () => {
      const response = await fetch('/api/projects/service-templates', {
        headers: { ...getAuthHeaders() },
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error((error as { error?: string }).error || 'Failed to fetch service templates')
      }
      return response.json() as { templates: ServiceTemplateDto[] }
    },
    enabled: Boolean(tenantId),
  })

  const createProject = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create project')
      }
      return response.json()
    },
    onSuccess: (data) => {
      router.push(`/projects/${tenantId}/Projects/${data.project.id}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.startDate || !formData.endDate) {
      window.alert('Start and end dates are required for project timeline.')
      return
    }
    if (new Date(formData.endDate).getTime() < new Date(formData.startDate).getTime()) {
      window.alert('End date must be on or after start date.')
      return
    }
    if (flowProfile === 'outsourcing' && !formData.budget) {
      window.alert('Outsourcing / MSP projects should set a budget baseline before creation.')
      return
    }
    if (flowProfile === 'software' && !serviceTemplateId) {
      window.alert('Software profile should select a playbook so approval milestones are seeded.')
      return
    }
    if (flowProfile === 'agency' && !formData.clientId.trim()) {
      window.alert('Agency / Support profile should include a client contact id before create.')
      return
    }
    const baseTags = formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    const metaTags: string[] = []
    const metaNotes: string[] = []
    if (flowProfile !== 'all') {
      metaTags.push(`profile:${flowProfile}`)
    }
    if (flowProfile === 'outsourcing') {
      if (profileMeta.outsourcingSlaHours.trim()) {
        metaTags.push(`sla_hours:${profileMeta.outsourcingSlaHours.trim()}`)
        metaNotes.push(`SLA target (hours): ${profileMeta.outsourcingSlaHours.trim()}`)
      }
      metaNotes.push(`Renewal cadence: ${profileMeta.outsourcingRenewalCadence}`)
    }
    if (flowProfile === 'software') {
      metaNotes.push(`Release cadence: ${profileMeta.softwareReleaseCadence}`)
      if (profileMeta.softwareUatOwner.trim()) {
        metaNotes.push(`UAT owner: ${profileMeta.softwareUatOwner.trim()}`)
      }
    }
    if (flowProfile === 'agency') {
      metaNotes.push(`Reporting cadence: ${profileMeta.agencyReportingCadence}`)
      metaNotes.push(`Primary channel: ${profileMeta.agencyPrimaryChannel}`)
    }
    const mergedNotes = [
      formData.description?.trim() || '',
      metaNotes.length ? `\n\n[Profile Metadata]\n${metaNotes.join('\n')}` : '',
    ]
      .join('')
      .trim()
    createProject.mutate({
      ...formData,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
      tags: [...new Set([...baseTags, ...metaTags])],
      notes: mergedNotes || undefined,
      ...(serviceTemplateId
        ? {
            serviceTemplateId,
            ...(seedServiceTemplate ? {} : { seedServiceTemplate: false }),
          }
        : {}),
    })
  }

  const selectedTemplate =
    templatesPayload?.templates.find((t) => t.id === serviceTemplateId) ?? null
  const visibleTemplates = (templatesPayload?.templates ?? []).filter((t) => {
    if (flowProfile === 'all') return true
    if (flowProfile === 'software') return t.id === 'software_product'
    if (flowProfile === 'outsourcing') return t.id === 'outsourcing_msp'
    return (
      t.id === 'website_agency' ||
      t.id === 'marketing_retainer' ||
      t.id === 'support_package'
    )
  })
  const profileHint =
    flowProfile === 'software'
      ? 'Software projects: seed approval-driven milestones (e.g., UAT sign-off) and keep a client contact linked.'
      : flowProfile === 'outsourcing'
        ? 'Outsourcing/MSP: set budget baseline now; prefer retainer playbook and quarterly review milestones.'
        : flowProfile === 'agency'
          ? 'Agency/Support: ensure client id is set and choose a template with sign-off milestones.'
          : 'Choose a delivery profile for guided defaults.'
  const displayProfile =
    flowProfile === 'software'
      ? 'Software'
      : flowProfile === 'outsourcing'
        ? 'Outsourcing / MSP'
        : flowProfile === 'agency'
          ? 'Agency / Support'
          : 'General / Manual'

  const stepTitles = ['Delivery Profile', 'Commercial Setup', 'Timeline', 'Review & Create']
  const isFinalStep = currentStep === stepTitles.length - 1

  const canMoveNext = () => {
    if (currentStep === 0) {
      if (flowProfile === 'software' && !serviceTemplateId) return false
      return true
    }
    if (currentStep === 1) {
      if (flowProfile === 'agency' && !formData.clientId.trim()) return false
      if (flowProfile === 'outsourcing' && !formData.budget) return false
      return true
    }
    if (currentStep === 2) {
      if (!formData.startDate || !formData.endDate) return false
      if (new Date(formData.endDate).getTime() < new Date(formData.startDate).getTime()) return false
      return true
    }
    return true
  }

  const handleNext = () => {
    if (currentStep === 0 && flowProfile === 'software' && !serviceTemplateId) {
      window.alert('Software profile should select a playbook so approval milestones are seeded.')
      return
    }
    if (currentStep === 1 && flowProfile === 'agency' && !formData.clientId.trim()) {
      window.alert('Agency / Support profile should include a client contact id before continuing.')
      return
    }
    if (currentStep === 1 && flowProfile === 'outsourcing' && !formData.budget) {
      window.alert('Outsourcing / MSP projects should set a budget baseline before continuing.')
      return
    }
    if (currentStep === 2) {
      if (!formData.startDate || !formData.endDate) {
        window.alert('Start and end dates are required for project timeline.')
        return
      }
      if (new Date(formData.endDate).getTime() < new Date(formData.startDate).getTime()) {
        window.alert('End date must be on or after start date.')
        return
      }
    }
    setCurrentStep((s) => Math.min(stepTitles.length - 1, s + 1))
  }

  const applyProfileDefaults = () => {
    if (profileDefaultsApplied) return
    if (flowProfile === 'software') {
      setFormData((prev) => ({
        ...prev,
        tags: prev.tags || 'software,product_delivery',
        status: prev.status || 'PLANNING',
      }))
    } else if (flowProfile === 'outsourcing') {
      setFormData((prev) => ({
        ...prev,
        budget: prev.budget || '100000',
        tags: prev.tags || 'outsourcing,msp,retainer',
      }))
    } else if (flowProfile === 'agency') {
      setFormData((prev) => ({
        ...prev,
        tags: prev.tags || 'agency,client_delivery',
      }))
    }
    setProfileDefaultsApplied(true)
  }

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/projects/${tenantId}/Projects`}>
            <Button variant="ghost" size="sm" className="dark:text-gray-300 dark:hover:bg-gray-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create New Project</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Set up a new project to track tasks and time</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Project Details</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Step {currentStep + 1} of {stepTitles.length}: {stepTitles[currentStep]}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentStep === 0 ? (
                <div className="space-y-4">
                  <div>
                <Label className="dark:text-gray-300">Delivery Profile</Label>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={flowProfile === 'software' ? 'default' : 'outline'}
                    onClick={() => {
                      setFlowProfile('software')
                      setServiceTemplateId('software_product')
                      setProfileDefaultsApplied(false)
                    }}
                  >
                    Software
                  </Button>
                  <Button
                    type="button"
                    variant={flowProfile === 'outsourcing' ? 'default' : 'outline'}
                    onClick={() => {
                      setFlowProfile('outsourcing')
                      setServiceTemplateId('outsourcing_msp')
                      setProfileDefaultsApplied(false)
                    }}
                  >
                    Outsourcing / MSP
                  </Button>
                  <Button
                    type="button"
                    variant={flowProfile === 'agency' ? 'default' : 'outline'}
                    onClick={() => {
                      setFlowProfile('agency')
                      if (!['website_agency', 'marketing_retainer', 'support_package'].includes(serviceTemplateId)) {
                        setServiceTemplateId('website_agency')
                      }
                      setProfileDefaultsApplied(false)
                    }}
                  >
                    Agency / Support
                  </Button>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Quick branch step: pre-selects a matching playbook while keeping full override control below.
                </p>
                <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                  {profileHint}
                </p>
              </div>

              <div>
                <Label htmlFor="serviceTemplateId" className="dark:text-gray-300">Service Playbook (optional)</Label>
                <CustomSelect
                  value={serviceTemplateId}
                  onValueChange={(value: string) => {
                    setServiceTemplateId(value)
                    if (value === 'software_product') setFlowProfile('software')
                    else if (value === 'outsourcing_msp') setFlowProfile('outsourcing')
                    else if (value) setFlowProfile('agency')
                    else setFlowProfile('all')
                  }}
                  placeholder="No template (manual setup)"
                >
                  <CustomSelectTrigger id="serviceTemplateId" className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                  </CustomSelectTrigger>
                  <CustomSelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <CustomSelectItem value="" className="dark:text-gray-100">None — manual plan</CustomSelectItem>
                    {visibleTemplates.map((t) => (
                      <CustomSelectItem key={t.id} value={t.id} className="dark:text-gray-100">
                        {t.label}
                      </CustomSelectItem>
                    ))}
                  </CustomSelectContent>
                </CustomSelect>
                {selectedTemplate ? (
                  <div className="mt-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3 space-y-2">
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      Defaults on create: <span className="font-medium">{selectedTemplate.deliveryTypeDefault}</span> delivery,{' '}
                      <span className="font-medium">{selectedTemplate.billingModelDefault}</span> billing.
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      Phases: {selectedTemplate.phaseNames.join(' -> ')}
                    </p>
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      Milestones:
                      <ul className="mt-1 list-disc ml-4 space-y-1">
                        {selectedTemplate.milestoneDefaults.map((m) => (
                          <li key={m.name}>
                            {m.name} — trigger <span className="font-medium">{m.billingTrigger}</span>
                            {m.approvalRequired ? ' (approval required)' : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <label className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-200">
                      <input
                        type="checkbox"
                        checked={seedServiceTemplate}
                        onChange={(e) => setSeedServiceTemplate(e.target.checked)}
                        className="mt-0.5"
                      />
                      Seed phases, milestone defaults, and starter tasks from this playbook
                    </label>
                  </div>
                ) : null}
              </div>
                </div>
              ) : null}

              {currentStep === 1 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3">
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      Apply profile defaults for faster setup ({displayProfile}).
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={applyProfileDefaults}
                      disabled={flowProfile === 'all' || profileDefaultsApplied}
                    >
                      {profileDefaultsApplied ? 'Applied' : 'Apply Defaults'}
                    </Button>
                  </div>
                  <div>
                    <Label htmlFor="clientId" className="dark:text-gray-300">Client Contact Id</Label>
                    <Input
                      id="clientId"
                      value={formData.clientId}
                      onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                      placeholder="CRM contact id"
                      className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Required for Agency / Support profile; recommended for all commercial projects.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="budget" className="dark:text-gray-300">Budget (₹)</Label>
                    <Input
                      id="budget"
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Required for Outsourcing / MSP profile.
                    </p>
                  </div>
                  {flowProfile === 'outsourcing' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="outsourcingSlaHours" className="dark:text-gray-300">SLA Target (hours)</Label>
                        <Input
                          id="outsourcingSlaHours"
                          type="number"
                          min="1"
                          value={profileMeta.outsourcingSlaHours}
                          onChange={(e) => setProfileMeta((s) => ({ ...s, outsourcingSlaHours: e.target.value }))}
                          placeholder="e.g., 8"
                          className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <Label className="dark:text-gray-300">Renewal Cadence</Label>
                        <CustomSelect
                          value={profileMeta.outsourcingRenewalCadence}
                          onValueChange={(value: string) =>
                            setProfileMeta((s) => ({ ...s, outsourcingRenewalCadence: value }))
                          }
                        >
                          <CustomSelectTrigger className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                          <CustomSelectContent className="dark:bg-gray-800 dark:border-gray-700">
                            <CustomSelectItem value="monthly" className="dark:text-gray-100">Monthly</CustomSelectItem>
                            <CustomSelectItem value="quarterly" className="dark:text-gray-100">Quarterly</CustomSelectItem>
                            <CustomSelectItem value="annual" className="dark:text-gray-100">Annual</CustomSelectItem>
                          </CustomSelectContent>
                        </CustomSelect>
                      </div>
                    </div>
                  ) : null}
                  {flowProfile === 'software' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="dark:text-gray-300">Release Cadence</Label>
                        <CustomSelect
                          value={profileMeta.softwareReleaseCadence}
                          onValueChange={(value: string) =>
                            setProfileMeta((s) => ({ ...s, softwareReleaseCadence: value }))
                          }
                        >
                          <CustomSelectTrigger className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                          <CustomSelectContent className="dark:bg-gray-800 dark:border-gray-700">
                            <CustomSelectItem value="weekly" className="dark:text-gray-100">Weekly</CustomSelectItem>
                            <CustomSelectItem value="biweekly" className="dark:text-gray-100">Biweekly</CustomSelectItem>
                            <CustomSelectItem value="monthly" className="dark:text-gray-100">Monthly</CustomSelectItem>
                          </CustomSelectContent>
                        </CustomSelect>
                      </div>
                      <div>
                        <Label htmlFor="softwareUatOwner" className="dark:text-gray-300">UAT Owner</Label>
                        <Input
                          id="softwareUatOwner"
                          value={profileMeta.softwareUatOwner}
                          onChange={(e) => setProfileMeta((s) => ({ ...s, softwareUatOwner: e.target.value }))}
                          placeholder="Name or role"
                          className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                        />
                      </div>
                    </div>
                  ) : null}
                  {flowProfile === 'agency' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="dark:text-gray-300">Reporting Cadence</Label>
                        <CustomSelect
                          value={profileMeta.agencyReportingCadence}
                          onValueChange={(value: string) =>
                            setProfileMeta((s) => ({ ...s, agencyReportingCadence: value }))
                          }
                        >
                          <CustomSelectTrigger className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                          <CustomSelectContent className="dark:bg-gray-800 dark:border-gray-700">
                            <CustomSelectItem value="weekly" className="dark:text-gray-100">Weekly</CustomSelectItem>
                            <CustomSelectItem value="monthly" className="dark:text-gray-100">Monthly</CustomSelectItem>
                            <CustomSelectItem value="campaign_end" className="dark:text-gray-100">Campaign end</CustomSelectItem>
                          </CustomSelectContent>
                        </CustomSelect>
                      </div>
                      <div>
                        <Label className="dark:text-gray-300">Primary Channel</Label>
                        <CustomSelect
                          value={profileMeta.agencyPrimaryChannel}
                          onValueChange={(value: string) =>
                            setProfileMeta((s) => ({ ...s, agencyPrimaryChannel: value }))
                          }
                        >
                          <CustomSelectTrigger className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                          <CustomSelectContent className="dark:bg-gray-800 dark:border-gray-700">
                            <CustomSelectItem value="email" className="dark:text-gray-100">Email</CustomSelectItem>
                            <CustomSelectItem value="whatsapp" className="dark:text-gray-100">WhatsApp</CustomSelectItem>
                            <CustomSelectItem value="slack" className="dark:text-gray-100">Slack</CustomSelectItem>
                          </CustomSelectContent>
                        </CustomSelect>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {currentStep === 2 ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate" className="dark:text-gray-300">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                      className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate" className="dark:text-gray-300">End Date *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                      className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    />
                  </div>
                </div>
              ) : null}

              {currentStep === 3 ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3 space-y-2">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Review Summary</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-700 dark:text-gray-300">
                      <p>
                        <span className="font-medium">Delivery profile:</span> {displayProfile}
                      </p>
                      <p>
                        <span className="font-medium">Playbook:</span> {selectedTemplate?.label || 'None (manual)'}
                      </p>
                      <p>
                        <span className="font-medium">Timeline:</span>{' '}
                        {formData.startDate && formData.endDate
                          ? `${formData.startDate} -> ${formData.endDate}`
                          : 'Not set'}
                      </p>
                      <p>
                        <span className="font-medium">Client contact:</span>{' '}
                        {formData.clientId.trim() || 'Not set'}
                      </p>
                      <p>
                        <span className="font-medium">Budget:</span>{' '}
                        {formData.budget ? `₹${formData.budget}` : 'Not set'}
                      </p>
                      <p>
                        <span className="font-medium">Template seeding:</span>{' '}
                        {serviceTemplateId ? (seedServiceTemplate ? 'On' : 'Off') : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="name" className="dark:text-gray-300">Project Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="e.g., Website Redesign"
                      className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <Label htmlFor="code" className="dark:text-gray-300">Project Code</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g., WEB-2024"
                      className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="dark:text-gray-300">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the project..."
                      rows={4}
                      className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status" className="dark:text-gray-300">Status</Label>
                  <CustomSelect
                    value={formData.status}
                    onValueChange={(value: string) => setFormData({ ...formData, status: value })}
                    placeholder="Status"
                  >
                    <CustomSelectTrigger className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                    </CustomSelectTrigger>
                    <CustomSelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      <CustomSelectItem value="PLANNING" className="dark:text-gray-100">Planning</CustomSelectItem>
                      <CustomSelectItem value="IN_PROGRESS" className="dark:text-gray-100">In Progress</CustomSelectItem>
                      <CustomSelectItem value="ON_HOLD" className="dark:text-gray-100">On Hold</CustomSelectItem>
                      <CustomSelectItem value="COMPLETED" className="dark:text-gray-100">Completed</CustomSelectItem>
                      <CustomSelectItem value="CANCELLED" className="dark:text-gray-100">Cancelled</CustomSelectItem>
                    </CustomSelectContent>
                  </CustomSelect>
                </div>

                <div>
                  <Label htmlFor="priority" className="dark:text-gray-300">Priority</Label>
                  <CustomSelect
                    value={formData.priority}
                    onValueChange={(value: string) => setFormData({ ...formData, priority: value })}
                    placeholder="Priority"
                  >
                    <CustomSelectTrigger className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                    </CustomSelectTrigger>
                    <CustomSelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      <CustomSelectItem value="LOW" className="dark:text-gray-100">Low</CustomSelectItem>
                      <CustomSelectItem value="MEDIUM" className="dark:text-gray-100">Medium</CustomSelectItem>
                      <CustomSelectItem value="HIGH" className="dark:text-gray-100">High</CustomSelectItem>
                      <CustomSelectItem value="URGENT" className="dark:text-gray-100">Urgent</CustomSelectItem>
                    </CustomSelectContent>
                  </CustomSelect>
                </div>
              </div>
                  <div>
                    <Label htmlFor="tags" className="dark:text-gray-300">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="e.g., web, design, urgent"
                      className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    />
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link href={`/projects/${tenantId}/Projects`}>
              <Button type="button" variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancel</Button>
            </Link>
            {currentStep > 0 ? (
              <Button type="button" variant="outline" onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}>
                Back
              </Button>
            ) : null}
            {!isFinalStep ? (
              <Button type="button" onClick={handleNext} disabled={!canMoveNext()}>
                Next
              </Button>
            ) : (
              <Button 
                type="submit" 
                className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600"
                disabled={createProject.isPending}
              >
                {createProject.isPending ? 'Creating...' : 'Create Project'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

