import assert from 'node:assert/strict'
import { isWebsiteBuilderHelperContractCheckGateEnabled } from './website-builder-step4-8-helper-contract-gate.mjs'

function run() {
  assert.equal(
    isWebsiteBuilderHelperContractCheckGateEnabled({}),
    false,
    'missing env var should disable helper contract gate'
  )
  assert.equal(
    isWebsiteBuilderHelperContractCheckGateEnabled({
      WEBSITE_BUILDER_INCLUDE_HELPER_CONTRACT_CHECK: '0',
    }),
    false,
    'flag=0 should disable helper contract gate'
  )
  assert.equal(
    isWebsiteBuilderHelperContractCheckGateEnabled({
      WEBSITE_BUILDER_INCLUDE_HELPER_CONTRACT_CHECK: 'true',
    }),
    false,
    'flag=true should not enable helper contract gate'
  )
  assert.equal(
    isWebsiteBuilderHelperContractCheckGateEnabled({
      WEBSITE_BUILDER_INCLUDE_HELPER_CONTRACT_CHECK: '1',
    }),
    true,
    'flag=1 should enable helper contract gate'
  )

  console.log('website-builder-step4-8-helper-contract-gate tests passed')
}

run()
