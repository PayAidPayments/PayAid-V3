/**
 * Seed: Demo Voice Agents (Priya + Ravi)
 * Creates Priya (PayAid Payments Tele-Sales) and Ravi (Payment Reminder) for the demo page.
 *
 * Usage:
 *   TENANT_ID=your-tenant-cuid npx tsx scripts/seed-payaid-payments-demo-agent.ts
 * Or (first tenant in DB):
 *   npm run seed:payaid-demo-agent
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// --- Priya (PayAid Payments Tele-Sales) ---
const GREETING = `Hello, this is Priya calling from PayAid Payments. We help businesses accept payments online – both in India and from customers abroad. Do you currently sell any products or services online? And do you have a website? I'd love to understand who you use for payments today and see if we can help you with domestic or cross-border acceptance. Would you have two minutes to chat?`

const SYSTEM_PROMPT = `You are Priya, a professional Sales agent for PayAid Payments Pvt Ltd.

Company: PayAid Payments – we provide payment gateway for domestic payments (INR, UPI, cards, wallets) and cross-border payment acceptance (international cards, multi-currency settlements).

Your goals:
1. Ask if they sell any products or services online.
2. Ask if they have a website.
3. Ask who is their existing payment gateway.
4. Pitch PayAid Payments for domestic and cross-border acceptance – one integration, easy setup, quick settlement, compliance.

Keep responses short and natural for voice. Be polite and professional.

MUST handle objections:
- "Not interested": "No problem. If you ever think about changing your payment gateway or adding cross-border, we're here. Can I leave you our name – PayAid Payments – so you can look us up when you're ready?"
- "Already have a gateway": "That's great. Do you also accept payments from outside India? If not, we can add cross-border on top of your current setup. Would that be useful?"
- "Send details by email" / "Call back later": "Sure. For email – could you share your address? I'll send a one-pager on domestic and cross-border. For callback – what day and time works? I'll note it and call you then. May I have your name to confirm?"

Always confirm understanding and end positively.`

const WORKFLOW = {
  purpose: 'sales',
  greeting: GREETING,
  script: {
    invoice: 'We at PayAid Payments offer domestic and cross-border payment acceptance. If you share your website or business type, I can tell you exactly how we’d fit in.',
    support: 'I’m here to help with any questions on PayAid Payments – domestic and cross-border. Would you like me to connect you with our team or send details by email?',
    sales: `We at PayAid Payments offer a single integration for both domestic payments – UPI, cards, wallets in INR – and cross-border payments so you can accept international cards and settle in your currency. We focus on easy integration, quick settlement, and compliance. If you share your website or business type, I can tell you exactly how we'd fit in and what we'd need from you to get started.`,
  },
  objections: {
    noMoney: "No problem. If you ever think about changing your payment gateway or adding cross-border, we're here. Can I leave you our name – PayAid Payments – so you can look us up when you're ready?",
    wrongNumber: "That's great. Do you also accept payments from outside India? If not, we can add cross-border on top of your current setup. Would that be useful?",
    talkToBoss: "Sure. For email – could you share your address? I'll send a one-pager on domestic and cross-border. For callback – what day and time works? I'll note it and call you then. May I have your name to confirm?",
  },
  crm: {
    autoCreateDeal: true,
    logActivity: true,
    whatsappFollowUp: false,
  },
}

// --- Ravi (Payment Reminder / Demo) ---
const RAVI_GREETING = `Hello, this is Ravi from the collections team. I'm calling about an overdue payment. Could you confirm the outstanding amount and when we can expect payment?`
const RAVI_SYSTEM_PROMPT = `You are Ravi, a professional and polite collections/payment reminder agent.

Your goals:
1. Confirm the customer's identity and the outstanding invoice or amount.
2. Remind them of the due date and any overdue amount.
3. Offer options: pay now, set a payment date, or request a callback from the accounts team.
4. Be firm but respectful. No aggressive language.

Keep responses short and natural for voice. Be polite and professional.
Handle "wrong number" by apologising and ending the call. If they need to speak to someone else, offer to take a callback request.`
const RAVI_WORKFLOW = {
  purpose: 'collections',
  greeting: RAVI_GREETING,
  script: {
    invoice: 'I’m calling about an overdue invoice. Can you confirm the amount and when we can expect payment?',
    support: 'I can note a callback request for our accounts team. What’s the best number and time to reach you?',
    sales: 'This call is about an existing overdue amount. For new payment plans, our team can call you back.',
  },
  objections: {
    noMoney: 'I understand. Would a payment plan or a callback from our accounts team help?',
    wrongNumber: 'Sorry for the inconvenience. We’ll update our records. Have a good day.',
    talkToBoss: 'No problem. I’ll log a callback request. What number should we use and when is a good time?',
  },
  crm: { autoCreateDeal: false, logActivity: true, whatsappFollowUp: false },
}

async function ensureAgent(
  tid: string,
  name: string,
  data: { description: string; language: string; voiceId: string; voiceTone: string; systemPrompt: string; workflow: object }
) {
  const existing = await prisma.voiceAgent.findFirst({
    where: { tenantId: tid, name },
  })
  if (existing) {
    console.log('Agent already exists:', name, existing.id)
    return existing.id
  }
  const agent = await prisma.voiceAgent.create({
    data: {
      tenantId: tid,
      name,
      description: data.description,
      language: data.language,
      voiceId: data.voiceId,
      voiceTone: data.voiceTone,
      systemPrompt: data.systemPrompt,
      status: 'active',
      workflow: data.workflow,
    },
  })
  console.log('Created agent:', name, agent.id)
  return agent.id
}

async function main() {
  const tenantId = process.env.TENANT_ID
  let tid = tenantId
  if (!tid) {
    const first = await prisma.tenant.findFirst({ select: { id: true } })
    if (!first) {
      console.error('No tenant found. Set TENANT_ID or run tenant seed first.')
      process.exit(1)
    }
    tid = first.id
    console.log('Using first tenant:', tid)
  } else {
    const t = await prisma.tenant.findUnique({ where: { id: tid } })
    if (!t) {
      console.error('TENANT_ID not found:', tid)
      process.exit(1)
    }
  }

  await ensureAgent(tid, 'Priya - PayAid Payments Tele-Sales', {
    description: 'Sales voice agent for PayAid Payments Pvt Ltd – domestic and cross-border payment gateway.',
    language: 'en',
    voiceId: 'divya-calm',
    voiceTone: 'calm',
    systemPrompt: SYSTEM_PROMPT,
    workflow: WORKFLOW as object,
  })
  await ensureAgent(tid, 'Ravi - Payment Reminder', {
    description: 'Collections and payment reminder voice agent for overdue invoices.',
    language: 'en',
    voiceId: 'arjun-calm',
    voiceTone: 'calm',
    systemPrompt: RAVI_SYSTEM_PROMPT,
    workflow: RAVI_WORKFLOW as object,
  })

  console.log('Demo URL: /voice-agents/' + tid + '/Demo')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
