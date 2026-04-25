const assert = require('node:assert/strict')
const { isStrictFlagEnabled: cjsStrictFlag } = require('./strict-flag.cjs')

async function run() {
  const { isStrictFlagEnabled: esmStrictFlag } = await import('./strict-flag.mjs')

  const cases = [
    { label: 'undefined default', value: undefined, options: {}, expected: false },
    { label: 'zero default', value: '0', options: {}, expected: false },
    { label: 'true default', value: 'true', options: {}, expected: false },
    { label: 'one default', value: '1', options: {}, expected: true },
    { label: 'true compatibility', value: 'true', options: { allowTrueString: true }, expected: true },
  ]

  for (const testCase of cases) {
    const cjsValue = cjsStrictFlag(testCase.value, testCase.options)
    const esmValue = esmStrictFlag(testCase.value, testCase.options)
    assert.equal(cjsValue, testCase.expected, `CJS mismatch for ${testCase.label}`)
    assert.equal(esmValue, testCase.expected, `ESM mismatch for ${testCase.label}`)
    assert.equal(cjsValue, esmValue, `Parity mismatch for ${testCase.label}`)
  }

  console.log('strict-flag CJS parity tests passed')
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
