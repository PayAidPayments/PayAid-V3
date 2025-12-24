/**
 * Image Generation Helper
 * Wraps existing image generation API for logo generation
 */

export async function generateImage(params: {
  prompt: string
  size?: string
  tenantId: string
  token?: string
}): Promise<{ url: string }> {
  // Use existing image generation endpoint
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  // Add authentication token if provided
  if (params.token) {
    headers['Authorization'] = `Bearer ${params.token}`
  }
  
  const response = await fetch(`${baseUrl}/api/ai/generate-image`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt: params.prompt,
      size: params.size || '1024x1024',
    }),
  })

  if (!response.ok) {
    let errorData: any
    try {
      errorData = await response.json()
    } catch (e) {
      // If response is not JSON, use status text
      throw new Error(`Image generation failed with status ${response.status}: ${response.statusText}`)
    }
    
    // Build detailed error message
    const errorMessage = errorData.error || errorData.message || 'Failed to generate image'
    const hint = errorData.hint ? ` ${errorData.hint}` : ''
    const details = errorData.details ? ` Details: ${errorData.details}` : ''
    
    throw new Error(`${errorMessage}${hint}${details}`)
  }

  const data = await response.json()
  return {
    url: data.url || data.imageUrl || data.image?.url || '',
  }
}
