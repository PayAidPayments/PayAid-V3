/**
 * Phase 4 thin orchestrator smoke (no DB writes).
 * Run: node node_modules/tsx/dist/cli.mjs scripts/smoke-customer-orchestrator.ts
 */
import {
  listCustomerOrchestratorRunbooks,
  runCustomerOrchestrator,
} from '../lib/ai/customer-specialists'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

async function main() {
  const runbooks = listCustomerOrchestratorRunbooks()
  assert(runbooks.length >= 2, 'expected at least 2 customer runbooks')
  assert(
    runbooks.some((r) => r.slug === 'sales-follow-up'),
    'missing sales-follow-up runbook'
  )
  assert(
    runbooks.some((r) => r.slug === 'gst-invoice-draft' && r.requiresApproval),
    'gst runbook must require approval'
  )

  const denied = await runCustomerOrchestrator({
    auth: {
      tenantId: 't1',
      userId: 'u1',
      roles: ['member'],
      licensedModules: ['marketing'],
    },
    payload: {
      runbook: 'sales-follow-up',
      contactName: 'Asha',
    },
    persistAudit: false,
  })
  assert(denied.allowed === false, 'orchestrator should deny without sales/crm')
  assert(denied.escalated === true, 'module deny should escalate')
  assert(denied.retryable === false, 'module deny should not be retryable')

  const sales = await runCustomerOrchestrator({
    auth: {
      tenantId: 't1',
      userId: 'u1',
      roles: ['member'],
      licensedModules: ['crm', 'sales', 'ai-studio'],
    },
    payload: {
      runbook: 'sales-follow-up',
      contactName: 'Asha Rao',
      companyName: 'Rao Traders',
      dealValueInr: 180000,
      notes: 'Follow up this week',
    },
    persistAudit: false,
  })
  assert(sales.allowed === true, `sales orch failed: ${sales.reason}`)
  assert(sales.bundle?.executable === false, 'draft must not be executable')
  assert(sales.bundle?.draft?.sendStatus === 'not_sent', 'must remain not_sent')
  assert(sales.attempt === 1, 'happy path should succeed on attempt 1')

  const gst = await runCustomerOrchestrator({
    auth: {
      tenantId: 't1',
      userId: 'u1',
      roles: ['manager'],
      licensedModules: ['finance', 'ai-studio'],
    },
    payload: {
      runbook: 'gst-invoice-draft',
      customerName: 'Beta Pvt Ltd',
      supplierStateCode: 'KA',
      placeOfSupplyStateCode: 'KA',
      lineItems: [
        {
          description: 'Retainer',
          quantity: 1,
          unitPriceInr: 10000,
          gstRatePercent: 18,
        },
      ],
    },
    persistAudit: false,
  })
  assert(gst.allowed === true, `gst orch failed: ${gst.reason}`)
  assert(gst.bundle?.approvalStatus === 'pending_approval', 'gst must pending approval')
  assert(gst.bundle?.executable === false, 'gst must not be executable')

  console.log('Customer orchestrator smoke PASS')
}

main().catch((error) => {
  console.error('Customer orchestrator smoke FAILED')
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
