'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Target, Users, Award, TrendingUp, Sparkles, CheckCircle, Clock, BarChart3 } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function HRPerformancePage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!

  // Mock data
  const okrs = [
    { id: '1', title: 'Increase Sales Revenue', owner: 'Sales Team', progress: 76, target: 100, status: 'ON_TRACK' },
    { id: '2', title: 'Improve Customer Satisfaction', owner: 'Support Team', progress: 82, target: 90, status: 'ON_TRACK' },
    { id: '3', title: 'Launch New Product Feature', owner: 'Engineering', progress: 45, target: 100, status: 'AT_RISK' },
  ]

  const reviews = [
    { id: '1', employee: 'Rajesh Kumar', reviewer: 'Manager', type: '360', status: 'COMPLETED', score: 4.2 },
    { id: '2', employee: 'Priya Sharma', reviewer: 'Peer', type: 'PEER', status: 'PENDING', score: null },
    { id: '3', employee: 'Amit Patel', reviewer: 'Self', type: 'SELF', status: 'IN_PROGRESS', score: null },
  ]

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Performance"
        moduleIcon={<Target className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="OKRs, 360 Reviews & AI Insights"
      />

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">OKR Completion</p>
                  <p className="text-2xl font-bold">76%</p>
                </div>
                <Target className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active OKRs</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reviews Completed</p>
                  <p className="text-2xl font-bold">8/12</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Performance</p>
                  <p className="text-2xl font-bold">4.1/5</p>
                </div>
                <Award className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights Banner */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">AI Performance Insights</h3>
                <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <li>• Engineering team shows strong OKR progress (82% completion)</li>
                  <li>• Sales team performance trending upward (+12% vs last quarter)</li>
                  <li>• 3 employees identified for recognition based on 360 feedback</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="okrs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="okrs">OKRs</TabsTrigger>
            <TabsTrigger value="reviews">360 Reviews</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="okrs" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Objectives & Key Results (OKRs)</CardTitle>
                    <CardDescription>Track team and individual performance goals</CardDescription>
                  </div>
                  <Link href={`/hr/${tenantId}/Performance/OKRs/new`}>
                    <Button>
                      <Target className="mr-2 h-4 w-4" />
                      Create OKR
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {okrs.map((okr) => (
                    <Card key={okr.id} className="border-l-4 border-l-purple-500">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{okr.title}</h3>
                            <p className="text-sm text-muted-foreground">Owner: {okr.owner}</p>
                          </div>
                          <Badge
                            variant={okr.status === 'ON_TRACK' ? 'default' : 'destructive'}
                          >
                            {okr.status === 'ON_TRACK' ? 'On Track' : 'At Risk'}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress</span>
                            <span className="font-semibold">{okr.progress}%</span>
                          </div>
                          <Progress value={okr.progress} className="h-2" />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Target: {okr.target}%</span>
                            <span>{okr.target - okr.progress}% remaining</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>360 Reviews</CardTitle>
                    <CardDescription>Multi-source performance feedback</CardDescription>
                  </div>
                  <Link href={`/hr/${tenantId}/Performance/Reviews/new`}>
                    <Button>
                      <Users className="mr-2 h-4 w-4" />
                      Start Review
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Reviewer</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell className="font-medium">{review.employee}</TableCell>
                        <TableCell>{review.reviewer}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{review.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              review.status === 'COMPLETED' ? 'default' :
                              review.status === 'PENDING' ? 'secondary' :
                              'outline'
                            }
                          >
                            {review.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {review.score ? `${review.score}/5` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/hr/${tenantId}/Performance/Reviews/${review.id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Employee Feedback</CardTitle>
                <CardDescription>Pulse surveys and continuous feedback</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p>No feedback surveys active</p>
                  <Button variant="outline" className="mt-4">
                    Create Survey
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
                <CardDescription>Trends and insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p>Performance analytics coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
