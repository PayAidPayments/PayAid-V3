/**
 * Voice Agent Orchestrator
 * Coordinates STT → LLM → TTS pipeline for voice conversations
 */

import type { PrismaClient } from '@prisma/client'
import { transcribeAudio } from './stt'
import { generateVoiceResponse } from './llm'
import { synthesizeSpeech } from './tts'
import { searchKnowledgeBase } from './knowledge-base'
import { ToolExecutor, Tool } from './tool-executor'
import {
  detectRequestedLanguageSwitch,
  getLanguageSwitchAcknowledgement,
  normalizeLanguageCode,
} from './language-switch'

export interface ConversationTurn {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface VoiceAgentConfig {
  id: string
  systemPrompt: string
  language: string
  voiceId?: string
  voiceTone?: string
  conversationStyle?: 'casual' | 'neutral' | 'professional'
  knowledgeBaseEnabled: boolean
}

function resolveConversationStyle(workflow: unknown): 'casual' | 'neutral' | 'professional' {
  if (!workflow || typeof workflow !== 'object') return 'neutral'
  const raw = (workflow as { conversationStyle?: unknown }).conversationStyle
  if (raw === 'casual' || raw === 'neutral' || raw === 'professional') {
    return raw
  }
  return 'neutral'
}

export class VoiceAgentOrchestrator {
  private readonly prisma: PrismaClient
  private conversationHistory: Map<string, ConversationTurn[]> = new Map()
  private readonly MAX_HISTORY = 10 // Keep last 10 turns
  private toolExecutor: ToolExecutor = new ToolExecutor()
  private agentTools: Map<string, Tool[]> = new Map() // Tools per agent

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient
  }

