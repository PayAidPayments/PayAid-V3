export const LEAD_JOBS = {
  RUN_DISCOVERY: 'leadBrief.runDiscovery',
  ENRICH_ACCOUNT: 'leadAccount.enrich',
  RESOLVE_CONTACTS: 'leadAccount.resolveContacts',
  ENRICH_CONTACT: 'leadContact.enrich',
  COMPUTE_SCORE: 'leadScore.compute',
  REFRESH_SEGMENT: 'leadSegment.refresh',
  REENRICH_SEGMENT: 'leadSegment.reEnrich',
  SYNC_TO_CRM: 'leadActivation.syncToCrm',
  START_SEQUENCE: 'leadActivation.startSequence',
  GENERATE_EXPORT: 'leadExport.generate',
  AUDIT_SWEEP: 'leadCompliance.auditSweep',
} as const

export type LeadJobName = (typeof LEAD_JOBS)[keyof typeof LEAD_JOBS]
