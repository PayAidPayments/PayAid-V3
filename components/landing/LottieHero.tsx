'use client'

import React, { useLayoutEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Script from 'next/script'

const SPLINE_VIEWER_VERSION = '1.12.77'
const SPLINE_VIEWER_MODULE = `https://unpkg.com/@splinetool/viewer@${SPLINE_VIEWER_VERSION}/build/spline-viewer.js`
const SPLINE_SCENE_URL = 'https://prod.spline.design/p5FMEypZOvJ11JJ2/scene.splinecode'
const HERO_FALLBACK_SRC = '/hero-digital-specialists.png'

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
    ensureHeadLink('preconnect', 'https://unpkg.com')
    ensureHeadLink('preconnect', 'https://prod.spline.design', { crossorigin: 'anonymous' })
    ensureHeadLink('modulepreload', SPLINE_VIEWER_MODULE, { crossorigin: 'anonymous' })
    ensureHeadLink('preload', SPLINE_SCENE_URL, { as: 'fetch', crossorigin: 'anonymous' })
  }, [])

  return (
    <>
      <Script type="module" src={SPLINE_VIEWER_MODULE} strategy="afterInteractive" />
      <spline-viewer
        url={SPLINE_SCENE_URL}
        className="block h-full min-h-[500px] w-full lg:min-h-[600px]"
        style={{ width: '100%', height: '100%', display: 'block' }}
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

  useLayoutEffect(() => {
    setReady(canBrowserRunSplineWebGL())
  }, [])

  const fallback = (
    <div className="relative min-h-[500px] w-full min-w-0 lg:min-h-[600px]">
      <StaticHeroFallback />
    </div>
  )

  return (
    <div className="relative w-full h-full min-h-[500px] lg:min-h-[600px] rounded-2xl overflow-hidden border border-purple-200 bg-white shadow-sm">
      {ready === null && (
        <div className="flex min-h-[500px] items-center justify-center bg-slate-950 lg:min-h-[600px]">
          <div className="h-9 w-9 animate-pulse rounded-full bg-purple-900/50" aria-hidden />
        </div>
      )}

      {ready === false && fallback}

      {ready === true && (
        <SplineRuntimeBoundary fallback={fallback}>
          <div className="relative min-h-[500px] w-full bg-slate-950 lg:min-h-[600px]">
            <SplineInteractiveHero />
            <div
              className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 flex items-end justify-center px-6 pt-16 pb-6"
              style={{
                background:
                  'linear-gradient(to top, rgba(10,0,30,1.0) 0%, rgba(30,10,60,0.97) 35%, rgba(83,50,138,0.85) 65%, transparent 100%)',
                backdropFilter: 'blur(2px)',
              }}
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
