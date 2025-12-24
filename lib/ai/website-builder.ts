/**
 * AI Website Builder Service
 * Generates React/Next.js components using Groq, Ollama, or Hugging Face
 * Replaces Gemini-based implementations
 */

import { getGroqClient } from './groq'
import { getOllamaClient } from './ollama'
import { getHuggingFaceClient } from './huggingface'

export interface WebsiteGenerationRequest {
  prompt: string
  style?: 'modern' | 'classic' | 'minimal' | 'bold' | 'elegant'
  components?: string[] // e.g., ['hero', 'features', 'pricing', 'testimonials']
  framework?: 'nextjs' | 'react'
}

export interface GeneratedComponent {
  code: string
  componentName: string
  description: string
  type: 'component' | 'page' | 'layout'
}

export interface WebsiteGenerationResponse {
  success: boolean
  components: GeneratedComponent[]
  provider: 'groq' | 'ollama' | 'huggingface' | 'none'
  error?: string
}

/**
 * Generate website components from natural language prompt
 * Uses fallback chain: Groq → Ollama → Hugging Face
 */
export async function generateWebsiteComponents(
  request: WebsiteGenerationRequest
): Promise<WebsiteGenerationResponse> {
  const systemPrompt = buildSystemPrompt(request)
  const userPrompt = buildUserPrompt(request)

  // Try Groq first (fastest inference)
  try {
    const groq = getGroqClient()
    const response = await groq.generateCompletion(userPrompt, systemPrompt)
    const components = parseComponentCode(response, request.style)
    
    return {
      success: true,
      components,
      provider: 'groq',
    }
  } catch (groqError) {
    console.log('⚠️ Groq failed, trying Ollama...', groqError)
  }

  // Fallback to Ollama
  try {
    const ollama = getOllamaClient()
    const response = await ollama.generateCompletion(userPrompt, systemPrompt)
    const components = parseComponentCode(response, request.style)
    
    return {
      success: true,
      components,
      provider: 'ollama',
    }
  } catch (ollamaError) {
    console.log('⚠️ Ollama failed, trying Hugging Face...', ollamaError)
  }

  // Final fallback to Hugging Face
  try {
    const huggingFace = getHuggingFaceClient()
    const response = await huggingFace.generateCompletion(userPrompt, systemPrompt)
    const components = parseComponentCode(response, request.style)
    
    return {
      success: true,
      components,
      provider: 'huggingface',
    }
  } catch (huggingFaceError) {
    console.error('❌ All AI providers failed:', huggingFaceError)
    
    return {
      success: false,
      components: [],
      provider: 'none',
      error: 'All AI providers failed. Please check your API keys and try again.',
    }
  }
}

/**
 * Build system prompt for AI code generation
 */
function buildSystemPrompt(request: WebsiteGenerationRequest): string {
  const framework = request.framework || 'nextjs'
  
  return `You are an expert ${framework === 'nextjs' ? 'Next.js 14' : 'React'} developer specializing in creating beautiful, production-ready website components.

CRITICAL REQUIREMENTS:
1. Generate ONLY valid ${framework === 'nextjs' ? 'Next.js 14 App Router' : 'React'} code
2. Use TypeScript with proper types
3. Use Tailwind CSS for ALL styling (no inline styles, no CSS modules)
4. Make components fully responsive (mobile-first approach)
5. Export as named exports (export const ComponentName)
6. Follow React best practices (hooks, proper state management)
7. Include proper accessibility attributes (aria-labels, semantic HTML)
8. Use Next.js Image component for images (if Next.js)
9. NO markdown, NO explanations, ONLY code

STYLE GUIDELINES:
- Use modern, clean design patterns
- Implement proper spacing and typography
- Use Tailwind's color palette appropriately
- Ensure good contrast for accessibility
- Add hover states and transitions where appropriate

COMPONENT STRUCTURE:
- Each component should be self-contained
- Use proper TypeScript interfaces for props
- Include JSDoc comments for complex logic
- Make components reusable and modular

Generate components based on the user's description. Return ONLY the code, no markdown formatting, no explanations.`
}

/**
 * Build user prompt from request
 */
function buildUserPrompt(request: WebsiteGenerationRequest): string {
  let prompt = `Create a ${request.style || 'modern'} website component`
  
  if (request.components && request.components.length > 0) {
    prompt += ` with the following sections: ${request.components.join(', ')}`
  }
  
  prompt += `.\n\nUser Description: ${request.prompt}\n\n`
  prompt += `Generate clean, production-ready React/TypeScript code with Tailwind CSS styling.`
  
  if (request.components && request.components.length > 0) {
    prompt += `\n\nRequired components: ${request.components.map(c => `- ${c}`).join('\n')}`
  }
  
  return prompt
}

