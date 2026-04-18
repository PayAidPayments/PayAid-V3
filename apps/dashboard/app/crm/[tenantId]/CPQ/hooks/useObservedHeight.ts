import { type RefObject, useLayoutEffect, useState } from 'react'

/**
 * Tracks an element's border-box height for layout math (e.g. sticky sidebars).
 */
export function useObservedHeight(ref: RefObject<HTMLElement | null>): number {
  const [height, setHeight] = useState(0)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const measure = () => setHeight(el.getBoundingClientRect().height)

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])

  return height
}
