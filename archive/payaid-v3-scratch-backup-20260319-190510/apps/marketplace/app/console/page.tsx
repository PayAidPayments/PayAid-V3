import Link from "next/link";

export default function ConsolePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link
        href="/"
        className="text-sm font-medium text-slate-600 hover:text-slate-900 mb-6 inline-block"
      >
        ← Marketplace
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">Live Agent Runs</h1>
      <p className="text-slate-600 mt-1">
        Agent execution console (Phase 2). Runs will appear here.
      </p>
      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
        No runs yet. Install an agent and trigger a run from CRM or Finance.
      </div>
    </div>
  );
}
