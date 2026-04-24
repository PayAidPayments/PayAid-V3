import { prisma } from '@/lib/db/prisma'
import { isCanonicalWebsiteBuilderApiMode } from '@/lib/website-builder/canonical-api-mode'

type JsonObject = Record<string, any>
type Mode = 'canonical' | 'landing-page-bridge'

type ListParams = {
  tenantId: string
  status?: string | null
  goalType?: string | null
  page: number
  limit: number
}

type UpdateInput = {
  name?: string
  slug?: string
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  goalType?: string
  schemaJson?: JsonObject
  pageTree?: JsonObject[]
  metaTitle?: string | null
  metaDescription?: string | null
}

function normalizePageTreeForPersistence(pageTree: JsonObject[]): JsonObject[] {
  return pageTree.map((entry, index) => {
    const rawSlug = typeof entry.slug === 'string' ? entry.slug : `page-${index + 1}`
    const normalizedSlug = rawSlug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    return {
      ...entry,
      slug: normalizedSlug || `page-${index + 1}`,
      orderIndex: index,
    }
  })
}

const db = prisma as any

function hasCanonicalTables(): boolean {
  return Boolean(db.websiteSite?.findMany && db.websitePage?.findMany)
}

function resolveMode(): Mode {
  if (isCanonicalWebsiteBuilderApiMode() && hasCanonicalTables()) return 'canonical'
  return 'landing-page-bridge'
}

export async function listWebsiteSites(params: ListParams) {
  const mode = resolveMode()
  if (mode === 'canonical') {
    const where: JsonObject = { tenantId: params.tenantId }
    if (params.status) where.status = params.status
    if (params.goalType) where.primaryGoal = params.goalType
    const skip = (params.page - 1) * params.limit
    const [rows, total] = await Promise.all([
      db.websiteSite.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: params.limit }),
      db.websiteSite.count({ where }),
    ])
    return {
      mode,
      total,
      rows: rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        status: r.status,
        goalType: r.primaryGoal ?? 'lead_generation',
        pageCount: undefined,
        views: undefined,
        conversions: undefined,
        conversionRate: undefined,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    }
  }

  const where: JsonObject = { tenantId: params.tenantId }
  if (params.status) where.status = params.status
  const skip = (params.page - 1) * params.limit
  const [rows, total] = await Promise.all([
    db.landingPage.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: params.limit }),
    db.landingPage.count({ where }),
  ])
  return {
    mode,
    total,
    rows: rows
      .map((r: any) => {
        const content = (r.contentJson as JsonObject | null) ?? {}
        const goalType = content.websiteGoalType ?? 'lead_generation'
        if (params.goalType && goalType !== params.goalType) return null
        return {
          id: r.id,
          name: r.name,
          slug: r.slug,
          status: r.status,
          goalType,
          pageCount: Array.isArray(content.pages) ? content.pages.length : 0,
          views: r.views,
          conversions: r.conversions,
          conversionRate: r.conversionRate,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }
      })
      .filter(Boolean),
  }
}

export async function findSiteBySlug(slug: string) {
  const mode = resolveMode()
  if (mode === 'canonical') {
    return db.websiteSite.findFirst({ where: { slug } })
  }
  return db.landingPage.findUnique({ where: { slug } })
}

export async function createWebsiteSite(input: {
  tenantId: string
  name: string
  slug: string
  goalType: string
  metaTitle?: string
  metaDescription?: string
  schemaJson?: JsonObject
}) {
  const mode = resolveMode()
  if (mode === 'canonical') {
    const created = await db.websiteSite.create({
      data: {
        tenantId: input.tenantId,
        name: input.name,
        slug: input.slug,
        status: 'DRAFT',
        primaryGoal: input.goalType,
      },
    })
    return { mode, record: created }
  }

  const created = await db.landingPage.create({
    data: {
      tenantId: input.tenantId,
      name: input.name,
      slug: input.slug,
      status: 'DRAFT',
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      contentJson: {
        websiteGoalType: input.goalType,
        pages: [],
        schema: input.schemaJson ?? {},
      },
    },
  })
  return { mode, record: created }
}

