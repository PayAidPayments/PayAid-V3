'use client'

import { useEffect, useState, type HTMLAttributes, type RefObject } from 'react'

type InViewOptions = {
  once?: boolean
  margin?: string
}

type MotionProps = {
  initial?: unknown
  animate?: unknown
  transition?: unknown
  variants?: unknown
  whileInView?: unknown
  viewport?: unknown
}

type DivProps = HTMLAttributes<HTMLDivElement> & MotionProps
type SpanProps = HTMLAttributes<HTMLSpanElement> & MotionProps

function stripMotionProps<T extends MotionProps>(props: T) {
  const { initial, animate, transition, variants, whileInView, viewport, ...domProps } = props
  void initial
  void animate
  void transition
  void variants
  void whileInView
  void viewport
  return domProps
}

function MotionDiv(props: DivProps) {
  return <div {...stripMotionProps(props)} />
}

function MotionSpan(props: SpanProps) {
  return <span {...stripMotionProps(props)} />
}

export const motion = {
  div: MotionDiv,
  span: MotionSpan,
}

export function useInView<T extends Element>(ref: RefObject<T | null>, options?: InViewOptions) {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (!entry) return
        if (entry.isIntersecting) {
          setInView(true)
          if (options?.once) observer.disconnect()
        } else if (!options?.once) {
          setInView(false)
        }
      },
      {
        root: null,
        rootMargin: options?.margin ?? '0px',
        threshold: 0.1,
      }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [ref, options?.margin, options?.once])

  return inView
}
