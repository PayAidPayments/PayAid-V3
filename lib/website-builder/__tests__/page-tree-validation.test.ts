import { validateWebsitePageTree } from '@/lib/website-builder/page-tree-validation'

describe('validateWebsitePageTree', () => {
  it('returns error for empty tree', () => {
    expect(validateWebsitePageTree([])).toEqual(['At least one page is required.'])
  })

  it('returns errors for missing title and slug', () => {
    const errors = validateWebsitePageTree([
      { title: '', slug: 'home' },
      { title: 'Contact', slug: '' },
    ])

    expect(errors).toEqual(
      expect.arrayContaining(['Page #1 title cannot be empty.', 'Page #2 slug cannot be empty.'])
    )
  })

  it('treats duplicate slugs as case-insensitive', () => {
    const errors = validateWebsitePageTree([
      { title: 'Home', slug: 'home' },
      { title: 'About', slug: 'HOME' },
    ])

    expect(errors).toEqual(expect.arrayContaining(['Duplicate slug "home" found. Slugs must be unique.']))
  })

  it('accepts valid page tree rows', () => {
    expect(
      validateWebsitePageTree([
        { title: 'Home', slug: 'home' },
        { title: 'About', slug: 'about' },
      ])
    ).toEqual([])
  })
})
