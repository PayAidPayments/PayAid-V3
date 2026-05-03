import { prisma } from '@payaid/db'
import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 60

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> | { publicId: string } }
) {
  const resolvedParams = params instanceof Promise ? await params : params
  const publicId = decodeURIComponent(resolvedParams.publicId || '').trim()

  if (!publicId) {
    return NextResponse.json({ error: 'publicId is required' }, { status: 400 })
  }

  const agent = await prisma.voiceAgent.findFirst({
    where: {
      publicId,
      status: 'active',
    },
    select: {
      publicId: true,
      name: true,
      theme: true,
    },
  })

  if (!agent?.publicId) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  return NextResponse.json({
    publicId: agent.publicId,
    name: agent.name,
    theme: agent.theme ?? {
      color: '#2563eb',
      position: 'bottom-right',
      icon: 'mic',
    },
  })
}

