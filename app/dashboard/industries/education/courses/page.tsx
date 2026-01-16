'use client'

import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface EducationCourse {
  id: string
  courseCode: string
  courseName: string
  description?: string
  category?: string
  duration?: number
  fee?: number
  maxStudents?: number
  instructorName?: string
  status: string
  enrollments: { id: string }[]
}

export default function EducationCoursesPage() {
  const { data, isLoading } = useQuery<{ courses: EducationCourse[] }>({
    queryKey: ['education-courses'],
    queryFn: async () => {
      const response = await apiRequest('/api/industries/education/courses')
      if (!response.ok) throw new Error('Failed to fetch courses')
      return response.json()
    },
  })

  const courses = data?.courses || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
        <p className="mt-2 text-gray-600">Manage course catalog and offerings</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading courses...</div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No courses found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardHeader>
                <CardTitle>{course.courseName}</CardTitle>
                <CardDescription>Code: {course.courseCode}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {course.description && <p>{course.description}</p>}
                  {course.category && <p><strong>Category:</strong> {course.category}</p>}
                  {course.duration && <p><strong>Duration:</strong> {course.duration} months</p>}
                  {course.fee && <p><strong>Fee:</strong> ₹{course.fee}</p>}
                  {course.instructorName && <p><strong>Instructor:</strong> {course.instructorName}</p>}
                  <p><strong>Enrolled:</strong> {course.enrollments.length} students</p>
                  {course.maxStudents && <p><strong>Max:</strong> {course.maxStudents} students</p>}
                  <span className={`inline-block px-2 py-1 rounded text-xs ${
                    course.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {course.status}
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

