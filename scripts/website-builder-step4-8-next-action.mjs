export function buildWebsiteBuilderStep48NextAction({
  runtimeBlockers,
  rerunCommand,
}) {
  if (!Array.isArray(runtimeBlockers) || runtimeBlockers.length === 0) {
    return { nextAction: null, nextActionSteps: [] }
  }

  const hasMissingBaseUrl = runtimeBlockers.some((reason) =>
    String(reason).includes('WEBSITE_BUILDER_BASE_URL')
  )
  const hasMissingAuthToken = runtimeBlockers.some((reason) =>
    String(reason).includes('WEBSITE_BUILDER_AUTH_TOKEN')
  )

  if (hasMissingBaseUrl || hasMissingAuthToken) {
    const steps = [
      hasMissingBaseUrl ? '$env:WEBSITE_BUILDER_BASE_URL="https://payaid-v3.vercel.app"' : null,
      hasMissingAuthToken
        ? '$env:WEBSITE_BUILDER_LOGIN_EMAIL="<email>" ; $env:WEBSITE_BUILDER_LOGIN_PASSWORD="<password>" ; npm run get:website-builder-step4-8-token'
        : null,
      rerunCommand,
    ].filter(Boolean)
    return {
      nextAction: ['Set required env vars and rerun:', ...steps].join(' '),
      nextActionSteps: steps,
    }
  }

  return {
    nextAction: `Fix runtime blockers and rerun: ${runtimeBlockers.join(' ; ')}`,
    nextActionSteps: [rerunCommand],
  }
}
