/**
 * Telephony Voice Orchestrator
 * Real-time voice agent orchestrator for telephony calls
 * 
 * Handles parallel streaming:
 * - STT (Deepgram) - streams transcripts as user speaks
 * - LLM (OpenAI) - generates response during speech
 * - TTS (ElevenLabs) - streams audio back during generation
 * 
 * Target latency: 400-600ms
 */

import { Deepgram } from '@deepgram/sdk';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
// Note: OpenAI package may not be installed - make import conditional
let OpenAI: any = null
try {
  OpenAI = require('openai').OpenAI
} catch {
  // OpenAI not installed - will need to handle this in code
}
import { VoiceAgent, VoiceAgentCall } from '@prisma/client';
import WebSocket from 'ws';
import { prisma } from '@/lib/db/prisma';

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

export class TelephonyVoiceOrchestrator {
  private agent: VoiceAgent;
  private call: VoiceAgentCall;
  private ws: WebSocket;
  
  // AI Services
  private deepgram: Deepgram;
  private elevenlabs: ElevenLabsClient;
  private openai: OpenAI;
  
  // Streams
  private sttStream: any; // Deepgram live transcription
  private conversationHistory: ConversationMessage[] = [];
  private isProcessing = false;
  private isActive = true;

  constructor(config: OrchestratorConfig) {
    this.agent = config.agent;
    this.call = config.call;
    this.ws = config.webSocket;
    
    // ===== INITIALIZE AI SERVICES =====
    this.deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY || '');
    this.elevenlabs = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY || ''
    });
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || ''
    });
  }

  /**
   * Start the orchestrator
   */
  async start() {
    console.log('[Telephony Orchestrator] Starting for call:', this.call.callSid);
    
    // ===== INITIALIZE STT STREAM =====
    this.initializeSTTStream();
    
    // ===== SEND GREETING =====
    const greeting = this.agent.description 
      ? `${this.agent.description.substring(0, 150)}. How can I help you?`
      : `Hello, you've reached ${this.agent.name}. How can I help you?`;
    
    await this.synthesizeAndPlay(greeting);
  }

  /**
   * Initialize Deepgram streaming STT
   */
  private initializeSTTStream() {
    console.log('[Telephony Orchestrator] Initializing Deepgram STT stream...');
    
    // Deepgram SDK v2+ uses listen.client instead of transcription.live
    this.sttStream = (this.deepgram as any).listen.client({
      model: process.env.DEEPGRAM_MODEL || 'nova-2',
      language: this.agent.language || 'en',
      interim_results: true, // Get partial transcripts
      vad_events: true, // Voice activity detection
      endpointing: 300, // 300ms silence = end of speech
      encoding: 'mulaw', // Twilio uses μ-law
      sample_rate: 8000 // Twilio standard
    });

    // ===== HANDLE PARTIAL TRANSCRIPTS =====
    this.sttStream.on('transcriptReceived', async (message: any) => {
      try {
        const transcript = message.channel?.alternatives?.[0]?.transcript || '';
        const isFinal = message.is_final || false;
        const confidence = message.channel?.alternatives?.[0]?.confidence || 0;

        if (!transcript.trim()) return;

        if (isFinal) {
          console.log('[STT] Final transcript:', transcript);
          
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
              confidence
            }
          });

          // ===== GENERATE AND STREAM RESPONSE =====
          await this.generateAndStreamResponse(transcript);
          
        } else {
          // Partial/interim transcript
          console.log('[STT] Interim transcript:', transcript);
          
          // Broadcast to dashboard (optional)
          this.broadcastMessage({
            type: 'transcript_interim',
            text: transcript,
            callSid: this.call.callSid
          });
        }
      } catch (error) {
        console.error('[STT] Error processing transcript:', error);
      }
    });

    this.sttStream.on('error', (error: any) => {
      console.error('[STT] Stream error:', error);
    });

    this.sttStream.on('close', () => {
      console.log('[STT] Stream closed');
    });
  }

  /**
   * Process incoming audio chunk
   */
  async processAudio(audioBuffer: Buffer) {
    if (!this.isActive || !this.sttStream) return;

    try {
      // Send audio to Deepgram STT stream
      if (audioBuffer.length > 0) {
        this.sttStream.write(audioBuffer);
      }
    } catch (error) {
      console.error('[Telephony Orchestrator] Error processing audio:', error);
    }
  }

  /**
   * Generate LLM response and stream TTS
   */
  private async generateAndStreamResponse(userMessage: string) {
    if (this.isProcessing) {
      console.log('[LLM] Already processing, skipping...');
      return;
    }

    this.isProcessing = true;

    try {
      console.log('[LLM] Generating response for:', userMessage.substring(0, 100));

      // ===== BUILD MESSAGES FOR LLM =====
      const messages: any[] = [
        {
          role: 'system',
          content: this.agent.systemPrompt
        },
        ...this.conversationHistory.slice(-10).map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];

      // ===== STREAM FROM LLM =====
      let fullResponse = '';
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 500
      });

      // ===== HANDLE STREAMING RESPONSE =====
      let textBuffer = '';
      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          textBuffer += content;

          // ===== STREAM TO TTS IMMEDIATELY (every sentence or 50 chars) =====
          if (textBuffer.length >= 50 || /[.!?]\s*$/.test(textBuffer)) {
            await this.synthesizeAndPlay(textBuffer, false);
            textBuffer = '';
          }
        }
      }

      // Process remaining buffer
      if (textBuffer.trim()) {
        await this.synthesizeAndPlay(textBuffer, true);
      }

      // ===== ADD TO CONVERSATION HISTORY =====
      this.conversationHistory.push({
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date()
      });

      // Save to database
      await prisma.callMessage.create({
        data: {
          callId: this.call.id,
          role: 'assistant',
          content: fullResponse,
          isPartial: false
        }
      });

      console.log('[LLM] Response complete:', fullResponse.substring(0, 100));

    } catch (error) {
      console.error('[LLM] Error:', error);
      // Send error message to caller
      await this.synthesizeAndPlay('I apologize, but I encountered an error. Please try again.');
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Synthesize text to speech and stream to caller
   */
  private async synthesizeAndPlay(text: string, isFinal: boolean = true) {
    if (!text.trim()) return;

    try {
      console.log('[TTS] Synthesizing:', text.substring(0, 100));

      // ===== USE ELEVENLABS FOR STREAMING TTS =====
      const voiceId = this.agent.voiceId || process.env.ELEVENLABS_DEFAULT_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
      
      // ElevenLabs SDK uses generate method for streaming
      const audioStream = await this.elevenlabs.textToSpeech.generate(voiceId, {
        text,
        model_id: 'eleven_turbo_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      });

      // ===== STREAM AUDIO CHUNKS TO CALLER =====
      for await (const chunk of audioStream) {
        // Convert to μ-law (Twilio format)
        const mulawAudio = this.encodeToMulaw(chunk);
        
        // Send to caller via WebSocket
        this.sendAudioToPhone(mulawAudio);
      }

    } catch (error) {
      console.error('[TTS] Error:', error);
    }
  }

  /**
   * Send audio to phone via WebSocket
   */
  private sendAudioToPhone(audioBuffer: Buffer) {
    if (this.ws.readyState === WebSocket.OPEN && this.isActive) {
      try {
        this.ws.send(JSON.stringify({
          event: 'media',
          media: {
            payload: audioBuffer.toString('base64')
          }
        }));
      } catch (error) {
        console.error('[Telephony Orchestrator] Error sending audio:', error);
      }
    }
  }

  /**
   * Encode PCM audio to μ-law (Twilio format)
   * Simplified version - use a library for production
   */
  private encodeToMulaw(pcmBuffer: Buffer): Buffer {
    // This is a simplified μ-law encoder
    // For production, use a proper library like 'mulaw' npm package
    const output = Buffer.alloc(pcmBuffer.length / 2);
    
    for (let i = 0; i < output.length; i++) {
      const sample = pcmBuffer.readInt16LE(i * 2);
      output[i] = this.pcmToMulaw(sample);
    }
    
    return output;
  }

  /**
   * Convert PCM sample to μ-law
   */
  private pcmToMulaw(sample: number): number {
    const SIGN_BIT = 0x80;
    const QUANT_MASK = 0x0f;
    const SEG_SHIFT = 4;
    const SEG_MASK = 0x70;
    const BIAS = 0x84;

    let sign = (sample >> 8) & SIGN_BIT;
    if (sample < 0) {
      sample = -sample;
      sign = SIGN_BIT;
    }

    sample += BIAS;
    if (sample > 0x7fff) sample = 0x7fff;

    let exponent = 7;
    for (let expMask = 0x4000; (sample & expMask) === 0 && exponent > 0; exponent--, expMask >>= 1);

    const mantissa = (sample >> (exponent + 3)) & QUANT_MASK;
    const ulawbyte = ~(sign | (exponent << SEG_SHIFT) | mantissa);

    return ulawbyte & 0xff;
  }

  /**
   * Broadcast message (for dashboard/monitoring)
   */
  private broadcastMessage(message: any) {
    if (this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('[Telephony Orchestrator] Error broadcasting:', error);
      }
    }
  }

  /**
   * Stop the orchestrator
   */
  async stop() {
    console.log('[Telephony Orchestrator] Stopping for call:', this.call.callSid);
    this.isActive = false;

    if (this.sttStream) {
      try {
        this.sttStream.finish();
      } catch (error) {
        console.error('[Telephony Orchestrator] Error closing STT stream:', error);
      }
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
