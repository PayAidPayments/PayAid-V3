import { create } from 'zustand'
import type {
  StudioState,
  StudioStep1State,
  StudioStep2State,
  StudioStep3State,
  SegmentSummary,
  MarketingGoal,
  MarketingChannel,
  ChannelVariant,
  MediaItem,
} from '../types'

const initialStep1: StudioStep1State = {
  selectedSegmentId: null,
  segmentSummary: null,
  goal: 'LEADS',
}

const initialStep2: StudioStep2State = {
  prompt: '',
  generatedContent: null,
  channelVariants: [],
  generatedImages: [],
  generatedVideo: null,
  selectedImageIds: [],
  saveToLibrary: true,
}

const initialStep3: StudioStep3State = {
  selectedChannels: [],
  contentByChannel: {} as Record<MarketingChannel, string>,
  mediaIdsByChannel: {} as Record<MarketingChannel, string[]>,
  sendNow: false,
  scheduledFor: null,
}

interface StudioStore extends StudioState {
  setStep: (step: 1 | 2 | 3 | 4) => void
  setStep1: (payload: Partial<StudioStep1State>) => void
  setStep2: (payload: Partial<StudioStep2State>) => void
  setStep3: (payload: Partial<StudioStep3State>) => void
  setSegment: (segmentId: string | null, summary: SegmentSummary | null) => void
  setGoal: (goal: MarketingGoal) => void
  setChannelVariants: (variants: ChannelVariant[]) => void
  setGeneratedImages: (images: MediaItem[]) => void
  setGeneratedVideo: (video: MediaItem | null) => void
  setSelectedChannels: (channels: MarketingChannel[]) => void
  setContentForChannel: (channel: MarketingChannel, content: string) => void
  setMediaIdsForChannel: (channel: MarketingChannel, mediaIds: string[]) => void
  setLaunching: (v: boolean) => void
  setLastLaunchedAt: (v: string | null) => void
  reset: () => void
}

export const useStudioStore = create<StudioStore>((set) => ({
  step: 1,
  step1: initialStep1,
  step2: initialStep2,
  step3: initialStep3,
  isLaunching: false,
  lastLaunchedAt: null,

  setStep: (step) => set({ step }),

  setStep1: (payload) =>
    set((s) => ({ step1: { ...s.step1, ...payload } })),

  setStep2: (payload) =>
    set((s) => ({ step2: { ...s.step2, ...payload } })),

  setStep3: (payload) =>
    set((s) => ({ step3: { ...s.step3, ...payload } })),

  setSegment: (selectedSegmentId, segmentSummary) =>
    set((s) => ({ step1: { ...s.step1, selectedSegmentId, segmentSummary } })),

  setGoal: (goal) =>
    set((s) => ({ step1: { ...s.step1, goal } })),

  setChannelVariants: (channelVariants) =>
    set((s) => ({ step2: { ...s.step2, channelVariants } })),

  setGeneratedImages: (generatedImages) =>
    set((s) => ({ step2: { ...s.step2, generatedImages } })),

  setGeneratedVideo: (generatedVideo) =>
    set((s) => ({ step2: { ...s.step2, generatedVideo } })),

  setSelectedChannels: (selectedChannels) =>
    set((s) => ({ step3: { ...s.step3, selectedChannels } })),

  setContentForChannel: (channel, content) =>
    set((s) => ({
      step3: {
        ...s.step3,
        contentByChannel: { ...s.step3.contentByChannel, [channel]: content },
      },
    })),

  setMediaIdsForChannel: (channel, mediaIds) =>
    set((s) => ({
      step3: {
        ...s.step3,
        mediaIdsByChannel: { ...s.step3.mediaIdsByChannel, [channel]: mediaIds },
      },
    })),

  setLaunching: (isLaunching) => set({ isLaunching }),

  setLastLaunchedAt: (lastLaunchedAt) => set({ lastLaunchedAt }),

  reset: () =>
    set({
      step: 1,
      step1: initialStep1,
      step2: initialStep2,
      step3: initialStep3,
      isLaunching: false,
    }),
}))
