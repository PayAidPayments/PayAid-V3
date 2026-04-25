import assert from 'node:assert/strict'
import { isStrictFlagEnabled } from './strict-flag.mjs'

function run() {
  assert.equal(isStrictFlagEnabled(undefined), false, 'undefined should be disabled')
  assert.equal(isStrictFlagEnabled('0'), false, '0 should be disabled')
  assert.equal(isStrictFlagEnabled('true'), false, 'true should be disabled by default')
  assert.equal(isStrictFlagEnabled('1'), true, '1 should be enabled')
  assert.equal(
    isStrictFlagEnabled('true', { allowTrueString: true }),
    true,
    'true should be enabled when allowTrueString=true'
  )

  console.log('strict-flag tests passed')
}

run()
