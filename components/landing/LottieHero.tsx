'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import Script from 'next/script'

const SPLINE_VIEWER_VERSION = '1.12.77'
const SPLINE_VIEWER_MODULE = `https://unpkg.com/@splinetool/viewer@${SPLINE_VIEWER_VERSION}/build/spline-viewer.js`
const SPLINE_SCENE_URL = 'https://prod.spline.design/p5FMEypZOvJ11JJ2/scene.splinecode'

function ensureHeadLink(rel: string, href: string, extra?: Record<string, string>) {
  const safe = href.replace(/[^a-zA-Z0-9]/g, '').slice(0, 64)
  const id = `payaid-spline-${rel}-${safe}`
  if (document.getElementById(id)) return
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

// Custom element declaration for the Spline viewer web component.
// Uses React.JSX namespace (React 18+) with a fallback to the global JSX namespace.
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

/**
 * Hero visual — Spline 3D interactive embed with a branded bottom banner.
 * Falls back to the realistic robot image if WebGL is unavailable.
 */
export default function LottieHero() {
  const [canRenderSpline, setCanRenderSpline] = useState(false)
  const warmDnsRef = useRef(false)

  useLayoutEffect(() => {
    if (!warmDnsRef.current) {
      warmDnsRef.current = true
      // layout.tsx already dns-prefetches; open TLS early for viewer + scene
      ensureHeadLink('preconnect', 'https://unpkg.com')
      ensureHeadLink('preconnect', 'https://prod.spline.design', { crossorigin: 'anonymous' })
    }

    try {
      const canvas = document.createElement('canvas')
      const gl =
        canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true }) ||
        canvas.getContext('experimental-webgl', { failIfMajorPerformanceCaveat: true })
      const ok = Boolean(gl)
      setCanRenderSpline(ok)
      if (ok) {
        ensureHeadLink('modulepreload', SPLINE_VIEWER_MODULE, { crossorigin: 'anonymous' })
        ensureHeadLink('preload', SPLINE_SCENE_URL, { as: 'fetch', crossorigin: 'anonymous' })
      }
    } catch {
      setCanRenderSpline(false)
    }
  }, [])

  return (
    <div
      className="relative w-full h-full min-h-[500px] lg:min-h-[600px] rounded-2xl overflow-hidden border border-purple-200 bg-white shadow-sm"
    >
      {/* Spline script — only load when WebGL is available */}
      {canRenderSpline && (
        <Script
          type="module"
          src={SPLINE_VIEWER_MODULE}
          strategy="afterInteractive"
        />
      )}

      {/* 3D Content */}
      {canRenderSpline ? (
        <spline-viewer
          url={SPLINE_SCENE_URL}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-indigo-100">
          <div className="rounded-2xl border border-purple-200 bg-white/90 px-6 py-5 shadow-sm">
            <p className="text-sm font-semibold text-purple-900">PayAid AI Assistant</p>
            <p className="mt-1 text-xs text-purple-700">3D preview is unavailable on this device.</p>
          </div>
        </div>
      )}

      {/* Bottom banner — always on top, covers the Spline watermark area */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 flex items-end justify-center px-6 pt-16 pb-6"
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
  )
}
