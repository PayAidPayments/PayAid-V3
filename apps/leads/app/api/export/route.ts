import { NextResponse } from 'next/server'
import { prisma } from '@payaid/db'

export async function POST(request: Request) {
  const body = await request.json()
  const tenantId = body.tenantId as string
  const initiatedById = body.initiatedById as string
  const exportType = body.exportType as string

  if (!tenantId || !initiatedById || !exportType) {
    return NextResponse.json({ error: 'tenantId, initiatedById, and exportType are required' }, { status: 400 })
  }

  const job = await prisma.leadExportJob.create({
    data: {
      tenantId,
      initiatedById,
      exportType,
      status: 'PENDING',
      payload: body.payload ?? {},
    },
  })

  return NextResponse.json({ jobId: job.id }, { status: 202 })
}
