'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Code, Key, Globe } from 'lucide-react'
import Link from 'next/link'

export default function ApiDocsPage() {
  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-purple-600" />
          API Documentation
        </h1>
        <p className="text-gray-600 mt-1">
          Integrate PayAid V3 into your applications using our REST API
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-700">
            All API requests require authentication using an API key. Include your API key in the Authorization header:
          </p>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`Authorization: Bearer YOUR_API_KEY`}
          </pre>
          <p className="text-sm text-gray-600">
            <Link href="/dashboard/developer/api-keys" className="text-purple-600 hover:underline">
              Create an API key →
            </Link>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Base URL
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`https://api.payaid.com/v1`}
          </pre>
          <p className="text-sm text-gray-600 mt-2">
            All endpoints are relative to this base URL.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            API Endpoints
          </CardTitle>
          <CardDescription>Available endpoints organized by module</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h3 className="font-semibold text-lg mb-3">CRM</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">GET</code>
                <code className="text-gray-700">/api/contacts</code>
                <span className="text-gray-500">List contacts</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">POST</code>
                <code className="text-gray-700">/api/contacts</code>
                <span className="text-gray-500">Create contact</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">GET</code>
                <code className="text-gray-700">/api/deals</code>
                <span className="text-gray-500">List deals</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">POST</code>
                <code className="text-gray-700">/api/deals</code>
                <span className="text-gray-500">Create deal</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-3">Finance</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">GET</code>
                <code className="text-gray-700">/api/invoices</code>
                <span className="text-gray-500">List invoices</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">POST</code>
                <code className="text-gray-700">/api/invoices</code>
                <span className="text-gray-500">Create invoice</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">GET</code>
                <code className="text-gray-700">/api/expenses</code>
                <span className="text-gray-500">List expenses</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-3">Workflows</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">GET</code>
                <code className="text-gray-700">/api/v1/workflows</code>
                <span className="text-gray-500">List workflows</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">POST</code>
                <code className="text-gray-700">/api/v1/workflows</code>
                <span className="text-gray-500">Create workflow</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-3">Public API v1</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">GET/POST</code>
                <code className="text-gray-700">/api/v1/contacts</code>
                <span className="text-gray-500">Contacts API</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">GET/POST</code>
                <code className="text-gray-700">/api/v1/deals</code>
                <span className="text-gray-500">Deals API</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">GET/POST</code>
                <code className="text-gray-700">/api/v1/invoices</code>
                <span className="text-gray-500">Invoices API</span>
              </div>
            </div>
          </section>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Example Request</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`curl -X GET https://api.payaid.com/v1/api/contacts \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rate Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700">
            API keys have configurable rate limits (default: 100 requests/hour). 
            Rate limit headers are included in responses:
          </p>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm mt-2">
{`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scopes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-3">
            API keys can be scoped to specific permissions. Available scopes:
          </p>
          <ul className="space-y-1 text-sm text-gray-600">
            <li><code className="bg-gray-100 px-1 rounded">read:contacts</code> - View contacts</li>
            <li><code className="bg-gray-100 px-1 rounded">write:contacts</code> - Create/update contacts</li>
            <li><code className="bg-gray-100 px-1 rounded">read:invoices</code> - View invoices</li>
            <li><code className="bg-gray-100 px-1 rounded">write:invoices</code> - Create/update invoices</li>
            <li><code className="bg-gray-100 px-1 rounded">read:workflows</code> - View workflows</li>
            <li><code className="bg-gray-100 px-1 rounded">write:workflows</code> - Create/update workflows</li>
          </ul>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-gray-500">
        <p>Need help? <Link href="/dashboard/developer/api-keys" className="text-purple-600 hover:underline">Manage your API keys</Link></p>
      </div>
    </div>
  )
}
