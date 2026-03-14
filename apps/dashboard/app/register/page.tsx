'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Get subdomain domain from environment (defaults to payaid.com)
const SUBDOMAIN_DOMAIN = process.env.NEXT_PUBLIC_SUBDOMAIN_DOMAIN || 'payaid.com'

export default function RegisterPage() {
  const router = useRouter()
  const { register, isLoading } = useAuthStore()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    tenantName: '',
    subdomain: '',
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate subdomain format
    if (!/^[a-z0-9-]+$/.test(formData.subdomain)) {
      setError('Subdomain can only contain lowercase letters, numbers, and hyphens')
      return
    }

    try {
      await register(formData)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Create your account
          </CardTitle>
          <CardDescription className="text-center">
            Get started with PayAid V3 Business Operating System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Full Name
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">Minimum 8 characters</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="tenantName" className="text-sm font-medium">
                Business Name
              </label>
              <Input
                id="tenantName"
                name="tenantName"
                type="text"
                placeholder="My Company"
                value={formData.tenantName}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="subdomain" className="text-sm font-medium">
                Subdomain
              </label>
              <div className="flex items-center">
                <Input
                  id="subdomain"
                  name="subdomain"
                  type="text"
                  placeholder="mycompany"
                  value={formData.subdomain}
                  onChange={handleChange}
                  required
                  minLength={3}
                  maxLength={50}
                  pattern="[a-z0-9-]+"
                  disabled={isLoading}
                  className="rounded-r-none"
                />
                <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-sm text-gray-600">
                  .{SUBDOMAIN_DOMAIN}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Lowercase letters, numbers, and hyphens only
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link href="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
