import { isStrictFlagEnabled } from './strict-flag.mjs'

export function isWebsiteBuilderHelperGateEnabled(env = process.env) {
  return isStrictFlagEnabled(env?.WEBSITE_BUILDER_INCLUDE_HELPER_TESTS)
}

export function isWebsiteBuilderDocsAsciiGateEnabled(env = process.env) {
  return isStrictFlagEnabled(env?.WEBSITE_BUILDER_INCLUDE_DOCS_ASCII_CHECK)
}
