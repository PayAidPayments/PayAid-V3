'use client'

import React, { useCallback, useLayoutEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Script from 'next/script'

const SPLINE_VIEWER_VERSION = '1.12.77'
const SPLINE_VIEWER_MODULE = `https://unpkg.com/@splinetool/viewer@${SPLINE_VIEWER_VERSION}/build/spline-viewer.js`
const SPLINE_SCENE_URL = 'https://prod.spline.design/p5FMEypZOvJ11JJ2/scene.splinecode'
/** Static frame captured from the live Spline hero scene (same character / angle). */
const HERO_POSTER_SRC = '/hero-spline-poster.webp'
const MIN_SPLINE_VIEWPORT_SIZE = 32
const DESKTOP_SPLINE_MQ = '(min-width: 1024px)'

const HERO_SHELL_CLASS =
  'relative flex h-full min-h-[500px] w-full flex-col overflow-hidden rounded-2xl border border-purple-200 bg-[#e8e8e8] shadow-sm lg:min-h-[min(85vh,880px)]'

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
 */
function canBrowserRunSplineWebGL(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const gl =
      (canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true }) as WebGL2RenderingContext | null) ||
      (canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true }) as WebGLRenderingContext | null) ||
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

function prefersStaticHero(): boolean {
  if (typeof window === 'undefined') return true
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true
    if (window.matchMedia(DESKTOP_SPLINE_MQ).matches === false) return true
    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string }
      deviceMemory?: number
      hardwareConcurrency?: number
    }
    if (nav.connection?.saveData) return true
    const effectiveType = nav.connection?.effectiveType
    if (effectiveType === 'slow-2g' || effectiveType === '2g') return true
    if (typeof nav.deviceMemory === 'number' && nav.deviceMemory > 0 && nav.deviceMemory < 4) return true
    if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency > 0 && nav.hardwareConcurrency < 4) {
      return true
    }
  } catch {
    return true
  }
  return false
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'spline-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          url?: string
          loading?: 'auto' | 'lazy' | 'eager'
          unloadable?: boolean | string
          hint?: boolean | string
          'loading-anim-type'?: string
          'events-target'?: 'local' | 'global'
        },
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

function HeroPoster({
  priority = true,
  className = '',
  alt = 'PayAid AI Assistant',
}: {
  priority?: boolean
  className?: string
  alt?: string
}) {
  return (
    <Image
      src={HERO_POSTER_SRC}
      alt={alt}
      fill
      sizes="(max-width: 1024px) 100vw, 50vw"
      className={`object-cover object-center ${className}`}
      priority={priority}
      fetchPriority={priority ? 'high' : 'auto'}
      placeholder="empty"
    />
  )
}

function SplineInteractiveHero({ onSceneReady, onSceneFailed }: { onSceneReady: () => void; onSceneFailed: () => void }) {
  const [viewerEl, setViewerEl] = useState<HTMLElement | null>(null)
  const readyFired = useRef(false)
  const hintsDone = useRef(false)
  const setViewerRef = useCallback((el: HTMLElement | null) => {
    setViewerEl(el)
  }, [])

  useLayoutEffect(() => {
    if (hintsDone.current) return
    hintsDone.current = true
    ensureHeadLink('preconnect', 'https://unpkg.com', { crossorigin: 'anonymous' })
    ensureHeadLink('preconnect', 'https://prod.spline.design', { crossorigin: 'anonymous' })
    ensureHeadLink('preload', SPLINE_VIEWER_MODULE, { as: 'script', crossorigin: 'anonymous' })
    ensureHeadLink('modulepreload', SPLINE_VIEWER_MODULE, { crossorigin: 'anonymous' })
    ensureHeadLink('preload', SPLINE_SCENE_URL, {
      as: 'fetch',
      crossorigin: 'anonymous',
      fetchpriority: 'high',
    })
  }, [])

  const markReady = useCallback(() => {
    if (readyFired.current) return
    readyFired.current = true
    onSceneReady()
  }, [onSceneReady])

  useLayoutEffect(() => {
    if (!viewerEl) return

    const onLoadComplete = () => markReady()
    const onError = () => onSceneFailed()

    viewerEl.addEventListener('load-complete', onLoadComplete as EventListener)
    viewerEl.addEventListener('error', onError as EventListener)

    // If the custom element already finished before listeners attached.
    const maybeLoaded = viewerEl as HTMLElement & { _loaded?: boolean }
    if (maybeLoaded._loaded) markReady()

    const safety = window.setTimeout(() => {
      // Soft fail: keep poster if Spline never reports ready (slow network / broken CDN).
      if (!readyFired.current) onSceneFailed()
    }, 20000)

    return () => {
      window.clearTimeout(safety)
      viewerEl.removeEventListener('load-complete', onLoadComplete as EventListener)
      viewerEl.removeEventListener('error', onError as EventListener)
    }
  }, [viewerEl, markReady, onSceneFailed])

  return (
    <>
      <Script
        type="module"
        src={SPLINE_VIEWER_MODULE}
        strategy="afterInteractive"
        crossOrigin="anonymous"
        onError={() => onSceneFailed()}
      />
      <spline-viewer
        ref={setViewerRef}
        url={SPLINE_SCENE_URL}
        loading="eager"
        unloadable="true"
        hint="false"
        events-target="local"
        className="block h-full min-h-0 w-full"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '100%',
          display: 'block',
          background: 'transparent',
        }}
      />
    </>
  )
}

