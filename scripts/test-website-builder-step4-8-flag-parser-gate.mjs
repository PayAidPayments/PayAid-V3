import assert from 'node:assert/strict'
import { isWebsiteBuilderFlagParserTestsGateEnabled } from './website-builder-step4-8-flag-parser-gate.mjs'

function run() {
  assert.equal(
    isWebsiteBuilderFlagParserTestsGateEnabled({}),
    false,
    'missing env var should disable flag parser gate'
  )
  assert.equal(
    isWebsiteBuilderFlagParserTestsGateEnabled({ WEBSITE_BUILDER_INCLUDE_FLAG_PARSER_TESTS: '0' }),
    false,
    'flag=0 should disable flag parser gate'
  )
  assert.equal(
    isWebsiteBuilderFlagParserTestsGateEnabled({ WEBSITE_BUILDER_INCLUDE_FLAG_PARSER_TESTS: 'true' }),
    false,
    'flag=true should not enable flag parser gate'
  )
  assert.equal(
    isWebsiteBuilderFlagParserTestsGateEnabled({ WEBSITE_BUILDER_INCLUDE_FLAG_PARSER_TESTS: '1' }),
    true,
    'flag=1 should enable flag parser gate'
  )

  console.log('website-builder-step4-8-flag-parser-gate tests passed')
}

run()
