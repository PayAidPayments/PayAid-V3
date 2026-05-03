export type PageTreeValidationInput = Array<Record<string, unknown>>

export function validateWebsitePageTree(pageTree: PageTreeValidationInput): string[] {
  const errors: string[] = []
  if (pageTree.length === 0) {
    errors.push('At least one page is required.')
    return errors
  }

  const slugSet = new Set<string>()
  pageTree.forEach((page, index) => {
    const pageNumber = index + 1
    const title = typeof page.title === 'string' ? page.title.trim() : ''
    const slug = typeof page.slug === 'string' ? page.slug.trim().toLowerCase() : ''

    if (!title) errors.push(`Page #${pageNumber} title cannot be empty.`)
    if (!slug) errors.push(`Page #${pageNumber} slug cannot be empty.`)

    if (slug) {
      if (slugSet.has(slug)) {
        errors.push(`Duplicate slug "${slug}" found. Slugs must be unique.`)
      } else {
        slugSet.add(slug)
      }
    }
  })

  return errors
}
