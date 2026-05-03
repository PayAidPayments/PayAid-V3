/**
 * Test script to verify Groq and Ollama API connections
 * Run with: npx tsx scripts/test-ai-services.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env file from project root
config({ path: resolve(process.cwd(), '.env') })

async function testAIServices() {
  const GROQ_API_KEY = process.env.GROQ_API_KEY
  const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant'
  const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
  const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY
  const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b'
  const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY
  const HUGGINGFACE_MODEL = process.env.HUGGINGFACE_MODEL || 'google/gemma-2-2b-it'

  console.log('🧪 Testing AI Service Connections\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // Test Groq
  console.log('📡 Testing Groq API...')
  if (!GROQ_API_KEY) {
    console.log('❌ GROQ_API_KEY not found in environment variables\n')
  } else {
    console.log(`✅ GROQ_API_KEY found (${GROQ_API_KEY.length} characters)`)
    console.log(`📦 Model: ${GROQ_MODEL}`)
    
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'user', content: 'Say "test" if you can read this.' },
          ],
          max_tokens: 10,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const message = data.choices[0]?.message?.content || 'no content'
        console.log(`✅ Groq API: SUCCESS`)
        console.log(`📝 Response: "${message}"\n`)
      } else {
        const errorText = await response.text()
        console.log(`❌ Groq API: FAILED`)
        console.log(`📝 Status: ${response.status} ${response.statusText}`)
        console.log(`📝 Error: ${errorText.substring(0, 200)}\n`)
      }
    } catch (error) {
      console.log(`❌ Groq API: ERROR`)
      console.log(`📝 Error: ${error instanceof Error ? error.message : String(error)}\n`)
    }
  }

  // Test Ollama
  console.log('📡 Testing Ollama API...')
  if (!OLLAMA_BASE_URL && !OLLAMA_API_KEY) {
    console.log('❌ OLLAMA_BASE_URL and OLLAMA_API_KEY not found\n')
  } else {
    console.log(`✅ OLLAMA_BASE_URL: ${OLLAMA_BASE_URL}`)
    if (OLLAMA_API_KEY) {
      console.log(`✅ OLLAMA_API_KEY found (${OLLAMA_API_KEY.length} characters)`)
    }
    console.log(`📦 Model: ${OLLAMA_MODEL}`)
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (OLLAMA_API_KEY) {
        headers['Authorization'] = `Bearer ${OLLAMA_API_KEY}`
      }

      const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: [
            { role: 'user', content: 'Say "test" if you can read this.' },
          ],
          stream: false,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const message = data.message?.content || data.response || 'no content'
        console.log(`✅ Ollama API: SUCCESS`)
        console.log(`📝 Response: "${message}"\n`)
      } else {
        const errorText = await response.text()
        console.log(`❌ Ollama API: FAILED`)
        console.log(`📝 Status: ${response.status} ${response.statusText}`)
        console.log(`📝 Error: ${errorText.substring(0, 200)}\n`)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.log(`❌ Ollama API: ERROR`)
      console.log(`📝 Error: ${errorMsg}`)
      
      if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('fetch failed')) {
        console.log(`💡 Hint: Is Ollama running? Try: ollama serve`)
      }
      console.log('')
    }
  }

  // Test Hugging Face
  console.log('📡 Testing Hugging Face Inference API...')
  if (!HUGGINGFACE_API_KEY) {
    console.log('❌ HUGGINGFACE_API_KEY not found in environment variables\n')
  } else {
    console.log(`✅ HUGGINGFACE_API_KEY found (${HUGGINGFACE_API_KEY.length} characters)`)
    console.log(`📦 Model: ${HUGGINGFACE_MODEL}`)
    
    try {
      // Use new router endpoint with OpenAI-compatible format
      const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
        },
        body: JSON.stringify({
          model: HUGGINGFACE_MODEL,
          messages: [
            { role: 'user', content: 'Say "test" if you can read this.' },
          ],
          max_tokens: 50,
          temperature: 0.7,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const generatedText = data.choices?.[0]?.message?.content || ''
        console.log(`✅ Hugging Face API: SUCCESS`)
        console.log(`📝 Response: "${generatedText.trim()}"\n`)
        } else {
          const errorText = await response.text()
          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { error: errorText }
          }
          
          if (response.status === 503 && errorData.estimated_time) {
            console.log(`⏳ Hugging Face API: MODEL LOADING`)
            console.log(`📝 Estimated time: ${Math.ceil(errorData.estimated_time)} seconds`)
            console.log(`💡 Hint: This is normal for first request. Try again in a minute.\n`)
          } else {
            console.log(`❌ Hugging Face API: FAILED`)
            console.log(`📝 Status: ${response.status} ${response.statusText}`)
            const errorMsg = errorData.error?.message || errorData.message || errorData.error || JSON.stringify(errorData) || errorText.substring(0, 200)
            console.log(`📝 Error: ${errorMsg}\n`)
          }
        }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.log(`❌ Hugging Face API: ERROR`)
      console.log(`📝 Error: ${errorMsg}\n`)
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ Test complete!')
}

testAIServices().catch(console.error)
