/**
 * Phase 3 customer flow smoke (no HTTP, no DB audit writes).
 * Run: node node_modules/tsx/dist/cli.mjs scripts/smoke-customer-flows.ts
 */
import {
  loadCustomerSpecialistCatalog,
  runGstInvoiceDraftFlow,
  runSalesFollowUpFlow,
} from '../lib/ai/customer-specialists'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

async function main() {
  const catalog = loadCustomerSpecialistCatalog()

  const deniedSales = await runSalesFollowUpFlow({
    catalog,
    auth: {
      tenantId: 't1',
      userId: 'u1',
      roles: ['member'],
      licensedModules: ['marketing'],
    },
    input: {
      contactName: 'Asha',
      companyName: 'Demo Co',
      persistAudit: false,
    },
  })
  assert(deniedSales.allowed === false, 'sales should deny without crm/sales')
  assert(deniedSales.reasonCode === 'MODULE_NOT_LICENSED', 'expected MODULE_NOT_LICENSED')

  const sales = await runSalesFollowUpFlow({
    catalog,
    auth: {
      tenantId: 't1',
      userId: 'u1',
      roles: ['member'],
      licensedModules: ['crm', 'sales'],
    },
    input: {
      contactName: 'Asha Rao',
      companyName: 'Rao Traders',
      dealValueInr: 320000,
      notes: 'Urgent need this month; competitor Zoho mentioned',
      persistAudit: false,
    },
  })
  assert(sales.allowed === true, `sales should allow: ${sales.reason}`)
  assert(sales.bundle?.executable === false, 'sales draft must not be executable')
  assert(sales.bundle?.draft?.sendStatus === 'not_sent', 'sales must remain not_sent')
  assert(sales.bundle?.steps?.length === 3, 'sales should run 3 specialist steps')
  assert(
    Boolean((sales.bundle?.draft as { proposal?: { title?: string } })?.proposal?.title),
    'proposal draft missing'
  )

  const deniedFinance = await runGstInvoiceDraftFlow({
    catalog,
    auth: {
      tenantId: 't1',
      userId: 'u1',
      roles: ['member'],
      licensedModules: ['finance'],
    },
    input: {
      customerName: 'Beta Pvt Ltd',
      lineItems: [{ description: 'Setup', quantity: 1, unitPriceInr: 1000, gstRatePercent: 18 }],
      persistAudit: false,
    },
  })
  assert(deniedFinance.allowed === false, 'finance member should be role-denied')
  assert(deniedFinance.reasonCode === 'ROLE_DENIED', 'expected ROLE_DENIED')

  const gst = await runGstInvoiceDraftFlow({
    catalog,
    auth: {
      tenantId: 't1',
      userId: 'u1',
      roles: ['manager'],
      licensedModules: ['finance'],
    },
    input: {
      customerName: 'Beta Pvt Ltd',
      customerGstin: '29ABCDE1234F1Z5',
      supplierStateCode: 'KA',
      placeOfSupplyStateCode: 'MH',
      lineItems: [
        {
          description: 'Implementation services',
          hsn: '998314',
          quantity: 2,
          unitPriceInr: 5000,
          gstRatePercent: 18,
        },
      ],
      persistAudit: false,
    },
  })
  assert(gst.allowed === true, `gst should allow: ${gst.reason}`)
  assert(gst.bundle?.approvalStatus === 'pending_approval', 'gst must pending approval')
  assert(gst.bundle?.executable === false, 'gst draft must not be executable')
  const draft = gst.bundle?.draft as {
    grandTotalInr?: number
    taxBreakup?: { supplyType?: string; igstInr?: number }
    filingStatus?: string
    paymentStatus?: string
  }
  assert(draft.filingStatus === 'not_filed', 'must not file')
  assert(draft.paymentStatus === 'not_paid', 'must not pay')
  assert(draft.taxBreakup?.supplyType === 'inter_state', 'MH vs KA should be IGST')
  assert(draft.taxBreakup?.igstInr === 1800, `expected IGST 1800, got ${draft.taxBreakup?.igstInr}`)
  assert(draft.grandTotalInr === 11800, `expected grand total 11800, got ${draft.grandTotalInr}`)

  console.log('Customer flows smoke PASS (sales follow-up + GST invoice draft)')
}

main().catch((error) => {
  console.error('Customer flows smoke FAILED')
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
