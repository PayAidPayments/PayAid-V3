# 🏗️ AI Website Builder Integration Guide

## 📋 Overview

This guide covers integrating an AI-powered website builder into PayAid V3, replacing Gemini with your existing AI providers (Groq, Ollama, Hugging Face).

---

## 🎯 Recommended Approach

### Option 1: **Open Lovable** (⭐ Best Choice)

**GitHub:** [open-lovable](https://github.com/lovable-io/open-lovable)  
**Why:** 
- ✅ Already supports Groq, Ollama, and Hugging Face
- ✅ Production-ready, actively maintained
- ✅ Built with Next.js 14 (matches your stack)
- ✅ Modern React components
- ✅ Better architecture than the Gemini-based repo

**Features:**
- Natural language to React components
- Real-time preview
- Export ready code
- Multiple AI provider support
- TypeScript support

---

### Option 2: **Adapt the GitHub Repo You Shared**

The [AI Website Builder](https://github.com/Ratna-Babu/Ai-Website-Builder) you found uses:
- Gemini Flash 2.0 for code generation
- Convex for real-time collaboration
- Next.js + Tailwind CSS

**Pros:**
- Simple architecture
- Good starting point
- Uses Convex (you could replace with your Prisma setup)

**Cons:**
- Hardcoded to Gemini
- Less mature than Open Lovable
- Requires more adaptation work

---

## 🔧 Implementation Plan

### Step 1: Create AI Code Generation Service

Create a unified service that uses your existing AI providers:

**File:** `lib/ai/website-builder.ts`

```typescript
import { getGroqClient } from './groq'
import { getOllamaClient } from './ollama'
import { getHuggingFaceClient } from './huggingface'

interface WebsiteGenerationRequest {
  prompt: string
  style?: 'modern' | 'classic' | 'minimal' | 'bold'
  components?: string[] // ['hero', 'features', 'pricing']
}

interface GeneratedComponent {
  code: string
  componentName: string
  description: string
}

export async function generateWebsiteComponents(
  request: WebsiteGenerationRequest
): Promise<GeneratedComponent[]> {
  const systemPrompt = `You are an expert React/Next.js developer. Generate clean, production-ready React components using Tailwind CSS.

Requirements:
- Use Next.js 14 App Router conventions
- Use TypeScript
- Use Tailwind CSS for styling
- Make components responsive (mobile-first)
- Export as named exports
- Include proper TypeScript types
- Follow React best practices

Generate components based on the user's description. Return ONLY valid React/TypeScript code, no markdown, no explanations.`

  const userPrompt = buildUserPrompt(request)

  // Try AI providers in order: Groq → Ollama → Hugging Face
  try {
    // Try Groq first (fastest)
    const groq = getGroqClient()
    const response = await groq.generateCompletion(userPrompt, systemPrompt)
    return parseComponentCode(response)
  } catch (groqError) {
    console.log('Groq failed, trying Ollama...')
    
    try {
      // Fallback to Ollama
      const ollama = getOllamaClient()
      const response = await ollama.generateCompletion(userPrompt, systemPrompt)
      return parseComponentCode(response)
    } catch (ollamaError) {
      console.log('Ollama failed, trying Hugging Face...')
      
      // Final fallback to Hugging Face
      const huggingFace = getHuggingFaceClient()
      const response = await huggingFace.generateCompletion(userPrompt, systemPrompt)
      return parseComponentCode(response)
    }
  }
}

function buildUserPrompt(request: WebsiteGenerationRequest): string {
  let prompt = `Create a ${request.style || 'modern'} website with the following components:\n\n`
  
  if (request.components && request.components.length > 0) {
    prompt += `Required components: ${request.components.join(', ')}\n\n`
  }
  
  prompt += `Description: ${request.prompt}\n\n`
  prompt += `Generate React components with Tailwind CSS styling.`
  
  return prompt
}

function parseComponentCode(aiResponse: string): GeneratedComponent[] {
  // Parse AI response to extract component code
  // This will need to handle different AI response formats
  // You might need to use regex or a more sophisticated parser
  
  // Example: Extract code blocks from markdown
  const codeBlockRegex = /```(?:tsx|ts|jsx|js)?\n([\s\S]*?)```/g
  const matches = [...aiResponse.matchAll(codeBlockRegex)]
  
  return matches.map((match, index) => ({
    code: match[1].trim(),
    componentName: `GeneratedComponent${index + 1}`,
    description: `AI-generated component ${index + 1}`
  }))
}
```

---

### Step 2: Create API Endpoint

**File:** `app/api/websites/generate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { generateWebsiteComponents } from '@/lib/ai/website-builder'

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    
    const { prompt, style, components } = body
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }
    
    const generatedComponents = await generateWebsiteComponents({
      prompt,
      style,
      components,
    })
    
    return NextResponse.json({
      success: true,
      components: generatedComponents,
    })
  } catch (error: any) {
    console.error('Website generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate website components' },
      { status: 500 }
    )
  }
}
```

---

### Step 3: Frontend Integration

**File:** `app/dashboard/websites/builder/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'

