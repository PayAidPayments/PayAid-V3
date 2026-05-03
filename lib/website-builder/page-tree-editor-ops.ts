export type EditablePageTreeEntry = {
  id: string
  slug: string
  title: string
  pageType: string
  orderIndex: number
  sections: string[]
}

function normalizeSlug(value: string, fallback: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return normalized || fallback
}

export function withNormalizedOrder(entries: EditablePageTreeEntry[]): EditablePageTreeEntry[] {
  return entries.map((entry, index) => ({
    ...entry,
    orderIndex: index,
  }))
}

export function createPageEntry(index: number): EditablePageTreeEntry {
  return {
    id: `manual-${Date.now()}-${index}`,
    slug: `page-${index + 1}`,
    title: `Page ${index + 1}`,
    pageType: 'custom',
    orderIndex: index,
    sections: [],
  }
}

export function addPageEntry(entries: EditablePageTreeEntry[]): EditablePageTreeEntry[] {
  return withNormalizedOrder([...entries, createPageEntry(entries.length)])
}

export function removePageEntry(entries: EditablePageTreeEntry[], index: number): EditablePageTreeEntry[] {
  return withNormalizedOrder(entries.filter((_, idx) => idx !== index))
}

export function movePageEntry(
  entries: EditablePageTreeEntry[],
  index: number,
  direction: -1 | 1
): EditablePageTreeEntry[] {
  const targetIndex = index + direction
  if (targetIndex < 0 || targetIndex >= entries.length) return entries
  const next = [...entries]
  const [item] = next.splice(index, 1)
  next.splice(targetIndex, 0, item)
  return withNormalizedOrder(next)
}

export function updatePageEntry(
  entries: EditablePageTreeEntry[],
  index: number,
  updates: Partial<EditablePageTreeEntry>
): EditablePageTreeEntry[] {
  return withNormalizedOrder(
    entries.map((item, idx) => {
      if (idx !== index) return item
      const nextTitle = updates.title !== undefined ? updates.title : item.title
      const nextSlug = updates.slug !== undefined ? updates.slug : item.slug
      return {
        ...item,
        ...updates,
        title: (nextTitle || `Page ${index + 1}`).toString(),
        slug: normalizeSlug(nextSlug || '', `page-${index + 1}`),
      }
    })
  )
}

export function addSection(entries: EditablePageTreeEntry[], pageIndex: number, section: string): EditablePageTreeEntry[] {
  return entries.map((item, idx) =>
    idx === pageIndex ? { ...item, sections: [...item.sections, section] } : item
  )
}

export function removeSection(
  entries: EditablePageTreeEntry[],
  pageIndex: number,
  sectionIndex: number
): EditablePageTreeEntry[] {
  return entries.map((item, idx) =>
    idx === pageIndex
      ? { ...item, sections: item.sections.filter((_, secIdx) => secIdx !== sectionIndex) }
      : item
  )
}

export function moveSection(
  entries: EditablePageTreeEntry[],
  pageIndex: number,
  sectionIndex: number,
  direction: -1 | 1
): EditablePageTreeEntry[] {
  return entries.map((item, idx) => {
    if (idx !== pageIndex) return item
    const target = sectionIndex + direction
    if (target < 0 || target >= item.sections.length) return item
    const sections = [...item.sections]
    const [moved] = sections.splice(sectionIndex, 1)
    sections.splice(target, 0, moved)
    return { ...item, sections }
  })
}

export function updateSection(
  entries: EditablePageTreeEntry[],
  pageIndex: number,
  sectionIndex: number,
  nextSection: string
): EditablePageTreeEntry[] {
  return entries.map((item, idx) => {
    if (idx !== pageIndex) return item
    return {
      ...item,
      sections: item.sections.map((section, secIdx) => (secIdx === sectionIndex ? nextSection : section)),
    }
  })
}
