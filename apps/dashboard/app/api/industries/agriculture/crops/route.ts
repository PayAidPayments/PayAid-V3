import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createCropSchema = z.object({
  cropName: z.string(),
  cropType: z.string().optional(),
  season: z.string().optional(),
  area: z.number().optional(),
  sowingDate: z.string().optional(),
  expectedHarvestDate: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'agriculture')
    
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const season = searchParams.get('season')

    const where: any = { tenantId }
    if (status) where.status = status
    if (season) where.season = season

    const crops = await prisma.agricultureCrop.findMany({
      where,
      include: { harvests: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ crops })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'agriculture')
    
    const body = await request.json()
    const data = createCropSchema.parse(body)

    const crop = await prisma.agricultureCrop.create({
      data: {
        tenantId,
        cropName: data.cropName,
        cropType: data.cropType,
        season: data.season,
        area: data.area,
        sowingDate: data.sowingDate ? new Date(data.sowingDate) : null,
        expectedHarvestDate: data.expectedHarvestDate ? new Date(data.expectedHarvestDate) : null,
        notes: data.notes,
      },
    })

    return NextResponse.json(crop, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

