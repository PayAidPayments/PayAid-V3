import Link from 'next/link'

const kpis = [
  { label: 'Active Segments', value: '0' },
  { label: 'Approved Accounts', value: '0' },
  { label: 'Verified Contacts', value: '0' },
  { label: 'Pipeline Created', value: 'INR 0' },
]

export default function LeadsWorkspacePage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Lead Intelligence</h1>
            <p className="text-sm text-slate-600">Company-first discovery, contact resolution, and activation.</p>
          </div>
          <Link href="/briefs/new" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            Create Lead Brief
          </Link>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <article key={kpi.label} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">{kpi.label}</p>
              <p className="mt-2 text-2xl font-semibold">{kpi.value}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
