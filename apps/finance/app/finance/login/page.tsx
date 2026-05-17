'use client'

import Link from 'next/link'

export default function FinanceLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-xl font-semibold">Finance login</h1>
        <p className="text-sm text-slate-600">
          Use the platform login; finance shares tenant auth with dashboard.
        </p>
        <Link href="http://localhost:3000/login?redirect=/finance" className="text-blue-600 underline text-sm">
          Open platform login
        </Link>
      </div>
    </main>
  )
}
