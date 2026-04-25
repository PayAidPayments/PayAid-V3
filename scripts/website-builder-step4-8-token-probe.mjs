import { spawnSync } from 'node:child_process'

export function hasWebsiteBuilderAuthTokenBlocker(runtimeBlockers) {
  return Array.isArray(runtimeBlockers)
    ? runtimeBlockers.some((reason) => String(reason).includes('WEBSITE_BUILDER_AUTH_TOKEN'))
    : false
}

export function canRunWebsiteBuilderTokenProbe(env = process.env) {
  return (
    typeof env.WEBSITE_BUILDER_BASE_URL === 'string' &&
    env.WEBSITE_BUILDER_BASE_URL.length > 0 &&
    typeof env.WEBSITE_BUILDER_LOGIN_EMAIL === 'string' &&
    env.WEBSITE_BUILDER_LOGIN_EMAIL.length > 0 &&
    typeof env.WEBSITE_BUILDER_LOGIN_PASSWORD === 'string' &&
    env.WEBSITE_BUILDER_LOGIN_PASSWORD.length > 0
  )
}

function tryParseJson(text) {
  if (!text || typeof text !== 'string') return null
  const match = text.match(/(\{[\s\S]*\})\s*$/)
  const candidate = match ? match[1] : text
  try {
    return JSON.parse(candidate)
  } catch {
    return null
  }
}

export function runWebsiteBuilderTokenHelperJsonProbe() {
  const run = spawnSync('npm', ['run', 'get:website-builder-step4-8-token', '--', '--json'], {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  })
  const payload = tryParseJson(run.stdout || '')
  if (!payload || typeof payload !== 'object') {
    return null
  }
  return {
    ok: payload.ok === true,
    code: typeof payload.code === 'string' ? payload.code : null,
    status: typeof payload.status === 'number' ? payload.status : null,
    error: typeof payload.error === 'string' ? payload.error : null,
    nextSteps: Array.isArray(payload.nextSteps) ? payload.nextSteps : [],
  }
}

export function resolveNextActionStepsWithTokenProbe({
  tokenHelperProbe,
  remediationSteps,
  rerunCommand,
}) {
  if (
    tokenHelperProbe &&
    tokenHelperProbe.code !== 'INVALID_BASE_URL' &&
    Array.isArray(tokenHelperProbe.nextSteps) &&
    tokenHelperProbe.nextSteps.length > 0
  ) {
    return [...tokenHelperProbe.nextSteps, rerunCommand]
  }
  return remediationSteps
}
