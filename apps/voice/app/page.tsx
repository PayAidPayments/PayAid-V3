import Link from 'next/link'

/**
 * Voice app entry — root URL is not the demo. Use /voice-agents (login required).
 */
export default function VoiceHomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-lg px-6 py-16 space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">PayAid Voice Agents</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            This app hosts AI voice agents, browser demos, and studio tools. The site root does not run a
            conversation — open <strong>Voice Agents</strong> after you log in.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/voice-agents"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            Open Voice Agents
          </Link>
          <Link
            href="/login?redirect=%2Fvoice-agents"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Sign in
          </Link>
          <p className="text-xs text-slate-500">
            You will be asked to log in if needed, then redirected to your workspace Home.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-600 space-y-2">
          <p className="font-medium text-slate-800">Direct links (after login)</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>
              Home: <code className="text-[11px]">/voice-agents/your-tenant-id/Home</code>
            </li>
            <li>
              Browser demo: <code className="text-[11px]">/voice-agents/your-tenant-id/Demo?agentId=…</code>
            </li>
            <li>
              Studio: <code className="text-[11px]">/voice-agents/your-tenant-id/studio?agentId=…</code>
            </li>
          </ul>
        </div>
      </div>
    </main>
  )
}
