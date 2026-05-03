"use client";

import { useState } from "react";
import { Download, ExternalLink } from "lucide-react";
import type { MarketplaceModule } from "@/lib/modules";

export function ModuleCard({ module: mod }: { module: MarketplaceModule }) {
  const [installing, setInstalling] = useState(false);

  async function handleInstall() {
    setInstalling(true);
    try {
      const res = await fetch("/api/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: mod.moduleId,
          config: {},
          tenantId: "demo",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success && data.nextUrl) {
        window.location.href = data.nextUrl.startsWith("http")
          ? data.nextUrl
          : `http://localhost:3001${data.nextUrl}`;
        return;
      }
    } finally {
      setInstalling(false);
    }
  }

  const priceLabel =
    mod.freeLabel ??
    (mod.priceMonthly != null
      ? `₹${mod.priceMonthly}/mo`
      : mod.pricePerUse != null
        ? `₹${mod.pricePerUse}/use`
        : "—");

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900">{mod.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{mod.description}</p>
          <p className="text-sm font-medium text-slate-700 mt-2">{priceLabel}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleInstall}
          disabled={installing}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {installing ? "Installing…" : "Install Demo"}
        </button>
        <a
          href={`/agents/${mod.moduleId}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ExternalLink className="h-4 w-4" />
          Learn more
        </a>
      </div>
    </div>
  );
}
