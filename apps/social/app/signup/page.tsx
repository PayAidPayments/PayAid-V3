import Link from 'next/link'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Create PayAid Social account</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Standalone Social signup: create a tenant with Marketing-only access. Full signup flow coming soon.
        </p>
        <Link
          href="/studio"
          className="block w-full text-center py-2.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium"
        >
          Start free trial
        </Link>
        <p className="mt-4 text-center text-sm">
          <Link href="/" className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Back</Link>
        </p>
      </div>
    </div>
  )
}
