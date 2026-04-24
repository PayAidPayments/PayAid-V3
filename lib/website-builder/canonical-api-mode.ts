export function isCanonicalWebsiteBuilderApiMode(): boolean {
  return process.env.CANONICAL_WEBSITE_BUILDER_API_ONLY?.trim() === '1'
}
