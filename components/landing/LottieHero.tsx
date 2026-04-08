'use client'

import { useEffect, useRef } from 'react'

/**
 * Animated AI hero visual — pure CSS/SVG, zero external dependencies.
 * Features:
 * - Robot character with idle floating animation
 * - Eyes follow the mouse cursor
 * - Subtle body tilt in the direction of the cursor
 * - Pulsing aura / glow effect
 * - Data particles orbiting around the robot
 */
export default function LottieHero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const eyeLeftRef = useRef<SVGCircleElement>(null)
  const eyeRightRef = useRef<SVGCircleElement>(null)
  const bodyRef = useRef<SVGGElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      // Normalised -1 to +1
      const nx = (e.clientX - centerX) / (rect.width / 2)
      const ny = (e.clientY - centerY) / (rect.height / 2)

      // Eye pupil follow (max ±3px travel)
      if (eyeLeftRef.current) {
        eyeLeftRef.current.setAttribute('cx', String(93 + nx * 3))
        eyeLeftRef.current.setAttribute('cy', String(118 + ny * 2))
      }
      if (eyeRightRef.current) {
        eyeRightRef.current.setAttribute('cx', String(127 + nx * 3))
        eyeRightRef.current.setAttribute('cy', String(118 + ny * 2))
      }

      // Body tilt (max ±6 deg)
      if (bodyRef.current) {
        bodyRef.current.setAttribute(
          'transform',
          `rotate(${nx * 4}, 110, 180) translate(${nx * 4}, ${ny * 2})`
        )
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[500px] lg:min-h-[600px] rounded-2xl overflow-hidden border border-purple-200 shadow-sm flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #f5f3ff 0%, #fefce8 50%, #f0fdf4 100%)',
      }}
    >
      {/* Decorative blobs */}
      <div className="absolute top-6 right-6 w-40 h-40 bg-purple-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-6 w-32 h-32 bg-yellow-300/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-green-200/30 rounded-full blur-2xl pointer-events-none" />

      {/* Main SVG Robot */}
      <svg
        viewBox="0 0 220 360"
        width="340"
        height="440"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 drop-shadow-xl"
        style={{ filter: 'drop-shadow(0 8px 32px rgba(83,50,138,0.18))' }}
      >
        <defs>
          <radialGradient id="aura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id="headGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Pulsing aura */}
        <circle cx="110" cy="200" r="95" fill="url(#aura)">
          <animate attributeName="r" values="90;100;90" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0.4;0.8" dur="3s" repeatCount="indefinite" />
        </circle>

        {/* Floating animation wrapper */}
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 0,-10; 0,0"
            dur="3.5s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95"
          />

          {/* Shadow on ground */}
          <ellipse cx="110" cy="348" rx="38" ry="7" fill="#7c3aed" opacity="0.18">
            <animate attributeName="rx" values="38;32;38" dur="3.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.18;0.10;0.18" dur="3.5s" repeatCount="indefinite" />
          </ellipse>

          {/* === BODY === */}
          <g ref={bodyRef}>
            {/* Legs */}
            <rect x="82" y="270" width="18" height="48" rx="9" fill="url(#bodyGrad)" />
            <rect x="120" y="270" width="18" height="48" rx="9" fill="url(#bodyGrad)" />
            {/* Feet */}
            <rect x="76" y="308" width="28" height="14" rx="7" fill="#4f46e5" />
            <rect x="116" y="308" width="28" height="14" rx="7" fill="#4f46e5" />

            {/* Torso */}
            <rect x="68" y="190" width="84" height="88" rx="18" fill="url(#bodyGrad)" />

            {/* Chest screen */}
            <rect x="80" y="202" width="60" height="44" rx="10" fill="url(#screenGrad)" />
            {/* Screen lines (data viz) */}
            <rect x="86" y="212" width="48" height="3" rx="1.5" fill="#6366f1" opacity="0.8">
              <animate attributeName="width" values="48;32;48" dur="2s" repeatCount="indefinite" />
            </rect>
            <rect x="86" y="220" width="36" height="3" rx="1.5" fill="#818cf8" opacity="0.7">
              <animate attributeName="width" values="36;48;36" dur="1.8s" repeatCount="indefinite" />
            </rect>
            <rect x="86" y="228" width="42" height="3" rx="1.5" fill="#a5b4fc" opacity="0.6">
              <animate attributeName="width" values="42;24;42" dur="2.3s" repeatCount="indefinite" />
            </rect>
            {/* Blinking dot */}
            <circle cx="115" cy="238" r="4" fill="#f5c700">
              <animate attributeName="opacity" values="1;0.2;1" dur="1.5s" repeatCount="indefinite" />
            </circle>

            {/* Arms */}
            <rect x="38" y="195" width="34" height="16" rx="8" fill="url(#bodyGrad)">
              {/* Left arm wave */}
              <animateTransform attributeName="transform" type="rotate"
                values="0,55,203; -18,55,203; 0,55,203"
                dur="2.5s" repeatCount="indefinite"
                calcMode="spline" keySplines="0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95" />
            </rect>
            <rect x="148" y="195" width="34" height="16" rx="8" fill="url(#bodyGrad)" />

            {/* Hands */}
            <circle cx="42" cy="203" r="10" fill="#6366f1">
              <animateTransform attributeName="transform" type="rotate"
                values="0,55,203; -18,55,203; 0,55,203"
                dur="2.5s" repeatCount="indefinite"
                calcMode="spline" keySplines="0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95" />
            </circle>
            <circle cx="178" cy="203" r="10" fill="#6366f1" />

            {/* Neck */}
            <rect x="100" y="174" width="20" height="20" rx="6" fill="#6366f1" />

            {/* === HEAD === */}
            <rect x="62" y="98" width="96" height="80" rx="22" fill="url(#headGrad)" />

            {/* Antenna */}
            <rect x="107" y="72" width="6" height="30" rx="3" fill="#8b5cf6" />
            <circle cx="110" cy="68" r="8" fill="#f5c700" filter="url(#glow)">
              <animate attributeName="r" values="8;10;8" dur="1.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.6;1" dur="1.2s" repeatCount="indefinite" />
            </circle>

            {/* Eye sockets */}
            <circle cx="90" cy="118" r="14" fill="#1e1b4b" />
            <circle cx="130" cy="118" r="14" fill="#1e1b4b" />

            {/* Eye whites */}
            <circle cx="90" cy="118" r="10" fill="white" opacity="0.95" />
            <circle cx="130" cy="118" r="10" fill="white" opacity="0.95" />

            {/* Pupils — these move with the mouse */}
            <circle ref={eyeLeftRef} cx="90" cy="118" r="5" fill="#53328A" />
            <circle ref={eyeRightRef} cx="130" cy="118" r="5" fill="#53328A" />

            {/* Pupil highlights */}
            <circle cx="92" cy="116" r="2" fill="white" opacity="0.8" />
            <circle cx="132" cy="116" r="2" fill="white" opacity="0.8" />

            {/* Mouth / speaker grille */}
            <rect x="82" y="148" width="56" height="14" rx="7" fill="#1e1b4b" />
            <rect x="88" y="152" width="8" height="6" rx="3" fill="#6366f1" opacity="0.8">
              <animate attributeName="height" values="6;2;6" dur="0.4s" repeatCount="indefinite" />
            </rect>
            <rect x="101" y="152" width="8" height="6" rx="3" fill="#818cf8" opacity="0.8">
              <animate attributeName="height" values="2;6;2" dur="0.4s" repeatCount="indefinite" />
            </rect>
            <rect x="114" y="152" width="8" height="6" rx="3" fill="#6366f1" opacity="0.8">
              <animate attributeName="height" values="6;2;6" dur="0.4s" repeatCount="indefinite" begin="0.2s" />
            </rect>
            <rect x="127" y="152" width="8" height="6" rx="3" fill="#818cf8" opacity="0.8">
              <animate attributeName="height" values="2;6;2" dur="0.4s" repeatCount="indefinite" begin="0.2s" />
            </rect>

            {/* Ear panels */}
            <rect x="50" y="110" width="14" height="22" rx="7" fill="#6366f1" />
            <rect x="156" y="110" width="14" height="22" rx="7" fill="#6366f1" />
          </g>
        </g>

        {/* Orbiting data particles */}
        <g opacity="0.7">
          {/* Particle 1 */}
          <circle cx="110" cy="110" r="5" fill="#f5c700">
            <animateMotion dur="4s" repeatCount="indefinite">
              <mpath xlinkHref="#orbit1" />
            </animateMotion>
          </circle>
          {/* Particle 2 */}
          <circle cx="110" cy="110" r="4" fill="#818cf8">
            <animateMotion dur="4s" repeatCount="indefinite" begin="-2s">
              <mpath xlinkHref="#orbit1" />
            </animateMotion>
          </circle>
          {/* Particle 3 — small */}
          <circle cx="110" cy="110" r="3" fill="#34d399">
            <animateMotion dur="6s" repeatCount="indefinite" begin="-1s">
              <mpath xlinkHref="#orbit2" />
            </animateMotion>
          </circle>

          {/* Orbit paths (invisible) */}
          <path id="orbit1" d="M 110,200 m -80,0 a 80,40 0 1,1 160,0 a 80,40 0 1,1 -160,0" fill="none" />
          <path id="orbit2" d="M 110,200 m -105,0 a 105,55 0 1,1 210,0 a 105,55 0 1,1 -210,0" fill="none" />
        </g>

        {/* Floating data chips */}
        <g>
          <g opacity="0.9">
            <rect x="10" y="140" width="44" height="22" rx="6" fill="white" stroke="#e9d5ff" strokeWidth="1.5" />
            <text x="32" y="155" textAnchor="middle" fontSize="9" fill="#7c3aed" fontWeight="bold">CRM</text>
            <animateTransform attributeName="transform" type="translate"
              values="0,0; 0,-6; 0,0" dur="3s" repeatCount="indefinite" calcMode="spline"
              keySplines="0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95" />
          </g>
          <g opacity="0.9">
            <rect x="164" y="155" width="46" height="22" rx="6" fill="white" stroke="#fef08a" strokeWidth="1.5" />
            <text x="187" y="170" textAnchor="middle" fontSize="8" fill="#b45309" fontWeight="bold">₹ Finance</text>
            <animateTransform attributeName="transform" type="translate"
              values="0,0; 0,-8; 0,0" dur="2.5s" repeatCount="indefinite" calcMode="spline"
              keySplines="0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95" begin="-1s" />
          </g>
          <g opacity="0.85">
            <rect x="4" y="235" width="48" height="22" rx="6" fill="white" stroke="#bbf7d0" strokeWidth="1.5" />
            <text x="28" y="250" textAnchor="middle" fontSize="8" fill="#065f46" fontWeight="bold">HR & Pay</text>
            <animateTransform attributeName="transform" type="translate"
              values="0,0; 0,-5; 0,0" dur="4s" repeatCount="indefinite" calcMode="spline"
              keySplines="0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95" begin="-2s" />
          </g>
          <g opacity="0.85">
            <rect x="168" y="242" width="46" height="22" rx="6" fill="white" stroke="#ddd6fe" strokeWidth="1.5" />
            <text x="191" y="257" textAnchor="middle" fontSize="8" fill="#6d28d9" fontWeight="bold">Analytics</text>
            <animateTransform attributeName="transform" type="translate"
              values="0,0; 0,-7; 0,0" dur="3.2s" repeatCount="indefinite" calcMode="spline"
              keySplines="0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95" begin="-0.5s" />
          </g>
        </g>
      </svg>

      {/* Label */}
      <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-purple-700 border border-purple-200 shadow-sm pointer-events-none">
        ✨ Your AI Co-founder
      </div>
    </div>
  )
}