export async function getWebsiteSiteById(tenantId: string, id: string) {
  const mode = resolveMode()
  if (mode === 'canonical') {
    const site = await db.websiteSite.findFirst({
      where: { id, tenantId },
      include: { pages: { orderBy: { createdAt: 'asc' } } },
    })
    if (!site) return { mode, site: null }
    return {
      mode,
      site: {
        id: site.id,
        name: site.name,
        slug: site.slug,
        status: site.status,
        goalType: site.primaryGoal ?? 'lead_generation',
        pageTree: site.pages ?? [],
        schemaJson: {},
        metaTitle: null,
        metaDescription: null,
        views: undefined,
        conversions: undefined,
        conversionRate: undefined,
        createdAt: site.createdAt,
        updatedAt: site.updatedAt,
      },
    }
  }

  const site = await db.landingPage.findFirst({ where: { id, tenantId } })
  if (!site) return { mode, site: null }
  const content = (site.contentJson as JsonObject | null) ?? {}
  return {
    mode,
    site: {
      id: site.id,
      name: site.name,
      slug: site.slug,
      status: site.status,
      goalType: content.websiteGoalType ?? 'lead_generation',
      pageTree: content.pages ?? [],
      schemaJson: content.schema ?? {},
      metaTitle: site.metaTitle,
      metaDescription: site.metaDescription,
      views: site.views,
      conversions: site.conversions,
      conversionRate: site.conversionRate,
      createdAt: site.createdAt,
      updatedAt: site.updatedAt,
    },
  }
}

export async function updateWebsiteSiteById(tenantId: string, id: string, input: UpdateInput) {
  const mode = resolveMode()
  if (mode === 'canonical') {
    const existing = await db.websiteSite.findFirst({ where: { id, tenantId } })
    if (!existing) return { mode, record: null }
    const updated = await db.websiteSite.update({
      where: { id },
      data: {
        name: input.name,
        slug: input.slug,
        status: input.status,
        primaryGoal: input.goalType,
      },
    })
    return { mode, record: updated }
  }

  const existing = await db.landingPage.findFirst({ where: { id, tenantId } })
  if (!existing) return { mode, record: null }
  const prevContent = (existing.contentJson as JsonObject | null) ?? {}
  const normalizedPageTree = input.pageTree ? normalizePageTreeForPersistence(input.pageTree) : undefined
  const nextContent = {
    ...prevContent,
    ...(input.goalType ? { websiteGoalType: input.goalType } : {}),
    ...(input.schemaJson ? { schema: input.schemaJson } : {}),
    ...(normalizedPageTree ? { pages: normalizedPageTree } : {}),
  }
  const updated = await db.landingPage.update({
    where: { id },
    data: {
      name: input.name,
      slug: input.slug,
      status: input.status,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      contentJson: nextContent,
    },
  })
  return { mode, record: updated, content: nextContent }
}

export async function setWebsiteSiteStatus(tenantId: string, id: string, status: 'DRAFT' | 'PUBLISHED') {
  const mode = resolveMode()
  if (mode === 'canonical') {
    const existing = await db.websiteSite.findFirst({ where: { id, tenantId } })
    if (!existing) return { mode, record: null }
    const updated = await db.websiteSite.update({
      where: { id },
      data: { status },
      select: { id: true, name: true, slug: true, status: true, updatedAt: true },
    })
    return { mode, record: updated }
  }
  const existing = await db.landingPage.findFirst({ where: { id, tenantId } })
  if (!existing) return { mode, record: null }
  const updated = await db.landingPage.update({
    where: { id },
    data: { status },
    select: { id: true, name: true, slug: true, status: true, updatedAt: true },
  })
  return { mode, record: updated }
}

export async function ingestWebsiteSubmission(input: { siteId: string }) {
  const mode = resolveMode()
  if (mode === 'canonical') {
    const site = await db.websiteSite.findFirst({
      where: { id: input.siteId, status: 'PUBLISHED' },
      select: { id: true, tenantId: true, slug: true },
    })
    return { mode, site, incremented: false }
  }
  const site = await db.landingPage.findFirst({
    where: { id: input.siteId, status: 'PUBLISHED' },
    select: { id: true, tenantId: true, slug: true },
  })
  if (!site) return { mode, site: null, incremented: false }
  await db.landingPage.update({
    where: { id: site.id },
    data: { conversions: { increment: 1 } },
  })
  return { mode, site, incremented: true }
}
