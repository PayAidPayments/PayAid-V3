/**
 * Free Stack Voice Orchestrator
 * Uses 100% free/open-source services:
 * - Whisper (STT) - via existing Docker service
 * - Ollama (LLM) - already integrated
 * - Coqui TTS - already in Docker
 * 
 * This orchestrator bypasses paid services (Deepgram, ElevenLabs, OpenAI)
 * and uses only free alternatives.
 */

import { VoiceAgent, VoiceAgentCall } from '@prisma/client';
import WebSocket from 'ws';
import { prisma } from '@/lib/db/prisma';
import { transcribeAudioFree } from './stt-free'; // Uses Whisper (free)
import { synthesizeSpeechFree } from './tts-free'; // Uses Coqui TTS (free)
import { generateVoiceResponseFree } from './llm-free'; // Uses Ollama (free)
import { searchKnowledgeBase } from './knowledge-base';

/**
 * Detect language from audio (simple heuristic - can be enhanced)
 */
async function detectLanguage(audioBuffer: Buffer): Promise<string | null> {
  // For now, let Whisper auto-detect
  // In future, can add language detection model
  try {
    const sttResult = await transcribeAudioFree(audioBuffer, undefined); // Auto-detect
    return sttResult.language || null;
  } catch {
    return null;
  }
}

/**
 * Detect if text contains Hindi or Hinglish
 */
function detectHindiOrHinglish(text: string): boolean {
  // Hindi Unicode range: \u0900-\u097F
  const hindiPattern = /[\u0900-\u097F]/;
  return hindiPattern.test(text);
}

