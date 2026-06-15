import { CRM_STAGE_TRIGGERS } from '@/lib/voice-agent/triggers/crm-stage-trigger'

describe('CRM_STAGE_TRIGGERS', () => {
  it('includes blueprint stage triggers', () => {
    expect(CRM_STAGE_TRIGGERS).toEqual(['new_lead', 'renewal_due', 'invoice_overdue'])
  })
})
