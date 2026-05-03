import assert from 'node:assert/strict'
import { isWebsiteBuilderHelperGateEnabled } from './website-builder-step4-8-helper-gate.mjs'

function run() {
  assert.equal(
    isWebsiteBuilderHelperGateEnabled({}),
    false,
    'missing env var should disable helper gate'
  )
  assert.equal(
    isWebsiteBuilderHelperGateEnabled({ WEBSITE_BUILDER_INCLUDE_HELPER_TESTS: '0' }),
    false,
    'flag=0 should disable helper gate'
  )
  assert.equal(
    isWebsiteBuilderHelperGateEnabled({ WEBSITE_BUILDER_INCLUDE_HELPER_TESTS: 'true' }),
    false,
    'flag=true should not enable helper gate'
  )
  assert.equal(
    isWebsiteBuilderHelperGateEnabled({ WEBSITE_BUILDER_INCLUDE_HELPER_TESTS: '1' }),
    true,
    'flag=1 should enable helper gate'
  )

  console.log('website-builder-step4-8-helper-gate tests passed')
}

run()