  /**
   * Process a voice call turn
   * @param agentId - Agent ID
   * @param audioChunk - Audio buffer to process
   * @param language - Optional language code
   * @param conversationHistory - Optional conversation history (for per-call history)
   */
  async processVoiceCall(
    agentId: string,
    audioChunk: Buffer,
    language?: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<{
    audio: Buffer
    transcript: string
    response: string
    detectedLanguage: string
  }> {
    try {
      // Step 1: Get agent configuration
      const agent = await this.getAgentConfig(agentId)
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`)
      }

      // Step 2: Speech-to-Text
      const sttResult = await transcribeAudio(
        audioChunk,
        language || agent.language
      )
      const detectedLanguage = normalizeLanguageCode(sttResult.language || language || agent.language)
      const transcript = sttResult.text

      console.log(`[VoiceAgent] Detected language: ${detectedLanguage}`)
      console.log(`[VoiceAgent] Transcript: ${transcript}`)

      const requestedSwitch = detectRequestedLanguageSwitch(transcript, detectedLanguage)
      const effectiveLanguage = requestedSwitch ?? detectedLanguage

      // Step 3: Search Knowledge Base (if enabled)
      let context = ''
      if (agent.knowledgeBaseEnabled) {
        try {
          const kbResults = await searchKnowledgeBase(agentId, transcript, 3)
          if (kbResults && kbResults.length > 0) {
            context = kbResults
              .map((r) => r.content)
              .join('\n\n')
            console.log(`[VoiceAgent] Found ${kbResults.length} knowledge base results`)
          }
        } catch (error) {
          console.warn('[VoiceAgent] Knowledge base search failed:', error)
        }
      }

      // Step 4: Get conversation history
      // Use provided history (per-call) or fall back to agent-level history
      const history = conversationHistory 
        ? conversationHistory.map(h => ({ role: h.role, content: h.content, timestamp: new Date() }))
        : this.getConversationHistory(agentId)

      // Step 5: Generate response using LLM (with tool support)
      const systemPrompt = this.buildSystemPrompt(agent, effectiveLanguage, context)
      
      // Get agent's tools if any
      const agentTools = this.agentTools.get(agentId) || []
      if (agentTools.length > 0) {
        // Register tools for this agent
        this.toolExecutor.registerTools(agentTools)
      }
      
      // Generate initial response
      let response: string
      if (requestedSwitch) {
        response = getLanguageSwitchAcknowledgement(effectiveLanguage)
      } else {
        response = await generateVoiceResponse(
          systemPrompt,
          history.map(h => ({ role: h.role, content: h.content })),
          effectiveLanguage
        )
      }

      // Note: Full function calling requires LLM support (OpenAI-style)
      // For now, we use pattern-based tool detection as a fallback
      // This can be extended when Ollama adds function calling support
      // or when using OpenAI-compatible APIs

      // Step 6: Update conversation history
      // If using provided history, don't update internal map (caller manages it)
      if (!conversationHistory) {
        this.addToHistory(agentId, {
          role: 'user',
          content: transcript,
          timestamp: new Date(),
        })
        this.addToHistory(agentId, {
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        })
      }

      // Step 7: Text-to-Speech (VEXYL when configured, else Coqui/Bhashini/IndicParler)
      const audioResponse = await synthesizeSpeech(
        response,
        effectiveLanguage,
        agent.voiceId,
        1.0,
        { voiceTone: agent.voiceTone ?? undefined }
      )

      return {
        audio: audioResponse,
        transcript,
        response,
        detectedLanguage: effectiveLanguage,
      }
    } catch (error) {
      console.error('[VoiceAgent] Error processing voice call:', error)
      throw error
    }
  }

  /**
   * Get agent configuration from database
   */
  private async getAgentConfig(agentId: string): Promise<VoiceAgentConfig | null> {
    const agent = await this.prisma.voiceAgent.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        systemPrompt: true,
        language: true,
        voiceId: true,
        voiceTone: true,
        workflow: true,
        knowledgeBase: true,
      },
    })

    if (!agent) return null

    return {
      id: agent.id,
      systemPrompt: agent.systemPrompt,
      language: agent.language,
      voiceId: agent.voiceId || undefined,
      voiceTone: agent.voiceTone ?? undefined,
      conversationStyle: resolveConversationStyle(agent.workflow),
      knowledgeBaseEnabled: agent.knowledgeBase !== null,
    }
  }

  /**
   * Build system prompt with language and context
   */
  private buildSystemPrompt(
    agent: VoiceAgentConfig,
    language: string,
    context: string
  ): string {
    const languagePrompts: Record<string, string> = {
      hi: 'हिंदी में बात करें।',
      en: 'Speak in English.',
      ta: 'தமிழில் பேசுங்கள்.',
      te: 'తెలుగులో మాట్లాడండి.',
      kn: 'ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ.',
      mr: 'मराठीत बोला.',
      gu: 'ગુજરાતીમાં બોલો.',
      pa: 'ਪੰਜਾਬੀ ਵਿੱਚ ਬੋਲੋ.',
      bn: 'বাংলায় কথা বলুন.',
      ml: 'മലയാളത്തിൽ സംസാരിക്കുക.',
    }

    const languageInstruction = languagePrompts[language] || languagePrompts['en']

    const voicePerformanceHint =
      language === 'te'
        ? ' Sound like a real tele-caller: natural, empathetic wording in Telugu—not a flat read-aloud; brief reactions where appropriate.'
        : ''

    const styleInstruction: Record<'casual' | 'neutral' | 'professional', string> = {
      casual: 'Keep wording casual and everyday, like a normal friendly person talking.',
      neutral: 'Keep wording balanced, clear, and natural in day-to-day speech.',
      professional: 'Keep wording professional but still modern, simple, and conversational.',
    }

    const conversationStyle = agent.conversationStyle ?? 'neutral'
    let prompt = `${agent.systemPrompt}\n\n${languageInstruction}${voicePerformanceHint}`
    prompt += `\nConversation style: ${conversationStyle}. ${styleInstruction[conversationStyle]}`
    prompt += '\nUse everyday modern conversational wording. Avoid archaic, poetic, or overly formal vocabulary.'

    if (context) {
      prompt += `\n\nRelevant Context:\n${context}\n\nUse this context to provide accurate information.`
    }

    return prompt
  }

  /**
   * Process a text-only turn (e.g. for VEXYL Custom LLM webhook).
   * Returns only the assistant reply text; no STT/TTS.
   */
  async processTextTurn(
    agentId: string,
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    options?: { language?: string; callerContext?: string }
  ): Promise<string> {
    const agent = await this.getAgentConfig(agentId)
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`)
    }
    const language = options?.language || agent.language

    let context = options?.callerContext || ''
    if (agent.knowledgeBaseEnabled && !context) {
      try {
        const kbResults = await searchKnowledgeBase(agentId, userMessage, 3)
        if (kbResults?.length) {
          context = kbResults.map((r) => r.content).join('\n\n')
        }
      } catch (e) {
        console.warn('[VoiceAgent] Knowledge base search failed:', e)
      }
    }

    const systemPrompt = this.buildSystemPrompt(agent, language, context)
    const historyWithUser = [
      ...conversationHistory.map((h) => ({ role: h.role, content: h.content })),
      { role: 'user' as const, content: userMessage },
    ]
    return generateVoiceResponse(systemPrompt, historyWithUser, language)
  }

  /**
   * Get conversation history for agent
   */
  private getConversationHistory(agentId: string): ConversationTurn[] {
    return this.conversationHistory.get(agentId) || []
  }

  /**
   * Add turn to conversation history
   */
  private addToHistory(agentId: string, turn: ConversationTurn): void {
    const history = this.getConversationHistory(agentId)
    history.push(turn)

    // Keep only last N turns
    if (history.length > this.MAX_HISTORY) {
      history.shift()
    }

    this.conversationHistory.set(agentId, history)
  }

  /**
   * Register tools for an agent
   */
  registerAgentTools(agentId: string, tools: Tool[]): void {
    this.agentTools.set(agentId, tools)
    console.log(`[VoiceAgent] Registered ${tools.length} tools for agent ${agentId}`)
  }

  /**
   * Get tools for an agent
   */
  getAgentTools(agentId: string): Tool[] {
    return this.agentTools.get(agentId) || []
  }

  /**
   * Get tool executor instance (for external use)
   */
  getToolExecutor(): ToolExecutor {
    return this.toolExecutor
  }

  /**
   * Clear conversation history for agent
   */
  clearHistory(agentId: string): void {
    this.conversationHistory.delete(agentId)
  }

  /**
   * Get conversation history as messages for LLM
   */
  getHistoryAsMessages(agentId: string): Array<{ role: string; content: string }> {
    const history = this.getConversationHistory(agentId)
    return history.map((turn) => ({
      role: turn.role,
      content: turn.content,
    }))
  }
}

