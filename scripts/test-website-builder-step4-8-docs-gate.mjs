import assert from 'node:assert/strict'
import { isWebsiteBuilderDocsAsciiGateEnabled } from './website-builder-step4-8-docs-gate.mjs'

function run() {
  assert.equal(
    isWebsiteBuilderDocsAsciiGateEnabled({}),
    false,
    'missing env var should disable docs ASCII gate'
  )
  assert.equal(
    isWebsiteBuilderDocsAsciiGateEnabled({ WEBSITE_BUILDER_INCLUDE_DOCS_ASCII_CHECK: '0' }),
    false,
    'flag=0 should disable docs ASCII gate'
  )
  assert.equal(
    isWebsiteBuilderDocsAsciiGateEnabled({ WEBSITE_BUILDER_INCLUDE_DOCS_ASCII_CHECK: 'true' }),
    false,
    'flag=true should not enable docs ASCII gate'
  )
  assert.equal(
    isWebsiteBuilderDocsAsciiGateEnabled({ WEBSITE_BUILDER_INCLUDE_DOCS_ASCII_CHECK: '1' }),
    true,
    'flag=1 should enable docs ASCII gate'
  )

  console.log('website-builder-step4-8-docs-gate tests passed')
}

run()
