'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'

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

export default function EmployeeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

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
      ACTIVE: 'bg-green-100 text-green-800',
      PROBATION: 'bg-yellow-100 text-yellow-800',
      NOTICE: 'bg-orange-100 text-orange-800',
      EXITED: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Employee not found</p>
        <Link href="/dashboard/hr/employees">
          <Button>Back to Employees</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {employee.firstName} {employee.lastName}
          </h1>
          <p className="mt-2 text-gray-600">Employee Code: {employee.employeeCode}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/hr/employees/${id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
          <Link href="/dashboard/hr/employees">
            <Button variant="outline">Back</Button>
          </Link>
        </div>
      </div>

      {/* Status and Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                employee.status
              )}`}
            >
              {employee.status}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Joining Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {employee.joiningDate
                ? format(new Date(employee.joiningDate), 'MMMM dd, yyyy')
                : '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">CTC (Annual)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {employee.ctcAnnualInr
                ? `₹${Number(employee.ctcAnnualInr).toLocaleString('en-IN')}`
                : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">First Name</div>
              <div className="font-medium">{employee.firstName}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Last Name</div>
              <div className="font-medium">{employee.lastName}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Official Email</div>
              <div className="font-medium">{employee.officialEmail}</div>
            </div>
            {employee.personalEmail && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Personal Email</div>
                <div className="font-medium">{employee.personalEmail}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-gray-600 mb-1">Mobile Number</div>
              <div className="font-medium">
                {employee.mobileCountryCode} {employee.mobileNumber}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employment Details */}
      <Card>
        <CardHeader>
          <CardTitle>Employment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Department</div>
              <div className="font-medium">{employee.department?.name || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Designation</div>
              <div className="font-medium">{employee.designation?.name || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Location</div>
              <div className="font-medium">
                {employee.location?.name || '-'}
                {employee.location?.city && employee.location?.state && (
                  <span className="text-gray-500 text-sm ml-2">
                    ({employee.location.city}, {employee.location.state})
                  </span>
                )}
              </div>
            </div>
            {employee.manager && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Manager</div>
                <div className="font-medium">
                  {employee.manager.firstName} {employee.manager.lastName} (
                  {employee.manager.employeeCode})
                </div>
              </div>
            )}
            {employee.probationEndDate && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Probation End Date</div>
                <div className="font-medium">
                  {format(new Date(employee.probationEndDate), 'MMMM dd, yyyy')}
                </div>
              </div>
            )}
            {employee.confirmationDate && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Confirmation Date</div>
                <div className="font-medium">
                  {format(new Date(employee.confirmationDate), 'MMMM dd, yyyy')}
                </div>
              </div>
            )}
            {employee.exitDate && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Exit Date</div>
                <div className="font-medium">
                  {format(new Date(employee.exitDate), 'MMMM dd, yyyy')}
                </div>
              </div>
            )}
            {employee.exitReason && (
              <div className="col-span-2">
                <div className="text-sm text-gray-600 mb-1">Exit Reason</div>
                <div className="font-medium">{employee.exitReason}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Compensation */}
      {(employee.ctcAnnualInr || employee.fixedComponentInr || employee.variableComponentInr) && (
        <Card>
          <CardHeader>
            <CardTitle>Compensation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {employee.ctcAnnualInr && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">CTC (Annual)</div>
                  <div className="text-lg font-semibold">
                    ₹{Number(employee.ctcAnnualInr).toLocaleString('en-IN')}
                  </div>
                </div>
              )}
              {employee.fixedComponentInr && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Fixed Component</div>
                  <div className="text-lg font-semibold">
                    ₹{Number(employee.fixedComponentInr).toLocaleString('en-IN')}
                  </div>
                </div>
              )}
              {employee.variableComponentInr && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">Variable Component</div>
                  <div className="text-lg font-semibold">
                    ₹{Number(employee.variableComponentInr).toLocaleString('en-IN')}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statutory Applicability */}
      <Card>
        <CardHeader>
          <CardTitle>Statutory Applicability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">PF Applicable</div>
              <div className="font-medium">{employee.pfApplicable ? 'Yes' : 'No'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">ESI Applicable</div>
              <div className="font-medium">{employee.esiApplicable ? 'Yes' : 'No'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">PT Applicable</div>
              <div className="font-medium">{employee.ptApplicable ? 'Yes' : 'No'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">TDS Applicable</div>
              <div className="font-medium">{employee.tdsApplicable ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Direct Reports */}
      {employee.reports && employee.reports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Direct Reports</CardTitle>
            <CardDescription>{employee.reports.length} employee(s) report to this employee</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {employee.reports.map((report) => (
                <Link
                  key={report.id}
                  href={`/dashboard/hr/employees/${report.id}`}
                  className="block p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium">
                    {report.firstName} {report.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{report.employeeCode}</div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
