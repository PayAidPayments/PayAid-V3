import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createCustomerSchema = z.object({
  contactId: z.string().optional(),
  customerName: z.string(),
  customerType: z.string(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  gstin: z.string().optional(),
  creditLimit: z.number().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'wholesale')
    
    const searchParams = request.nextUrl.searchParams
    const customerType = searchParams.get('customerType')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = { tenantId }
    if (customerType) where.customerType = customerType
    if (status) where.status = status

    const customers = await prisma.wholesaleCustomer.findMany({
      where,
      include: {
        pricings: true,
        creditLimits: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ customers })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'wholesale')
    
    const body = await request.json()
    const data = createCustomerSchema.parse(body)

    const customer = await prisma.wholesaleCustomer.create({
      data: {
        tenantId,
        contactId: data.contactId,
        customerName: data.customerName,
        customerType: data.customerType,
        phone: data.phone,
        email: data.email,
        address: data.address,
        gstin: data.gstin,
        creditLimit: data.creditLimit,
        paymentTerms: data.paymentTerms,
        notes: data.notes,
      },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

