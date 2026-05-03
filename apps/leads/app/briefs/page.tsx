import Link from 'next/link'

export default function LeadBriefsPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">Lead Briefs</h1>
        <p className="text-sm text-slate-600">Saved ICP definitions and target-segment briefs.</p>
        <Link href="/briefs/new" className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
          New Brief
        </Link>
      </div>
    </main>
  )
}
