'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { useTheme } from '@/lib/contexts/theme-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Moon, Sun } from 'lucide-react'

function getAuthHeaders() {
  const { token } = useAuthStore.getState()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export default function ProfileSettingsPage() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    inAppNotifications: true,
    weeklyDigest: true,
    dealReminders: true,
  })

  useEffect(() => {
    try {
      const key = `payaid:prefs:${user?.id || 'me'}`
      const raw = localStorage.getItem(key)
      if (!raw) return
      const parsed = JSON.parse(raw) as Partial<typeof prefs>
      const id = globalThis.setTimeout(() => {
        setPrefs((p) => ({ ...p, ...parsed }))
      }, 0)
      return () => globalThis.clearTimeout(id)
    } catch {
      // ignore
    }
  }, [user?.id])

  useEffect(() => {
    try {
      const key = `payaid:prefs:${user?.id || 'me'}`
      localStorage.setItem(key, JSON.stringify(prefs))
    } catch {
      // ignore
    }
  }, [prefs, user?.id])

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await fetch('/api/settings/profile', { headers: getAuthHeaders() })
      if (!response.ok) throw new Error('Failed to fetch profile')
      return response.json()
    },
  })

  const updateProfile = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to update profile')
      }
      return response.json()
    },
    onSuccess: (data: { email?: string; name?: string }) => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
      if (data.email || data.name) {
        useAuthStore.setState({
          user: {
            ...user!,
            email: data.email ?? user?.email ?? '',
            name: data.name ?? user?.name ?? null,
          },
        })
      }
      setSuccess('Profile updated successfully!')
      setError('')
      setTimeout(() => setSuccess(''), 3000)
      setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }))
    },
  })

  useEffect(() => {
    if (!profile) return
    const id = globalThis.setTimeout(() => {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        avatar: profile.avatar || '',
        password: '',
        confirmPassword: '',
      })
    }, 0)
    return () => globalThis.clearTimeout(id)
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (formData.password) {
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters long')
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        return
      }
    }
    try {
      const updateData: Record<string, unknown> = {
        name: formData.name,
        email: formData.email,
        avatar: formData.avatar,
      }
      if (formData.password) updateData.password = formData.password
      await updateProfile.mutateAsync(updateData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Profile</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Personal information and account settings</p>
      </div>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Appearance</CardTitle>
          <CardDescription>Choose your preferred theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'light' ? <Sun className="h-5 w-5 text-slate-600 dark:text-slate-400" /> : <Moon className="h-5 w-5 text-slate-600 dark:text-slate-400" />}
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{theme === 'light' ? 'Use light theme' : 'Use dark theme'}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  theme === 'light'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                Light
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  theme === 'dark'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                Dark
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Notifications</CardTitle>
          <CardDescription>Control how you receive alerts and reminders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Email notifications</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Invoice, tasks, and system notifications</div>
            </div>
            <Switch checked={prefs.emailNotifications} onCheckedChange={(v) => setPrefs((p) => ({ ...p, emailNotifications: v }))} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">In-app notifications</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Bell notifications inside PayAid</div>
            </div>
            <Switch checked={prefs.inAppNotifications} onCheckedChange={(v) => setPrefs((p) => ({ ...p, inAppNotifications: v }))} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Weekly digest</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">A weekly summary of key KPIs</div>
            </div>
            <Switch checked={prefs.weeklyDigest} onCheckedChange={(v) => setPrefs((p) => ({ ...p, weeklyDigest: v }))} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Deal reminders</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Upcoming close dates and stalled pipeline</div>
            </div>
            <Switch checked={prefs.dealReminders} onCheckedChange={(v) => setPrefs((p) => ({ ...p, dealReminders: v }))} />
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Preferences are saved locally per browser for now.
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Personal Information</CardTitle>
          <CardDescription>Update your name, email, and profile picture</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">{error}</div>}
            {success && <div className="p-3 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">{success}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name *</label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required disabled={updateProfile.isPending} />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">Email *</label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required disabled={updateProfile.isPending} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="avatar" className="text-sm font-medium text-slate-700 dark:text-slate-300">Profile picture URL</label>
                <Input id="avatar" name="avatar" type="url" value={formData.avatar} onChange={handleChange} placeholder="https://..." disabled={updateProfile.isPending} />
              </div>
            </div>
            <div className="flex justify-end"><Button type="submit" disabled={updateProfile.isPending}>{updateProfile.isPending ? 'Saving...' : 'Save'}</Button></div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
                <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Leave blank to keep current" disabled={updateProfile.isPending} />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm Password</label>
                <Input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} disabled={updateProfile.isPending} />
              </div>
            </div>
            <div className="flex justify-end"><Button type="submit" disabled={updateProfile.isPending}>Update Password</Button></div>
          </form>
        </CardContent>
      </Card>

      {profile && (
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader><CardTitle className="text-slate-900 dark:text-slate-100">Account</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500 dark:text-slate-400">Role</span><div className="font-medium text-slate-900 dark:text-slate-100">{profile.role || 'Member'}</div></div>
              <div><span className="text-slate-500 dark:text-slate-400">Member since</span><div className="font-medium text-slate-900 dark:text-slate-100">{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}</div></div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
