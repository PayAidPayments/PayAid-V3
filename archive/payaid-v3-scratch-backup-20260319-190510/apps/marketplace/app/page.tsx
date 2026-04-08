import Link from "next/link";
import { prisma } from "@/lib/db";
import { CORE_MODULES, SALES_SUITE_MODULES } from "@/lib/modules";
import { ModuleCard } from "./_components/ModuleCard";

export const revalidate = 60;

export default async function MarketplacePage() {
  const agents = await prisma.agent.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-slate-900">
            PayAid Marketplace
          </Link>
          <Link
            href="http://localhost:3001/dashboard"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Open CRM →
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Install 25+ AI Modules for Your Business
          </h1>
          <p className="text-slate-600">
            Free core suite. Sales tools. India-first WhatsApp & GST agents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">
              Free Core
            </h2>
            <div className="space-y-3">
              {CORE_MODULES.map((mod) => (
                <ModuleCard key={mod.moduleId} module={mod} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">
              Sales Suite
            </h2>
            <div className="space-y-3">
              {SALES_SUITE_MODULES.map((mod) => (
                <ModuleCard key={mod.moduleId} module={mod} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">
              AI Agents
            </h2>
            <div className="space-y-3">
              {agents.map((agent) => (
                <ModuleCard
                  key={agent.id}
                  module={{
                    moduleId: agent.id,
                    name: agent.name,
                    description: agent.description,
                    category: "ai-agents",
                    priceMonthly: agent.priceMonthly ?? null,
                    pricePerUse: agent.pricePerUse ?? null,
                    freeLabel: agent.priceMonthly == null ? "Free" : undefined,
                  }}
                />
              ))}
              {agents.length === 0 && (
                <p className="text-sm text-slate-500 py-4">
                  Run seed-marketplace to load agents.
                </p>
              )}
            </div>
          </section>
        </div>

        <footer className="mt-16 text-center text-sm text-slate-500">
          <p>25+ modules. Free core suite. Multi-tenant. India-first.</p>
        </footer>
      </main>
    </div>
  );
}