/**
 * Parse AI response to extract component code
 * Handles different response formats from different AI providers
 */
function parseComponentCode(aiResponse: string, style?: string): GeneratedComponent[] {
  const components: GeneratedComponent[] = []
  
  // Method 1: Extract code blocks from markdown (```tsx, ```ts, ```jsx, ```js)
  const codeBlockRegex = /```(?:tsx|ts|jsx|js|typescript|javascript)?\n([\s\S]*?)```/g
  const codeBlocks = [...aiResponse.matchAll(codeBlockRegex)]
  
  if (codeBlocks.length > 0) {
    codeBlocks.forEach((match, index) => {
      const code = match[1].trim()
      if (code && code.length > 50) { // Minimum code length check
        components.push({
          code,
          componentName: extractComponentName(code) || `GeneratedComponent${index + 1}`,
          description: `AI-generated ${style || 'modern'} component ${index + 1}`,
          type: determineComponentType(code),
        })
      }
    })
  }
  
  // Method 2: If no code blocks found, try to extract function/const declarations
  if (components.length === 0) {
    const functionRegex = /(?:export\s+)?(?:const|function)\s+(\w+)\s*[=:]\s*(?:\([^)]*\)\s*=>|function\s*\([^)]*\))\s*\{[\s\S]*?\}/g
    const functions = [...aiResponse.matchAll(functionRegex)]
    
    functions.forEach((match, index) => {
      const componentName = match[1]
      const fullMatch = match[0]
      
      if (fullMatch && fullMatch.length > 50) {
        components.push({
          code: fullMatch,
          componentName,
          description: `AI-generated component: ${componentName}`,
          type: 'component',
        })
      }
    })
  }
  
  // Method 3: If still no components, treat entire response as one component
  if (components.length === 0 && aiResponse.trim().length > 100) {
    // Try to clean up the response (remove markdown, explanations)
    let cleanedCode = aiResponse
      .replace(/^```[\w]*\n?/gm, '') // Remove opening code blocks
      .replace(/```$/gm, '') // Remove closing code blocks
      .replace(/^#+\s+.*$/gm, '') // Remove markdown headers
      .replace(/^\*\s+.*$/gm, '') // Remove markdown lists
      .trim()
    
    // Check if it looks like valid code (has import/export statements)
    if (cleanedCode.includes('import') || cleanedCode.includes('export')) {
      components.push({
        code: cleanedCode,
        componentName: extractComponentName(cleanedCode) || 'GeneratedComponent',
        description: 'AI-generated component',
        type: 'component',
      })
    }
  }
  
  return components
}

/**
 * Extract component name from code
 */
function extractComponentName(code: string): string | null {
  // Try to find: export const ComponentName
  const exportConstMatch = code.match(/export\s+const\s+(\w+)/)
  if (exportConstMatch) return exportConstMatch[1]
  
  // Try to find: const ComponentName =
  const constMatch = code.match(/const\s+(\w+)\s*=/)
  if (constMatch) return constMatch[1]
  
  // Try to find: function ComponentName
  const functionMatch = code.match(/function\s+(\w+)/)
  if (functionMatch) return functionMatch[1]
  
  // Try to find: export default function ComponentName
  const defaultExportMatch = code.match(/export\s+default\s+function\s+(\w+)/)
  if (defaultExportMatch) return defaultExportMatch[1]
  
  return null
}

/**
 * Determine component type from code
 */
function determineComponentType(code: string): 'component' | 'page' | 'layout' {
  const lowerCode = code.toLowerCase()
  
  if (lowerCode.includes('export default') || lowerCode.includes('page')) {
    return 'page'
  }
  
  if (lowerCode.includes('layout') || lowerCode.includes('rootlayout')) {
    return 'layout'
  }
  
  return 'component'
}

/**
 * Validate generated component code
 */
export function validateComponentCode(code: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Check for basic React/Next.js patterns
  if (!code.includes('return') && !code.includes('export')) {
    errors.push('Code does not appear to be a valid React component')
  }
  
  // Check for JSX
  if (!code.includes('<') && !code.includes('React.createElement')) {
    errors.push('Code does not contain JSX or React elements')
  }
  
  // Check for proper exports
  if (!code.includes('export') && !code.includes('module.exports')) {
    errors.push('Component is not exported')
  }
  
  // Check for TypeScript types (optional but recommended)
  if (!code.includes('interface') && !code.includes('type') && !code.includes(':')) {
    // Not an error, just a warning
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

