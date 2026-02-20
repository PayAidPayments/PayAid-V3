'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Settings, Users, Zap, Shield, Bell, Database, Key, Sparkles, IndianRupee, Calendar, FileText, Building2, Receipt, ExternalLink } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/lib/stores/auth'
import { useQuery, useMutation } from '@tanstack/react-query'
import { formatINRForDisplay } from '@/lib/utils/formatINR'

export default function HRSettingsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!
  const { token } = useAuthStore()
  const [aiEnabled, setAiEnabled] = useState(true)
  const [autoPayroll, setAutoPayroll] = useState(true)
  const [whatsappNotifications, setWhatsappNotifications] = useState(true)

  // Payroll Configuration State
  const [pfConfig, setPfConfig] = useState({
    wageCeiling: 15000,
    employeePercent: 12,
    employerPercent: 12,
    epsPercent: 3.67,
    pfPercent: 8.33,
  })
  const [esiConfig, setEsiConfig] = useState({
    wageCeiling: 21000,
    employeePercent: 0.75,
    employerPercent: 3.25,
  })
  const [ptConfigs, setPtConfigs] = useState<any[]>([])

  // Fetch PF Config
  const { data: pfData } = useQuery({
    queryKey: ['pf-config', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/hr/payroll/statutory/pf-config', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch PF config')
      const data = await res.json()
      setPfConfig({
        wageCeiling: parseFloat(data.wageCeiling),
        employeePercent: parseFloat(data.employeePercent),
        employerPercent: parseFloat(data.employerPercent),
        epsPercent: parseFloat(data.epsPercent),
        pfPercent: parseFloat(data.pfPercent),
      })
      return data
    },
    enabled: !!tenantId && !!token,
  })

  // Fetch ESI Config
  const { data: esiData } = useQuery({
    queryKey: ['esi-config', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/hr/payroll/statutory/esi-config', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch ESI config')
      const data = await res.json()
      setEsiConfig({
        wageCeiling: parseFloat(data.wageCeiling),
        employeePercent: parseFloat(data.employeePercent),
        employerPercent: parseFloat(data.employerPercent),
      })
      return data
    },
    enabled: !!tenantId && !!token,
  })

  // Fetch PT Configs
  const { data: ptData } = useQuery({
    queryKey: ['pt-configs', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/hr/payroll/statutory/pt-config', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch PT configs')
      const data = await res.json()
      setPtConfigs(data.configs || [])
      return data
    },
    enabled: !!tenantId && !!token,
  })

  // Update PF Config Mutation
  const updatePFConfig = useMutation({
    mutationFn: async (data: typeof pfConfig) => {
      const res = await fetch('/api/hr/payroll/statutory/pf-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update PF config')
      return res.json()
    },
    onSuccess: () => {
      alert('PF Configuration updated successfully!')
    },
  })

  // Update ESI Config Mutation
  const updateESIConfig = useMutation({
    mutationFn: async (data: typeof esiConfig) => {
      const res = await fetch('/api/hr/payroll/statutory/esi-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update ESI config')
      return res.json()
    },
    onSuccess: () => {
      alert('ESI Configuration updated successfully!')
    },
  })

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="HR Settings"
        moduleIcon={<Settings className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="Roles, Integrations & AI Configuration"
      />

      <div className="p-6 space-y-6">
        {/* Tabs */}
        <Tabs defaultValue="payroll" className="space-y-4">
          <TabsList>
            <TabsTrigger value="payroll">Payroll Configuration</TabsTrigger>
            <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="ai">AI Configuration</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="payroll" className="space-y-6">
            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href={`/hr/${tenantId}/Salary-Structures`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Salary Structures</h3>
                        <p className="text-sm text-muted-foreground">Manage salary components</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href={`/hr/${tenantId}/Payroll-Runs`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Payroll Cycles</h3>
                        <p className="text-sm text-muted-foreground">Manage payroll runs</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href={`/hr/${tenantId}/Statutory-Compliance`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Compliance</h3>
                        <p className="text-sm text-muted-foreground">View compliance reports</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* PF Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5" />
                  Provident Fund (PF) Configuration
                </CardTitle>
                <CardDescription>Configure PF wage ceiling, employee and employer contribution percentages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pf-wage-ceiling">Wage Ceiling (₹)</Label>
                    <Input
                      id="pf-wage-ceiling"
                      type="number"
                      value={pfConfig.wageCeiling}
                      onChange={(e) => setPfConfig({ ...pfConfig, wageCeiling: parseFloat(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-muted-foreground">Default: ₹15,000</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pf-employee-percent">Employee Contribution (%)</Label>
                    <Input
                      id="pf-employee-percent"
                      type="number"
                      step="0.01"
                      value={pfConfig.employeePercent}
                      onChange={(e) => setPfConfig({ ...pfConfig, employeePercent: parseFloat(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-muted-foreground">Default: 12%</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pf-employer-percent">Employer Contribution (%)</Label>
                    <Input
                      id="pf-employer-percent"
                      type="number"
                      step="0.01"
                      value={pfConfig.employerPercent}
                      onChange={(e) => setPfConfig({ ...pfConfig, employerPercent: parseFloat(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-muted-foreground">Default: 12%</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pf-eps-percent">EPS Percentage (%)</Label>
                    <Input
                      id="pf-eps-percent"
                      type="number"
                      step="0.01"
                      value={pfConfig.epsPercent}
                      onChange={(e) => setPfConfig({ ...pfConfig, epsPercent: parseFloat(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-muted-foreground">Default: 3.67%</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pf-pf-percent">PF Percentage (%)</Label>
                    <Input
                      id="pf-pf-percent"
                      type="number"
                      step="0.01"
                      value={pfConfig.pfPercent}
                      onChange={(e) => setPfConfig({ ...pfConfig, pfPercent: parseFloat(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-muted-foreground">Default: 8.33%</p>
                  </div>
                </div>
                <Button
                  onClick={() => updatePFConfig.mutate(pfConfig)}
                  disabled={updatePFConfig.isPending}
                >
                  {updatePFConfig.isPending ? 'Saving...' : 'Save PF Configuration'}
                </Button>
              </CardContent>
            </Card>

            {/* ESI Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Employee State Insurance (ESI) Configuration
                </CardTitle>
                <CardDescription>Configure ESI wage ceiling and contribution percentages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="esi-wage-ceiling">Wage Ceiling (₹)</Label>
                    <Input
                      id="esi-wage-ceiling"
                      type="number"
                      value={esiConfig.wageCeiling}
                      onChange={(e) => setEsiConfig({ ...esiConfig, wageCeiling: parseFloat(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-muted-foreground">Default: ₹21,000</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="esi-employee-percent">Employee Contribution (%)</Label>
                    <Input
                      id="esi-employee-percent"
                      type="number"
                      step="0.01"
                      value={esiConfig.employeePercent}
                      onChange={(e) => setEsiConfig({ ...esiConfig, employeePercent: parseFloat(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-muted-foreground">Default: 0.75%</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="esi-employer-percent">Employer Contribution (%)</Label>
                    <Input
                      id="esi-employer-percent"
                      type="number"
                      step="0.01"
                      value={esiConfig.employerPercent}
                      onChange={(e) => setEsiConfig({ ...esiConfig, employerPercent: parseFloat(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-muted-foreground">Default: 3.25%</p>
                  </div>
                </div>
                <Button
                  onClick={() => updateESIConfig.mutate(esiConfig)}
                  disabled={updateESIConfig.isPending}
                >
                  {updateESIConfig.isPending ? 'Saving...' : 'Save ESI Configuration'}
                </Button>
              </CardContent>
            </Card>

            {/* Professional Tax Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Professional Tax (PT) Configuration
                </CardTitle>
                <CardDescription>State-wise Professional Tax slabs (configured per state)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {ptConfigs.length > 0 ? (
                  <div className="space-y-4">
                    {ptConfigs.map((config: any) => (
                      <div key={config.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{config.state}</h4>
                          <Badge variant="outline">{config.ptSlabs?.length || 0} Slabs</Badge>
                        </div>
                        {config.ptSlabs && config.ptSlabs.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {config.ptSlabs.map((slab: any, idx: number) => (
                              <p key={idx} className="text-sm text-muted-foreground">
                                ₹{formatINRForDisplay(parseFloat(slab.salaryFrom))} - {slab.salaryTo ? `₹${formatINRForDisplay(parseFloat(slab.salaryTo))}` : 'Above'}: PT = ₹{formatINRForDisplay(parseFloat(slab.ptAmountInr))}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No PT configurations found. PT slabs are configured per state.</p>
                    <p className="text-sm mt-2">Contact support to add PT configurations for your states.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* TDS Configuration Note */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5" />
                  Tax Deducted at Source (TDS) & Income Tax
                </CardTitle>
                <CardDescription>TDS calculation is based on annual projection method with tax declarations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>TDS Configuration:</strong> TDS is calculated automatically based on:
                  </p>
                  <ul className="list-disc list-inside mt-2 text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>Annual salary projection</li>
                    <li>Tax declarations submitted by employees</li>
                    <li>Standard deduction (₹50,000)</li>
                    <li>Current tax slabs</li>
                  </ul>
                  <p className="text-sm text-blue-900 dark:text-blue-100 mt-3">
                    Employees can submit tax declarations through their profile. TDS is calculated monthly based on the annual projection.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Roles & Permissions</CardTitle>
                <CardDescription>Manage user roles and access permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">HR Admin</h3>
                      <p className="text-sm text-muted-foreground">Full access to all HR functions</p>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">HR Manager</h3>
                      <p className="text-sm text-muted-foreground">Manage employees, payroll, and reports</p>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">Employee</h3>
                      <p className="text-sm text-muted-foreground">Self-service access only</p>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>
                <Button>
                  <Users className="mr-2 h-4 w-4" />
                  Create New Role
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Integrations</CardTitle>
                <CardDescription>Connect with external services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Biometric Attendance</h3>
                        <p className="text-sm text-muted-foreground">Connect biometric devices</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Connected</Badge>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <Bell className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">WhatsApp</h3>
                        <p className="text-sm text-muted-foreground">Send notifications via WhatsApp</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Connected</Badge>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <Key className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Tally Integration</h3>
                        <p className="text-sm text-muted-foreground">Sync payroll data with Tally</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Not Connected</Badge>
                      <Button variant="outline" size="sm">Connect</Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                        <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">PayAid Payments</h3>
                        <p className="text-sm text-muted-foreground">Direct deposit integration</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Connected</Badge>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Configuration</CardTitle>
                <CardDescription>Configure AI-powered features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <div>
                      <Label htmlFor="ai-enabled" className="font-semibold">AI Insights</Label>
                      <p className="text-sm text-muted-foreground">Enable AI-powered insights and predictions</p>
                    </div>
                  </div>
                  <Switch
                    id="ai-enabled"
                    checked={aiEnabled}
                    onCheckedChange={setAiEnabled}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <Label htmlFor="auto-payroll" className="font-semibold">Auto Payroll Processing</Label>
                      <p className="text-sm text-muted-foreground">Automatically process payroll on scheduled dates</p>
                    </div>
                  </div>
                  <Switch
                    id="auto-payroll"
                    checked={autoPayroll}
                    onCheckedChange={setAutoPayroll}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <Label htmlFor="flight-risk" className="font-semibold">Flight Risk Prediction</Label>
                      <p className="text-sm text-muted-foreground">Predict employee flight risk using AI</p>
                    </div>
                  </div>
                  <Switch
                    id="flight-risk"
                    checked={aiEnabled}
                    onCheckedChange={setAiEnabled}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <Label htmlFor="resume-screening" className="font-semibold">AI Resume Screening</Label>
                      <p className="text-sm text-muted-foreground">Automatically screen resumes using AI</p>
                    </div>
                  </div>
                  <Switch
                    id="resume-screening"
                    checked={aiEnabled}
                    onCheckedChange={setAiEnabled}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <Label htmlFor="whatsapp-notifications" className="font-semibold">WhatsApp Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send payslips and leave notifications via WhatsApp</p>
                    </div>
                  </div>
                  <Switch
                    id="whatsapp-notifications"
                    checked={whatsappNotifications}
                    onCheckedChange={setWhatsappNotifications}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <Label htmlFor="email-notifications" className="font-semibold">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send notifications via email</p>
                    </div>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={true}
                    onCheckedChange={() => {}}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
