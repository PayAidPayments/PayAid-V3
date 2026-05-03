import assert from 'node:assert/strict'
import {
  canRunWebsiteBuilderTokenProbe,
  hasWebsiteBuilderAuthTokenBlocker,
  resolveNextActionStepsWithTokenProbe,
} from './website-builder-step4-8-token-probe.mjs'

function run() {
  assert.equal(
    hasWebsiteBuilderAuthTokenBlocker(['WEBSITE_BUILDER_AUTH_TOKEN is missing']),
    true,
    'auth token blocker should be detected'
  )
  assert.equal(
    hasWebsiteBuilderAuthTokenBlocker(['WEBSITE_BUILDER_BASE_URL is missing']),
    false,
    'non-auth blockers should not trigger auth token blocker'
  )
  assert.equal(
    hasWebsiteBuilderAuthTokenBlocker(null),
    false,
    'null blockers should not trigger auth token blocker'
  )

  assert.equal(
    canRunWebsiteBuilderTokenProbe({
      WEBSITE_BUILDER_BASE_URL: 'https://payaid-v3.vercel.app',
      WEBSITE_BUILDER_LOGIN_EMAIL: 'admin@demo.com',
      WEBSITE_BUILDER_LOGIN_PASSWORD: 'secret',
    }),
    true,
    'probe should run when all required env vars are present'
  )
  assert.equal(
    canRunWebsiteBuilderTokenProbe({
      WEBSITE_BUILDER_BASE_URL: 'https://payaid-v3.vercel.app',
      WEBSITE_BUILDER_LOGIN_EMAIL: 'admin@demo.com',
      WEBSITE_BUILDER_LOGIN_PASSWORD: '',
    }),
    false,
    'probe should not run when any required env var is empty'
  )

  const remediationSteps = ['npm run run:website-builder-step4-8-evidence-pipeline']
  assert.deepEqual(
    resolveNextActionStepsWithTokenProbe({
      tokenHelperProbe: {
        code: 'LOGIN_FAILED',
        nextSteps: [
          '$env:WEBSITE_BUILDER_BASE_URL="https://payaid-v3.vercel.app"',
          '$env:WEBSITE_BUILDER_LOGIN_EMAIL="<email>"',
        ],
      },
      remediationSteps,
      rerunCommand: 'npm run run:website-builder-step4-8-evidence-pipeline',
    }),
    [
      '$env:WEBSITE_BUILDER_BASE_URL="https://payaid-v3.vercel.app"',
      '$env:WEBSITE_BUILDER_LOGIN_EMAIL="<email>"',
      'npm run run:website-builder-step4-8-evidence-pipeline',
    ],
    'valid probe steps should be preferred and append rerun command'
  )
  assert.deepEqual(
    resolveNextActionStepsWithTokenProbe({
      tokenHelperProbe: {
        code: 'INVALID_BASE_URL',
        nextSteps: ['$env:WEBSITE_BUILDER_BASE_URL="bad-url"'],
      },
      remediationSteps,
      rerunCommand: 'npm run run:website-builder-step4-8-evidence-pipeline',
    }),
    remediationSteps,
    'invalid base url probe should fallback to remediation steps'
  )
  assert.deepEqual(
    resolveNextActionStepsWithTokenProbe({
      tokenHelperProbe: {
        code: 'INVALID_BASE_URL',
        nextSteps: [
          '$env:WEBSITE_BUILDER_BASE_URL="bad-url"',
          'npm run get:website-builder-step4-8-token',
        ],
      },
      remediationSteps,
      rerunCommand: 'npm run run:website-builder-step4-8-evidence-pipeline',
    }),
    remediationSteps,
    'invalid base url should fallback even with non-empty nextSteps'
  )
  assert.deepEqual(
    resolveNextActionStepsWithTokenProbe({
      tokenHelperProbe: null,
      remediationSteps,
      rerunCommand: 'npm run run:website-builder-step4-8-evidence-pipeline',
    }),
    remediationSteps,
    'missing probe should fallback to remediation steps'
  )
  assert.deepEqual(
    resolveNextActionStepsWithTokenProbe({
      tokenHelperProbe: {
        code: 'LOGIN_FAILED',
      },
      remediationSteps,
      rerunCommand: 'npm run run:website-builder-step4-8-evidence-pipeline',
    }),
    remediationSteps,
    'malformed probe (missing nextSteps) should fallback to remediation steps'
  )
  assert.deepEqual(
    resolveNextActionStepsWithTokenProbe({
      tokenHelperProbe: {
        code: 'LOGIN_FAILED',
        nextSteps: [],
      },
      remediationSteps,
      rerunCommand: 'npm run run:website-builder-step4-8-evidence-pipeline',
    }),
    remediationSteps,
    'empty probe nextSteps should fallback to remediation steps'
  )

  console.log('website-builder-step4-8-token-probe tests passed')
}

run()
