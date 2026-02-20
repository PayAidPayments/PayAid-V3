'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Play, Code, FileText } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'

const ENDPOINTS = [
  { value: 'GET /api/v1/contacts', method: 'GET', path: '/api/v1/contacts' },
  { value: 'POST /api/v1/contacts', method: 'POST', path: '/api/v1/contacts' },
  { value: 'GET /api/v1/deals', method: 'GET', path: '/api/v1/deals' },
  { value: 'POST /api/v1/deals', method: 'POST', path: '/api/v1/deals' },
  { value: 'GET /api/v1/invoices', method: 'GET', path: '/api/v1/invoices' },
  { value: 'POST /api/v1/invoices', method: 'POST', path: '/api/v1/invoices' },
  { value: 'GET /api/v1/workflows', method: 'GET', path: '/api/v1/workflows' },
]

export default function ApiExplorerPage() {
  const { token } = useAuthStore()
  const [selectedEndpoint, setSelectedEndpoint] = useState(ENDPOINTS[0].value)
  const [apiKey, setApiKey] = useState('')
  const [requestBody, setRequestBody] = useState('{}')
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const endpoint = ENDPOINTS.find(e => e.value === selectedEndpoint)!

  const handleExecute = async () => {
    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const authHeader = apiKey ? `Bearer ${apiKey}` : token ? `Bearer ${token}` : ''
      if (!authHeader) {
        setError('Please provide an API key or ensure you are logged in')
        setLoading(false)
        return
      }

      const options: RequestInit = {
        method: endpoint.method,
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      }

      if (endpoint.method === 'POST' && requestBody) {
        options.body = requestBody
      }

      const url = endpoint.path + (endpoint.method === 'GET' ? '?page=1&limit=10' : '')
      const res = await fetch(url, options)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || `HTTP ${res.status}`)
      } else {
        setResponse({
          status: res.status,
          headers: Object.fromEntries(res.headers.entries()),
          data,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  const generateCurl = () => {
    const authHeader = apiKey ? apiKey : token || 'YOUR_API_KEY'
    let curl = `curl -X ${endpoint.method} \\\n`
    curl += `  '${window.location.origin}${endpoint.path}${endpoint.method === 'GET' ? '?page=1&limit=10' : ''}' \\\n`
    curl += `  -H 'Authorization: Bearer ${authHeader}' \\\n`
    curl += `  -H 'Content-Type: application/json'`
    if (endpoint.method === 'POST' && requestBody) {
      curl += ` \\\n  -d '${requestBody}'`
    }
    return curl
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Code className="h-7 w-7 text-purple-600" />
          API Explorer
        </h1>
        <p className="text-gray-600 mt-1">
          Test PayAid APIs interactively
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Request</CardTitle>
            <CardDescription>Configure and execute API requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Endpoint</Label>
              <select
                value={selectedEndpoint}
                onChange={(e) => setSelectedEndpoint(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {ENDPOINTS.map((ep) => (
                  <option key={ep.value} value={ep.value}>
                    {ep.value}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>API Key (optional, uses session token if not provided)</Label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Your API key"
                className="mt-1 font-mono text-sm"
              />
            </div>
            {endpoint.method === 'POST' && (
              <div>
                <Label>Request Body (JSON)</Label>
                <Textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  className="mt-1 font-mono text-sm"
                  rows={8}
                />
              </div>
            )}
            <Button onClick={handleExecute} disabled={loading} className="w-full">
              <Play className="h-4 w-4 mr-2" />
              {loading ? 'Executing...' : 'Execute Request'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response</CardTitle>
            <CardDescription>View API response</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                <strong>Error:</strong> {error}
              </div>
            )}
            {response && (
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-semibold mb-2">Status: {response.status}</div>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                    {JSON.stringify(response.data, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            {!error && !response && (
              <div className="text-center py-12 text-gray-500 text-sm">
                Execute a request to see the response
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            cURL Command
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
            {generateCurl()}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
