export {
  LeadRoutingConfigV1Schema,
  DEFAULT_LEAD_ROUTING_CONFIG_V1,
  parseLeadRoutingJson,
  coerceLeadRoutingConfigV1,
} from './config-schema'
export type { LeadRoutingConfigV1 } from './config-schema'
export { resolveInboundSalesRepAssignment } from './resolve-inbound-assignment'
export { loadLeadRoutingConfig } from './load-config'
