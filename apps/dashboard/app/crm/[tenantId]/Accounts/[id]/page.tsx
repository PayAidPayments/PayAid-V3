'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { getAuthHeaders } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/ui/loading'
import { Building2, ChevronLeft, Users } from 'lucide-react'

export default function CRMAccountDetailPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) || ''
  const accountId = (params?.id as string) || ''
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accountId) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/accounts/${accountId}`, { headers: getAuthHeaders() })
        const json = await res.json().catch(() => ({}))
        if (cancelled) return
        if (!res.ok) {
          setError(json.error || 'Failed to load account')
          setData(null)
        } else if (json.success && json.data) {
          setData(json.data)
          setError(null)
        } else {
          setError('Account not found')
          setData(null)
        }
      } catch {
        if (!cancelled) setError('Failed to load account')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [accountId])

  if (loading) {
    return <PageLoading message="Loading account..." fullScreen={false} />
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10 text-center">
        <p className="text-slate-600 dark:text-gray-400 mb-4">{error || 'Account not found'}</p>
        <Link href={`/crm/${tenantId}/Accounts`}>
          <Button variant="outline">Back to accounts</Button>
        </Link>
      </div>
    )
  }

  const contacts = data.contacts || []
  const parent = data.parentAccount
  const children = data.childAccounts || []

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900" data-testid="crm-account-detail">
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-5">
        <Link
          href={`/crm/${tenantId}/Accounts`}
          className="inline-flex items-center gap-1 text-sm text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-100"
        >
          <ChevronLeft className="w-4 h-4" />
          Accounts
        </Link>

        <header className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-slate-100 dark:bg-gray-700 p-2.5">
              <Building2 className="w-6 h-6 text-slate-600 dark:text-gray-300" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-gray-100">{data.name}</h1>
              <div className="mt-1 flex flex-wrap gap-2 text-sm text-slate-500 dark:text-gray-400">
                {data.type ? <span className="capitalize">{data.type}</span> : null}
                {data.industry ? <span>{data.industry}</span> : null}
                {data.city ? <span>{data.city}</span> : null}
              </div>
              {parent ? (
                <p className="mt-2 text-sm text-slate-600 dark:text-gray-300">
                  Parent:{' '}
                  <Link
                    href={`/crm/${tenantId}/Accounts/${parent.id}`}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    {parent.name}
                  </Link>
                </p>
              ) : null}
            </div>
          </div>
        </header>

        {children.length > 0 && (
          <section className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100 mb-3">Child accounts</h2>
            <ul className="space-y-2">
              {children.map((c: any) => (
                <li key={c.id}>
                  <Link
                    href={`/crm/${tenantId}/Accounts/${c.id}`}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">Contacts</h2>
          </div>
          {contacts.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-gray-400">No contacts linked to this account yet.</p>
          ) : (
            <ul className="space-y-2">
              {contacts.map((c: any) => (
                <li key={c.id}>
                  <Link
                    href={`/crm/${tenantId}/Contacts/${c.id}`}
                    className="flex justify-between gap-2 rounded-lg border border-slate-200 dark:border-gray-700 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-gray-700/80 transition-colors"
                  >
                    <span className="font-medium text-slate-900 dark:text-gray-100">{c.name}</span>
                    <span className="text-xs text-slate-500">{c.stage || c.type || ''}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