export default function WebsiteBuilderPage() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [components, setComponents] = useState<any[]>([])

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/websites/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      
      const data = await response.json()
      if (data.success) {
        setComponents(data.components)
      }
    } catch (error) {
      console.error('Generation error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">AI Website Builder</h1>
      
      <Card className="p-6 mb-6">
        <Textarea
          placeholder="Describe your website... e.g., 'Create a modern landing page for a SaaS product with hero section, features grid, and pricing cards'"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          className="mb-4"
        />
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Website'}
        </Button>
      </Card>

      {components.length > 0 && (
        <div className="space-y-4">
          {components.map((component, index) => (
            <Card key={index} className="p-4">
              <h3 className="font-semibold mb-2">{component.componentName}</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto">
                <code>{component.code}</code>
              </pre>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## 🔄 Alternative: Use Open Lovable

If you want a more complete solution, consider integrating **Open Lovable**:

1. **Clone the repo:**
```bash
git clone https://github.com/lovable-io/open-lovable.git
```

2. **Extract the AI integration parts:**
   - Copy their AI provider abstraction layer
   - Adapt it to use your existing Groq/Ollama/Hugging Face clients
   - Use their component generation logic

3. **Key files to adapt:**
   - `lib/ai/generate.ts` - Component generation logic
   - `app/api/generate/route.ts` - API endpoint
   - `components/builder/` - Builder UI components

---

## 📊 Comparison: Your Options

| Feature | GitHub Repo (Gemini) | Open Lovable | Custom Build |
|---------|---------------------|-------------|--------------|
| **AI Provider Support** | Gemini only | Multiple (Groq, Ollama, HF) | ✅ Your choice |
| **Maturity** | Basic | Production-ready | Custom |
| **Integration Effort** | Medium | Low | High |
| **Customization** | High | Medium | Full control |
| **Maintenance** | Low | High (active) | You maintain |

---

## 🎯 Recommendation

**Best Approach:** Start with **Open Lovable** and adapt it to your stack:

1. ✅ Already supports your AI providers
2. ✅ Better code quality
3. ✅ Active maintenance
4. ✅ Production-ready
5. ✅ Easy to customize

**Alternative:** If you prefer the simpler Gemini repo, use the code above to replace Gemini with your AI providers.

---

## 🚀 Next Steps

1. **Choose your approach** (Open Lovable or adapt Gemini repo)
2. **Create the AI service** (`lib/ai/website-builder.ts`)
3. **Create API endpoint** (`app/api/websites/generate/route.ts`)
4. **Build frontend** (builder page)
5. **Test with your AI providers** (Groq, Ollama, Hugging Face)
6. **Add component preview** (live preview of generated components)
7. **Add export functionality** (download as React files)

---

## 📚 Additional Resources

- **Open Lovable Docs:** https://open-lovable.com
- **Groq API Docs:** https://console.groq.com/docs
- **Ollama Docs:** https://ollama.ai/docs
- **Hugging Face Inference API:** https://huggingface.co/docs/api-inference

---

## 💡 Tips

1. **Start Simple:** Begin with basic component generation, then add features
2. **Test Each Provider:** Make sure all three (Groq, Ollama, HF) work
3. **Error Handling:** Implement proper fallbacks between providers
4. **Rate Limiting:** Add rate limiting to prevent abuse
5. **Caching:** Cache generated components to reduce API calls
6. **Validation:** Validate generated code before saving

---

**Ready to implement?** Let me know which approach you prefer, and I can help you set it up!

