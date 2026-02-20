'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Clock, Calendar, MapPin, Camera, Users, TrendingUp, AlertCircle, CheckCircle, Upload, Download, Settings, Zap } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

export default function HRAttendancePage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!

  // Mock data
  const attendanceStats = {
    presentToday: 44,
    absentToday: 3,
    lateArrivals: 5,
    earlyDepartures: 2,
    presentRate: 94.5,
    avgWorkHours: 8.2,
    overtimeHours: 12,
  }

  const biometricDevices = [
    { id: '1', name: 'Office Main Gate', type: 'FACIAL_RECOGNITION', status: 'ACTIVE', lastSync: '2026-02-20 09:15:00', employees: 47 },
    { id: '2', name: 'Warehouse Entrance', type: 'FINGERPRINT', status: 'ACTIVE', lastSync: '2026-02-20 09:10:00', employees: 12 },
  ]

  const geoFences = [
    { id: '1', name: 'Bangalore Office', address: '123 MG Road, Bangalore', radius: 100, status: 'ACTIVE', employees: 35 },
    { id: '2', name: 'Mumbai Office', address: '456 Bandra, Mumbai', radius: 150, status: 'ACTIVE', employees: 12 },
  ]

  const attendanceTrend = [
    { month: 'Oct', presentRate: 92, lateArrivals: 8 },
    { month: 'Nov', presentRate: 93, lateArrivals: 7 },
    { month: 'Dec', presentRate: 94, lateArrivals: 6 },
    { month: 'Jan', presentRate: 94.5, lateArrivals: 5 },
  ]

  const shiftManagement = [
    { id: '1', name: 'General Shift', startTime: '09:00', endTime: '18:00', employees: 35, status: 'ACTIVE' },
    { id: '2', name: 'Night Shift', startTime: '18:00', endTime: '02:00', employees: 8, status: 'ACTIVE' },
    { id: '3', name: 'Flexible Hours', startTime: '10:00', endTime: '19:00', employees: 4, status: 'ACTIVE' },
  ]

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Attendance"
        moduleIcon={<Clock className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="Biometric/AI Facial Recognition & Geo-Fencing"
      />

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Present Today</p>
                  <p className="text-2xl font-bold">{attendanceStats.presentToday}/47</p>
                  <p className="text-xs text-muted-foreground mt-1">{attendanceStats.presentRate}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Late Arrivals</p>
                  <p className="text-2xl font-bold">{attendanceStats.lateArrivals}</p>
                  <p className="text-xs text-muted-foreground mt-1">Today</p>
                </div>
                <AlertCircle className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Work Hours</p>
                  <p className="text-2xl font-bold">{attendanceStats.avgWorkHours}h</p>
                  <p className="text-xs text-muted-foreground mt-1">This month</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overtime Hours</p>
                  <p className="text-2xl font-bold">{attendanceStats.overtimeHours}h</p>
                  <p className="text-xs text-muted-foreground mt-1">This week</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Biometric & AI Banner */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Camera className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Biometric & AI Facial Recognition</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">KredEYE-style facial recognition enabled for seamless check-in</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Configure
                </Button>
                <Link href={`/hr/${tenantId}/Attendance/Check-In`}>
                  <Button size="sm">
                    <Clock className="mr-2 h-4 w-4" />
                    Check In
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link href={`/hr/${tenantId}/Attendance/Calendar`}>
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              View Calendar
            </Button>
          </Link>
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Bulk Import
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Reports
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="biometric">Biometric Devices</TabsTrigger>
            <TabsTrigger value="geofencing">Geo-Fencing</TabsTrigger>
            <TabsTrigger value="shifts">Shift Management</TabsTrigger>
            <TabsTrigger value="overtime">Overtime Tracking</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            {/* Attendance Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Trends</CardTitle>
                <CardDescription>Monthly attendance rate and late arrivals</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={attendanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="presentRate" stroke="#53328A" name="Present Rate %" strokeWidth={2} />
                    <Line type="monotone" dataKey="lateArrivals" stroke="#F5C700" name="Late Arrivals" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Today's Attendance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Attendance Summary</CardTitle>
                <CardDescription>Real-time attendance status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Present</p>
                      <p className="text-sm text-muted-foreground">{attendanceStats.presentToday} employees</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{attendanceStats.presentRate}%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Absent</p>
                      <p className="text-sm text-muted-foreground">{attendanceStats.absentToday} employees</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-600">{Math.round((attendanceStats.absentToday / 47) * 100)}%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Late Arrivals</p>
                      <p className="text-sm text-muted-foreground">{attendanceStats.lateArrivals} employees</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-amber-600">{attendanceStats.lateArrivals}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="biometric" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Biometric Devices</CardTitle>
                    <CardDescription>Facial recognition and fingerprint devices</CardDescription>
                  </div>
                  <Button>
                    <Zap className="mr-2 h-4 w-4" />
                    Add Device
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Last Sync</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {biometricDevices.map((device) => (
                      <TableRow key={device.id}>
                        <TableCell className="font-medium">{device.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{device.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={device.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {device.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{device.employees}</TableCell>
                        <TableCell>{device.lastSync}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">Configure</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="geofencing" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Geo-Fencing</CardTitle>
                    <CardDescription>Location-based attendance tracking</CardDescription>
                  </div>
                  <Button>
                    <MapPin className="mr-2 h-4 w-4" />
                    Add Geo-Fence
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {geoFences.map((fence) => (
                    <Card key={fence.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{fence.name}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{fence.address}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <span>Radius: {fence.radius}m</span>
                              <span>•</span>
                              <span>{fence.employees} employees</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={fence.status === 'ACTIVE' ? 'default' : 'secondary'}>
                              {fence.status}
                            </Badge>
                            <Button variant="ghost" size="sm">Edit</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shifts" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Shift Management</CardTitle>
                    <CardDescription>Manage work shifts and schedules</CardDescription>
                  </div>
                  <Button>
                    <Clock className="mr-2 h-4 w-4" />
                    Create Shift
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shift Name</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>End Time</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shiftManagement.map((shift) => (
                      <TableRow key={shift.id}>
                        <TableCell className="font-medium">{shift.name}</TableCell>
                        <TableCell>{shift.startTime}</TableCell>
                        <TableCell>{shift.endTime}</TableCell>
                        <TableCell>{shift.employees}</TableCell>
                        <TableCell>
                          <Badge variant={shift.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {shift.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overtime" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Overtime Tracking</CardTitle>
                <CardDescription>Monitor overtime hours and costs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-amber-900 dark:text-amber-100">Total Overtime This Week</p>
                        <p className="text-sm text-amber-700 dark:text-amber-300">{attendanceStats.overtimeHours} hours</p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p>Overtime details view</p>
                    <p className="text-sm mt-2">Track overtime by employee, department, and project</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
