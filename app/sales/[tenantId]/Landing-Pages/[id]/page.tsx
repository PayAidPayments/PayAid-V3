'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import { ModuleSwitcher } from '@/components/ModuleSwitcher'
import { useAuthStore } from '@/lib/stores/auth'
import { Settings, LogOut, ChevronDown, RefreshCw } from 'lucide-react'
import { useRef, useEffect } from 'react'
import { PageLoading } from '@/components/ui/loading'

interface LandingPage {
  id: string
  name: string
  slug: string
  status: string
  contentJson: any
  metaTitle?: string
  metaDescription?: string
  views: number
  conversions: number
  conversionRate?: number
  createdAt: string
}

export default function SalesLandingPageDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const tenantId = params.tenantId as string
  const { user, logout, token } = useAuthStore()
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    metaTitle: '',
    metaDescription: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
  })

  const { data: page, refetch } = useQuery<LandingPage>({
    queryKey: ['sales-landing-page', id],
    queryFn: async () => {
      const response = await fetch(`/api/sales/landing-pages/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch landing page')
      const data = await response.json()
      setFormData({
        name: data.name,
        slug: data.slug,
        metaTitle: data.metaTitle || '',
        metaDescription: data.metaDescription || '',
        status: data.status,
      })
      return data
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(`/api/sales/landing-pages/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          metaTitle: data.metaTitle || null,
          metaDescription: data.metaDescription || null,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update landing page')
      }
      return response.json()
    },
    onSuccess: () => {
      setIsEditing(false)
      refetch()
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const getUserInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return user?.email?.[0]?.toUpperCase() || 'U'
  }

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileMenuOpen])

  if (!page) {
    return <PageLoading message="Loading landing page..." fullScreen={false} />
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 relative" style={{ zIndex: 1 }}>
      {/* Top Navigation Bar */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-semibold text-gray-900">Sales</h2>
            <nav className="flex items-center gap-4 text-sm">
              <Link href={`/sales/${tenantId}/Home/`} className="text-gray-600 hover:text-gray-900 transition-colors">Home</Link>
              <Link href={`/sales/${tenantId}/Landing-Pages`} className="text-green-600 font-medium border-b-2 border-green-600 pb-2">Landing Pages</Link>
              <Link href={`/sales/${tenantId}/Checkout-Pages`} className="text-gray-600 hover:text-gray-900 transition-colors">Checkout Pages</Link>
              <Link href={`/sales/${tenantId}/Orders`} className="text-gray-600 hover:text-gray-900 transition-colors">Orders</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
            <ModuleSwitcher currentModule="sales" />
            
            {/* User Profile Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="User menu"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                  {getUserInitials()}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="py-1">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        router.push(tenantId ? `/dashboard/${tenantId}/settings/profile` : '/dashboard/settings/profile')
                        setProfileMenuOpen(false)
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Profile Settings
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{page.name}</h1>
            <p className="mt-2 text-gray-600">/{page.slug}</p>
          </div>
          <div className="flex gap-2">
            {!isEditing && (
              <>
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  Edit
                </Button>
                <Link href={`/sales/${tenantId}/Landing-Pages`}>
                  <Button variant="outline">Back</Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {isEditing ? (
          <Card>
            <CardHeader>
              <CardTitle>Edit Landing Page</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Page Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="slug" className="text-sm font-medium text-gray-700">
                      URL Slug <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="slug"
                      name="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="status" className="text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full h-10 rounded-md border border-gray-300 px-3"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="metaTitle" className="text-sm font-medium text-gray-700">
                      Meta Title
                    </label>
                    <Input
                      id="metaTitle"
                      name="metaTitle"
                      value={formData.metaTitle}
                      onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="metaDescription" className="text-sm font-medium text-gray-700">
                      Meta Description
                    </label>
                    <textarea
                      id="metaDescription"
                      name="metaDescription"
                      value={formData.metaDescription}
                      onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                      rows={3}
                      className="w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-4">
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
                <CardTitle>Page Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        page.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                        page.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {page.status}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Views</dt>
                    <dd className="mt-1 text-sm text-gray-900">{page.views.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Conversions</dt>
                    <dd className="mt-1 text-sm text-gray-900">{page.conversions.toLocaleString()}</dd>
                  </div>
                  {page.conversionRate != null && page.conversionRate > 0 && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Conversion Rate</dt>
                      <dd className="mt-1 text-sm text-gray-900 text-green-600 font-semibold">
                        {Number(page.conversionRate).toFixed(2)}%
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="mt-1 text-sm text-gray-900">{format(new Date(page.createdAt), 'PPp')}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Page Preview</CardTitle>
                  <CardDescription>Visual preview of your landing page</CardDescription>
                </div>
                <Link href={`/dashboard/landing-pages/${id}/preview`}>
                  <Button variant="outline" size="sm">
                    👁️ Full Preview
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {page.contentJson && page.contentJson.sections ? (
                  <div className="space-y-6">
                    {page.contentJson.sections.map((section: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        {section.type === 'hero' && (
                          <div className="relative rounded-lg overflow-hidden bg-gradient-to-r from-[#53328A] to-[#F5C700]" style={{ minHeight: '300px' }}>
                            <div className="flex items-center justify-center p-8">
                              <div className="text-center text-white">
                                <h2 className="text-3xl font-bold mb-2">{section.title || page.name}</h2>
                                {section.subtitle && <p className="text-xl mb-4">{section.subtitle}</p>}
                                {section.cta && (
                                  <Button variant="secondary">{section.cta.text}</Button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        {section.type === 'features' && (
                          <div>
                            <h3 className="text-xl font-bold mb-4">{section.title || 'Features'}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {section.items?.map((item: any, idx: number) => (
                                <div key={idx} className="border rounded p-4">
                                  <h4 className="font-semibold">{item.icon || '✨'} {item.title || 'Feature'}</h4>
                                  <p className="text-sm text-gray-600">{item.description || 'Feature description'}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-sm text-gray-500">No content preview available. Page content will be displayed here once configured.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

