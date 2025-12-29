'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import Script from 'next/script'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, isLoading, token, fetchUser } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || isLoading) return

    if (isAuthenticated && token) {
      const { tenant } = useAuthStore.getState()
      if (tenant?.id) {
        router.push(`/dashboard/${tenant.id}`)
      } else {
        router.push('/dashboard')
      }
    } else if (token && !isAuthenticated) {
      fetchUser().catch(() => {})
    }
  }, [mounted, isAuthenticated, isLoading, token, router, fetchUser])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Header scroll effect
    const header = document.querySelector('header')
    const handleScroll = () => {
      if (window.scrollY > 50) {
        header?.classList.add('scrolled')
      } else {
        header?.classList.remove('scrolled')
      }
    }
    window.addEventListener('scroll', handleScroll)

    // Scroll reveal animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    }, observerOptions)

    document.querySelectorAll('.scroll-reveal').forEach(el => {
      observer.observe(el)
    })

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault()
        const href = anchor.getAttribute('href')
        if (href) {
          const target = document.querySelector(href)
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }
      })
    })

    // Tab functionality - DYNAMIC IMAGE SWITCHING
    const tabButtons = document.querySelectorAll('.tab-btn')
    const showcaseImages = document.querySelectorAll('.showcase-image img')

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab')
        
        // Update active button
        tabButtons.forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
        
        // Hide all images and show selected one
        showcaseImages.forEach(img => img.classList.add('hidden'))
        const targetImg = document.getElementById(tabName || '')
        if (targetImg) {
          targetImg.classList.remove('hidden')
        }
      })
    })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [mounted])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#53328A]"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <>
      <style jsx global>{`
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --primary-purple: #53328A;
            --primary-gold: #F5C700;
            --dark-purple: #2D1B47;
            --light-purple: #6B4BA1;
            --text-dark: #1A1A1A;
            --text-light: #666666;
            --text-light-2: #888888;
            --white: #FFFFFF;
            --bg-light: #F8F7F3;
            --border-light: #E8E7E3;
        }

        html {
            scroll-behavior: smooth;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: var(--text-dark);
            background-color: var(--white);
            overflow-x: hidden;
        }

        /* ===== HEADER ===== */
        header {
            position: fixed;
            top: 0;
            width: 100%;
            z-index: 1000;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid var(--border-light);
            transition: all 0.3s ease;
            padding: 0.75rem 2rem;
        }

        header.scrolled {
            box-shadow: 0 8px 32px rgba(83, 50, 138, 0.1);
        }

        nav {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            text-decoration: none;
            font-weight: 700;
            font-size: 1.2rem;
            color: var(--primary-purple);
        }

        .logo img {
            height: 40px;
            width: auto;
        }

        .nav-links {
            display: flex;
            gap: 2rem;
            list-style: none;
            align-items: center;
        }

        .nav-item {
            position: relative;
        }

        .nav-links a {
            text-decoration: none;
            color: var(--text-dark);
            font-weight: 500;
            font-size: 0.9rem;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.3rem;
            padding: 0.5rem 0;
        }

        .nav-links a:hover {
            color: var(--primary-purple);
        }

        .dropdown-arrow {
            font-size: 0.7rem;
            transition: transform 0.3s ease;
        }

        .nav-item:hover .dropdown-arrow {
            transform: rotate(180deg);
        }

        /* ===== MEGA MENU ===== */
        .mega-menu {
            position: absolute;
            top: 100%;
            left: 0;
            background: var(--white);
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
            padding: 2rem;
            min-width: 600px;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all 0.3s ease;
            margin-top: 0.5rem;
        }

        .nav-item:hover .mega-menu {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }

        .mega-menu-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
        }

        .menu-column h4 {
            font-size: 0.85rem;
            font-weight: 700;
            color: var(--primary-purple);
            margin-bottom: 1rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .menu-column ul {
            list-style: none;
        }

        .menu-column li {
            margin-bottom: 0.75rem;
        }

        .menu-column a {
            color: var(--text-light);
            text-decoration: none;
            font-size: 0.85rem;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .menu-column a:hover {
            color: var(--primary-purple);
            transform: translateX(4px);
        }

        .cta-header {
            background: linear-gradient(135deg, var(--primary-purple), var(--light-purple));
            color: var(--white);
            padding: 0.6rem 1.5rem;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 600;
            font-size: 0.9rem;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(83, 50, 138, 0.2);
        }

        .cta-header:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(83, 50, 138, 0.3);
        }

        .menu-toggle {
            display: none;
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: var(--primary-purple);
        }

        /* ===== HERO SECTION ===== */
        .hero {
            margin-top: 70px;
            min-height: 100vh;
            background: linear-gradient(135deg, var(--white) 0%, var(--bg-light) 100%);
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            padding: 2rem;
        }

        .hero::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -10%;
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, rgba(245, 199, 0, 0.08) 0%, transparent 70%);
            border-radius: 50%;
            animation: float 8s ease-in-out infinite;
        }

        .hero::after {
            content: '';
            position: absolute;
            bottom: -10%;
            left: -5%;
            width: 500px;
            height: 500px;
            background: radial-gradient(circle, rgba(83, 50, 138, 0.05) 0%, transparent 70%);
            border-radius: 50%;
            animation: float 10s ease-in-out infinite reverse;
        }

        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(30px); }
        }

        .hero-content {
            position: relative;
            z-index: 2;
            max-width: 900px;
            animation: slideIn 0.8s ease-out;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(40px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .hero h1 {
            font-size: clamp(2rem, 6vw, 4rem);
            font-weight: 800;
            line-height: 1.2;
            margin-bottom: 1.5rem;
            color: var(--text-dark);
            background: linear-gradient(135deg, var(--primary-purple) 0%, var(--primary-gold) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .hero p {
            font-size: clamp(1rem, 2.5vw, 1.25rem);
            color: var(--text-light);
            margin-bottom: 2.5rem;
            line-height: 1.7;
            max-width: 600px;
        }

        .hero-buttons {
            display: flex;
            gap: 1.5rem;
            flex-wrap: wrap;
            animation: fadeIn 1s ease-out 0.3s backwards;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .btn-primary {
            background: linear-gradient(135deg, var(--primary-purple), var(--light-purple));
            color: var(--white);
            padding: 1rem 2rem;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 600;
            font-size: 1rem;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            box-shadow: 0 8px 25px rgba(83, 50, 138, 0.2);
            display: inline-block;
        }

        .btn-primary:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 35px rgba(83, 50, 138, 0.3);
        }

        .btn-secondary {
            background: var(--white);
            color: var(--primary-purple);
            padding: 1rem 2rem;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 600;
            font-size: 1rem;
            transition: all 0.3s ease;
            border: 2px solid var(--primary-purple);
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
        }

        .btn-secondary:hover {
            background: var(--primary-purple);
            color: var(--white);
            transform: translateY(-4px);
        }

        /* ===== DASHBOARD SHOWCASE ===== */
        .dashboard-showcase {
            padding: 6rem 2rem;
            background: var(--white);
            position: relative;
            z-index: 10;
        }

        .showcase-container {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 1fr 1.2fr;
            gap: 3rem;
            align-items: center;
        }

        .showcase-left h2 {
            font-size: clamp(1.8rem, 3vw, 2.5rem);
            font-weight: 800;
            margin-bottom: 1.5rem;
            color: var(--text-dark);
            line-height: 1.3;
        }

        .showcase-left p {
            font-size: 1.05rem;
            color: var(--text-light);
            margin-bottom: 2rem;
            line-height: 1.8;
        }

        .showcase-tabs {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
        }

        .tab-btn {
            padding: 0.8rem 1.4rem;
            border: 2px solid var(--border-light);
            background: var(--white);
            color: var(--text-light);
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .tab-btn:hover {
            border-color: var(--primary-purple);
            color: var(--primary-purple);
        }

        .tab-btn.active {
            background: linear-gradient(135deg, var(--primary-purple), var(--light-purple));
            color: var(--white);
            border-color: transparent;
        }

        .showcase-image {
            position: relative;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
            animation: slideInRight 0.8s ease-out;
        }

        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(40px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        .showcase-image img {
            width: 100%;
            height: auto;
            display: block;
            transition: opacity 0.5s ease;
        }

        .showcase-image img.hidden {
            display: none;
        }

        /* ===== STATS SECTION ===== */
        .stats {
            padding: 4rem 2rem;
            background: linear-gradient(135deg, var(--bg-light) 0%, var(--white) 100%);
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 2rem;
            max-width: 1200px;
            margin: 0 auto;
            text-align: center;
        }

        .stat-item {
            animation: countUp 0.8s ease-out;
        }

        @keyframes countUp {
            from {
                opacity: 0;
                transform: scale(0.9);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }

        .stat-number {
            font-size: clamp(2rem, 4vw, 3rem);
            font-weight: 800;
            background: linear-gradient(135deg, var(--primary-purple), var(--primary-gold));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 0.5rem;
        }

        .stat-label {
            color: var(--text-light);
            font-size: 0.95rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
        }

        /* ===== FEATURES SECTION ===== */
        .features {
            padding: 6rem 2rem;
            background: var(--white);
            position: relative;
            z-index: 10;
        }

        .section-title {
            text-align: center;
            margin-bottom: 4rem;
        }

        .section-title h2 {
            font-size: clamp(2rem, 4vw, 2.8rem);
            font-weight: 800;
            margin-bottom: 1rem;
            color: var(--text-dark);
        }

        .section-title p {
            font-size: 1.1rem;
            color: var(--text-light);
            max-width: 600px;
            margin: 0 auto;
        }

        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 2rem;
            max-width: 1200px;
            margin: 0 auto;
        }

        .feature-card {
            background: linear-gradient(135deg, rgba(245, 199, 0, 0.03) 0%, rgba(83, 50, 138, 0.03) 100%);
            padding: 2.5rem 2rem;
            border-radius: 16px;
            border: 1px solid var(--border-light);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        .feature-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(90deg, var(--primary-gold), var(--primary-purple));
            transform: scaleX(0);
            transform-origin: left;
            transition: transform 0.3s ease;
        }

        .feature-card:hover {
            transform: translateY(-8px);
            background: linear-gradient(135deg, rgba(245, 199, 0, 0.05) 0%, rgba(83, 50, 138, 0.05) 100%);
            border-color: var(--border-light);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
        }

        .feature-card:hover::before {
            transform: scaleX(1);
        }

        .feature-icon {
            width: 80px;
            height: 80px;
            background: transparent;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1.5rem;
            color: var(--white);
            box-shadow: none;
            overflow: hidden;
        }

        .feature-icon img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .feature-card h3 {
            font-size: 1.3rem;
            margin-bottom: 0.75rem;
            color: var(--primary-purple);
            font-weight: 700;
        }

        .feature-card p {
            color: var(--text-light-2);
            line-height: 1.6;
            font-size: 0.95rem;
        }

        /* ===== USE CASES SECTION ===== */
        .use-cases {
            padding: 6rem 2rem;
            background: linear-gradient(135deg, var(--bg-light) 0%, var(--white) 100%);
        }

        .use-cases-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            max-width: 1200px;
            margin: 0 auto;
            margin-top: 3rem;
        }

        .use-case-card {
            background: var(--white);
            padding: 2rem;
            border-radius: 16px;
            border: 1px solid var(--border-light);
            transition: all 0.3s ease;
            box-shadow: 0 2px 15px rgba(0, 0, 0, 0.03);
        }

        .use-case-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.08);
            border-color: var(--primary-gold);
        }

        .use-case-icon {
            width: 70px;
            height: 70px;
            background: transparent;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1rem;
            color: var(--white);
            overflow: hidden;
        }

        .use-case-icon img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .use-case-card h3 {
            font-size: 1.2rem;
            font-weight: 700;
            color: var(--primary-purple);
            margin-bottom: 0.75rem;
        }

        .use-case-card p {
            font-size: 0.95rem;
            color: var(--text-light-2);
            line-height: 1.6;
            margin-bottom: 1rem;
        }

        .use-case-link {
            color: var(--primary-purple);
            font-weight: 600;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.3s ease;
        }

        .use-case-link:hover {
            gap: 1rem;
            color: var(--primary-gold);
        }

        /* ===== PRICING SECTION ===== */
        .pricing {
            padding: 6rem 2rem;
            background: linear-gradient(135deg, var(--dark-purple) 0%, var(--primary-purple) 100%);
            color: var(--white);
        }

        .pricing .section-title h2 {
            color: var(--white);
        }

        .pricing .section-title p {
            color: rgba(255, 255, 255, 0.8);
        }

        .pricing-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            max-width: 1200px;
            margin: 0 auto;
        }

        .pricing-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 2.5rem;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.15);
            transition: all 0.3s ease;
            position: relative;
        }

        .pricing-card.featured {
            background: linear-gradient(135deg, var(--primary-gold) 0%, #FFA500 100%);
            color: var(--text-dark);
            transform: scale(1.05);
            box-shadow: 0 20px 60px rgba(245, 199, 0, 0.3);
        }

        .pricing-card:hover {
            transform: translateY(-8px);
            border-color: rgba(255, 255, 255, 0.3);
            box-shadow: 0 15px 50px rgba(255, 255, 255, 0.1);
        }

        .pricing-card.featured:hover {
            transform: scale(1.08) translateY(-8px);
        }

        .badge {
            position: absolute;
            top: -15px;
            right: 20px;
            background: var(--primary-gold);
            color: var(--text-dark);
            padding: 0.6rem 1.2rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 700;
        }

        .pricing-card h3 {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
            font-weight: 700;
        }

        .price {
            font-size: 3rem;
            font-weight: 800;
            margin: 1.5rem 0;
        }

        .pricing-card.featured .price {
            color: var(--text-dark);
        }

        .price-period {
            font-size: 0.95rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }

        .features-list {
            list-style: none;
            margin-bottom: 2rem;
        }

        .features-list li {
            padding: 0.75rem 0;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            font-size: 0.95rem;
        }

        .pricing-card.featured .features-list li {
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }

        .features-list li:last-child {
            border-bottom: none;
        }

        .check-icon {
            color: var(--primary-gold);
            font-weight: bold;
            font-size: 1.3rem;
        }

        .pricing-card.featured .check-icon {
            color: var(--text-dark);
        }

        .price-cta {
            width: 100%;
            padding: 1rem;
            border-radius: 50px;
            border: none;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 1rem;
            text-decoration: none;
            display: block;
            text-align: center;
        }

        .pricing-card.featured .price-cta {
            background: var(--text-dark);
            color: var(--primary-gold);
        }

        .pricing-card:not(.featured) .price-cta {
            background: var(--primary-gold);
            color: var(--text-dark);
        }

        .price-cta:hover {
            transform: translateY(-2px);
        }

        /* ===== TESTIMONIALS ===== */
        .testimonials {
            padding: 6rem 2rem;
            background: var(--white);
        }

        .testimonials-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            max-width: 1200px;
            margin: 0 auto;
            margin-top: 3rem;
        }

        .testimonial-card {
            background: linear-gradient(135deg, rgba(245, 199, 0, 0.03) 0%, rgba(83, 50, 138, 0.03) 100%);
            padding: 2rem;
            border-radius: 16px;
            border: 1px solid var(--border-light);
            transition: all 0.3s ease;
        }

        .testimonial-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
        }

        .stars {
            color: var(--primary-gold);
            font-size: 1rem;
            margin-bottom: 1rem;
            letter-spacing: 2px;
        }

        .testimonial-text {
            font-size: 0.95rem;
            color: var(--text-light);
            margin-bottom: 1.5rem;
            line-height: 1.7;
            font-style: italic;
        }

        .testimonial-author {
            font-weight: 700;
            color: var(--primary-purple);
            margin-bottom: 0.25rem;
        }

        .testimonial-role {
            font-size: 0.85rem;
            color: var(--text-light-2);
        }

        /* ===== FINAL CTA ===== */
        .final-cta {
            padding: 6rem 2rem;
            background: linear-gradient(135deg, var(--primary-purple) 0%, var(--dark-purple) 100%);
            color: var(--white);
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        .final-cta::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -10%;
            width: 500px;
            height: 500px;
            background: radial-gradient(circle, rgba(245, 199, 0, 0.08) 0%, transparent 70%);
            border-radius: 50%;
        }

        .final-cta h2 {
            font-size: clamp(2rem, 4vw, 2.8rem);
            margin-bottom: 1rem;
            font-weight: 800;
            position: relative;
            z-index: 2;
        }

        .final-cta p {
            font-size: 1.1rem;
            margin-bottom: 2rem;
            opacity: 0.95;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
            position: relative;
            z-index: 2;
        }

        .cta-button-large {
            background: var(--primary-gold);
            color: var(--text-dark);
            padding: 1.25rem 2.5rem;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 700;
            font-size: 1.1rem;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            box-shadow: 0 8px 25px rgba(245, 199, 0, 0.3);
            display: inline-block;
            position: relative;
            z-index: 2;
        }

        .cta-button-large:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 35px rgba(245, 199, 0, 0.4);
        }

        /* ===== FOOTER ===== */
        footer {
            background: var(--text-dark);
            color: var(--white);
            padding: 4rem 2rem 2rem;
        }

        .footer-content {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
        }

        .footer-section h4 {
            margin-bottom: 1rem;
            font-size: 1rem;
            font-weight: 700;
            color: var(--primary-gold);
        }

        .footer-section a {
            color: rgba(255, 255, 255, 0.6);
            text-decoration: none;
            font-size: 0.9rem;
            display: block;
            margin-bottom: 0.75rem;
            transition: color 0.3s ease;
        }

        .footer-section a:hover {
            color: var(--primary-gold);
        }

        .footer-bottom {
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            padding-top: 2rem;
            text-align: center;
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.5);
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 768px) {
            .nav-links {
                display: none;
            }

            .menu-toggle {
                display: block;
            }

            .mega-menu {
                min-width: auto;
                width: calc(100vw - 4rem);
            }

            .mega-menu-grid {
                grid-template-columns: 1fr;
            }

            .showcase-container {
                grid-template-columns: 1fr;
                gap: 2rem;
            }

            .hero h1 {
                font-size: 2rem;
            }

            .hero-buttons {
                flex-direction: column;
            }

            .btn-primary, .btn-secondary {
                width: 100%;
                text-align: center;
            }

            .pricing-card.featured {
                transform: scale(1);
            }

            header {
                padding: 0.5rem 1rem;
            }

            .hero {
                margin-top: 60px;
                padding: 1rem;
            }
        }

        /* ===== SCROLL REVEAL ===== */
        .scroll-reveal {
            opacity: 0;
            transform: translateY(30px);
        }

        .scroll-reveal.visible {
            animation: slideUp 0.6s ease-out forwards;
        }

        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
      `}</style>

      {/* HEADER WITH MEGA MENU */}
      <header>
        <nav>
          <Link href="/" className="logo">
            <img src="https://payaidpayments.com/wp-content/uploads/2023/03/payaidPNG-2048x1058.png" alt="PayAid" />
          </Link>
          <ul className="nav-links">
            <li className="nav-item">
              <a href="#products">Products <span className="dropdown-arrow">▼</span></a>
              <div className="mega-menu">
                <div className="mega-menu-grid">
                  <div className="menu-column">
                    <h4>AI Services</h4>
                    <ul>
                      <li><a href="#ai-services">Conversational AI</a></li>
                      <li><a href="#ai-services">Agentic Automation</a></li>
                      <li><a href="#ai-services">Knowledge & RAG AI</a></li>
                      <li><a href="#ai-services">AI Co-founder</a></li>
                      <li><a href="#ai-services">AI Insights</a></li>
                      <li><a href="#ai-services">Website Builder</a></li>
                    </ul>
                  </div>
                  <div className="menu-column">
                    <h4>Business Modules</h4>
                    <ul>
                      <li><a href="#features">CRM Management</a></li>
                      <li><a href="#features">Invoicing & Billing</a></li>
                      <li><a href="#features">Inventory Tracking</a></li>
                      <li><a href="#features">Payment Processing</a></li>
                      <li><a href="#features">HR & Payroll</a></li>
                      <li><a href="#features">Accounting & GST</a></li>
                    </ul>
                  </div>
                </div>
              </div>
            </li>
            <li className="nav-item">
              <a href="#solutions">Solutions <span className="dropdown-arrow">▼</span></a>
              <div className="mega-menu">
                <div className="mega-menu-grid">
                  <div className="menu-column">
                    <h4>By Industry</h4>
                    <ul>
                      <li><a href="#features">Restaurants & Cafes</a></li>
                      <li><a href="#features">Retail Stores</a></li>
                      <li><a href="#features">Service Businesses</a></li>
                      <li><a href="#features">Manufacturing</a></li>
                    </ul>
                  </div>
                  <div className="menu-column">
                    <h4>Use Cases</h4>
                    <ul>
                      <li><a href="#features">Multi-Location Management</a></li>
                      <li><a href="#features">E-Commerce Integration</a></li>
                      <li><a href="#features">GST Compliance</a></li>
                      <li><a href="#features">Business Scaling</a></li>
                    </ul>
                  </div>
                </div>
              </div>
            </li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#features">Company</a></li>
            <li><Link href="/login">Sign In</Link></li>
          </ul>
          <Link href="/register" className="cta-header">Book AI Consultation</Link>
          <button className="menu-toggle">☰</button>
        </nav>
      </header>

      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-content">
          <h1>Your Complete Business OS, <span style={{display: 'block'}}>Powered by AI</span></h1>
          <p>
            AI-powered CRM, automation, and intelligence to streamline operations, reduce costs, and elevate customer experiences. 
            Everything your business needs—from conversational AI to workflow automation—all in one platform. Built for India.
          </p>
          <div className="hero-buttons">
            <Link href="/register" className="btn-primary">Start Free Trial</Link>
            <a href="#ai-services" className="btn-secondary">Explore AI Features →</a>
          </div>
        </div>
      </section>

      {/* DASHBOARD SHOWCASE */}
      <section className="dashboard-showcase" id="dashboard-showcase">
        <div className="showcase-container">
          <div className="showcase-left">
            <h2>All Your Business, One Dashboard</h2>
            <p>
              Manage your entire business from a single, intuitive dashboard. Access customer management, invoicing, inventory, payments, HR, accounting, analytics, and AI-powered insights all in one place. No switching between tools. No learning curves.
            </p>
            <div className="showcase-tabs">
              <button className="tab-btn active" data-tab="crm">CRM</button>
              <button className="tab-btn" data-tab="invoicing">Invoicing</button>
              <button className="tab-btn" data-tab="inventory">Inventory</button>
              <button className="tab-btn" data-tab="analytics">Analytics</button>
            </div>
          </div>
          <div className="showcase-image">
            <img id="crm" src="https://user-gen-media-assets.s3.amazonaws.com/seedream_images/c0edae1a-228f-4ed9-ac4c-7416f122b23c.png" alt="CRM Dashboard" />
            <img id="invoicing" className="hidden" src="https://user-gen-media-assets.s3.amazonaws.com/seedream_images/11f51316-40e0-48f1-b809-89197160a22e.png" alt="Invoicing Dashboard" />
            <img id="inventory" className="hidden" src="https://user-gen-media-assets.s3.amazonaws.com/seedream_images/87901090-3bfc-4120-b4fc-456db282f481.png" alt="Inventory Dashboard" />
            <img id="analytics" className="hidden" src="https://user-gen-media-assets.s3.amazonaws.com/seedream_images/df4d5758-332c-4e79-89ec-4f9af8b1c070.png" alt="Analytics Dashboard" />
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="stats">
        <div className="stats-grid">
          <div className="stat-item scroll-reveal">
            <div className="stat-number">10×</div>
            <div className="stat-label">Faster Execution</div>
          </div>
          <div className="stat-item scroll-reveal">
            <div className="stat-number">50%</div>
            <div className="stat-label">Cost Savings</div>
          </div>
          <div className="stat-item scroll-reveal">
            <div className="stat-number">100%</div>
            <div className="stat-label">Business Visibility</div>
          </div>
          <div className="stat-item scroll-reveal">
            <div className="stat-number">0</div>
            <div className="stat-label">Tools to Switch</div>
          </div>
        </div>
      </section>

      {/* CORE AI SERVICES SECTION */}
      <section className="features" id="ai-services" style={{background: 'linear-gradient(135deg, var(--bg-light) 0%, var(--white) 100%)'}}>
        <div className="section-title">
          <h2>Our Core AI Services</h2>
          <p>Powerful AI automation and smart solutions to transform your business operations</p>
        </div>
        <div className="features-grid">
          <div className="feature-card scroll-reveal">
            <div className="feature-icon" style={{background: 'linear-gradient(135deg, var(--primary-purple), var(--light-purple))'}}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'white'}}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                <path d="M13 8H3"></path>
                <path d="M17 12H3"></path>
              </svg>
            </div>
            <h3>Conversational AI</h3>
            <p>Build multilingual, context-aware chatbots for web, WhatsApp, apps, or voice. Turn conversations into conversions with intelligent lead qualification and automated customer support.</p>
          </div>
          <div className="feature-card scroll-reveal">
            <div className="feature-icon" style={{background: 'linear-gradient(135deg, var(--primary-purple), var(--light-purple))'}}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'white'}}>
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
              </svg>
            </div>
            <h3>Agentic Workflow Automation</h3>
            <p>Deploy smart AI agents to automate email parsing, form-filling, document review, and tasks in real time. Reduce manual work and accelerate business processes.</p>
          </div>
          <div className="feature-card scroll-reveal">
            <div className="feature-icon" style={{background: 'linear-gradient(135deg, var(--primary-purple), var(--light-purple))'}}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'white'}}>
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                <path d="M9 10h6"></path>
                <path d="M9 14h6"></path>
              </svg>
            </div>
            <h3>Knowledge & RAG AI</h3>
            <p>Ask questions from your documents or SOPs and get instant, cited answers via intelligent retrieval. Transform your knowledge base into a searchable AI assistant with full audit trails.</p>
          </div>
          <div className="feature-card scroll-reveal">
            <div className="feature-icon" style={{background: 'linear-gradient(135deg, var(--primary-purple), var(--light-purple))'}}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'white'}}>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3>AI Co-founder</h3>
            <p>Your strategic business partner with 22 specialist agents. Get business insights, recommendations, and execute actions automatically. From idea to IPO, guided by AI.</p>
          </div>
          <div className="feature-card scroll-reveal">
            <div className="feature-icon" style={{background: 'linear-gradient(135deg, var(--primary-purple), var(--light-purple))'}}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'white'}}>
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            </div>
            <h3>AI Website Builder</h3>
            <p>Create stunning websites and landing pages with AI-powered component generation. Build, customize, and deploy professional sites in minutes, not weeks.</p>
          </div>
          <div className="feature-card scroll-reveal">
            <div className="feature-icon" style={{background: 'linear-gradient(135deg, var(--primary-purple), var(--light-purple))'}}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: 'white'}}>
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
            </div>
            <h3>AI-Powered Insights</h3>
            <p>Get intelligent business analysis, revenue insights, and risk warnings. Make data-driven decisions with AI that understands your business context.</p>
          </div>
        </div>
      </section>

      {/* BUSINESS OPERATING SYSTEM SECTION */}
      <section className="features" id="features">
        <div className="section-title">
          <h2>Complete Business Operating System</h2>
          <p>All your business modules integrated with AI-powered intelligence</p>
        </div>
        <div className="features-grid">
          <div className="feature-card scroll-reveal">
            <div className="feature-icon"><img src="https://user-gen-media-assets.s3.amazonaws.com/seedream_images/a710366a-897f-4ae7-bc18-1f725c29151f.png" alt="All-in-One Platform" /></div>
            <h3>All-in-One Platform</h3>
            <p>Comprehensive Management: Manage your CRM, Invoicing, Inventory, HR, Payments, and Accounting seamlessly within a single platform. Eliminate the need for multiple, disconnected software solutions and gain a unified view of your business operations.</p>
          </div>
          <div className="feature-card scroll-reveal">
            <div className="feature-icon"><img src="https://user-gen-media-assets.s3.amazonaws.com/seedream_images/a1747960-4b63-446e-ad29-c247eb134d4c.png" alt="50% More Affordable" /></div>
            <h3>Made for Indian Businesses</h3>
            <p>Tailored Solutions: PayAid is specifically designed to address the unique challenges and requirements of Indian businesses. Localized Support: Enjoy dedicated support and features that align with the Indian market, ensuring your business stays ahead with tools that truly matter.</p>
          </div>
          <div className="feature-card scroll-reveal">
            <div className="feature-icon"><img src="https://user-gen-media-assets.s3.amazonaws.com/seedream_images/32625e56-4103-46fc-a059-89161398fc9b.png" alt="India-First Design" /></div>
            <h3>Simple & Easy to Use</h3>
            <p>User-Friendly Interface: Built for simplicity, PayAid ensures that anyone in your organization can use it effortlessly. From HR managers to sales teams, our platform minimizes the learning curve, making it accessible to all. Quick Onboarding: Get started in no time.</p>
          </div>
          <div className="feature-card scroll-reveal">
            <div className="feature-icon"><img src="https://user-gen-media-assets.s3.amazonaws.com/seedream_images/3634df48-2ea7-4641-bb4d-cd1c631bbcc1.png" alt="AI-Powered Intelligence" /></div>
            <h3>AI-Powered Intelligence</h3>
            <p>Every module is enhanced with AI capabilities. From smart lead scoring to automated invoice processing, AI works behind the scenes to make your business operations smarter and more efficient. Get insights, predictions, and recommendations tailored to your business.</p>
          </div>
          <div className="feature-card scroll-reveal">
            <div className="feature-icon"><img src="https://user-gen-media-assets.s3.amazonaws.com/seedream_images/2b88452a-f5f2-4a3b-8e26-dccc89f76fa9.png" alt="Lightning Fast Implementation" /></div>
            <h3>Improved Efficiency</h3>
            <p>Streamline workflows and enhance team productivity by integrating all business functions under one roof. Start using PayAid in minutes, not months. Simple onboarding, intuitive interface, and immediate productivity gains.</p>
          </div>
          <div className="feature-card scroll-reveal">
            <div className="feature-icon"><img src="https://user-gen-media-assets.s3.amazonaws.com/seedream_images/7dce85d1-4485-457c-825c-a9b5ca0008a7.png" alt="Enterprise-Grade Security" /></div>
            <h3>Strong Security</h3>
            <p>128-bit SSL encryption—the same high-security standard trusted by leading banks. From login to every action you take, your data stays safe, secure & shielded from threats. Bank-grade security with enterprise-level compliance standards.</p>
          </div>
        </div>
      </section>

      {/* USE CASES SECTION */}
      <section className="use-cases">
        <div className="section-title">
          <h2>Built for Indian Businesses</h2>
          <p>Serving restaurants, retail, services, and more across India</p>
        </div>
        <div className="use-cases-grid">
          <div className="use-case-card scroll-reveal">
            <div className="use-case-icon"><img src="https://user-gen-media-assets.s3.amazonaws.com/seedream_images/d5698294-4698-48a6-bad4-7ff8d841d471.png" alt="Restaurants" /></div>
            <h3>Restaurants</h3>
            <p>No more operational headaches! With PayAid, handle online and offline orders, payment processing, inventory tracking, and staff scheduling from one dashboard, ensuring smooth sailing for your team.</p>
            <a href="#features" className="use-case-link">Learn more</a>
          </div>
          <div className="use-case-card scroll-reveal">
            <div className="use-case-icon"><img src="https://user-gen-media-assets.s3.amazonaws.com/seedream_images/3c6c7a46-58ea-426f-9c3c-7b415040e598.png" alt="Retail Stores" /></div>
            <h3>Retail Stores</h3>
            <p>Manage your leads, assign sales targets and close more deals. Multi-location inventory management, customer loyalty programs, point of sale systems, and centralized analytics.</p>
            <a href="#features" className="use-case-link">Learn more</a>
          </div>
          <div className="use-case-card scroll-reveal">
            <div className="use-case-icon"><img src="https://user-gen-media-assets.s3.amazonaws.com/seedream_images/ef72d266-1453-4f1b-879f-c1e44a154e80.png" alt="Service Businesses" /></div>
            <h3>Service Businesses</h3>
            <p>Keep a track of all the transactions happening in your business. Project management, client invoicing, team scheduling, expense tracking, and profitability analysis in real-time.</p>
            <a href="#features" className="use-case-link">Learn more</a>
          </div>
          <div className="use-case-card scroll-reveal">
            <div className="use-case-icon"><img src="https://user-gen-media-assets.s3.amazonaws.com/seedream_images/50ad44eb-346a-42cc-b988-01e39a718fd4.png" alt="E-Commerce Platforms" /></div>
            <h3>E-Commerce Platforms</h3>
            <p>Manage projects, assign tasks and never miss a project timeline. Multi-channel selling, inventory synchronization, order management, fulfillment tracking, and customer insights.</p>
            <a href="#features" className="use-case-link">Learn more</a>
          </div>
          <div className="use-case-card scroll-reveal">
            <div className="use-case-icon"><img src="https://user-gen-media-assets.s3.amazonaws.com/seedream_images/770d8b48-df7a-4d19-8632-9d8f28f844a7.png" alt="Manufacturing" /></div>
            <h3>Manufacturing</h3>
            <p>Production tracking, supplier management, quality control, logistics optimization, and compliance reporting—all streamlined in one platform.</p>
            <a href="#features" className="use-case-link">Learn more</a>
          </div>
          <div className="use-case-card scroll-reveal">
            <div className="use-case-icon"><img src="https://user-gen-media-assets.s3.amazonaws.com/seedream_images/81b13c03-2331-4efa-8fa4-c85f7d0f8c04.png" alt="Professional Services" /></div>
            <h3>Professional Services</h3>
            <p>Client project management, team collaboration, resource planning, time tracking, and invoice automation—all in one place.</p>
            <a href="#features" className="use-case-link">Learn more</a>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section className="pricing" id="pricing">
        <div className="section-title">
          <h2>Simple, Transparent Pricing</h2>
          <p>No hidden charges. No surprise fees. Scale as you grow.</p>
        </div>
        <div className="pricing-cards">
          <div className="pricing-card scroll-reveal">
            <h3>Starter</h3>
            <div className="price">₹3,999</div>
            <div className="price-period">per month</div>
            <ul className="features-list">
              <li><span className="check-icon">✓</span> CRM & Invoicing</li>
              <li><span className="check-icon">✓</span> Up to 5 Users</li>
              <li><span className="check-icon">✓</span> Basic Analytics</li>
              <li><span className="check-icon">✓</span> Email Support</li>
              <li><span className="check-icon">✓</span> Mobile App</li>
            </ul>
            <Link href="/register" className="price-cta">Start Free Trial</Link>
          </div>
          <div className="pricing-card featured scroll-reveal">
            <div className="badge">Most Popular</div>
            <h3>Professional</h3>
            <div className="price">₹7,999</div>
            <div className="price-period">per month</div>
            <ul className="features-list">
              <li><span className="check-icon">✓</span> All Modules Included</li>
              <li><span className="check-icon">✓</span> Unlimited Users</li>
              <li><span className="check-icon">✓</span> AI Co-founder</li>
              <li><span className="check-icon">✓</span> Advanced Analytics</li>
              <li><span className="check-icon">✓</span> Priority Support</li>
            </ul>
            <Link href="/register" className="price-cta">Start Free Trial</Link>
          </div>
          <div className="pricing-card scroll-reveal">
            <h3>Enterprise</h3>
            <div className="price">Custom</div>
            <div className="price-period">per month</div>
            <ul className="features-list">
              <li><span className="check-icon">✓</span> Everything Included</li>
              <li><span className="check-icon">✓</span> Custom Integrations</li>
              <li><span className="check-icon">✓</span> Dedicated Account Manager</li>
              <li><span className="check-icon">✓</span> White-label Options</li>
              <li><span className="check-icon">✓</span> SLA Guarantee</li>
            </ul>
            <Link href="/register" className="price-cta">Contact Sales</Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="testimonials">
        <div className="section-title">
          <h2>The Hype is Real. Here&apos;s What They Say</h2>
          <p>Trusted by Indian entrepreneurs transforming their businesses</p>
        </div>
        <div className="testimonials-grid">
          <div className="testimonial-card scroll-reveal">
            <div className="stars">★★★★★</div>
            <p className="testimonial-text">&quot;Running a restaurant chain was already hard. What made it harder? Juggling 5–6 different tools just to keep operations aligned. PayAid changed everything. We now manage orders, payments, and staff across all locations from one dashboard. Saved us ₹18,000 per month.&quot;</p>
            <p className="testimonial-author">Rajesh Kumar</p>
            <p className="testimonial-role">Restaurant Owner, Mumbai</p>
          </div>
          <div className="testimonial-card scroll-reveal">
            <div className="stars">★★★★★</div>
            <p className="testimonial-text">&quot;As a growing retail business, managing our remote team was chaotic. We were juggling multiple tools, and everything felt disconnected. PayAid creates a unified experience—and it&apos;s been a total game changer. Real-time visibility keeps teams aligned instantly.&quot;</p>
            <p className="testimonial-author">Priya Singh</p>
            <p className="testimonial-role">Retail Store Manager, Delhi</p>
          </div>
          <div className="testimonial-card scroll-reveal">
            <div className="stars">★★★★★</div>
            <p className="testimonial-text">&quot;The AI co-founder feature turns every conversation into execution. It captures insights, suggests actions, and helps execute—turning every discussion into business growth. PayAid feels like having a strategic partner on our team every day.&quot;</p>
            <p className="testimonial-author">Amit Patel</p>
            <p className="testimonial-role">Service Business Owner, Bangalore</p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final-cta">
        <h2>Ready to Accelerate Your Growth with AI?</h2>
        <p>Whether you're a startup or scaling enterprise—PayAid can craft AI-powered workflows, chatbots, and automation tools tailored for you. Book your free AI consultation or start your trial today.</p>
        <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2rem'}}>
          <Link href="/register" className="cta-button-large">Start Free Trial</Link>
          <a href="#ai-services" className="btn-secondary" style={{background: 'rgba(255, 255, 255, 0.1)', color: 'var(--white)', borderColor: 'rgba(255, 255, 255, 0.3)'}}>Book AI Consultation</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-content">
          <div className="footer-section">
            <h4>AI Services</h4>
            <a href="#ai-services">Conversational AI</a>
            <a href="#ai-services">Agentic Automation</a>
            <a href="#ai-services">Knowledge & RAG AI</a>
            <a href="#ai-services">AI Co-founder</a>
          </div>
          <div className="footer-section">
            <h4>Product</h4>
            <a href="#features">Business Modules</a>
            <a href="#pricing">Pricing</a>
            <a href="#features">Integrations</a>
            <a href="#features">Security</a>
          </div>
          <div className="footer-section">
            <h4>Solutions</h4>
            <a href="#features">Restaurants</a>
            <a href="#features">Retail</a>
            <a href="#features">Services</a>
            <a href="#features">E-Commerce</a>
          </div>
          <div className="footer-section">
            <h4>Company</h4>
            <a href="#features">About</a>
            <a href="#features">Blog</a>
            <a href="#features">Careers</a>
            <a href="#features">Contact</a>
          </div>
          <div className="footer-section">
            <h4>Legal</h4>
            <a href="#features">Privacy Policy</a>
            <a href="#features">Terms of Service</a>
            <a href="#features">Compliance</a>
            <a href="#features">Security</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 PayAid. Built for Indian Businesses. All rights reserved.</p>
        </div>
      </footer>
    </>
  )
}
