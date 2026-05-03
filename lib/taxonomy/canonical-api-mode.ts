export function isCanonicalOnlyApiMode(): boolean {
  // Vercel/env tooling can preserve trailing newlines from stdin values.
  // Normalize before comparing so `1` and `1\r\n` behave consistently.
  return process.env.CANONICAL_MODULE_API_ONLY?.trim() === '1'
}

export function shouldIncludeLegacyModuleFields(): boolean {
  return !isCanonicalOnlyApiMode()
}
