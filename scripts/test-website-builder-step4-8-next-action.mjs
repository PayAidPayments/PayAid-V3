import assert from 'node:assert/strict'
import { buildWebsiteBuilderStep48NextAction } from './website-builder-step4-8-next-action.mjs'

function run() {
  assert.deepEqual(
    buildWebsiteBuilderStep48NextAction({
      runtimeBlockers: null,
      rerunCommand: 'npm run run:website-builder-step4-8-evidence-pipeline',
    }),
    { nextAction: null, nextActionSteps: [] },
    'empty blockers should return null action + empty steps'
  )

  const missingEnvResult = buildWebsiteBuilderStep48NextAction({
    runtimeBlockers: [
      'WEBSITE_BUILDER_BASE_URL is missing',
      'WEBSITE_BUILDER_AUTH_TOKEN is missing',
    ],
    rerunCommand: 'npm run run:website-builder-step4-8-evidence-pipeline',
  })
  assert.equal(typeof missingEnvResult.nextAction, 'string', 'missing env should produce message')
  assert.deepEqual(
    missingEnvResult.nextActionSteps,
    [
      '$env:WEBSITE_BUILDER_BASE_URL="https://payaid-v3.vercel.app"',
      '$env:WEBSITE_BUILDER_LOGIN_EMAIL="<email>" ; $env:WEBSITE_BUILDER_LOGIN_PASSWORD="<password>" ; npm run get:website-builder-step4-8-token',
      'npm run run:website-builder-step4-8-evidence-pipeline',
    ],
    'missing env should produce expected remediation sequence'
  )

  const genericBlockerResult = buildWebsiteBuilderStep48NextAction({
    runtimeBlockers: ['Unexpected runtime blocker'],
    rerunCommand: 'npm run run:website-builder-ready-to-commit-pack',
  })
  assert.equal(
    genericBlockerResult.nextAction,
    'Fix runtime blockers and rerun: Unexpected runtime blocker',
    'generic blockers should produce generic guidance'
  )
  assert.deepEqual(
    genericBlockerResult.nextActionSteps,
    ['npm run run:website-builder-ready-to-commit-pack'],
    'generic blockers should only keep rerun step'
  )

  console.log('website-builder-step4-8-next-action tests passed')
}

run()
