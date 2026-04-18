export { processInboundLead } from './process-inbound-lead'
export { INBOUND_ORCHESTRATION_SYSTEM_USER_ID } from './constants'
export type {
  InboundDedupePolicy,
  InboundMergeExistingFields,
  InboundSourceAttribution,
  InboundContactFields,
  ProcessInboundLeadInput,
  ProcessInboundLeadResult,
  ProcessInboundLeadError,
} from './types'
export {
  normalizeInboundContactFields,
  normalizeSourceAttribution,
  computeInboundLeadScoreV1,
  buildPayaidSourcePayload,
  trimEmail,
  trimPhone,
} from './source-normalize'
