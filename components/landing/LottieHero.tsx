'use client'

import React, { useLayoutEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Script from 'next/script'

const SPLINE_VIEWER_VERSION = '1.12.77'
const SPLINE_VIEWER_MODULE = `https://unpkg.com/@splinetool/viewer@${SPLINE_VIEWER_VERSION}/build/spline-viewer.js`
const SPLINE_SCENE_URL = 'https://prod.spline.design/p5FMEypZOvJ11JJ2/scene.splinecode'
const HERO_FALLBACK_SRC = '/hero-digital-specialists.png'
const MIN_SPLINE_VIEWPORT_SIZE = 32

function ensureHeadLink(rel: string, href: string, extra?: Record<string, string>) {
  const safe = href.replace(/[^a-zA-Z0-9]/g, '').slice(0, 64)
  const id = `payaid-spline-${rel}-${safe}`
  if (typeof document === 'undefined' || document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = rel
  link.href = href
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      link.setAttribute(k, v)
    }
  }
  document.head.appendChild(link)
}

/**
 * Matches the failure mode: THREE sees GL_VENDOR/RENDERER = Disabled, Sandboxed = yes.
 * If we load @splinetool/viewer anyway, it throws and Next.js shows a runtime error overlay.
 * Skipping the script entirely avoids loading THREE when the browser cannot create a context.
 */
function canBrowserRunSplineWebGL(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const gl =
      (canvas.getContext('webgl2') as WebGL2RenderingContext | null) ||
      (canvas.getContext('webgl') as WebGLRenderingContext | null) ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null)
    if (!gl) return false
    const vendor = String(gl.getParameter(gl.VENDOR) ?? '')
    const renderer = String(gl.getParameter(gl.RENDERER) ?? '')
    if (/disabled/i.test(vendor) || /disabled/i.test(renderer)) return false
    return true
  } catch {
    return false
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'spline-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { url?: string },
        HTMLElement
      >
    }
  }
}

class SplineRuntimeBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function StaticHeroFallback() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-900">
      <Image
        src={HERO_FALLBACK_SRC}
        alt="PayAid AI Assistant"
        fill
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="object-cover object-center"
        priority
      />
    </div>
  )
}

function SplineInteractiveHero() {
  const hintsDone = useRef(false)

  useLayoutEffect(() => {
    if (hintsDone.current) return
    hintsDone.current = true
    ensureHeadLink('preconnect', 'https://unpkg.com', { crossorigin: 'anonymous' })
    ensureHeadLink('preconnect', 'https://prod.spline.design', { crossorigin: 'anonymous' })
    ensureHeadLink('preload', SPLINE_VIEWER_MODULE, { as: 'script', crossorigin: 'anonymous' })
    ensureHeadLink('preload', SPLINE_SCENE_URL, { as: 'fetch', crossorigin: 'anonymous', fetchpriority: 'high' })
  }, [])

  return (
    <>
      <Script
        type="module"
        src={SPLINE_VIEWER_MODULE}
        strategy="afterInteractive"
        crossOrigin="anonymous"
      />
      <spline-viewer
        url={SPLINE_SCENE_URL}
        className="block h-full min-h-0 w-full"
        style={{ width: '100%', height: '100%', minHeight: '100%', display: 'block' }}
      />
    </>
  )
}

/**
 * Loads Spline only when a WebGL context is actually available. Avoids THREE &quot;Error creating
 * WebGL context&quot; + Next overlay when Windows Chrome has GL disabled (Firefox on the same PC
 * may still work — different graphics stack).
 */
export default function LottieHero() {
  const [ready, setReady] = useState<boolean | null>(null)
  const [hasRenderableSize, setHasRenderableSize] = useState(false)
  const heroViewportRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    setReady(canBrowserRunSplineWebGL())
  }, [])

  useLayoutEffect(() => {
    if (ready !== true) {
      setHasRenderableSize(false)
      return
    }
    const node = heroViewportRef.current
    if (!node) return

    const updateRenderableSize = () => {
      const rect = node.getBoundingClientRect()
      setHasRenderableSize(rect.width >= MIN_SPLINE_VIEWPORT_SIZE && rect.height >= MIN_SPLINE_VIEWPORT_SIZE)
    }

    updateRenderableSize()

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        updateRenderableSize()
      })
      observer.observe(node)
      return () => observer.disconnect()
    }

    window.addEventListener('resize', updateRenderableSize)
    return () => window.removeEventListener('resize', updateRenderableSize)
  }, [ready])

  const fallback = (
    <div className="relative h-full min-h-[500px] w-full min-w-0 lg:min-h-[min(85vh,880px)]">
      <StaticHeroFallback />
    </div>
  )

  return (
    <div className="relative flex h-full min-h-[500px] w-full flex-col overflow-hidden rounded-2xl border border-purple-200 bg-white shadow-sm lg:min-h-[min(85vh,880px)]">
      {ready === null && (
        <div className="flex min-h-[500px] flex-1 items-center justify-center bg-slate-950 lg:min-h-[min(85vh,880px)]">
          <div className="h-9 w-9 animate-pulse rounded-full bg-purple-900/50" aria-hidden />
        </div>
      )}

      {ready === false && fallback}

      {ready === true && (
        <SplineRuntimeBoundary fallback={fallback}>
          <div className="relative h-full min-h-[500px] w-full flex-1 bg-slate-950 lg:min-h-[min(85vh,880px)]">
            {/* Fill the card: Spline was only ~50% tall because the viewer sat in flow; inset-0 + h-full fixes it */}
            <div ref={heroViewportRef} className="absolute inset-0 min-h-[500px] lg:min-h-0">
              {hasRenderableSize ? (
                <SplineInteractiveHero />
              ) : (
                <div className="h-full w-full bg-slate-950" aria-hidden />
              )}
            </div>
            <div
              className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 flex max-h-[75%] items-end justify-center bg-gradient-to-t from-[#060210]/100 via-[#1c0c38]/100 to-[#3a2266]/95 px-6 pb-5 pt-10"
            >
              <p
                className="text-white text-center font-semibold text-sm md:text-base leading-snug tracking-wide"
                style={{ textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}
              >
                AI that tracks activity and suggests the right outcome.
              </p>
            </div>
          </div>
        </SplineRuntimeBoundary>
      )}
    </div>
  )
}
