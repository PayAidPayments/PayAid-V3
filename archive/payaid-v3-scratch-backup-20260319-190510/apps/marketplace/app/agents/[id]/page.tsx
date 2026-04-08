import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = await prisma.agent.findUnique({
    where: { id },
  });
  if (!agent) {
    const core = ["crm", "finance", "hr", "whatsapp"];
    if (core.includes(id)) {
      return (
        <div className="max-w-2xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-bold text-slate-900 capitalize">{id}</h1>
          <p className="text-slate-600 mt-2">
            Core module. Install from the marketplace to enable.
          </p>
          <Link
            href="/"
            className="inline-block mt-4 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← Back to marketplace
          </Link>
        </div>
      );
    }
    notFound();
  }

  const priceLabel =
    agent.priceMonthly != null
      ? `₹${agent.priceMonthly}/month`
      : "Free";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link
        href="/"
        className="text-sm font-medium text-slate-600 hover:text-slate-900 mb-6 inline-block"
      >
        ← Marketplace
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">{agent.name}</h1>
      <p className="text-lg text-slate-600 mt-1">{priceLabel}</p>
      <p className="mt-4 text-slate-700">{agent.description}</p>
      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-2">
          How it works
        </h2>
        <p className="text-sm text-slate-600">
          Configure and run this agent from the Agent Console. Input/output
          and logs are available per run.
        </p>
      </div>
      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Install Agent
        </Link>
        <Link
          href="/console"
          className="inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          View Console
        </Link>
      </div>
    </div>
  );
}
