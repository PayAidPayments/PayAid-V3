import { isStrictFlagEnabled } from './strict-flag.mjs'

export function isWebsiteBuilderHelperGateEnabled(env = process.env) {
  return isStrictFlagEnabled(env?.WEBSITE_BUILDER_INCLUDE_HELPER_TESTS)
}

export function isWebsiteBuilderDocsAsciiGateEnabled(env = process.env) {
  return isStrictFlagEnabled(env?.WEBSITE_BUILDER_INCLUDE_DOCS_ASCII_CHECK)
}

export function isWebsiteBuilderFlagParserTestsGateEnabled(env = process.env) {
  return isStrictFlagEnabled(env?.WEBSITE_BUILDER_INCLUDE_FLAG_PARSER_TESTS)
}

export function isWebsiteBuilderHelperContractCheckGateEnabled(env = process.env) {
  return isStrictFlagEnabled(env?.WEBSITE_BUILDER_INCLUDE_HELPER_CONTRACT_CHECK)
}
