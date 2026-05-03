'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewCandidatePage() {
  const router = useRouter()
  const params = useParams()
  const tenantId = params.tenantId as string
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

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/hr/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          currentCtcInr: data.currentCtcInr ? parseFloat(data.currentCtcInr) : undefined,
          expectedCtcInr: data.expectedCtcInr ? parseFloat(data.expectedCtcInr) : undefined,
          noticePeriodDays: data.noticePeriodDays ? parseInt(data.noticePeriodDays) : undefined,
          skills: data.skills,
          resumeFileUrl: data.resumeFileUrl || undefined,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create candidate')
      }
      return response.json()
    },
    onSuccess: (data) => {
      router.push(`/hr/${tenantId}/Hiring/Candidates/${data.id}`)
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    createMutation.mutate(formData)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">New Candidate</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Add a new candidate to the pool</p>
        </div>
        <Link href={`/hr/${tenantId}/Hiring/Candidates`}>
          <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancel</Button>
        </Link>
      </div>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Candidate Information</CardTitle>
          <CardDescription className="dark:text-gray-400">Enter the candidate details below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="fullName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  placeholder="e.g., John Doe"
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="john.doe@example.com"
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone <span className="text-red-500">*</span>
                </label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="+91 9876543210"
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="source" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Source
                </label>
                <select
                  id="source"
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  className="w-full h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
                >
                  <option value="LINKEDIN">LinkedIn</option>
                  <option value="REFERRAL">Referral</option>
                  <option value="NAUKRI">Naukri</option>
                  <option value="CAREERS_PAGE">Careers Page</option>
                  <option value="OTHERS">Others</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
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
                <label htmlFor="currentCompany" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Current Company
                </label>
                <Input
                  id="currentCompany"
                  name="currentCompany"
                  value={formData.currentCompany}
                  onChange={handleChange}
                  placeholder="e.g., ABC Corp"
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Location
                </label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Bangalore, Karnataka"
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="currentCtcInr" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Current CTC ₹
                </label>
                <Input
                  id="currentCtcInr"
                  name="currentCtcInr"
                  type="number"
                  step="0.01"
                  value={formData.currentCtcInr}
                  onChange={handleChange}
                  placeholder="e.g., 500000"
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="expectedCtcInr" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Expected CTC ₹
                </label>
                <Input
                  id="expectedCtcInr"
                  name="expectedCtcInr"
                  type="number"
                  step="0.01"
                  value={formData.expectedCtcInr}
                  onChange={handleChange}
                  placeholder="e.g., 700000"
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="noticePeriodDays" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notice Period (Days)
                </label>
                <Input
                  id="noticePeriodDays"
                  name="noticePeriodDays"
                  type="number"
                  value={formData.noticePeriodDays}
                  onChange={handleChange}
                  placeholder="e.g., 30"
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="resumeFileUrl" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Resume URL
                </label>
                <Input
                  id="resumeFileUrl"
                  name="resumeFileUrl"
                  type="url"
                  value={formData.resumeFileUrl}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="skills" className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
                    className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  />
                  <Button type="button" onClick={addSkill} variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                    Add
                  </Button>
                </div>
                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
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
              <Link href={`/hr/${tenantId}/Hiring/Candidates`}>
                <Button type="button" variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={createMutation.isPending} className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                {createMutation.isPending ? 'Creating...' : 'Create Candidate'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
