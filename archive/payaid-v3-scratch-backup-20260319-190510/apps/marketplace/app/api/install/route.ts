import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

async function seedModuleData(tenantId: string, moduleId: string) {
  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId },
  });
  if (!tenant) return;

  if (moduleId === "crm" && !tenant.modules.includes("crm")) {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { modules: [...tenant.modules, "crm"] },
    });
  }
  if (moduleId === "whatsapp" && !tenant.modules.includes("whatsapp")) {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { modules: [...tenant.modules, "whatsapp"] },
    });
  }
  if (moduleId === "finance" && !tenant.modules.includes("finance")) {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { modules: [...tenant.modules, "finance"] },
    });
  }
  if (moduleId === "hr" && !tenant.modules.includes("hr")) {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { modules: [...tenant.modules, "hr"] },
    });
  }
}

const MODULE_NEXT_URL: Record<string, string> = {
  crm: "/dashboard",
  finance: "/finance",
  hr: "/hr",
  whatsapp: "/whatsapp",
  sequences: "/sequences",
  "sales-dialer": "/sales-dialer",
  enrichment: "/enrichment",
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { moduleId, config = {}, tenantId: bodyTenantId } = body as {
    moduleId?: string;
    config?: Record<string, unknown>;
    tenantId?: string;
  };

  if (!moduleId?.trim()) {
    return NextResponse.json(
      { error: "moduleId required" },
      { status: 400 }
    );
  }

  const tenantSlugOrId = bodyTenantId ?? "demo";

  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [{ id: tenantSlugOrId }, { slug: tenantSlugOrId }],
    },
  });
  if (!tenant) {
    return NextResponse.json(
      { error: "Tenant not found" },
      { status: 404 }
    );
  }
  const tenantId = tenant.id;

  await prisma.tenantModule.upsert({
    where: {
      tenantId_moduleId: { tenantId, moduleId: moduleId.trim() },
    },
    create: {
      tenantId,
      moduleId: moduleId.trim(),
      enabled: true,
      config: Object.keys(config).length > 0 ? config : undefined,
    },
    update: {
      enabled: true,
      config: Object.keys(config).length > 0 ? config : undefined,
    },
  });

  await seedModuleData(tenantId, moduleId.trim());

  const baseUrl = process.env.NEXT_PUBLIC_CRM_URL ?? "http://localhost:3001";
  const nextPath = MODULE_NEXT_URL[moduleId.trim()] ?? `/dashboard`;
  const nextUrl = nextPath.startsWith("http") ? nextPath : `${baseUrl}${nextPath}`;

  return NextResponse.json({
    success: true,
    moduleId: moduleId.trim(),
    nextUrl,
    demoData: true,
  });
}
