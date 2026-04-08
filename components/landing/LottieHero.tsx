'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import Image from 'next/image'

declare global {
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

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const gl =
        canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true }) ||
        canvas.getContext('experimental-webgl', { failIfMajorPerformanceCaveat: true })
      setCanRenderSpline(Boolean(gl))
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
          src="https://unpkg.com/@splinetool/viewer@1.12.77/build/spline-viewer.js"
          strategy="afterInteractive"
        />
      )}

      {/* 3D Content */}
      {canRenderSpline ? (
        <spline-viewer
          url="https://prod.spline.design/p5FMEypZOvJ11JJ2/scene.splinecode"
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      ) : (
        <Image
          src="/hero-robot-pro.png"
          alt="PayAid AI Robot Assistant"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain"
          priority
          style={{ filter: 'drop-shadow(0 20px 60px rgba(83,50,138,0.35))' }}
        />
      )}

      {/* Bottom banner — always on top, covers the Spline watermark area */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 flex items-end justify-center px-6 pt-16 pb-6"
        style={{
          background:
            'linear-gradient(to top, rgba(83,50,138,0.95) 0%, rgba(83,50,138,0.80) 50%, transparent 100%)',
          backdropFilter: 'blur(2px)',
        }}
      >
        <p
          className="text-white text-center font-semibold text-sm md:text-base leading-snug tracking-wide"
          style={{ textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}
        >
          The AI System that Tracks your every move and suggests Better outcomes
        </p>
      </div>
    </div>
  )
}
