import { prisma } from '@/lib/db/prisma'
import { transcribeAudio, saveTranscription, generateTranscriptionSummary, extractActionItems } from '@/lib/ai/transcription-service'

export interface CallRecordingConfig {
  autoRecord: boolean
  requireConsent: boolean
  storageProvider: 'twilio' | 'exotel' | 's3'
  transcriptionEnabled: boolean
  tenantId: string
}

/**
 * Handle call recording from Twilio
 */
export async function handleTwilioRecording(
  recordingSid: string,
  callSid: string,
  recordingUrl: string,
  tenantId: string
): Promise<void> {
  try {
    // Find the interaction for this call
    const interaction = await prisma.interaction.findFirst({
      where: {
        tenantId,
        metadata: {
          path: ['callSid'],
          equals: callSid,
        },
      },
    })

    if (!interaction) {
      console.warn(`No interaction found for call SID: ${callSid}`)
      return
    }

    // Check if auto-recording is enabled and consent is given
    const config = await getCallRecordingConfig(tenantId)
    if (!config.autoRecord) {
      return
    }

    // Check consent if required
    if (config.requireConsent) {
      const consent = await checkRecordingConsent(interaction.contactId || '', tenantId)
      if (!consent) {
        console.warn(`Recording consent not given for contact: ${interaction.contactId}`)
        return
      }
    }

    // Download and store recording
    const recordingData = await downloadRecording(recordingUrl)
    const storedUrl = await storeRecording(recordingData, recordingSid, config.storageProvider, tenantId)

    // Update interaction with recording URL
    await prisma.interaction.update({
      where: { id: interaction.id },
      data: {
        metadata: {
          ...((interaction.metadata as any) || {}),
          recording: {
            sid: recordingSid,
            url: storedUrl,
            provider: 'twilio',
            recordedAt: new Date().toISOString(),
          },
        },
      },
    })

    // Transcribe if enabled
    if (config.transcriptionEnabled) {
      await processRecordingTranscription(interaction.id, storedUrl, tenantId)
    }
  } catch (error) {
    console.error('Error handling Twilio recording:', error)
    throw error
  }
}

/**
 * Handle call recording from Exotel
 */
export async function handleExotelRecording(
  recordingId: string,
  callId: string,
  recordingUrl: string,
  tenantId: string
): Promise<void> {
  try {
    // Find the interaction for this call
    const interaction = await prisma.interaction.findFirst({
      where: {
        tenantId,
        metadata: {
          path: ['exotelCallId'],
          equals: callId,
        },
      },
    })

    if (!interaction) {
      console.warn(`No interaction found for Exotel call ID: ${callId}`)
      return
    }

    // Check if auto-recording is enabled and consent is given
    const config = await getCallRecordingConfig(tenantId)
    if (!config.autoRecord) {
      return
    }

    // Check consent if required
    if (config.requireConsent) {
      const consent = await checkRecordingConsent(interaction.contactId || '', tenantId)
      if (!consent) {
        console.warn(`Recording consent not given for contact: ${interaction.contactId}`)
        return
      }
    }

    // Download and store recording
    const recordingData = await downloadRecording(recordingUrl)
    const storedUrl = await storeRecording(recordingData, recordingId, config.storageProvider, tenantId)

    // Update interaction with recording URL
    await prisma.interaction.update({
      where: { id: interaction.id },
      data: {
        metadata: {
          ...((interaction.metadata as any) || {}),
          recording: {
            id: recordingId,
            url: storedUrl,
            provider: 'exotel',
            recordedAt: new Date().toISOString(),
          },
        },
      },
    })

    // Transcribe if enabled
    if (config.transcriptionEnabled) {
      await processRecordingTranscription(interaction.id, storedUrl, tenantId)
    }
  } catch (error) {
    console.error('Error handling Exotel recording:', error)
    throw error
  }
}

/**
 * Get call recording configuration for tenant
 */
async function getCallRecordingConfig(tenantId: string): Promise<CallRecordingConfig> {
  // In production, this would be stored in tenant settings
  // For now, return defaults
  return {
    autoRecord: true,
    requireConsent: true, // GDPR compliance
    storageProvider: process.env.CALL_RECORDING_STORAGE_PROVIDER === 'exotel' ? 'exotel' : 'twilio',
    transcriptionEnabled: true,
    tenantId,
  }
}

/**
 * Check if recording consent is given
 */
async function checkRecordingConsent(contactId: string, tenantId: string): Promise<boolean> {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId, tenantId },
    select: { metadata: true },
  })

  if (!contact) {
    return false
  }

  const metadata = (contact.metadata as any) || {}
  return metadata.callRecordingConsent === true
}

/**
 * Download recording from URL
 */
async function downloadRecording(recordingUrl: string): Promise<Buffer> {
  const response = await fetch(recordingUrl)
  if (!response.ok) {
    throw new Error(`Failed to download recording: ${response.statusText}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Store recording in configured storage
 */
async function storeRecording(
  recordingData: Buffer,
  recordingId: string,
  provider: 'twilio' | 'exotel' | 's3',
  tenantId: string
): Promise<string> {
  // In production, store in S3 or similar
  // For now, return the original URL or store in database
  // This is a placeholder - implement actual storage logic
  
  // Option 1: Store in S3
  if (provider === 's3' || process.env.S3_BUCKET) {
    // Implement S3 upload
    // const s3Url = await uploadToS3(recordingData, recordingId, tenantId)
    // return s3Url
  }

  // Option 2: Store file reference (for now)
  // In production, you'd upload to cloud storage
  return `https://storage.payaid.com/recordings/${tenantId}/${recordingId}.mp3`
}

/**
 * Process recording transcription
 */
async function processRecordingTranscription(
  interactionId: string,
  audioUrl: string,
  tenantId: string
): Promise<void> {
  try {
    // Transcribe audio
    const transcription = await transcribeAudio(audioUrl, {
      language: 'en',
      speakerDiarization: true,
      tenantId,
    })

    // Generate summary
    const summary = await generateTranscriptionSummary(transcription.transcript, tenantId)
    transcription.summary = summary

    // Extract action items
    const actionItems = await extractActionItems(transcription.transcript, tenantId)

    // Save transcription
    await saveTranscription(interactionId, transcription, audioUrl, tenantId)

    // Create tasks from action items
    const interaction = await prisma.interaction.findUnique({
      where: { id: interactionId },
      include: { contact: true, deal: true },
    })

    if (interaction && actionItems.length > 0) {
      for (const item of actionItems) {
        await prisma.task.create({
          data: {
            tenantId,
            title: item.text,
            description: `Auto-created from call transcription`,
            status: 'pending',
            dueDate: item.dueDate,
            contactId: interaction.contactId,
            dealId: interaction.dealId,
            createdByRepId: interaction.createdByRepId,
            source: 'call_transcription',
          },
        })
      }
    }
  } catch (error) {
    console.error('Error processing transcription:', error)
    // Don't throw - transcription failure shouldn't break the call recording
  }
}

/**
 * Update recording consent for a contact
 */
export async function updateRecordingConsent(
  contactId: string,
  consent: boolean,
  tenantId: string
): Promise<void> {
  await prisma.contact.update({
    where: { id: contactId, tenantId },
    data: {
      metadata: {
        ...((await prisma.contact.findUnique({ where: { id: contactId } }))?.metadata as any || {}),
        callRecordingConsent: consent,
        consentUpdatedAt: new Date().toISOString(),
      },
    },
  })
}
