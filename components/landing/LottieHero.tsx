'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'

/**
 * Hero visual — realistic dark humanoid robot with:
 * - Mouse-follow 3D parallax tilt on the container
 * - Floating module label chips (CSS animated)
 * - Pulsing glow aura behind the robot
 * - Subtle eye-glow flicker via CSS
 */
export default function LottieHero() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const nx = (e.clientX - centerX) / (rect.width / 2)   // -1 to +1
      const ny = (e.clientY - centerY) / (rect.height / 2)  // -1 to +1

      // Max ±7 deg tilt
      const rotateY = nx * 7
      const rotateX = -ny * 5

      container.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
    }

    const handleMouseLeave = () => {
      container.style.transform = `perspective(900px) rotateX(0deg) rotateY(0deg)`
    }

    window.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[500px] lg:min-h-[600px] rounded-2xl overflow-hidden border border-purple-200/60 shadow-2xl"
      style={{
        background: 'linear-gradient(135deg, #f5f3ff 0%, #faf5ff 40%, #e0e7ff 100%)',
        transition: 'transform 0.14s ease-out',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Background glow blobs */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 60%, rgba(124,58,237,0.18) 0%, transparent 70%)' }}
      />
      <div className="absolute top-4 right-8 w-48 h-48 bg-purple-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-8 left-8 w-36 h-36 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none" />

      {/* Robot image */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Image
          src="/hero-robot-pro.png"
          alt="PayAid AI Robot Assistant"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain"
          priority
          style={{ filter: 'drop-shadow(0 20px 60px rgba(83,50,138,0.35))' }}
        />
      </div>

      {/* Floating module chips — CSS keyframe animated */}
      <style>{`
        @keyframes float-a { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes float-b { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
        @keyframes float-c { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes float-d { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes pulse-dot { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.85); } }
      `}</style>

      {/* CRM chip */}
      <div
        className="absolute top-[22%] left-[6%] flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg border border-purple-100 text-xs font-semibold text-purple-700"
        style={{ animation: 'float-a 3s ease-in-out infinite' }}
      >
        <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" style={{ animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
        CRM
      </div>

      {/* Finance chip */}
      <div
        className="absolute top-[28%] right-[5%] flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg border border-yellow-200 text-xs font-semibold text-yellow-700"
        style={{ animation: 'float-b 2.5s ease-in-out infinite' }}
      >
        <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" style={{ animation: 'pulse-dot 1.2s ease-in-out infinite' }} />
        ₹ Finance
      </div>

      {/* HR chip */}
      <div
        className="absolute bottom-[30%] left-[5%] flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg border border-green-200 text-xs font-semibold text-green-700"
        style={{ animation: 'float-c 3.5s ease-in-out infinite' }}
      >
        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" style={{ animation: 'pulse-dot 1.8s ease-in-out infinite' }} />
        HR & Payroll
      </div>

      {/* Analytics chip */}
      <div
        className="absolute bottom-[28%] right-[5%] flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg border border-indigo-200 text-xs font-semibold text-indigo-700"
        style={{ animation: 'float-d 2.8s ease-in-out infinite' }}
      >
        <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" style={{ animation: 'pulse-dot 1.4s ease-in-out infinite' }} />
        Analytics
      </div>

      {/* Inventory chip */}
      <div
        className="absolute top-[52%] left-[4%] flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg border border-orange-200 text-xs font-semibold text-orange-700"
        style={{ animation: 'float-b 4s ease-in-out infinite', animationDelay: '-1s' }}
      >
        <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
        Inventory
      </div>

      {/* Label */}
      <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-semibold text-purple-700 border border-purple-200 shadow-sm pointer-events-none flex items-center gap-1.5">
        <span>✨</span> Your AI Co-founder
      </div>
    </div>
  )
}
