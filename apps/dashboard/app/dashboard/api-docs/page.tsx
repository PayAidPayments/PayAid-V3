'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BookOpen, 
  Code,
  Download,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import { DashboardLoading } from '@/components/ui/loading'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export default function APIDocsPage() {
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [openApiSpec, setOpenApiSpec] = useState<any>(null)

  useEffect(() => {
    fetchAPIDocs()
  }, [])

  const fetchAPIDocs = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/api-docs/openapi', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setOpenApiSpec(data)
      }
    } catch (error) {
      console.error('Failed to fetch API docs:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadSpec = () => {
    if (!openApiSpec) return
    
    const blob = new Blob([JSON.stringify(openApiSpec, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'payaid-api-spec.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <DashboardLoading message="Loading API documentation..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">API Documentation</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Complete API reference and integration guides
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              variant="outline"
              onClick={downloadSpec}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Download OpenAPI Spec
            </Button>
            <Button
              variant="outline"
              onClick={fetchAPIDocs}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 dark:bg-gray-800">
            <TabsTrigger value="overview" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700">
              Overview
            </TabsTrigger>
            <TabsTrigger value="authentication" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700">
              Authentication
            </TabsTrigger>
            <TabsTrigger value="endpoints" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700">
              Endpoints
            </TabsTrigger>
            <TabsTrigger value="examples" className="dark:text-gray-300 dark:data-[state=active]:bg-gray-700">
              Examples
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  API Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">About PayAid V3 API</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    PayAid V3 provides a comprehensive REST API for integrating with all platform modules including CRM, Finance, Inventory, Marketing, HR, and Analytics.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Base URL</h3>
                  <code className="block p-3 bg-gray-100 dark:bg-gray-700 rounded text-sm text-gray-900 dark:text-gray-100">
                    {process.env.NEXT_PUBLIC_APP_URL || 'https://app.payaid.com'}/api
                  </code>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">API Version</h3>
                  <p className="text-gray-600 dark:text-gray-400">v3.0.0</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Rate Limits</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    100 requests per minute per API key. Rate limit headers are included in all responses.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="authentication" className="space-y-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">Authentication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Bearer Token Authentication</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    All API requests require authentication using a Bearer token in the Authorization header.
                  </p>
                  <code className="block p-3 bg-gray-100 dark:bg-gray-700 rounded text-sm text-gray-900 dark:text-gray-100">
                    Authorization: Bearer YOUR_API_TOKEN
                  </code>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Getting Your API Key</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Navigate to Settings → API Keys to generate and manage your API keys.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="endpoints" className="space-y-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">Available Endpoints</CardTitle>
              </CardHeader>
              <CardContent>
                {openApiSpec && openApiSpec.tags ? (
                  <div className="space-y-4">
                    {openApiSpec.tags.map((tag: any) => (
                      <div key={tag.name} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{tag.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{tag.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">Loading endpoints...</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples" className="space-y-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">Code Examples</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">JavaScript/TypeScript</h3>
                  <pre className="p-4 bg-gray-100 dark:bg-gray-700 rounded text-sm text-gray-900 dark:text-gray-100 overflow-x-auto">
{`const response = await fetch('https://app.payaid.com/api/contacts', {
  headers: {
    'Authorization': 'Bearer YOUR_API_TOKEN',
    'Content-Type': 'application/json',
  },
});

const data = await response.json();`}
                  </pre>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">cURL</h3>
                  <pre className="p-4 bg-gray-100 dark:bg-gray-700 rounded text-sm text-gray-900 dark:text-gray-100 overflow-x-auto">
{`curl -X GET "https://app.payaid.com/api/contacts" \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json"`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
