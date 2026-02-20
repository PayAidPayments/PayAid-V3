'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Briefcase, Users, FileText, Calendar, Upload, Sparkles, Filter, Search } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { useQuery } from '@tanstack/react-query'
import { ResumeMatchBadge } from '@/components/hr/ResumeMatchBadge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function HRRecruitmentPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!
  const [searchQuery, setSearchQuery] = useState('')

  // Mock data - would come from API
  const jobRequisitions = [
    { id: '1', title: 'Senior Software Engineer', department: 'Engineering', status: 'OPEN', candidates: 12, postedDate: '2026-02-15' },
    { id: '2', title: 'Sales Manager', department: 'Sales', status: 'OPEN', candidates: 8, postedDate: '2026-02-10' },
    { id: '3', title: 'HR Executive', department: 'HR', status: 'CLOSED', candidates: 15, postedDate: '2026-01-20' },
  ]

  // Mock candidates data (would come from API)
  const candidates = [
    { id: '1', name: 'Rajesh Kumar', position: 'Senior Software Engineer', status: 'SCREENED', aiScore: 87, resumeMatch: 92, experience: '5 years', jobRequisitionId: '1' },
    { id: '2', name: 'Priya Sharma', position: 'Sales Manager', status: 'SHORTLISTED', aiScore: 82, resumeMatch: 88, experience: '7 years', jobRequisitionId: '2' },
    { id: '3', name: 'Amit Patel', position: 'HR Executive', status: 'INTERVIEWED', aiScore: 79, resumeMatch: 85, experience: '4 years', jobRequisitionId: '3' },
  ]

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Recruitment"
        moduleIcon={<Briefcase className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="ATS with AI Resume Screening"
      />

      <div className="p-6 space-y-6">
        {/* AI Resume Pool Banner */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">AI Resume Pool</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Upload resumes for AI-powered screening and matching</p>
                </div>
              </div>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Upload className="mr-2 h-4 w-4" />
                Upload Resumes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open Positions</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <Briefcase className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Candidates</p>
                  <p className="text-2xl font-bold">45</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Hiring Time</p>
                  <p className="text-2xl font-bold">14 days</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">AI Screened</p>
                  <p className="text-2xl font-bold">128</p>
                </div>
                <Sparkles className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="jobs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="jobs">Job Requisitions</TabsTrigger>
            <TabsTrigger value="candidates">Candidates</TabsTrigger>
            <TabsTrigger value="interviews">Interviews</TabsTrigger>
            <TabsTrigger value="resume-pool">Resume Pool</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Job Requisitions</CardTitle>
                    <CardDescription>Create and manage job postings</CardDescription>
                  </div>
                  <Link href={`/hr/${tenantId}/Recruitment/Job-Requisitions/new`}>
                    <Button>
                      <FileText className="mr-2 h-4 w-4" />
                      Post New Job
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search jobs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3"
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Candidates</TableHead>
                      <TableHead>Posted Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobRequisitions.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.title}</TableCell>
                        <TableCell>{job.department}</TableCell>
                        <TableCell>
                          <Badge variant={job.status === 'OPEN' ? 'default' : 'secondary'}>
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{job.candidates}</TableCell>
                        <TableCell>{new Date(job.postedDate).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/hr/${tenantId}/Recruitment/Job-Requisitions/${job.id}`}>
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

          <TabsContent value="candidates" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Candidates</CardTitle>
                    <CardDescription>AI-screened candidates with match scores</CardDescription>
                  </div>
                  <Link href={`/hr/${tenantId}/Recruitment/Candidates/new`}>
                    <Button>
                      <Users className="mr-2 h-4 w-4" />
                      Add Candidate
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>AI Score</TableHead>
                      <TableHead>Resume Match</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidates.map((candidate) => (
                      <TableRow key={candidate.id}>
                        <TableCell className="font-medium">{candidate.name}</TableCell>
                        <TableCell>{candidate.position}</TableCell>
                        <TableCell>
                          <Badge variant={candidate.aiScore >= 80 ? 'default' : 'secondary'}>
                            {candidate.aiScore}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <ResumeMatchBadge 
                            candidateId={candidate.id} 
                            jobRequisitionId={candidate.jobRequisitionId}
                            fallbackScore={candidate.resumeMatch}
                          />
                        </TableCell>
                        <TableCell>{candidate.experience}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{candidate.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/hr/${tenantId}/Recruitment/Candidates/${candidate.id}`}>
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

          <TabsContent value="interviews" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Interviews</CardTitle>
                    <CardDescription>Schedule and manage interviews</CardDescription>
                  </div>
                  <Link href={`/hr/${tenantId}/Recruitment/Interviews/new`}>
                    <Button>
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule Interview
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p>No interviews scheduled</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resume-pool" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Resume Pool</CardTitle>
                    <CardDescription>AI-processed resumes ready for matching</CardDescription>
                  </div>
                  <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Bulk Upload
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p>Upload resumes to build your talent pool</p>
                  <p className="text-sm mt-2">AI will automatically extract skills, experience, and match to open positions</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
