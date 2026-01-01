/**
 * Document Reviewer Agent - Review documents and extract data
 */

import { prisma } from '@/lib/db/prisma'
import { getGroqClient } from '@/lib/ai/groq'
import { getOllamaClient } from '@/lib/ai/ollama'

export interface DocumentReviewResult {
  extractedData: {
    parties?: string[]
    dates?: string[]
    amounts?: number[]
    terms?: string[]
    clauses?: { title: string; content: string; risk?: 'low' | 'medium' | 'high' }[]
  }
  risks: {
    level: 'low' | 'medium' | 'high'
    issues: string[]
  }
  compliance: {
    status: 'compliant' | 'non-compliant' | 'needs-review'
    issues: string[]
  }
  summary: string
  recommendations: string[]
}

/**
 * Review document and extract structured data
 */
export async function reviewDocument(
  tenantId: string,
  documentContent: string,
  documentType: 'contract' | 'invoice' | 'proposal' | 'agreement' | 'other' = 'other'
): Promise<DocumentReviewResult> {
  const systemPrompt = `You are a document review AI agent. Analyze documents and extract:
- Parties involved (names, companies)
- Important dates (signing, expiry, payment)
- Financial amounts
- Key terms and conditions
- Important clauses with risk assessment
- Compliance issues
- Summary and recommendations

Return JSON format:
{
  "extractedData": {
    "parties": ["..."],
    "dates": ["..."],
    "amounts": [0],
    "terms": ["..."],
    "clauses": [{"title": "...", "content": "...", "risk": "low|medium|high"}]
  },
  "risks": {
    "level": "low|medium|high",
    "issues": ["..."]
  },
  "compliance": {
    "status": "compliant|non-compliant|needs-review",
    "issues": ["..."]
  },
  "summary": "...",
  "recommendations": ["..."]
}`

  const userPrompt = `Review this ${documentType} document:
${documentContent.substring(0, 8000)}` // Limit content length

  try {
    const groq = getGroqClient()
    const response = await groq.generateCompletion(userPrompt, systemPrompt)
    
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return parsed as DocumentReviewResult
    }
  } catch (error) {
    console.error('Groq document review failed, trying Ollama:', error)
    try {
      const ollama = getOllamaClient()
      const response = await ollama.generateCompletion(userPrompt, systemPrompt)
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return parsed as DocumentReviewResult
      }
    } catch (ollamaError) {
      console.error('Ollama document review failed:', ollamaError)
    }
  }

  // Fallback
  return {
    extractedData: {},
    risks: {
      level: 'low',
      issues: [],
    },
    compliance: {
      status: 'needs-review',
      issues: ['Unable to automatically review document'],
    },
    summary: 'Document review requires manual inspection',
    recommendations: ['Please review this document manually'],
  }
}

/**
 * Update CRM with extracted document data
 */
export async function updateCRMFromDocument(
  tenantId: string,
  reviewResult: DocumentReviewResult,
  documentId?: string
): Promise<{
  contactsCreated: number
  dealsCreated: number
  invoicesCreated: number
}> {
  const results = {
    contactsCreated: 0,
    dealsCreated: 0,
    invoicesCreated: 0,
  }

  // Create contacts from parties
  if (reviewResult.extractedData.parties) {
    for (const party of reviewResult.extractedData.parties) {
      // Try to extract email/phone from party string
      const emailMatch = party.match(/[\w.-]+@[\w.-]+\.\w+/)
      const phoneMatch = party.match(/[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}/)

      if (emailMatch || phoneMatch) {
        const existing = await prisma.contact.findFirst({
          where: {
            tenantId,
            OR: [
              emailMatch ? { email: emailMatch[0] } : {},
              phoneMatch ? { phone: phoneMatch[0] } : {},
            ],
          },
        })

        if (!existing) {
          await prisma.contact.create({
            data: {
              tenantId,
              name: party.split(/[<@]/)[0].trim(),
              email: emailMatch?.[0],
              phone: phoneMatch?.[0],
              type: 'lead',
              status: 'active',
              source: 'document',
            },
          })
          results.contactsCreated++
        }
      }
    }
  }

  // Create deals from amounts (if significant)
  if (reviewResult.extractedData.amounts) {
    // Get or create a default contact for document-extracted deals
    let defaultContact = await prisma.contact.findFirst({
      where: { tenantId, type: 'lead' },
    })
    
    if (!defaultContact) {
      defaultContact = await prisma.contact.create({
        data: {
          tenantId,
          name: 'Document Review Contact',
          email: 'document-review@example.com',
          type: 'lead',
          status: 'active',
        },
      })
    }
    
    for (const amount of reviewResult.extractedData.amounts) {
      if (amount > 10000) { // Only create deals for significant amounts
        const deal = await prisma.deal.create({
          data: {
            tenantId,
            contactId: defaultContact.id,
            name: `Deal from document - ₹${amount.toLocaleString('en-IN')}`,
            value: amount,
            stage: 'prospecting',
            probability: 25,
            expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        })
        results.dealsCreated++
      }
    }
  }

  return results
}

