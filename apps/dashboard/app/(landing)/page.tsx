'use client'

import dynamic from 'next/dynamic'

const LandingPage = dynamic(
  () => import('@/components/landing/LandingPage').then((m) => ({ default: m.default })),
  {
    ssr: true,
    loading: () => (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        <div className="flex flex-col items-center gap-4">
          <div className="h-9 w-9 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    ),
  }
)

export default function Page() {
  return <LandingPage />
}