/**
 * Progressive hero: same-scene poster paints immediately; live Spline fades in on desktop
 * after `load-complete`. Mobile / reduced-motion / save-data / low-power keep the poster.
 */
export default function LottieHero() {
  const [allowLiveSpline, setAllowLiveSpline] = useState(false)
  const [hasRenderableSize, setHasRenderableSize] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const [liveFailed, setLiveFailed] = useState(false)
  const heroViewportRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const enable = !prefersStaticHero() && canBrowserRunSplineWebGL()
    setAllowLiveSpline(enable)

    if (!enable) return

    const mq = window.matchMedia(DESKTOP_SPLINE_MQ)
    const onChange = () => {
      const next = !prefersStaticHero() && canBrowserRunSplineWebGL()
      setAllowLiveSpline(next)
      if (!next) {
        setSceneReady(false)
        setLiveFailed(false)
      }
    }
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  useLayoutEffect(() => {
    if (!allowLiveSpline || liveFailed) {
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
      const observer = new ResizeObserver(() => updateRenderableSize())
      observer.observe(node)
      return () => observer.disconnect()
    }

    window.addEventListener('resize', updateRenderableSize)
    return () => window.removeEventListener('resize', updateRenderableSize)
  }, [allowLiveSpline, liveFailed])

  const showLiveLayer = allowLiveSpline && !liveFailed

  return (
    <div className={HERO_SHELL_CLASS}>
      <div ref={heroViewportRef} className="relative h-full min-h-[500px] w-full flex-1 lg:min-h-[min(85vh,880px)]">
        {/* Instant same-scene poster — always painted first; fades out after Spline is ready */}
        <div
          className={`absolute inset-0 z-10 transition-opacity duration-500 ease-out ${
            sceneReady ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
          aria-hidden={sceneReady}
        >
          <HeroPoster priority />
        </div>

        {showLiveLayer && (
          <SplineRuntimeBoundary
            fallback={
              <div className="absolute inset-0">
                <HeroPoster priority={false} />
              </div>
            }
          >
            <div
              className={`absolute inset-0 z-0 transition-opacity duration-500 ease-out ${
                sceneReady ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {hasRenderableSize ? (
                <SplineInteractiveHero
                  onSceneReady={() => setSceneReady(true)}
                  onSceneFailed={() => {
                    setLiveFailed(true)
                    setSceneReady(false)
                  }}
                />
              ) : null}
            </div>
          </SplineRuntimeBoundary>
        )}

        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 flex max-h-[75%] items-end justify-center bg-gradient-to-t from-[#060210]/100 via-[#1c0c38]/100 to-[#3a2266]/95 px-6 pb-5 pt-10"
        >
          <p
            className="text-center text-sm font-semibold leading-snug tracking-wide text-white md:text-base"
            style={{ textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}
          >
            AI that tracks activity and suggests the right outcome.
          </p>
        </div>
      </div>
    </div>
  )
}

/** Shared skeleton used by LandingPage dynamic() while the hero chunk downloads. */
export function LottieHeroPlaceholder() {
  return (
    <div className={HERO_SHELL_CLASS}>
      <div className="relative h-full min-h-[500px] w-full flex-1 lg:min-h-[min(85vh,880px)]">
        <div className="absolute inset-0">
          <HeroPoster priority />
        </div>
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 flex max-h-[75%] items-end justify-center bg-gradient-to-t from-[#060210]/100 via-[#1c0c38]/100 to-[#3a2266]/95 px-6 pb-5 pt-10"
        >
          <p
            className="text-center text-sm font-semibold leading-snug tracking-wide text-white md:text-base"
            style={{ textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}
          >
            AI that tracks activity and suggests the right outcome.
          </p>
        </div>
      </div>
    </div>
  )
}
