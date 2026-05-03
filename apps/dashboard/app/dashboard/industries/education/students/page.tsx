'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface EducationStudent {
  id: string
  studentId: string
  fullName: string
  dateOfBirth?: string
  gender?: string
  phone?: string
  email?: string
  address?: string
  parentName?: string
  parentPhone?: string
  admissionDate?: string
  status: string
  createdAt: string
}

export default function EducationStudentsPage() {
  const queryClient = useQueryClient()
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [search, setSearch] = useState<string>('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    studentId: '',
    fullName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    admissionDate: '',
    notes: '',
  })

  const { data, isLoading } = useQuery<{ students: EducationStudent[] }>({
    queryKey: ['education-students', selectedStatus, search],
    queryFn: async () => {
      let url = '/api/industries/education/students'
      const params = new URLSearchParams()
      if (selectedStatus !== 'all') params.append('status', selectedStatus)
      if (search) params.append('search', search)
      if (params.toString()) url += '?' + params.toString()
      
      const response = await apiRequest(url)
      if (!response.ok) throw new Error('Failed to fetch students')
      return response.json()
    },
  })

  const createStudentMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('/api/industries/education/students', {
        method: 'POST',
        body: JSON.stringify({
          studentId: data.studentId,
          fullName: data.fullName,
          dateOfBirth: data.dateOfBirth || undefined,
          gender: data.gender || undefined,
          phone: data.phone || undefined,
          email: data.email || undefined,
          address: data.address || undefined,
          parentName: data.parentName || undefined,
          parentPhone: data.parentPhone || undefined,
          parentEmail: data.parentEmail || undefined,
          admissionDate: data.admissionDate || undefined,
          notes: data.notes || undefined,
        }),
      })
      if (!response.ok) throw new Error('Failed to create student')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['education-students'] })
      setShowAddForm(false)
      setFormData({
        studentId: '',
        fullName: '',
        dateOfBirth: '',
        gender: '',
        phone: '',
        email: '',
        address: '',
        parentName: '',
        parentPhone: '',
        parentEmail: '',
        admissionDate: '',
        notes: '',
      })
    },
  })

  const students = data?.students || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="mt-2 text-gray-600">Manage student records and information</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : 'Add New Student'}
        </Button>
      </div>

      {/* Add Student Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Student</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                createStudentMutation.mutate(formData)
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Student ID *</label>
                  <Input
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name *</label>
                  <Input
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date of Birth</label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Parent Name</label>
                  <Input
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Parent Phone</label>
                  <Input
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Admission Date</label>
                  <Input
                    type="date"
                    value={formData.admissionDate}
                    onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                />
              </div>
              <Button type="submit" disabled={createStudentMutation.isPending}>
                {createStudentMutation.isPending ? 'Creating...' : 'Create Student'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="GRADUATED">Graduated</option>
            <option value="DROPPED">Dropped</option>
          </select>
          <input
            type="text"
            placeholder="Search by name, ID, or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border rounded-md flex-1"
          />
        </CardContent>
      </Card>

      {/* Students List */}
      {isLoading ? (
        <div className="text-center py-8">Loading students...</div>
      ) : students.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No students found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => (
            <Card key={student.id}>
              <CardHeader>
                <CardTitle>{student.fullName}</CardTitle>
                <CardDescription>ID: {student.studentId}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {student.phone && <p><strong>Phone:</strong> {student.phone}</p>}
                  {student.email && <p><strong>Email:</strong> {student.email}</p>}
                  {student.parentName && <p><strong>Parent:</strong> {student.parentName}</p>}
                  {student.admissionDate && (
                    <p><strong>Admission:</strong> {new Date(student.admissionDate).toLocaleDateString()}</p>
                  )}
                  <span className={`inline-block px-2 py-1 rounded text-xs ${
                    student.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    student.status === 'GRADUATED' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {student.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