interface OrchestratorConfig {
  agent: VoiceAgent;
  call: VoiceAgentCall;
  webSocket: WebSocket;
}

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export class FreeStackVoiceOrchestrator {
  private agent: VoiceAgent;
  private call: VoiceAgentCall;
  private ws: WebSocket;
  
  // Conversation state
  private conversationHistory: ConversationMessage[] = [];
  private isProcessing = false;
  private isActive = true;
  private audioBuffer: Buffer[] = [];
  private lastProcessTime = 0;
  private readonly PROCESS_INTERVAL = 2000; // Process every 2 seconds

  constructor(config: OrchestratorConfig) {
    this.agent = config.agent;
    this.call = config.call;
    this.ws = config.webSocket;
  }

  /**
   * Start the orchestrator
   */
  async start() {
    console.log('[Free Stack Orchestrator] Starting for call:', this.call.callSid);
    console.log('[Free Stack Orchestrator] Using free services: Whisper (STT), Ollama (LLM), Coqui TTS');
    
    // ===== SEND GREETING =====
    const greeting = this.agent.description 
      ? `${this.agent.description.substring(0, 150)}. How can I help you?`
      : `Hello, you've reached ${this.agent.name}. How can I help you?`;
    
    await this.synthesizeAndPlay(greeting);
  }

  /**
   * Process incoming audio chunk
   * Accumulates audio and processes periodically
   */
  async processAudio(audioBuffer: Buffer) {
    if (!this.isActive) return;

    try {
      // Accumulate audio chunks
      this.audioBuffer.push(audioBuffer);

      // Process if enough time has passed (to avoid processing too frequently)
      const now = Date.now();
      if (now - this.lastProcessTime >= this.PROCESS_INTERVAL && this.audioBuffer.length > 0) {
        await this.processAccumulatedAudio();
        this.lastProcessTime = now;
      }
    } catch (error) {
      console.error('[Free Stack Orchestrator] Error processing audio:', error);
    }
  }

  /**
   * Process accumulated audio chunks
   */
  private async processAccumulatedAudio() {
    if (this.audioBuffer.length === 0 || this.isProcessing) return;

    this.isProcessing = true;

    try {
      // Combine audio chunks
      const combinedAudio = Buffer.concat(this.audioBuffer);
      this.audioBuffer = []; // Clear buffer

      // ===== STEP 1: SPEECH-TO-TEXT (Whisper - FREE) =====
      console.log('[Free Stack] Transcribing audio with Whisper...');
      // Auto-detect language for Hindi/Hinglish support
      const detectedLanguage = await detectLanguage(combinedAudio);
      const targetLanguage = detectedLanguage || this.agent.language || 'en';
      console.log(`[Free Stack] Detected language: ${targetLanguage}`);
      
      const sttResult = await transcribeAudioFree(
        combinedAudio,
        targetLanguage === 'hi' || targetLanguage === 'hinglish' ? 'hi' : targetLanguage
      );

      const transcript = sttResult.text.trim();
      if (!transcript) {
        console.log('[Free Stack] No speech detected in audio chunk');
        this.isProcessing = false;
        return;
      }

      console.log('[Free Stack] Transcript:', transcript);

      // Add to conversation history
      this.conversationHistory.push({
        role: 'user',
        content: transcript,
        timestamp: new Date()
      });

      // Save to database
      await prisma.callMessage.create({
        data: {
          callId: this.call.id,
          role: 'user',
          content: transcript,
          isPartial: false,
          confidence: sttResult.confidence || undefined
        }
      });

      // ===== STEP 2: SEARCH KNOWLEDGE BASE (if enabled) =====
      let knowledgeContext = '';
      if (this.agent.knowledgeBase) {
        try {
          const kbResults = await searchKnowledgeBase(this.agent.id, transcript, 3);
          if (kbResults && kbResults.length > 0) {
            knowledgeContext = kbResults.map(r => r.content).join('\n\n');
            console.log('[Free Stack] Found knowledge base context');
          }
        } catch (error) {
          console.warn('[Free Stack] Knowledge base search failed:', error);
        }
      }

      // ===== STEP 3: GENERATE LLM RESPONSE (Ollama - FREE) =====
      console.log('[Free Stack] Generating response with Ollama...');
      
      // Detect if transcript contains Hindi/Hinglish
      const isHindiOrHinglish = detectHindiOrHinglish(transcript);
      const responseLanguage = isHindiOrHinglish ? 'hi' : (targetLanguage || 'en');
      
      // Build system prompt with knowledge context and language support
      let systemPrompt = this.agent.systemPrompt;
      
      // Add Hindi/Hinglish support to system prompt
      if (isHindiOrHinglish) {
        systemPrompt += `\n\nIMPORTANT: The user is speaking in Hindi or Hinglish (Hindi-English mix). 
        You MUST respond in the same language (Hindi or Hinglish) that the user used.
        If the user mixes Hindi and English, you can respond in Hinglish.
        Be natural and conversational in Hindi/Hinglish.`;
      }
      if (knowledgeContext) {
        systemPrompt += `\n\nRelevant context:\n${knowledgeContext}`;
      }

      // Generate response using Ollama in detected language
      const response = await generateVoiceResponseFree(
        systemPrompt,
        this.conversationHistory.slice(-10).map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        responseLanguage
      );

      console.log('[Free Stack] Response:', response.substring(0, 100));

      // Add to conversation history
      this.conversationHistory.push({
        role: 'assistant',
        content: response,
        timestamp: new Date()
      });

      // Save to database
      await prisma.callMessage.create({
        data: {
          callId: this.call.id,
          role: 'assistant',
          content: response,
          isPartial: false
        }
      });

      // ===== STEP 4: TEXT-TO-SPEECH (Coqui TTS - FREE) =====
      console.log('[Free Stack] Synthesizing speech with Coqui TTS...');
      // Use detected language for TTS
      const ttsLanguage = responseLanguage === 'hi' || responseLanguage === 'hinglish' ? 'hi' : responseLanguage;
      await this.synthesizeAndPlay(response, ttsLanguage);

    } catch (error) {
      console.error('[Free Stack Orchestrator] Error in processing:', error);
      // Send error message to caller
      await this.synthesizeAndPlay('I apologize, but I encountered an error. Please try again.');
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Synthesize text to speech and stream to caller
   */
  private async synthesizeAndPlay(text: string, language?: string) {
    if (!text.trim()) return;

    try {
      console.log('[Free Stack] Synthesizing:', text.substring(0, 100));

      // ===== USE COQUI TTS (FREE) =====
      const ttsLang = language || this.agent.language || 'en';
      const audioBuffer = await synthesizeSpeechFree(
        text,
        ttsLang,
        this.agent.voiceId || undefined,
        1.0 // speed
      );

      // ===== SEND AUDIO TO CALLER =====
      this.sendAudioToPhone(audioBuffer);

    } catch (error) {
      console.error('[Free Stack] TTS Error:', error);
    }
  }

  /**
   * Send audio to phone via WebSocket
   */
  private sendAudioToPhone(audioBuffer: Buffer) {
    if (this.ws.readyState === WebSocket.OPEN && this.isActive) {
      try {
        // Convert to μ-law (Twilio format) or send as-is depending on telephony provider
        // For now, send as base64
        this.ws.send(JSON.stringify({
          event: 'media',
          media: {
            payload: audioBuffer.toString('base64')
          }
        }));
      } catch (error) {
        console.error('[Free Stack] Error sending audio:', error);
      }
    }
  }

  /**
   * Broadcast message (for dashboard/monitoring)
   */
  private broadcastMessage(message: any) {
    if (this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('[Free Stack] Error broadcasting:', error);
      }
    }
  }

  /**
   * Stop the orchestrator
   */
  async stop() {
    console.log('[Free Stack Orchestrator] Stopping for call:', this.call.callSid);
    this.isActive = false;

    // Process any remaining audio
    if (this.audioBuffer.length > 0) {
      await this.processAccumulatedAudio();
    }

    // Update call transcript
    const transcript = this.conversationHistory
      .map(msg => `${msg.role === 'user' ? 'User' : 'Agent'}: ${msg.content}`)
      .join('\n\n');

    await prisma.voiceAgentCall.update({
      where: { id: this.call.id },
      data: {
        transcript,
        status: 'completed',
        endTime: new Date()
      }
    });
  }
}
