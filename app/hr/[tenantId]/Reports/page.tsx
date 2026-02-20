'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BarChart3, Download, Search, Filter, FileText, TrendingUp, Users, IndianRupee } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'

export default function HRReportsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!
  const [searchQuery, setSearchQuery] = useState('')

  // Mock report categories
  const reportCategories = [
    {
      category: 'Payroll Reports',
      reports: [
        { id: '1', name: 'Monthly Payroll Summary', description: 'Complete payroll breakdown for the month', icon: IndianRupee },
        { id: '2', name: 'Payroll Register', description: 'Detailed register of all payroll transactions', icon: FileText },
        { id: '3', name: 'Salary Statement', description: 'Individual salary statements', icon: Users },
        { id: '4', name: 'Arrears Report', description: 'Arrears calculation and payment details', icon: TrendingUp },
      ],
    },
    {
      category: 'Attendance Reports',
      reports: [
        { id: '5', name: 'Attendance Summary', description: 'Monthly attendance summary', icon: Users },
        { id: '6', name: 'Late Coming Report', description: 'Employees with late arrivals', icon: FileText },
        { id: '7', name: 'Overtime Report', description: 'Overtime hours and costs', icon: TrendingUp },
      ],
    },
    {
      category: 'Leave Reports',
      reports: [
        { id: '8', name: 'Leave Balance Report', description: 'Current leave balances for all employees', icon: Users },
        { id: '9', name: 'Leave Utilization', description: 'Leave usage trends', icon: BarChart3 },
      ],
    },
    {
      category: 'Compliance Reports',
      reports: [
        { id: '10', name: 'PF/ECR Report', description: 'Provident Fund contribution report', icon: FileText },
        { id: '11', name: 'ESI Report', description: 'Employee State Insurance report', icon: FileText },
        { id: '12', name: 'TDS Report', description: 'Tax Deducted at Source report', icon: FileText },
        { id: '13', name: 'PT Report', description: 'Professional Tax report', icon: FileText },
      ],
    },
    {
      category: 'Performance Reports',
      reports: [
        { id: '14', name: 'OKR Progress Report', description: 'Objectives and Key Results progress', icon: TrendingUp },
        { id: '15', name: '360 Review Summary', description: '360-degree feedback summary', icon: Users },
      ],
    },
  ]

  const filteredReports = reportCategories.map(cat => ({
    ...cat,
    reports: cat.reports.filter(r =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(cat => cat.reports.length > 0)

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Reports & Analytics"
        moduleIcon={<BarChart3 className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="200+ Custom Reports"
      />

      <div className="p-6 space-y-6">
        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Categories */}
        <div className="space-y-6">
          {filteredReports.map((category) => (
            <Card key={category.category}>
              <CardHeader>
                <CardTitle>{category.category}</CardTitle>
                <CardDescription>{category.reports.length} reports available</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.reports.map((report) => {
                    const Icon = report.icon
                    return (
                      <Card
                        key={report.id}
                        className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-purple-500"
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                              <Icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm mb-1">{report.name}</h3>
                              <p className="text-xs text-muted-foreground mb-3">{report.description}</p>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1">
                                  <BarChart3 className="mr-2 h-3 w-3" />
                                  View
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Custom Reports Banner */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Need a Custom Report?</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Create custom reports with specific filters, date ranges, and data points tailored to your needs.
                </p>
              </div>
              <Button>
                Create Custom Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
