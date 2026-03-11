'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Clock, LogIn, LogOut, CheckCircle, AlertCircle, Calendar, MapPin } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { useAuthStore } from '@/lib/stores/auth'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { PageLoading } from '@/components/ui/loading'

export default function HRAttendanceMarkPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!
  const { token } = useAuthStore()
  const [remarks, setRemarks] = useState('')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)

  // Get current time
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Get location if available
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        () => {
          // Location permission denied or unavailable
          setLocation(null)
        }
      )
    }
  }, [])

  // Fetch current attendance status
  const { data: attendanceStatus, isLoading, refetch } = useQuery({
    queryKey: ['my-attendance-status', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/hr/attendance/my-status', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        // Return error shape so UI can show hint and loginEmail
        return {
          _error: true,
          message: body.error || 'Failed to fetch attendance status',
          hint: body.hint,
          loginEmail: body.loginEmail,
        }
      }
      return body
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Check In Mutation
  const checkIn = useMutation({
    mutationFn: async (data: { remarks?: string; latitude?: number; longitude?: number }) => {
      const res = await fetch('/api/hr/attendance/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employeeId: attendanceStatus?.employee.id,
          remarks: data.remarks,
          checkInLatitude: data.latitude,
          checkInLongitude: data.longitude,
          source: 'WEB',
        }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to check in')
      }
      return res.json()
    },
    onSuccess: () => {
      refetch()
      setRemarks('')
      alert('Checked in successfully!')
    },
  })

  // Check Out Mutation
  const checkOut = useMutation({
    mutationFn: async (data: { remarks?: string }) => {
      const res = await fetch('/api/hr/attendance/check-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employeeId: attendanceStatus?.employee.id,
          remarks: data.remarks,
        }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to check out')
      }
      return res.json()
    },
    onSuccess: () => {
      refetch()
      setRemarks('')
      alert('Checked out successfully!')
    },
  })

  const handleCheckIn = () => {
    if (!attendanceStatus?.canCheckIn) {
      alert('You have already checked in today!')
      return
    }
    checkIn.mutate({
      remarks: remarks || undefined,
      latitude: location?.lat,
      longitude: location?.lng,
    })
  }

  const handleCheckOut = () => {
    if (!attendanceStatus?.canCheckOut) {
      alert('Please check in first or you have already checked out!')
      return
    }
    checkOut.mutate({
      remarks: remarks || undefined,
    })
  }

  if (isLoading) {
    return <PageLoading message="Loading attendance status..." fullScreen={true} />
  }

  const isEmployeeNotFound = attendanceStatus && (attendanceStatus as any)._error === true
  const errorPayload = isEmployeeNotFound ? (attendanceStatus as { message: string; hint?: string; loginEmail?: string }) : null

  if (isEmployeeNotFound && errorPayload) {
    return (
      <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
        <UniversalModuleHero
          moduleName="Mark Attendance"
          moduleIcon={<Clock className="w-8 h-8" />}
          gradientFrom={moduleConfig.gradientFrom}
          gradientTo={moduleConfig.gradientTo}
          description="Clock In / Clock Out"
        />
        <div className="p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12 max-w-lg mx-auto">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                <p className="text-lg font-semibold mb-2">Employee Record Not Found</p>
                <p className="text-muted-foreground mb-4">
                  {errorPayload.message}
                </p>
                {errorPayload.hint && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {errorPayload.hint}
                  </p>
                )}
                {errorPayload.loginEmail && (
                  <p className="text-sm font-medium mt-4 p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                    Your login email: <span className="font-mono text-primary">{errorPayload.loginEmail}</span>
                    <br />
                    <span className="text-xs font-normal text-muted-foreground mt-1 block">Share this with HR so they can set it as Official Email or link your account to your employee record.</span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!attendanceStatus || !('employee' in attendanceStatus) || !attendanceStatus.employee) {
    return null
  }

  const { employee, today, canCheckIn, canCheckOut } = attendanceStatus

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Mark Attendance"
        moduleIcon={<Clock className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="Clock In / Clock Out"
      />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Employee Info Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{employee.name}</h3>
                <p className="text-sm text-muted-foreground">Employee Code: {employee.employeeCode}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-lg font-semibold">{format(new Date(today.date), 'EEEE, MMMM d, yyyy')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Time Display */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Current Time</p>
              <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                {format(currentTime, 'HH:mm:ss')}
              </p>
              <p className="text-sm text-muted-foreground mt-2">{format(currentTime, 'EEEE, MMMM d, yyyy')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Attendance</CardTitle>
            <CardDescription>Your check-in and check-out times</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <LogIn className="h-5 w-5 text-green-600" />
                  <Label className="text-sm font-semibold">Check In</Label>
                </div>
                {today.checkInTime ? (
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {format(new Date(today.checkInTime), 'HH:mm')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(today.checkInTime), 'MMM d, yyyy')}
                    </p>
                  </div>
                ) : (
                  <p className="text-lg text-muted-foreground">Not checked in</p>
                )}
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <LogOut className="h-5 w-5 text-blue-600" />
                  <Label className="text-sm font-semibold">Check Out</Label>
                </div>
                {today.checkOutTime ? (
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {format(new Date(today.checkOutTime), 'HH:mm')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(today.checkOutTime), 'MMM d, yyyy')}
                    </p>
                  </div>
                ) : (
                  <p className="text-lg text-muted-foreground">Not checked out</p>
                )}
              </div>
            </div>

            {today.workHours !== null && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <Label className="text-sm font-semibold">Work Hours Today</Label>
                  </div>
                  <p className="text-xl font-bold text-purple-600">{today.workHours.toFixed(2)} hours</p>
                </div>
              </div>
            )}

            {today.status && (
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    today.status === 'PRESENT'
                      ? 'default'
                      : today.status === 'HALF_DAY'
                      ? 'secondary'
                      : 'destructive'
                  }
                >
                  {today.status}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Mark Attendance</CardTitle>
            <CardDescription>Click to check in or check out</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="remarks">Remarks (Optional)</Label>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add any remarks about your attendance..."
                rows={3}
                className="mt-1"
              />
            </div>

            {location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
              </div>
            )}

            <div className="flex gap-4">
              <motion.div
                className="flex-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleCheckIn}
                  disabled={!canCheckIn || checkIn.isPending}
                  className="w-full h-20 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  size="lg"
                >
                  <LogIn className="mr-2 h-6 w-6" />
                  {checkIn.isPending ? 'Checking In...' : 'Clock In'}
                </Button>
              </motion.div>

              <motion.div
                className="flex-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleCheckOut}
                  disabled={!canCheckOut || checkOut.isPending}
                  variant="outline"
                  className="w-full h-20 text-lg border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  size="lg"
                >
                  <LogOut className="mr-2 h-6 w-6" />
                  {checkOut.isPending ? 'Checking Out...' : 'Clock Out'}
                </Button>
              </motion.div>
            </div>

            {(checkIn.error || checkOut.error) && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                {checkIn.error instanceof Error
                  ? checkIn.error.message
                  : checkOut.error instanceof Error
                  ? checkOut.error.message
                  : 'An error occurred'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold mb-1">Important Notes:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>You can only check in once per day</li>
                  <li>You must check in before checking out</li>
                  <li>Work hours are calculated automatically</li>
                  <li>Location is captured automatically if permission is granted</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
