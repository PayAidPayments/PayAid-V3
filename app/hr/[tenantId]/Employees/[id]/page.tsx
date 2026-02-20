'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageLoading } from '@/components/ui/loading'
import { format } from 'date-fns'
import { FlightRiskCard } from '@/components/hr/FlightRiskCard'
import { useAuthStore } from '@/lib/stores/auth'

interface Employee {
  id: string
  employeeCode: string
  firstName: string
  lastName: string
  officialEmail: string
  personalEmail?: string
  mobileCountryCode: string
  mobileNumber: string
  joiningDate: string
  probationEndDate?: string
  confirmationDate?: string
  exitDate?: string
  exitReason?: string
  status: string
  department?: { id: string; name: string }
  designation?: { id: string; name: string }
  location?: { id: string; name: string; city?: string; state?: string }
  manager?: { id: string; firstName: string; lastName: string; employeeCode: string }
  reports?: Array<{ id: string; firstName: string; lastName: string; employeeCode: string }>
  ctcAnnualInr?: number
  fixedComponentInr?: number
  variableComponentInr?: number
  pfApplicable: boolean
  esiApplicable: boolean
  ptApplicable: boolean
  tdsApplicable: boolean
}

export default function HREmployeeDetailPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const id = params.id as string
  const { token } = useAuthStore()

  const { data: employee, isLoading } = useQuery<Employee>({
    queryKey: ['employee', id],
    queryFn: async () => {
      const response = await fetch(`/api/hr/employees/${id}`)
      if (!response.ok) throw new Error('Failed to fetch employee')
      return response.json()
    },
  })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      PROBATION: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      NOTICE: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      EXITED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }

  if (isLoading) {
    return <PageLoading message="Loading employee details..." fullScreen={false} />
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Employee not found</p>
        <Link href={`/hr/${tenantId}/Employees`}>
          <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Back to Employees</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {employee.firstName} {employee.lastName}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Employee Code: {employee.employeeCode}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/hr/${tenantId}/Employees/${id}/Edit`}>
            <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Edit</Button>
          </Link>
          <Link href={`/hr/${tenantId}/Employees`}>
            <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Back</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(employee.status)}>
              {employee.status}
            </Badge>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Joining Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold dark:text-gray-100">
              {employee.joiningDate
                ? format(new Date(employee.joiningDate), 'MMMM dd, yyyy')
                : '-'}
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">CTC (Annual)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold dark:text-gray-100">
              {employee.ctcAnnualInr
                ? `₹${Number(employee.ctcAnnualInr).toLocaleString('en-IN')}`
                : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">First Name</div>
              <div className="font-medium dark:text-gray-100">{employee.firstName}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Last Name</div>
              <div className="font-medium dark:text-gray-100">{employee.lastName}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Official Email</div>
              <div className="font-medium dark:text-gray-100">{employee.officialEmail}</div>
            </div>
            {employee.personalEmail && (
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Personal Email</div>
                <div className="font-medium dark:text-gray-100">{employee.personalEmail}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Mobile Number</div>
              <div className="font-medium dark:text-gray-100">
                {employee.mobileCountryCode} {employee.mobileNumber}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Employment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Department</div>
              <div className="font-medium dark:text-gray-100">{employee.department?.name || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Designation</div>
              <div className="font-medium dark:text-gray-100">{employee.designation?.name || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Location</div>
              <div className="font-medium dark:text-gray-100">
                {employee.location?.name || '-'}
                {employee.location?.city && employee.location?.state && (
                  <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
                    ({employee.location.city}, {employee.location.state})
                  </span>
                )}
              </div>
            </div>
            {employee.manager && (
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Manager</div>
                <div className="font-medium dark:text-gray-100">
                  {employee.manager.firstName} {employee.manager.lastName} (
                  {employee.manager.employeeCode})
                </div>
              </div>
            )}
            {employee.probationEndDate && (
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Probation End Date</div>
                <div className="font-medium dark:text-gray-100">
                  {format(new Date(employee.probationEndDate), 'MMMM dd, yyyy')}
                </div>
              </div>
            )}
            {employee.confirmationDate && (
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Confirmation Date</div>
                <div className="font-medium dark:text-gray-100">
                  {format(new Date(employee.confirmationDate), 'MMMM dd, yyyy')}
                </div>
              </div>
            )}
            {employee.exitDate && (
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Exit Date</div>
                <div className="font-medium dark:text-gray-100">
                  {format(new Date(employee.exitDate), 'MMMM dd, yyyy')}
                </div>
              </div>
            )}
            {employee.exitReason && (
              <div className="col-span-2">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Exit Reason</div>
                <div className="font-medium dark:text-gray-100">{employee.exitReason}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {(employee.ctcAnnualInr || employee.fixedComponentInr || employee.variableComponentInr) && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Compensation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {employee.ctcAnnualInr && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">CTC (Annual)</div>
                  <div className="text-lg font-semibold dark:text-gray-100">
                    ₹{Number(employee.ctcAnnualInr).toLocaleString('en-IN')}
                  </div>
                </div>
              )}
              {employee.fixedComponentInr && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Fixed Component</div>
                  <div className="text-lg font-semibold dark:text-gray-100">
                    ₹{Number(employee.fixedComponentInr).toLocaleString('en-IN')}
                  </div>
                </div>
              )}
              {employee.variableComponentInr && (
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Variable Component</div>
                  <div className="text-lg font-semibold dark:text-gray-100">
                    ₹{Number(employee.variableComponentInr).toLocaleString('en-IN')}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Statutory Applicability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">PF Applicable</div>
              <div className="font-medium dark:text-gray-100">{employee.pfApplicable ? 'Yes' : 'No'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">ESI Applicable</div>
              <div className="font-medium dark:text-gray-100">{employee.esiApplicable ? 'Yes' : 'No'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">PT Applicable</div>
              <div className="font-medium dark:text-gray-100">{employee.ptApplicable ? 'Yes' : 'No'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">TDS Applicable</div>
              <div className="font-medium dark:text-gray-100">{employee.tdsApplicable ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flight Risk Assessment */}
      {employee.status === 'ACTIVE' && (
        <FlightRiskCard employeeId={id} tenantId={tenantId} token={token} />
      )}

      {employee.reports && employee.reports.length > 0 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Direct Reports</CardTitle>
            <CardDescription className="dark:text-gray-400">{employee.reports.length} employee(s) report to this employee</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {employee.reports.map((report) => (
                <Link
                  key={report.id}
                  href={`/hr/${tenantId}/Employees/${report.id}`}
                  className="block p-3 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="font-medium dark:text-gray-100">
                    {report.firstName} {report.lastName}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{report.employeeCode}</div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
