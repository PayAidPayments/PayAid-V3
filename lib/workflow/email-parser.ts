/**
 * Email Parser Agent - Extract structured data from emails
 */

import { prisma } from '@/lib/db/prisma'
import { getGroqClient } from '@/lib/ai/groq'
import { getOllamaClient } from '@/lib/ai/ollama'

export interface ParsedEmailData {
  contacts: {
    name?: string
    email?: string
    phone?: string
    company?: string
  }[]
  deals: {
    title?: string
    value?: number
    stage?: string
    probability?: number
  }[]
  tasks: {
    title: string
    description?: string
    priority?: string
    dueDate?: Date
  }[]
  category: 'inquiry' | 'support' | 'sales' | 'invoice' | 'other'
  urgency: 'low' | 'medium' | 'high'
  summary: string
}

/**
 * Parse email content and extract structured data
 */
export async function parseEmail(
  tenantId: string,
  emailContent: string,
  emailSubject: string,
  fromEmail: string,
  fromName?: string
): Promise<ParsedEmailData> {
  const systemPrompt = `You are an email parsing AI agent. Extract structured data from emails:
- Contact information (name, email, phone, company)
- Sales opportunities (deal title, value, stage)
- Action items (tasks with title, description, priority, due date)
- Category (inquiry, support, sales, invoice, other)
- Urgency (low, medium, high)
- Summary of email content

Return JSON format with this structure:
{
  "contacts": [{"name": "...", "email": "...", "phone": "...", "company": "..."}],
  "deals": [{"title": "...", "value": 0, "stage": "...", "probability": 0}],
  "tasks": [{"title": "...", "description": "...", "priority": "...", "dueDate": "..."}],
  "category": "inquiry|support|sales|invoice|other",
  "urgency": "low|medium|high",
  "summary": "..."
}`

  const userPrompt = `Parse this email:
Subject: ${emailSubject}
From: ${fromName || fromEmail} <${fromEmail}>
Content: ${emailContent}`

  try {
    const groq = getGroqClient()
    const response = await groq.generateCompletion(userPrompt, systemPrompt)
    
    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return parsed as ParsedEmailData
    }
  } catch (error) {
    console.error('Groq email parsing failed, trying Ollama:', error)
    try {
      const ollama = getOllamaClient()
      const response = await ollama.generateCompletion(userPrompt, systemPrompt)
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return parsed as ParsedEmailData
      }
    } catch (ollamaError) {
      console.error('Ollama email parsing failed:', ollamaError)
    }
  }

  // Fallback: Basic extraction
  return {
    contacts: [{
      name: fromName,
      email: fromEmail,
    }],
    deals: [],
    tasks: [],
    category: 'other',
    urgency: 'medium',
    summary: emailSubject,
  }
}

/**
 * Auto-process email: Parse and create contacts/deals/tasks
 */
export async function autoProcessEmail(
  tenantId: string,
  emailContent: string,
  emailSubject: string,
  fromEmail: string,
  fromName?: string
): Promise<{
  contactId?: string
  dealId?: string
  taskIds: string[]
}> {
  const parsed = await parseEmail(tenantId, emailContent, emailSubject, fromEmail, fromName)

  const results = {
    contactId: undefined as string | undefined,
    dealId: undefined as string | undefined,
    taskIds: [] as string[],
  }

  // Create/update contact
  if (parsed.contacts.length > 0) {
    const contactData = parsed.contacts[0]
    if (contactData.email) {
      let contact = await prisma.contact.findFirst({
        where: {
          tenantId,
          email: contactData.email,
        },
      })

      if (!contact) {
        contact = await prisma.contact.create({
          data: {
            tenantId,
            name: contactData.name || contactData.email.split('@')[0],
            email: contactData.email,
            phone: contactData.phone,
            company: contactData.company,
            type: 'lead',
            status: 'active',
            source: 'email',
          },
        })
      } else {
        // Update contact if new info available
        contact = await prisma.contact.update({
          where: { id: contact.id },
          data: {
            name: contactData.name || contact.name,
            phone: contactData.phone || contact.phone,
            company: contactData.company || contact.company,
            lastContactedAt: new Date(),
          },
        })
      }
      results.contactId = contact.id
    }
  }

  // Create deal if sales opportunity detected
  if (parsed.deals.length > 0 && results.contactId) {
    const dealData = parsed.deals[0]
    const deal = await prisma.deal.create({
      data: {
        tenantId,
        name: dealData.title || emailSubject,
        value: dealData.value || 0,
        stage: dealData.stage || 'prospecting',
        probability: dealData.probability || 25,
        contactId: results.contactId,
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    })
    results.dealId = deal.id
  }

  // Create tasks
  for (const taskData of parsed.tasks) {
    const task = await prisma.task.create({
      data: {
        tenantId,
        title: taskData.title,
        description: taskData.description || emailSubject,
        priority: (taskData.priority?.toUpperCase() as any) || 'MEDIUM',
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
        status: 'TODO',
        contactId: results.contactId,
      },
    })
    results.taskIds.push(task.id)
  }

  return results
}

