import { prisma } from '@payaid/db'
import { NextRequest, NextResponse } from 'next/server'

export const revalidate = 60

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  const { publicId: rawPublicId } = await params
  const publicId = decodeURIComponent(rawPublicId || '').trim()

  if (!publicId) {
    return NextResponse.json({ error: 'publicId is required' }, { status: 400 })
  }

  const agent = await prisma.voiceAgent.findFirst({
    where: {
      id: publicId,
      status: 'active',
    },
    select: {
      id: true,
      name: true,
    },
  })

  if (!agent?.id) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  return NextResponse.json({
    publicId: agent.id,
    name: agent.name,
    theme: {
      color: '#2563eb',
      position: 'bottom-right',
      icon: 'mic',
    },
  })
}
