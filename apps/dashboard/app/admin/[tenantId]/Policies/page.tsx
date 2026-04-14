'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ShieldCheck, Bot, Zap, Users, FileText, Lock,
  AlertTriangle, ChevronRight, Save, ToggleLeft, ToggleRight,
} from 'lucide-react'

type PolicySection = {
  id: string
  label: string
  description: string
  icon: React.ElementType
  color: string
}

const POLICY_SECTIONS: PolicySection[] = [
  { id: 'ai_limits', label: 'AI Usage Limits', description: 'Control AI token consumption and rate limits per tenant', icon: Bot, color: 'text-purple-600' },
  { id: 'approvals', label: 'Approval Gates', description: 'Define which actions require human approval before executing', icon: ShieldCheck, color: 'text-blue-600' },
  { id: 'automation', label: 'Automation Rules', description: 'Guardrails for workflow and SDR automation runs', icon: Zap, color: 'text-amber-600' },
  { id: 'data_access', label: 'Data Access & Retention', description: 'PII handling, data export, and retention periods', icon: Lock, color: 'text-red-600' },
  { id: 'compliance', label: 'Compliance Rules', description: 'GDPR, DPDPA, and TRAI opt-out enforcement', icon: FileText, color: 'text-emerald-600' },
  { id: 'roles', label: 'Role & Permission Policies', description: 'Override default permissions for modules and features', icon: Users, color: 'text-indigo-600' },
]

type PolicyToggle = { id: string; label: string; description: string; enabled: boolean }

const DEFAULT_POLICIES: Record<string, PolicyToggle[]> = {
  ai_limits: [
    { id: 'ai_rate_limit', label: 'Enforce AI rate limits', description: 'Limit AI calls to 1,000 per tenant per day (configurable)', enabled: true },
    { id: 'ai_cost_alerts', label: 'AI cost threshold alerts', description: 'Alert admin when AI spend exceeds configured threshold', enabled: true },
    { id: 'ai_model_lock', label: 'Lock AI model version', description: 'Pin to approved model versions to prevent unexpected behaviour changes', enabled: false },
  ],
  approvals: [
    { id: 'sdr_approval', label: 'Require approval for SDR runs', description: 'All SDR playbook runs must be approved by an admin before starting', enabled: false },
    { id: 'bulk_delete_approval', label: 'Require approval for bulk deletes', description: 'Bulk delete of contacts, leads, or deals requires admin sign-off', enabled: true },
    { id: 'quote_approval', label: 'Quote approval workflow', description: 'Quotes above ₹5,00,000 must be approved before sending', enabled: true },
  ],
  automation: [
    { id: 'automation_cooldown', label: 'Enforce sequence cooldowns', description: 'Minimum 24h between automated touches per contact', enabled: true },
    { id: 'max_contacts_per_run', label: 'Cap contacts per SDR run', description: 'Maximum 500 contacts per single SDR playbook run', enabled: true },
    { id: 'blackout_hours', label: 'Blackout hours enforcement', description: 'Block automated messages between 10 PM and 8 AM', enabled: false },
  ],
  data_access: [
    { id: 'pii_redaction', label: 'PII auto-redaction in transcripts', description: 'Automatically redact names, phone numbers, and emails in call transcripts', enabled: true },
    { id: 'data_export_approval', label: 'Approve data exports', description: 'CSV/JSON exports require admin approval before download', enabled: false },
    { id: 'retention_90d', label: '90-day audit log retention', description: 'Purge audit logs older than 90 days automatically', enabled: false },
  ],
  compliance: [
    { id: 'trai_dnd', label: 'TRAI DND suppression', description: 'Suppress calls and SMS to numbers on the DND registry', enabled: true },
    { id: 'gdpr_consent', label: 'Require GDPR consent for email', description: 'Block marketing emails to contacts without explicit consent', enabled: true },
    { id: 'dpdpa_rights', label: 'DPDPA data subject rights', description: 'Enable self-service data deletion and portability requests', enabled: false },
  ],
  roles: [
    { id: 'crm_admin_only_delete', label: 'Restrict contact deletion to admins', description: 'Only CRM admins can permanently delete contacts', enabled: true },
    { id: 'finance_readonly_default', label: 'Finance module read-only by default', description: 'New users get read-only finance access unless explicitly granted write', enabled: false },
    { id: 'sdr_write_requires_approval', label: 'SDR write requires role approval', description: 'crm:sdr:write permission must be explicitly granted by admin', enabled: true },
  ],
}

export default function PoliciesPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const [activeSection, setActiveSection] = useState('ai_limits')
  const [policies, setPolicies] = useState(DEFAULT_POLICIES)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const toggle = (sectionId: string, policyId: string) => {
    setPolicies((prev) => ({
      ...prev,
      [sectionId]: prev[sectionId].map((p) =>
        p.id === policyId ? { ...p, enabled: !p.enabled } : p
      ),
    }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 600))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const activeToggles = policies[activeSection] ?? []
  const activeSection_ = POLICY_SECTIONS.find((s) => s.id === activeSection)!

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-blue-600" />
            Admin Policies
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure approval gates, AI limits, compliance rules, and automation guardrails.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className={saved ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Policies'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left nav */}
        <div className="space-y-1">
          {POLICY_SECTIONS.map((section) => {
            const Icon = section.icon
            const enabledCount = (policies[section.id] ?? []).filter((p) => p.enabled).length
            const total = (policies[section.id] ?? []).length
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeSection === section.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${section.color} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{section.label}</p>
                </div>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {enabledCount}/{total}
                </Badge>
              </button>
            )
          })}
        </div>

        {/* Right panel */}
        <div className="lg:col-span-3 space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <activeSection_.icon className={`w-5 h-5 ${activeSection_.color}`} />
                <CardTitle className="text-base">{activeSection_.label}</CardTitle>
              </div>
              <CardDescription>{activeSection_.description}</CardDescription>
            </CardHeader>
          </Card>

          {activeToggles.map((policy) => (
            <Card key={policy.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{policy.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{policy.description}</p>
                  </div>
                  <button
                    onClick={() => toggle(activeSection, policy.id)}
                    className="shrink-0 mt-0.5 cursor-pointer"
                    aria-label={policy.enabled ? 'Disable' : 'Enable'}
                    title={saving ? 'Please wait' : undefined}
                    disabled={saving}
                  >
                    {policy.enabled ? (
                      <ToggleRight className="w-8 h-8 text-blue-600" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-400" />
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Warning banner */}
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Policy changes take effect immediately for new actions. In-flight automation runs use the policies that were active when they started.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
