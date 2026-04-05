/**
 * @payaid/ai – text, image, audio, video, embeddings, and TTS helpers.
 */
export const AI_PACKAGE = '@payaid/ai'

export { tts, generateTTS, type TTSResult } from './tts'

export { transcribeAudio, synthesizeSpeech, type TranscribeOptions, type SynthesizeOptions } from './audio'
export { generateText, type GenerateTextInput } from './text'
export { classifyText, type ClassifyTextInput } from './classify'
export {
  embedText,
  embedTexts,
  cosineSimilarity,
  rankTextsBySimilarity,
} from './embeddings'
export { qaDoc, type QaDocInput } from './doc-qa'
export {
  generateImage,
  isImageGenerationConfigured,
  type GenerateImageParams,
} from './image'
export { generateVideo, videoFromImage, type GenerateVideoParams } from './video'
export { getVideoQueueUrl } from './config'
