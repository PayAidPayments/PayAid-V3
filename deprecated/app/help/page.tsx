'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

/**
 * Help root: redirect to help center with default slug so footer link /help returns 200.
 * E2E link checker expects same-origin links to return < 400.
 */
export default function HelpRootPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/help/support')
  }, [router])

  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 p-8">
      <p className="text-slate-600 dark:text-slate-400">Redirecting to Help Center…</p>
      <Link href="/help/support" className="text-indigo-600 dark:text-indigo-400 hover:underline">
        Go to Help Center
      </Link>
    </div>
  )
}
