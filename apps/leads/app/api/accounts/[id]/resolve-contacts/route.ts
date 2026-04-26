import { NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { LeadContactResolutionService } from '@payaid/leads-core'
import { InternalFallbackProvider, ProviderAAdapter, ProviderBAdapter } from '@payaid/leads-providers'
import { recordLeadProviderUsage } from '@payaid/queue'

const resolver = new LeadContactResolutionService()

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = await request.json()
  const tenantId = body.tenantId as string
  if (!tenantId) return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })

  const { id } = await params
  const contactsFromBody = Array.isArray(body.contacts) ? body.contacts : []

  let contacts = contactsFromBody
  if (contacts.length === 0) {
    const account = await prisma.leadAccount.findFirst({
      where: { id, tenantId },
      include: {
        segment: {
          include: {
            brief: {
              select: { personaFilters: true },
            },
          },
        },
      },
    })

    if (!account) {
      return NextResponse.json({ error: 'Lead account not found' }, { status: 404 })
    }

    const personas = Array.isArray(account.segment?.brief?.personaFilters) ? account.segment.brief.personaFilters : []
    contacts = await discoverContactsWaterfall({
      tenantId,
      accountId: id,
      personas,
      limit: Math.max(1, Number(body.limit ?? 25)),
    })
  }

  const result = await resolver.resolveAndPersist({ tenantId, accountId: id, contacts })
  return NextResponse.json(result, { status: 201 })
}

async function discoverContactsWaterfall(input: {
  tenantId: string
  accountId: string
  personas: unknown[]
  limit: number
}) {
  const providers = [new ProviderAAdapter(), new ProviderBAdapter(), new InternalFallbackProvider()]
  const discovered = []
  const targetCoverage = Math.max(5, Math.floor(input.limit * 0.6))

  for (const provider of providers) {
    const startedAt = Date.now()
    const candidates = await provider.findContacts({
      orgId: input.tenantId,
      accountId: input.accountId,
      personas: input.personas,
      limit: input.limit,
    })
    discovered.push(...candidates)

    await recordLeadProviderUsage({
      tenantId: input.tenantId,
      provider: provider.name,
      operation: 'findContacts',
      units: candidates.length,
      latencyMs: Date.now() - startedAt,
      success: true,
    })

    if (discovered.length >= targetCoverage) {
      break
    }
  }

  return discovered
}
