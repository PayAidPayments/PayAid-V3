'use client'

/**
 * Voice Interface Demo Component
 * Demonstrates VoiceInput and VoiceOutput components
 * Can be used for testing or as a standalone voice interface
 */

import { useState } from 'react'
import { VoiceInput } from './VoiceInput'
import { VoiceOutput } from './VoiceOutput'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function VoiceInterfaceDemo() {
  const [transcript, setTranscript] = useState<string>('')
  const [detectedLanguage, setDetectedLanguage] = useState<string>('en')
  const [synthesisText, setSynthesisText] = useState<string>('')

  const handleTranscript = (text: string, language: string) => {
    setTranscript(text)
    setDetectedLanguage(language)
    // Auto-populate synthesis text with transcript
    setSynthesisText(text)
  }

  const handleError = (error: Error) => {
    console.error('Voice interface error:', error)
    alert(`Error: ${error.message}`)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Voice Interface Demo</CardTitle>
          <CardDescription>
            Test voice input (Speech-to-Text) and output (Text-to-Speech) with Hindi/Hinglish support
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="input" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="input">Voice Input (STT)</TabsTrigger>
              <TabsTrigger value="output">Voice Output (TTS)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="input" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Speech-to-Text</h3>
                <p className="text-sm text-muted-foreground">
                  Click "Start Recording" and speak. The audio will be transcribed automatically.
                  Supports English, Hindi, and Hinglish (Hindi-English mix).
                </p>
              </div>
              
              <VoiceInput
                onTranscript={handleTranscript}
                onError={handleError}
                autoDetectLanguage={true}
                className="w-full"
              />
              
              {transcript && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Transcript:</span>
                    <span className="text-xs text-muted-foreground">
                      Language: {detectedLanguage === 'hi' ? 'Hindi' : detectedLanguage === 'hinglish' ? 'Hinglish' : 'English'}
                    </span>
                  </div>
                  <p className="text-sm">{transcript}</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="output" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Text-to-Speech</h3>
                <p className="text-sm text-muted-foreground">
                  Enter text and click "Play" to hear it synthesized. Supports English and Hindi voices.
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Text to Synthesize:</label>
                  <textarea
                    value={synthesisText}
                    onChange={(e) => setSynthesisText(e.target.value)}
                    placeholder="Enter text to convert to speech (supports English, Hindi, Hinglish)..."
                    className="w-full min-h-[100px] p-3 border rounded-md"
                  />
                </div>
                
                <VoiceOutput
                  text={synthesisText}
                  language={detectedLanguage}
                  className="w-full"
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Usage Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <strong>Voice Input:</strong>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>Click "Start Recording" to begin</li>
              <li>Speak clearly into your microphone</li>
              <li>Click "Stop Recording" when done</li>
              <li>Language is automatically detected</li>
              <li>Transcript appears below</li>
            </ul>
          </div>
          <div>
            <strong>Voice Output:</strong>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>Enter or paste text in the textarea</li>
              <li>Click "Play" to synthesize and play</li>
              <li>Voice is selected based on detected language</li>
              <li>Click "Stop" to pause playback</li>
            </ul>
          </div>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <strong>Note:</strong> Make sure your browser has microphone permissions enabled for voice input to work.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
