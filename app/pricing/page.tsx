'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function PricingLandingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [selectedIndustry, setSelectedIndustry] = useState<string>('retail')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Industry-specific pricing adjustments
  const industryPricing: Record<string, { startup: number; professional: number; description: string }> = {
    restaurant: { startup: 9999, professional: 18999, description: 'POS integration, inventory sync, staff scheduling, table management' },
    retail: { startup: 7999, professional: 15999, description: 'Complete retail management with inventory, POS, and customer management' },
    service: { startup: 5999, professional: 12999, description: 'CRM + invoicing. Simple setup, fewer integrations needed' },
    healthcare: { startup: 12999, professional: 24999, description: 'Compliance-focused with patient management and secure records' },
    education: { startup: 4999, professional: 9999, description: 'Volume-based pricing for schools and educational institutions' },
    ecommerce: { startup: 8999, professional: 17999, description: 'E-commerce integration with order management and fulfillment' },
  }

  const basePricing = {
    startup: 7999,
    professional: 15999,
  }

  const currentPricing = industryPricing[selectedIndustry] || { ...basePricing, description: '' }

  const getAnnualPrice = (monthly: number) => {
    return Math.round(monthly * 12 * 0.84) // 16% discount
  }

  const pricing = {
    startup: {
      monthly: currentPricing.startup,
      annual: getAnnualPrice(currentPricing.startup),
      savings: currentPricing.startup - Math.round(getAnnualPrice(currentPricing.startup) / 12),
    },
    professional: {
      monthly: currentPricing.professional,
      annual: getAnnualPrice(currentPricing.professional),
      savings: currentPricing.professional - Math.round(getAnnualPrice(currentPricing.professional) / 12),
    },
  }

  useEffect(() => {
    // Header scroll effect
    const header = document.querySelector('header')
    const handleScroll = () => {
      if (window.scrollY > 50) {
        header?.classList.add('scrolled')
      } else {
        header?.classList.remove('scrolled')
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle')
    const mobileMenu = document.querySelector('.mobile-menu')

    if (menuToggle && mobileMenu) {
      mobileMenu.classList.remove('active')
      menuToggle.textContent = '☰'

      menuToggle.addEventListener('click', (e) => {
        e.stopPropagation()
        mobileMenu.classList.toggle('active')
        if (mobileMenu.classList.contains('active')) {
          menuToggle.textContent = '✕'
        } else {
          menuToggle.textContent = '☰'
        }
      })

      document.addEventListener('click', (e) => {
        if (mobileMenu.classList.contains('active') && 
            !mobileMenu.contains(e.target as Node) && 
            !menuToggle.contains(e.target as Node)) {
          mobileMenu.classList.remove('active')
          menuToggle.textContent = '☰'
        }
      })

      mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          mobileMenu.classList.remove('active')
          menuToggle.textContent = '☰'
        })
      })
    }

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

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const faqs = [
    {
      q: "What's included in the free trial?",
      a: "Full access for 14 days. Every feature. Every module. Same as paying customers. No credit card required. If you upgrade during trial, trial days credit toward first month.",
    },
    {
      q: "Can I switch between industries?",
      a: "YES. This is unique to our platform. Same account, just switch industry config. All customer data stays. Switch anytime.",
    },
    {
      q: "How long does setup take?",
      a: "5 minutes to get started. Industry config included. Optional: Paid onboarding (₹15k, 8 hours setup).",
    },
    {
      q: "What happens if I add more team members?",
      a: "Startup tier: Limited to 3. Upgrade to Professional for unlimited. Professional: Unlimited at no extra cost (same ₹15,999 regardless of team size).",
    },
    {
      q: "How much can I save with annual billing?",
      a: "16% off = one month free. Startup: ₹79,999/year (save ₹1,333). Professional: ₹159,999/year (save ₹2,666).",
    },
    {
      q: "Do you have a money-back guarantee?",
      a: "Yes. 30-day money-back guarantee. Try it. If not right, we refund fully. No questions asked.",
    },
    {
      q: "What if I want to cancel?",
      a: "No problem. Monthly: Cancels end of month. Annual: Pro-rated refund for unused time. No penalties.",
    },
    {
      q: "Is my data secure?",
      a: "Bank-level encryption. SOC 2 Type II compliant. ISO 27001 certified. Data in India (no US servers).",
    },
  ]

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

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
          line-height: 1.6;
          color: var(--text-dark);
          background-color: var(--white);
        }

        html {
          scroll-behavior: smooth;
        }

        /* Header */
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

        .nav-links {
          display: flex;
          gap: 2rem;
          list-style: none;
          align-items: center;
        }

        .nav-links a {
          text-decoration: none;
          color: var(--text-dark);
          font-weight: 500;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }

        .nav-links a:hover {
          color: var(--primary-purple);
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
          z-index: 1000;
        }

        .mobile-menu {
          display: none !important;
          position: fixed;
          top: 70px;
          left: 0;
          right: 0;
          background: var(--white);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          z-index: 999;
          max-height: calc(100vh - 70px);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.3s ease;
        }

        .mobile-menu.active {
          display: block !important;
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .mobile-menu ul {
          list-style: none;
          padding: 1rem;
          margin: 0;
        }

        .mobile-menu li {
          padding: 0;
          border-bottom: 1px solid var(--border-light);
        }

        .mobile-menu li:last-child {
          border-bottom: none;
        }

        .mobile-menu a {
          color: var(--text-dark);
          text-decoration: none;
          font-weight: 500;
          display: block;
          padding: 1rem 0;
          min-height: 44px;
          display: flex;
          align-items: center;
          transition: all 0.2s ease;
        }

        .mobile-menu a:active {
          background: var(--bg-light);
          color: var(--primary-purple);
        }

        .mobile-menu .cta-header {
          background: var(--primary-purple);
          color: var(--white);
          padding: 1rem 1.5rem;
          border-radius: 8px;
          text-align: center;
          margin-top: 0.5rem;
          min-height: 48px;
          justify-content: center;
        }

        /* Hero Section */
        .pricing-hero {
          margin-top: 80px;
          padding: 6rem 2rem 4rem;
          background: linear-gradient(135deg, var(--white) 0%, var(--bg-light) 100%);
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .pricing-hero::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -10%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(245, 199, 0, 0.08) 0%, transparent 70%);
          border-radius: 50%;
        }

        .pricing-hero::after {
          content: '';
          position: absolute;
          bottom: -10%;
          left: -5%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(83, 50, 138, 0.05) 0%, transparent 70%);
          border-radius: 50%;
        }

        .pricing-hero h1 {
          font-size: clamp(2.5rem, 5vw, 4.5rem);
          font-weight: 800;
          margin-bottom: 1.5rem;
          color: var(--text-dark);
          position: relative;
          z-index: 2;
          line-height: 1.2;
        }

        .pricing-hero .hero-highlight {
          background: linear-gradient(135deg, var(--primary-purple) 0%, var(--primary-gold) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .pricing-hero p {
          font-size: clamp(1rem, 2vw, 1.35rem);
          color: var(--text-light);
          max-width: 800px;
          margin: 0 auto 2.5rem;
          position: relative;
          z-index: 2;
          line-height: 1.7;
        }

        /* Stats Section */
        .stats-section {
          padding: 3rem 2rem;
          background: var(--white);
          margin-top: 0;
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
          padding: 1.5rem;
        }

        .stat-number {
          font-size: clamp(2rem, 4vw, 3.5rem);
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

        /* Billing Toggle */
        .billing-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin: 2rem 0;
          position: relative;
          z-index: 2;
        }

        .billing-toggle span {
          color: var(--text-light);
          font-weight: 500;
          font-size: 1rem;
        }

        .billing-toggle .active {
          color: var(--primary-purple);
          font-weight: 700;
        }

        .toggle-switch {
          position: relative;
          width: 60px;
          height: 30px;
          background: var(--border-light);
          border-radius: 30px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .toggle-switch.active {
          background: var(--primary-purple);
        }

        .toggle-switch::after {
          content: '';
          position: absolute;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--white);
          top: 3px;
          left: 3px;
          transition: all 0.3s ease;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }

        .toggle-switch.active::after {
          left: 33px;
        }

        /* Industry Selector */
        .industry-selector {
          max-width: 1200px;
          margin: 3rem auto;
          padding: 0 2rem;
        }

        .industry-selector h3 {
          text-align: center;
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: var(--text-dark);
        }

        .industry-selector p {
          text-align: center;
          color: var(--text-light);
          margin-bottom: 2rem;
          font-size: 1rem;
        }

        .industry-tabs {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .industry-tab {
          padding: 0.75rem 1.5rem;
          border: 2px solid var(--border-light);
          background: var(--white);
          color: var(--text-light);
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .industry-tab:hover {
          border-color: var(--primary-purple);
          color: var(--primary-purple);
        }

        .industry-tab.active {
          background: linear-gradient(135deg, var(--primary-purple), var(--light-purple));
          color: var(--white);
          border-color: transparent;
        }

        /* Features Section */
        .features-section {
          padding: 6rem 2rem;
          background: var(--white);
        }

        .section-title {
          text-align: center;
          margin-bottom: 3rem;
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
          max-width: 700px;
          margin: 0 auto;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .feature-card {
          background: linear-gradient(135deg, rgba(245, 199, 0, 0.03) 0%, rgba(83, 50, 138, 0.03) 100%);
          padding: 2rem;
          border-radius: 16px;
          border: 1px solid var(--border-light);
          transition: all 0.3s ease;
          text-align: center;
        }

        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
          border-color: var(--primary-purple);
        }

        .feature-icon {
          width: 70px;
          height: 70px;
          margin: 0 auto 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--primary-purple), var(--light-purple));
          border-radius: 12px;
          color: var(--white);
        }

        .feature-icon svg {
          width: 40px;
          height: 40px;
        }

        .feature-card h3 {
          font-size: 1.2rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: var(--primary-purple);
        }

        .feature-card p {
          color: var(--text-light);
          font-size: 0.95rem;
          line-height: 1.6;
        }

        /* Pricing Cards */
        .pricing-section {
          padding: 4rem 2rem;
          background: var(--bg-light);
        }

        .pricing-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 2rem;
          margin-top: 3rem;
        }

        .pricing-card {
          background: var(--white);
          border: 2px solid var(--border-light);
          border-radius: 16px;
          padding: 2.5rem;
          position: relative;
          transition: all 0.3s ease;
        }

        .pricing-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 60px rgba(83, 50, 138, 0.15);
          border-color: var(--primary-purple);
        }

        .pricing-card.popular {
          border-color: var(--primary-gold);
          border-width: 3px;
          transform: scale(1.05);
        }

        @media (max-width: 968px) {
          .pricing-card.popular {
            transform: scale(1);
          }
        }

        .pricing-card.popular::before {
          content: 'MOST POPULAR';
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--primary-gold);
          color: var(--text-dark);
          padding: 0.4rem 1.5rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .pricing-card h3 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: var(--text-dark);
        }

        .pricing-card .subtitle {
          color: var(--text-light);
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
        }

        .pricing-card .price {
          margin: 1.5rem 0;
        }

        .pricing-card .price-amount {
          font-size: 3rem;
          font-weight: 800;
          color: var(--primary-purple);
          line-height: 1;
        }

        .pricing-card .price-period {
          color: var(--text-light);
          font-size: 0.9rem;
          margin-top: 0.5rem;
        }

        .pricing-card .price-savings {
          color: var(--primary-gold);
          font-size: 0.85rem;
          font-weight: 600;
          margin-top: 0.5rem;
        }

        .pricing-card .features {
          list-style: none;
          margin: 2rem 0;
        }

        .pricing-card .features li {
          padding: 0.75rem 0;
          color: var(--text-dark);
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          font-size: 0.95rem;
        }

        .pricing-card .features li::before {
          content: '✓';
          color: var(--primary-gold);
          font-weight: 700;
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .pricing-card .cta-button {
          width: 100%;
          padding: 1rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 1.5rem;
          text-decoration: none;
          display: block;
          text-align: center;
        }

        .pricing-card .cta-primary {
          background: linear-gradient(135deg, var(--primary-purple), var(--light-purple));
          color: var(--white);
          box-shadow: 0 4px 15px rgba(83, 50, 138, 0.2);
        }

        .pricing-card .cta-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(83, 50, 138, 0.3);
        }

        .pricing-card .cta-secondary {
          background: var(--white);
          color: var(--primary-purple);
          border: 2px solid var(--primary-purple);
        }

        .pricing-card .cta-secondary:hover {
          background: var(--primary-purple);
          color: var(--white);
        }

        /* Comparison Table */
        .comparison-section {
          padding: 4rem 2rem;
          background: var(--white);
        }

        .comparison-container {
          max-width: 1400px;
          margin: 0 auto;
          overflow-x: auto;
        }

        .comparison-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 2rem;
          background: var(--white);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }

        .comparison-table thead {
          background: linear-gradient(135deg, var(--primary-purple), var(--light-purple));
          color: var(--white);
        }

        .comparison-table th {
          padding: 1.25rem;
          text-align: left;
          font-weight: 700;
          font-size: 0.95rem;
        }

        .comparison-table th:first-child {
          width: 30%;
        }

        .comparison-table td {
          padding: 1.25rem;
          border-bottom: 1px solid var(--border-light);
          color: var(--text-dark);
        }

        .comparison-table tr:last-child td {
          border-bottom: none;
        }

        .comparison-table .check {
          color: var(--primary-gold);
          font-weight: 700;
          font-size: 1.2rem;
        }

        .comparison-table .cross {
          color: var(--text-light-2);
          font-weight: 700;
        }

        .comparison-table .highlight {
          background: rgba(245, 199, 0, 0.1);
          font-weight: 600;
        }

        /* Testimonials */
        .testimonials-section {
          padding: 6rem 2rem;
          background: var(--bg-light);
        }

        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          max-width: 1200px;
          margin: 3rem auto 0;
        }

        .testimonial-card {
          background: var(--white);
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

        .testimonial-role {
          font-size: 0.85rem;
          color: var(--text-light-2);
          font-style: italic;
        }

        /* FAQ Section */
        .faq-section {
          padding: 4rem 2rem;
          background: var(--white);
        }

        .faq-container {
          max-width: 900px;
          margin: 0 auto;
        }

        .faq-item {
          background: var(--white);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          margin-bottom: 1rem;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .faq-item:hover {
          border-color: var(--primary-purple);
        }

        .faq-question {
          padding: 1.5rem;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
          color: var(--text-dark);
          transition: all 0.3s ease;
        }

        .faq-question:hover {
          color: var(--primary-purple);
        }

        .faq-answer {
          padding: 0 1.5rem;
          max-height: 0;
          overflow: hidden;
          transition: all 0.3s ease;
          color: var(--text-light);
          line-height: 1.7;
        }

        .faq-item.active .faq-answer {
          padding: 0 1.5rem 1.5rem;
          max-height: 500px;
        }

        .faq-toggle {
          font-size: 1.5rem;
          color: var(--primary-purple);
          transition: transform 0.3s ease;
        }

        .faq-item.active .faq-toggle {
          transform: rotate(180deg);
        }

        /* Trust Section */
        .trust-section {
          padding: 4rem 2rem;
          background: var(--bg-light);
          text-align: center;
        }

        .trust-badges {
          display: flex;
          justify-content: center;
          gap: 3rem;
          flex-wrap: wrap;
          margin-top: 2rem;
        }

        .trust-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .trust-badge svg {
          width: 60px;
          height: 60px;
          color: var(--primary-purple);
        }

        .trust-badge span {
          font-size: 0.9rem;
          color: var(--text-light);
          font-weight: 500;
        }

        /* Final CTA */
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

        /* Footer */
        footer {
          background: var(--text-dark);
          color: var(--white);
          padding: 4rem 2rem 2rem;
        }

        .footer-content {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 3rem;
          margin-bottom: 3rem;
        }

        .footer-section h4 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: var(--primary-gold);
        }

        .footer-section ul {
          list-style: none;
        }

        .footer-section li {
          margin-bottom: 0.75rem;
        }

        .footer-section a {
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }

        .footer-section a:hover {
          color: var(--primary-gold);
        }

        .footer-bottom {
          text-align: center;
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.85rem;
        }

        /* Scroll Reveal */
        .scroll-reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }

        .scroll-reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Responsive */
        @media (max-width: 968px) {
          .nav-links {
            display: none;
          }

          .menu-toggle {
            display: block;
          }

          .pricing-grid {
            grid-template-columns: 1fr;
          }

          .testimonials-grid {
            grid-template-columns: 1fr;
          }

          .comparison-table {
            font-size: 0.85rem;
          }

          .comparison-table th,
          .comparison-table td {
            padding: 0.75rem;
          }
        }

        @media (max-width: 640px) {
          .pricing-hero {
            padding: 4rem 1rem 3rem;
          }

          .pricing-section,
          .comparison-section,
          .faq-section,
          .features-section {
            padding: 3rem 1rem;
          }

          .industry-tabs {
            gap: 0.5rem;
          }

          .industry-tab {
            padding: 0.6rem 1rem;
            font-size: 0.85rem;
          }
        }
      `}</style>

      {/* Header */}
      <header>
        <nav>
          <Link href="/" className="logo">
            <span style={{ color: 'var(--primary-purple)' }}>Pay</span>
            <span style={{ color: 'var(--primary-gold)' }}>Aid</span>
          </Link>
          <ul className="nav-links">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/features">Features</Link></li>
            <li><Link href="/pricing">Pricing</Link></li>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
          <Link href="/register" className="cta-header">Start Free Trial</Link>
          <button className="menu-toggle">☰</button>
        </nav>
        {/* Mobile Menu */}
        <div className="mobile-menu">
          <ul>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/features">Features</Link></li>
            <li><Link href="/pricing">Pricing</Link></li>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/contact">Contact</Link></li>
            <li><Link href="/register" className="cta-header">Start Free Trial</Link></li>
          </ul>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pricing-hero">
        <h1>
          Pricing That <span className="hero-highlight">Scales With You</span>
        </h1>
        <p>
          No surprises. No hidden fees. No lock-in contracts. Get all the marketing tools you need to manage and grow your business in one platform.
        </p>

        {/* Billing Toggle */}
        <div className="billing-toggle">
          <span className={billingCycle === 'monthly' ? 'active' : ''}>Monthly</span>
          <div
            className={`toggle-switch ${billingCycle === 'annual' ? 'active' : ''}`}
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
          />
          <span className={billingCycle === 'annual' ? 'active' : ''}>
            Annual <span style={{ color: 'var(--primary-gold)', fontSize: '0.85rem' }}>(Save 16%)</span>
          </span>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-item scroll-reveal">
            <div className="stat-number">500+</div>
            <div className="stat-label">Indian Businesses</div>
          </div>
          <div className="stat-item scroll-reveal">
            <div className="stat-number">40%</div>
            <div className="stat-label">Faster Setup</div>
          </div>
          <div className="stat-item scroll-reveal">
            <div className="stat-number">₹50k</div>
            <div className="stat-label">Avg Savings/Customer</div>
          </div>
          <div className="stat-item scroll-reveal">
            <div className="stat-number">95%</div>
            <div className="stat-label">Customer Satisfaction</div>
          </div>
        </div>
      </section>

      {/* Industry Selector */}
      <section className="industry-selector">
        <h3>Select Your Industry</h3>
        <p>Pricing adjusts based on industry complexity. Switch industries anytime with the same account.</p>
        <div className="industry-tabs">
          {Object.keys(industryPricing).map((industry) => (
            <button
              key={industry}
              className={`industry-tab ${selectedIndustry === industry ? 'active' : ''}`}
              onClick={() => setSelectedIndustry(industry)}
            >
              {industry.charAt(0).toUpperCase() + industry.slice(1)}
            </button>
          ))}
        </div>
        {currentPricing.description && (
          <p style={{ textAlign: 'center', color: 'var(--text-light)', marginTop: '1rem', fontSize: '0.9rem', fontStyle: 'italic' }}>
            {currentPricing.description}
          </p>
        )}
      </section>

      {/* Core Features Section */}
      <section className="features-section">
        <div className="section-title">
          <h2>Everything You Need, All in One Place</h2>
          <p>From lead capture, to sales and post-purchase, you can manage your business all in one place</p>
        </div>
        <div className="features-grid">
          <div className="feature-card scroll-reveal">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3>Unlimited Contacts</h3>
            <p>Don't pay extra every month just for having a successful business or big mailing list! Have as many contacts as you need without having to pay more.</p>
          </div>
          <div className="feature-card scroll-reveal">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <h3>Increase Email Deliverability</h3>
            <p>Use your own sub-domain to ensure your emails are hitting inboxes so they'll be seen by your customers.</p>
          </div>
          <div className="feature-card scroll-reveal">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3>Consolidated Communication</h3>
            <p>Messenger, email, SMS and web-chat conversations all appear in one place - so you can see your communication with each contact all in one place.</p>
          </div>
          <div className="feature-card scroll-reveal">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <h3>Reputation Manager</h3>
            <p>Manage your reputation via Facebook and Google Reviews including requesting and responding to reviews and disputing suspect reviews.</p>
          </div>
          <div className="feature-card scroll-reveal">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <h3>Post Directly to Social Platforms</h3>
            <p>With the built-in Social Planner, you can post or schedule your social media content directly to Facebook, Google, Instagram, LinkedIn, Twitter or TikTok.</p>
          </div>
          <div className="feature-card scroll-reveal">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h3>Schedule Appointments</h3>
            <p>Use built-in calendars to book appointments for your leads and customers. Calendars sync directly with Google and Outlook calendars for seamless scheduling.</p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pricing-section">
        <div className="pricing-container">
          <div className="section-title">
            <h2>Choose Your Plan</h2>
            <p>All plans include 14-day free trial. No credit card required.</p>
          </div>

          <div className="pricing-grid">
            {/* Startup Tier */}
            <div className="pricing-card scroll-reveal">
              <h3>Startup</h3>
              <p className="subtitle">Everything to get started</p>
              <div className="price">
                <div className="price-amount">
                  ₹{billingCycle === 'monthly' ? pricing.startup.monthly.toLocaleString() : Math.round(pricing.startup.annual / 12).toLocaleString()}
                </div>
                <div className="price-period">
                  {billingCycle === 'monthly' ? '/month' : '/month (billed annually)'}
                </div>
                {billingCycle === 'annual' && (
                  <div className="price-savings">Save ₹{pricing.startup.savings.toLocaleString()}/month</div>
                )}
              </div>
              <ul className="features">
                <li>3 team members</li>
                <li>500 contacts</li>
                <li>5 core modules (CRM, Basic Accounting, Communication, Inventory, Reports)</li>
                <li>Basic AI co-founder (500 API calls/month)</li>
                <li>Email + WhatsApp support (24-48 hours)</li>
                <li>Industry templates (1 industry)</li>
              </ul>
              <Link href="/register" className="cta-button cta-secondary">Start Free Trial</Link>
            </div>

            {/* Professional Tier */}
            <div className="pricing-card popular scroll-reveal">
              <h3>Professional</h3>
              <p className="subtitle">Everything to scale</p>
              <div className="price">
                <div className="price-amount">
                  ₹{billingCycle === 'monthly' ? pricing.professional.monthly.toLocaleString() : Math.round(pricing.professional.annual / 12).toLocaleString()}
                </div>
                <div className="price-period">
                  {billingCycle === 'monthly' ? '/month' : '/month (billed annually)'}
                </div>
                {billingCycle === 'annual' && (
                  <div className="price-savings">Save ₹{pricing.professional.savings.toLocaleString()}/month</div>
                )}
              </div>
              <ul className="features">
                <li>Unlimited team members</li>
                <li>Unlimited contacts</li>
                <li>All 9 modules (everything)</li>
                <li>Advanced AI co-founder (unlimited API calls)</li>
                <li>Priority support (4-hour response)</li>
                <li>All industry templates</li>
                <li>Quarterly strategy calls</li>
                <li>Unlimited integrations</li>
              </ul>
              <Link href="/register" className="cta-button cta-primary">Start Free Trial</Link>
            </div>

            {/* Enterprise Tier */}
            <div className="pricing-card scroll-reveal">
              <h3>Enterprise</h3>
              <p className="subtitle">Everything, customized</p>
              <div className="price">
                <div className="price-amount">Custom</div>
                <div className="price-period">Starting from ₹49,999/month</div>
              </div>
              <ul className="features">
                <li>Everything in Professional</li>
                <li>Custom modules</li>
                <li>Dedicated account manager</li>
                <li>Custom development</li>
                <li>24/7 phone support (30 min response)</li>
                <li>99.9% SLA guarantee</li>
                <li>White-label option</li>
                <li>Executive dashboards</li>
              </ul>
              <Link href="/contact" className="cta-button cta-secondary">Contact Sales</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="section-title">
          <h2>Our Customers Love What We Do</h2>
          <p>Hear from businesses transforming their operations</p>
        </div>
        <div className="testimonials-grid">
          <div className="testimonial-card scroll-reveal">
            <div className="stars">★★★★★</div>
            <p className="testimonial-text">
              "Running a restaurant chain was already hard. What made it harder? Juggling 5–6 different tools just to keep operations aligned. This platform changed everything. We now manage orders, payments, and staff across all locations from one dashboard. Saved us ₹18,000 per month."
            </p>
            <p className="testimonial-role">Restaurant Owner, Mumbai</p>
          </div>
          <div className="testimonial-card scroll-reveal">
            <div className="stars">★★★★★</div>
            <p className="testimonial-text">
              "As a growing retail business, managing our remote team was chaotic. We were juggling multiple tools, and everything felt disconnected. This platform creates a unified experience—and it's been a total game changer. Real-time visibility keeps teams aligned instantly."
            </p>
            <p className="testimonial-role">Retail Store Manager, Delhi</p>
          </div>
          <div className="testimonial-card scroll-reveal">
            <div className="stars">★★★★★</div>
            <p className="testimonial-text">
              "The AI co-founder feature turns every conversation into execution. It captures insights, suggests actions, and helps execute—turning every discussion into business growth. It feels like having a strategic partner on our team every day."
            </p>
            <p className="testimonial-role">Service Business Owner, Bangalore</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="faq-container">
          <div className="section-title">
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about our pricing</p>
          </div>

          <div style={{ marginTop: '2rem' }}>
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`faq-item ${openFaq === index ? 'active' : ''}`}
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
              >
                <div className="faq-question">
                  <span>{faq.q}</span>
                  <span className="faq-toggle">▼</span>
                </div>
                <div className="faq-answer">{faq.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="trust-section">
        <h2 className="section-title" style={{ marginBottom: '0' }}>
          Trusted & Secure
        </h2>
        <div className="trust-badges">
          <div className="trust-badge scroll-reveal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>SOC 2 Type II Compliant</span>
          </div>
          <div className="trust-badge scroll-reveal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4" />
              <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3" />
              <path d="M3 12c1 0 3-1 3-3S4 6 3 6 0 7 0 9s2 3 3 3" />
            </svg>
            <span>ISO 27001 Certified</span>
          </div>
          <div className="trust-badge scroll-reveal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
            <span>Data in India</span>
          </div>
          <div className="trust-badge scroll-reveal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span>Bank-Level Encryption</span>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <h2>Ready to Transform Your Business?</h2>
        <p>Take the platform for a test drive and discover how this powerful program can help your business increase revenue, save time and save money.</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2rem' }}>
          <Link href="/register" className="cta-button-large">Start 14-Day FREE Trial</Link>
        </div>
        <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.9 }}>No credit card required to start trial.</p>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-content">
          <div className="footer-section">
            <h4>Product</h4>
            <ul>
              <li><Link href="/features">Features</Link></li>
              <li><Link href="/pricing">Pricing</Link></li>
              <li><Link href="/app-store">App Store</Link></li>
              <li><Link href="/integrations">Integrations</Link></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Company</h4>
            <ul>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/careers">Careers</Link></li>
              <li><Link href="/blog">Blog</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Resources</h4>
            <ul>
              <li><Link href="/help">Help Center</Link></li>
              <li><Link href="/security">Security</Link></li>
              <li><Link href="/compliance">Compliance</Link></li>
              <li><Link href="/privacy-policy">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service">Terms of Service</Link></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Support</h4>
            <ul>
              <li><Link href="/contact">Contact Support</Link></li>
              <li><Link href="/help">Documentation</Link></li>
              <li><Link href="/api-docs">API Docs</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 PayAid. All rights reserved.</p>
        </div>
      </footer>
    </>
  )
}
