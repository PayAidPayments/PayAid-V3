import assert from 'node:assert/strict'
import {
  isWebsiteBuilderDocsAsciiGateEnabled,
  isWebsiteBuilderHelperGateEnabled,
} from './website-builder-step4-8-gates.mjs'
import { isStrictFlagEnabled } from './strict-flag.mjs'

function run() {
  assert.equal(isStrictFlagEnabled(undefined), false, 'undefined flag should be disabled')
  assert.equal(isStrictFlagEnabled('0'), false, 'flag=0 should be disabled')
  assert.equal(isStrictFlagEnabled('true'), false, 'flag=true should be disabled')
  assert.equal(isStrictFlagEnabled('1'), true, 'flag=1 should be enabled')

  assert.equal(
    isWebsiteBuilderHelperGateEnabled({ WEBSITE_BUILDER_INCLUDE_HELPER_TESTS: '1' }),
    true,
    'helper flag=1 should enable helper gate'
  )
  assert.equal(
    isWebsiteBuilderDocsAsciiGateEnabled({ WEBSITE_BUILDER_INCLUDE_DOCS_ASCII_CHECK: '1' }),
    true,
    'docs flag=1 should enable docs gate'
  )

  console.log('website-builder-step4-8-gates tests passed')
}

run()
