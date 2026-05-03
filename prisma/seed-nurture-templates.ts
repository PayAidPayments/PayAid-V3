/**
 * Seed default nurture templates
 * Run with: npx tsx prisma/seed-nurture-templates.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedNurtureTemplates() {
  console.log('🌱 Seeding nurture templates...')

  // Get all tenants
  const tenants = await prisma.tenant.findMany()

  for (const tenant of tenants) {
    // Check if templates already exist
    const existing = await prisma.nurtureTemplate.findFirst({
      where: { tenantId: tenant.id },
    })

    if (existing) {
      console.log(`⏭️  Templates already exist for tenant: ${tenant.name}`)
      continue
    }

    // Create Cold Lead Nurture Template
    const coldTemplate = await prisma.nurtureTemplate.create({
      data: {
        name: 'Cold Lead Nurture',
        description: '7-day sequence for cold leads with no recent activity',
        tenantId: tenant.id,
        steps: {
          create: [
            {
              dayNumber: 0,
              channel: 'email',
              subject: 'Welcome to {Company}! Let\'s explore how we can help',
              body: `Hi {Name},

Thank you for your interest in {Company}. We're excited to help you achieve your business goals.

Our platform offers:
- Complete CRM solution
- E-commerce management
- GST-compliant invoicing
- Marketing automation
- AI-powered insights

Would you like to schedule a quick 15-minute demo to see how we can help your business grow?

Best regards,
{YourName}`,
              order: 1,
            },
            {
              dayNumber: 3,
              channel: 'email',
              subject: 'Success Story: How {Company} helped XYZ Corp grow 3x',
              body: `Hi {Name},

I wanted to share a success story that might interest you.

XYZ Corp, a company similar to yours, implemented our solution and saw:
- 3x increase in sales
- 50% reduction in manual work
- Complete GST compliance automation

Read the full case study here: [Link]

Would you like to see how this could work for your business?

Best regards,
{YourName}`,
              order: 2,
            },
            {
              dayNumber: 5,
              channel: 'email',
              subject: 'Special Offer: 20% off your first 3 months',
              body: `Hi {Name},

I have a special offer for you:

Get 20% off your first 3 months when you sign up this week!

This offer includes:
- Full access to all features
- Priority support
- Free onboarding and training
- Money-back guarantee

Offer expires in 2 days. Don't miss out!

Schedule a call: [Link]

Best regards,
{YourName}`,
              order: 3,
            },
            {
              dayNumber: 7,
              channel: 'sms', // Use SMS for urgency
              subject: null,
              body: `Hi {Name}, Last chance! 20% off expires tomorrow. Sign up now: [Link]`,
              order: 4,
            },
            {
              dayNumber: 7,
              channel: 'email',
              subject: 'Last Chance: 20% off expires tomorrow',
              body: `Hi {Name},

This is your last chance to get 20% off your first 3 months!

The offer expires tomorrow. Here's what you'll get:
- Complete business management platform
- GST compliance built-in
- AI-powered insights
- 24/7 support

Ready to get started? [Sign Up Now]

Questions? Reply to this email or call us.

Best regards,
{YourName}`,
              order: 5,
            },
            {
              dayNumber: 10,
              channel: 'email',
              subject: 'Final Follow-up: Still interested?',
              body: `Hi {Name},

I wanted to reach out one more time to see if you're still interested in {Company}.

If you're not ready now, that's okay! I'll check back in a few months.

If you'd like to learn more, just reply to this email or schedule a call: [Link]

Best regards,
{YourName}`,
              order: 6,
            },
          ],
        },
      },
    })

    // Create Warm Lead Nurture Template
    const warmTemplate = await prisma.nurtureTemplate.create({
      data: {
        name: 'Warm Lead Nurture',
        description: '5-day sequence for warm leads showing interest',
        tenantId: tenant.id,
        steps: {
          create: [
            {
              dayNumber: 0,
              channel: 'email',
              subject: 'Quick Demo: See {Company} in action',
              body: `Hi {Name},

Thanks for your interest! I'd love to show you how {Company} can help your business.

Let's schedule a quick 15-minute demo where I'll show you:
- How to manage your contacts and deals
- Create GST-compliant invoices in seconds
- Automate your marketing campaigns
- Get AI-powered business insights

Schedule your demo: [Link]

Best regards,
{YourName}`,
              order: 1,
            },
            {
              dayNumber: 2,
              channel: 'email',
              subject: 'Pricing Details: Transparent and Affordable',
              body: `Hi {Name},

I wanted to share our pricing with you:

Starter Plan: ₹999/month
- Up to 50 contacts
- 10 invoices/month
- Basic CRM features

Professional Plan: ₹2,999/month
- Unlimited contacts
- Unlimited invoices
- All features included
- Priority support

All plans include:
- GST compliance
- Payment gateway integration
- AI-powered insights
- Email support

See full pricing: [Link]

Questions? Reply to this email.

Best regards,
{YourName}`,
              order: 2,
            },
            {
              dayNumber: 5,
              channel: 'whatsapp', // Use WhatsApp for engagement
              subject: null,
              body: `Hi {Name}! Ready to get started? Here's a quick setup checklist: 1) Create account 2) Add business details 3) Import contacts 4) Create first invoice. Total time: 5 minutes! Get started: [Link]`,
              order: 3,
            },
            {
              dayNumber: 5,
              channel: 'email',
              subject: 'Setup Checklist: Get started in 5 minutes',
              body: `Hi {Name},

Ready to get started? Here's a quick setup checklist:

1. Create your account (2 minutes)
2. Add your business details (1 minute)
3. Import your contacts (2 minutes)
4. Create your first invoice (1 minute)

Total time: 5 minutes!

Get started: [Link]

Need help? Our team is here to assist you.

Best regards,
{YourName}`,
              order: 3,
            },
          ],
        },
      },
    })

    console.log(`✅ Created templates for tenant: ${tenant.name}`)
    console.log(`   - ${coldTemplate.name}`)
    console.log(`   - ${warmTemplate.name}`)
  }

  console.log('✅ Nurture templates seeding complete!')
}

seedNurtureTemplates()
  .catch((error) => {
    console.error('❌ Error seeding templates:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
