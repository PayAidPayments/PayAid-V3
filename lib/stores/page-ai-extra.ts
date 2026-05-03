import { create } from 'zustand'

export type PageAIExtraPayload = Record<string, unknown> | null

interface PageAIExtraState {
  extra: PageAIExtraPayload
  setExtra: (extra: PageAIExtraPayload) => void
}

export const usePageAIExtraStore = create<PageAIExtraState>((set) => ({
  extra: null,
  setExtra: (extra) => set({ extra }),
}))
