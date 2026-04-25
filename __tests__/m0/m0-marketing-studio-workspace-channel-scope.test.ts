import {
  filterChannelsForWorkspace,
  getWorkspaceDefaultChannels,
} from '@/lib/marketing/studio-workspace'

describe('Marketing Studio workspace channel scope', () => {
  it('defaults Direct workspace to non-video channels', () => {
    expect(getWorkspaceDefaultChannels('direct')).toEqual(['email', 'sms', 'whatsapp'])
  })

  it('filters out social/video channels from Direct workspace', () => {
    expect(
      filterChannelsForWorkspace(['email', 'youtube', 'instagram', 'sms'], 'direct')
    ).toEqual(['email', 'sms'])
  })

  it('keeps only social channels in Social workspace', () => {
    expect(
      filterChannelsForWorkspace(['email', 'linkedin', 'youtube', 'whatsapp', 'facebook'], 'social')
    ).toEqual(['linkedin', 'youtube', 'facebook'])
  })
})
