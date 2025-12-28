'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'

interface Candidate {
  id: string
  fullName: string
  email: string
  phone: string
  source?: string
  currentCompany?: string
  currentCtcInr?: number
  expectedCtcInr?: number
  noticePeriodDays?: number
  location?: string
  skills: string[]
  resumeFileUrl?: string
  status: string
  candidateJobs: Array<{
    id: string
    stage: string
    requisition: {
      id: string
      title: string
      department?: { id: string; name: string }
    }
  }>
  interviewRounds: Array<{
    id: string
    roundName: string
    scheduledAt: string
    mode: string
    status: string
    rating?: number
    interviewerId?: string // interviewer relation doesn't exist in schema, use interviewerId instead
  }>
  offers: Array<{
    id: string
    offeredCtcInr: number
    offerStatus: string
    requisition: {
      id: string
      title: string
    }
  }>
  createdAt: string
}

export default function CandidateDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    source: 'OTHERS',
    currentCompany: '',
    currentCtcInr: '',
    expectedCtcInr: '',
    noticePeriodDays: '',
    location: '',
    skills: [] as string[],
    resumeFileUrl: '',
    status: 'NEW' as 'NEW' | 'SCREENING' | 'SHORTLISTED' | 'INTERVIEW' | 'OFFERED' | 'HIRED' | 'REJECTED',
  })
  const [error, setError] = useState('')
  const [newSkill, setNewSkill] = useState('')

  const { data: candidate, refetch } = useQuery<Candidate>({
    queryKey: ['candidate', id],
    queryFn: async () => {
      const response = await fetch(`/api/hr/candidates/${id}`)
      if (!response.ok) throw new Error('Failed to fetch candidate')
      const data = await response.json()
      setFormData({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        source: data.source || 'OTHERS',
        currentCompany: data.currentCompany || '',
        currentCtcInr: data.currentCtcInr ? Number(data.currentCtcInr).toString() : '',
        expectedCtcInr: data.expectedCtcInr ? Number(data.expectedCtcInr).toString() : '',
        noticePeriodDays: data.noticePeriodDays ? data.noticePeriodDays.toString() : '',
        location: data.location || '',
        skills: data.skills || [],
        resumeFileUrl: data.resumeFileUrl || '',
        status: data.status,
      })
      return data
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(`/api/hr/candidates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          currentCtcInr: data.currentCtcInr ? parseFloat(data.currentCtcInr) : null,
          expectedCtcInr: data.expectedCtcInr ? parseFloat(data.expectedCtcInr) : null,
          noticePeriodDays: data.noticePeriodDays ? parseInt(data.noticePeriodDays) : null,
          skills: data.skills,
          resumeFileUrl: data.resumeFileUrl || null,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update candidate')
      }
      return response.json()
    },
    onSuccess: () => {
      setIsEditing(false)
      refetch()
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    updateMutation.mutate(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const addSkill = () => {
    if (newSkill && !formData.skills.includes(newSkill)) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill],
      })
      setNewSkill('')
    }
  }

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    })
  }

  if (!candidate) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{candidate.fullName}</h1>
          <p className="mt-2 text-gray-600">Candidate Profile</p>
        </div>
        <div className="flex gap-2">
          {!isEditing && (
            <>
              <Button onClick={() => setIsEditing(true)} variant="outline">
                Edit
              </Button>
              <Link href="/dashboard/hr/hiring/candidates">
                <Button variant="outline">Back</Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Candidate</CardTitle>
            <CardDescription>Update the candidate details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                  <label htmlFor="source" className="text-sm font-medium text-gray-700">
                    Source
                  </label>
                  <select
                    id="source"
                    name="source"
                    value={formData.source}
                    onChange={handleChange}
                    className="w-full h-10 rounded-md border border-gray-300 px-3"
                  >
                    <option value="LINKEDIN">LinkedIn</option>
                    <option value="REFERRAL">Referral</option>
                    <option value="NAUKRI">Naukri</option>
                    <option value="CAREERS_PAGE">Careers Page</option>
                    <option value="OTHERS">Others</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="status" className="text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full h-10 rounded-md border border-gray-300 px-3"
                  >
                    <option value="NEW">New</option>
                    <option value="SCREENING">Screening</option>
                    <option value="SHORTLISTED">Shortlisted</option>
                    <option value="INTERVIEW">Interview</option>
                    <option value="OFFERED">Offered</option>
                    <option value="HIRED">Hired</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="currentCompany" className="text-sm font-medium text-gray-700">
                    Current Company
                  </label>
                  <Input id="currentCompany" name="currentCompany" value={formData.currentCompany} onChange={handleChange} />
                </div>

                <div className="space-y-2">
                  <label htmlFor="location" className="text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <Input id="location" name="location" value={formData.location} onChange={handleChange} />
                </div>

                <div className="space-y-2">
                  <label htmlFor="currentCtcInr" className="text-sm font-medium text-gray-700">
                    Current CTC ₹
                  </label>
                  <Input
                    id="currentCtcInr"
                    name="currentCtcInr"
                    type="number"
                    step="0.01"
                    value={formData.currentCtcInr}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="expectedCtcInr" className="text-sm font-medium text-gray-700">
                    Expected CTC ₹
                  </label>
                  <Input
                    id="expectedCtcInr"
                    name="expectedCtcInr"
                    type="number"
                    step="0.01"
                    value={formData.expectedCtcInr}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="noticePeriodDays" className="text-sm font-medium text-gray-700">
                    Notice Period (Days)
                  </label>
                  <Input
                    id="noticePeriodDays"
                    name="noticePeriodDays"
                    type="number"
                    value={formData.noticePeriodDays}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="resumeFileUrl" className="text-sm font-medium text-gray-700">
                    Resume URL
                  </label>
                  <Input id="resumeFileUrl" name="resumeFileUrl" type="url" value={formData.resumeFileUrl} onChange={handleChange} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="skills" className="text-sm font-medium text-gray-700">
                    Skills
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="skills"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addSkill()
                        }
                      }}
                      placeholder="Add a skill and press Enter"
                    />
                    <Button type="button" onClick={addSkill} variant="outline">
                      Add
                    </Button>
                  </div>
                  {formData.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{candidate.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">{candidate.phone}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Source</dt>
                  <dd className="mt-1 text-sm text-gray-900">{candidate.source || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {candidate.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Current Company</dt>
                  <dd className="mt-1 text-sm text-gray-900">{candidate.currentCompany || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="mt-1 text-sm text-gray-900">{candidate.location || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Current CTC</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {candidate.currentCtcInr ? `₹${Number(candidate.currentCtcInr).toLocaleString('en-IN')}` : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Expected CTC</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {candidate.expectedCtcInr ? `₹${Number(candidate.expectedCtcInr).toLocaleString('en-IN')}` : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Notice Period</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {candidate.noticePeriodDays ? `${candidate.noticePeriodDays} days` : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Resume</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {candidate.resumeFileUrl ? (
                      <a href={candidate.resumeFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View Resume
                      </a>
                    ) : (
                      '-'
                    )}
                  </dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Skills</dt>
                  <dd className="mt-1 flex flex-wrap gap-2">
                    {candidate.skills.length > 0 ? (
                      candidate.skills.map((skill) => (
                        <span key={skill} className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">No skills added</span>
                    )}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {candidate.candidateJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Applied Jobs ({candidate.candidateJobs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Stage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidate.candidateJobs.map((cj) => (
                      <TableRow key={cj.id}>
                        <TableCell className="font-medium">{cj.requisition.title}</TableCell>
                        <TableCell>{cj.requisition.department?.name || '-'}</TableCell>
                        <TableCell>{cj.stage}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {candidate.interviewRounds.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Interviews ({candidate.interviewRounds.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Round</TableHead>
                      <TableHead>Scheduled At</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Interviewer</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidate.interviewRounds.map((interview) => (
                      <TableRow key={interview.id}>
                        <TableCell className="font-medium">{interview.roundName}</TableCell>
                        <TableCell>{format(new Date(interview.scheduledAt), 'PPp')}</TableCell>
                        <TableCell>{interview.mode}</TableCell>
                        <TableCell>
                          {interview.interviewerId
                            ? `ID: ${interview.interviewerId}`
                            : '-'}
                        </TableCell>
                        <TableCell>{interview.rating ? `${interview.rating}/5` : '-'}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {interview.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {candidate.offers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Offers ({candidate.offers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job</TableHead>
                      <TableHead>Offered CTC</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidate.offers.map((offer) => (
                      <TableRow key={offer.id}>
                        <TableCell className="font-medium">{offer.requisition.title}</TableCell>
                        <TableCell>₹{Number(offer.offeredCtcInr).toLocaleString('en-IN')}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {offer.offerStatus}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
