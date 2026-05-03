# PayAid Landing Page - Ready-to-Build HTML/Next.js Code

## Quick Copy-Paste Implementation Guide

Below is complete, production-ready code that you can give to your frontend team or use with Cursor.

---

## 📝 Complete HTML Structure (Next.js Ready)

```jsx
// app/page.tsx or pages/index.tsx
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  const [activeDropdown, setActiveDropdown] = useState(null);

  return (
    <div className="min-h-screen bg-white">
      {/* HEADER & NAVIGATION */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* Logo */}
          <div className="text-2xl font-bold">
            <span className="text-[#53328A]">Pay</span>
            <span className="text-[#F5C700]">Aid</span>
          </div>

          {/* Navigation Menu */}
          <div className="hidden md:flex gap-8">
            {/* Products Dropdown */}
            <div className="relative group">
              <button className="text-[#414143] hover:text-[#53328A] font-medium">
                Products
              </button>
              <div className="absolute left-0 mt-0 w-48 bg-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all">
                <a href="#crm" className="block px-4 py-2 hover:bg-gray-100">CRM</a>
                <a href="#invoicing" className="block px-4 py-2 hover:bg-gray-100">Invoicing</a>
                <a href="#accounting" className="block px-4 py-2 hover:bg-gray-100">Accounting</a>
                <a href="#hr" className="block px-4 py-2 hover:bg-gray-100">HR</a>
                <a href="#whatsapp" className="block px-4 py-2 hover:bg-gray-100">WhatsApp</a>
                <a href="#analytics" className="block px-4 py-2 hover:bg-gray-100">Analytics</a>
              </div>
            </div>

            {/* Solutions Dropdown */}
            <div className="relative group">
              <button className="text-[#414143] hover:text-[#53328A] font-medium">
                Solutions
              </button>
              <div className="absolute left-0 mt-0 w-48 bg-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all">
                <a href="#" className="block px-4 py-2 hover:bg-gray-100">For Small Business</a>
                <a href="#" className="block px-4 py-2 hover:bg-gray-100">For E-commerce</a>
                <a href="#" className="block px-4 py-2 hover:bg-gray-100">For Startups</a>
                <a href="#" className="block px-4 py-2 hover:bg-gray-100">For Agencies</a>
                <a href="#" className="block px-4 py-2 hover:bg-gray-100">For Enterprises</a>
              </div>
            </div>

            <a href="#pricing" className="text-[#414143] hover:text-[#53328A] font-medium">Pricing</a>
            <a href="#enterprise" className="text-[#414143] hover:text-[#53328A] font-medium">Enterprise</a>

            {/* Resources Dropdown */}
            <div className="relative group">
              <button className="text-[#414143] hover:text-[#53328A] font-medium">
                Resources
              </button>
              <div className="absolute left-0 mt-0 w-48 bg-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all">
                <a href="#" className="block px-4 py-2 hover:bg-gray-100">Documentation</a>
                <a href="#" className="block px-4 py-2 hover:bg-gray-100">Video Tutorials</a>
                <a href="#" className="block px-4 py-2 hover:bg-gray-100">Blog</a>
                <a href="#" className="block px-4 py-2 hover:bg-gray-100">Case Studies</a>
                <a href="#" className="block px-4 py-2 hover:bg-gray-100">Community</a>
              </div>
            </div>
          </div>

          {/* Sign In & CTA */}
          <div className="flex gap-4 items-center">
            <a href="/login" className="text-[#414143] hover:text-[#53328A] font-medium">
              Sign In
            </a>
            <button className="bg-[#F5C700] hover:bg-[#E0B200] text-white px-6 py-2 rounded-lg font-medium transition-all">
              Start Free Trial
            </button>
          </div>
        </nav>
      </header>

      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-br from-[#53328A] to-[#3F1F62] text-white py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Run Your Entire Business on PayAid
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto">
            One unified platform. Six powerful modules. Built for India's growing businesses.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button className="bg-[#F5C700] hover:bg-[#E0B200] text-white px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105">
              Start Free Trial
            </button>
            <button className="border-2 border-white text-white hover:bg-white hover:text-[#53328A] px-8 py-4 rounded-lg font-bold text-lg transition-all">
              Watch Demo
            </button>
          </div>

          <p className="text-gray-300 text-sm md:text-base">
            ✓ 14-day free trial &nbsp; ✓ No credit card required &nbsp; ✓ Setup in minutes
          </p>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-gray-600 font-medium mb-8">
            Trusted by 10,000+ Indian Businesses
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 mb-8">
            {['Company 1', 'Company 2', 'Company 3', 'Company 4', 'Company 5'].map((company, i) => (
              <div key={i} className="text-gray-400 font-semibold text-sm">
                {company}
              </div>
            ))}
          </div>
          <p className="text-center text-gray-600">
            ⭐⭐⭐⭐⭐ 4.8/5 on G2 | 5,000+ Reviews
          </p>
        </div>
      </section>

      {/* WHY PAYAID SECTION */}
      <section className="py-20 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-[#53328A] mb-16">
            Why Choose PayAid?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '⚡',
                title: 'Faster',
                desc: '2x Speed vs Competitors - Pages load in <1 second'
              },
              {
                icon: '💰',
                title: 'Cheaper',
                desc: '50% cheaper than Zoho - Starting ₹2,499/month'
              },
              {
                icon: '💬',
                title: 'WhatsApp Native',
                desc: 'Send invoices via WhatsApp - Trusted by millions'
              },
              {
                icon: '🇮🇳',
                title: 'India-First',
                desc: 'Built for Indian SMBs - Your payment expertise'
              },
              {
                icon: '🤖',
                title: 'AI-Powered',
                desc: 'Smart insights & automation - Automate workflows'
              },
              {
                icon: '✅',
                title: 'Easy Setup',
                desc: '30 minutes to live - No implementation needed'
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-8 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-all"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-[#53328A] mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODULES SHOWCASE */}
      <section className="py-20 md:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-[#53328A] mb-6">
            All the tools you need. In one place.
          </h2>
          <p className="text-center text-gray-600 mb-16 text-lg">
            Six powerful modules, working seamlessly together
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: 'CRM', icon: '🎯', desc: 'Manage contacts & deals' },
              { name: 'Invoicing', icon: '💰', desc: 'Create & track invoices' },
              { name: 'Accounting', icon: '📊', desc: 'Track finances & reports' },
              { name: 'HR', icon: '👥', desc: 'Manage employees & payroll' },
              { name: 'WhatsApp', icon: '💬', desc: 'Connect with customers' },
              { name: 'Analytics', icon: '📈', desc: 'Visualize your business' },
            ].map((module, i) => (
              <div
                key={i}
                className="bg-white p-8 rounded-lg hover:shadow-xl transition-all transform hover:-translate-y-2"
              >
                <div className="text-5xl mb-4">{module.icon}</div>
                <h3 className="text-2xl font-bold text-[#53328A] mb-2">{module.name}</h3>
                <p className="text-gray-600 mb-4">{module.desc}</p>
                <a href="#" className="text-[#F5C700] font-semibold hover:text-[#E0B200]">
                  Explore →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-20 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-[#53328A] mb-16">
            Simple, Transparent Pricing
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {[
              {
                name: 'Starter',
                price: '₹2,499',
                features: ['CRM', 'Invoicing', 'Basic Support'],
                cta: 'Start Free',
                popular: false
              },
              {
                name: 'Professional',
                price: '₹7,999',
                features: ['CRM', 'Invoicing', 'Accounting', 'Priority Support'],
                cta: 'Most Popular',
                popular: true
              },
              {
                name: 'Complete',
                price: '₹14,999',
                features: ['All 6 Modules', 'Premium Support', 'API Access'],
                cta: 'Upgrade Now',
                popular: false
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`rounded-lg p-8 relative ${
                  plan.popular
                    ? 'bg-[#53328A] text-white border-2 border-[#F5C700] transform scale-105'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-4 right-4 bg-[#F5C700] text-[#53328A] px-3 py-1 rounded-full text-sm font-bold">
                    🏆 Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold mb-6">
                  {plan.price}
                  <span className="text-lg">/month</span>
                </div>
                <ul className="mb-8 space-y-3">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center">
                      <span className="mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-3 rounded-lg font-bold transition-all ${
                    plan.popular
                      ? 'bg-[#F5C700] text-[#53328A] hover:bg-yellow-300'
                      : 'bg-[#F5C700] text-[#53328A] hover:bg-[#E0B200]'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-600">
            vs Zoho: You save ₹1,50,000/year
          </p>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 md:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-[#53328A] mb-16">
            What Our Customers Say
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "PayAid saved us 20 hours per week. The speed alone is worth it.",
                author: "Rajesh Kumar",
                title: "Founder, TechStart India",
                rating: 5
              },
              {
                quote: "Finally, a CRM built for India. WhatsApp integration is a game-changer.",
                author: "Priya Sharma",
                title: "Director, E-Commerce Venture",
                rating: 5
              },
              {
                quote: "Zoho was too complex. PayAid is intuitive, affordable, and just works.",
                author: "Amit Patel",
                title: "CEO, Manufacturing SMB",
                rating: 5
              },
            ].map((testimonial, i) => (
              <div key={i} className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-all">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <span key={j} className="text-[#F5C700] text-lg">★</span>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-bold text-[#53328A]">{testimonial.author}</p>
                  <p className="text-gray-600 text-sm">{testimonial.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="bg-gradient-to-r from-[#53328A] to-[#3F1F62] text-white py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Modernize Your Business?
          </h2>
          <p className="text-xl mb-8 text-gray-200">
            Start your free trial today. No credit card required.
          </p>
          <button className="bg-[#F5C700] hover:bg-[#E0B200] text-white px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105">
            Start Your Free Trial
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#414143] text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white">CRM</a></li>
                <li><a href="#" className="hover:text-white">Invoicing</a></li>
                <li><a href="#" className="hover:text-white">Accounting</a></li>
                <li><a href="#" className="hover:text-white">HR</a></li>
                <li><a href="#" className="hover:text-white">WhatsApp</a></li>
                <li><a href="#" className="hover:text-white">Analytics</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Press</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Docs</a></li>
                <li><a href="#" className="hover:text-white">Community</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Connect</h4>
              <div className="flex gap-4 text-gray-300">
                <a href="#" className="hover:text-white text-xl">f</a>
                <a href="#" className="hover:text-white text-xl">𝕏</a>
                <a href="#" className="hover:text-white text-xl">in</a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-600 pt-8 text-gray-400 text-sm">
            <p>© 2025 PayAid Payments. All rights reserved.</p>
            <p className="mt-2">
              <a href="#" className="hover:text-white">Privacy Policy</a> | 
              <a href="#" className="hover:text-white"> Terms of Service</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
```

---

## 🎨 Tailwind CSS Configuration

```js
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        payaid: {
          gold: '#F5C700',
          purple: '#53328A',
          dark: '#3F1F62',
          charcoal: '#414143',
        },
      },
      fontFamily: {
        sans: ['Geist', 'Inter', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

---

## 📱 Mobile Menu (Optional Enhancement)

If you want a hamburger menu for mobile:

```jsx
// Add to header component
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

// Toggle button (add to mobile view)
<button
  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
  className="md:hidden text-[#53328A]"
>
  ☰
</button>

// Mobile menu overlay
{mobileMenuOpen && (
  <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b">
    <a href="#" className="block px-4 py-2">Products</a>
    <a href="#" className="block px-4 py-2">Solutions</a>
    <a href="#" className="block px-4 py-2">Pricing</a>
    <a href="#" className="block px-4 py-2">Enterprise</a>
    <a href="#" className="block px-4 py-2">Resources</a>
  </div>
)}
```

---

## 🚀 Quick Implementation Steps

1. **Create Next.js project:**
   ```bash
   npx create-next-app@latest payaid-landing --tailwind
   ```

2. **Replace page.tsx with code above**

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Visit:** http://localhost:3000

6. **Customize:**
   - Replace company logos
   - Add real testimonials
   - Connect CTA buttons to signup
   - Add analytics tracking
   - Set up email collection

---

## 💡 Cursor Prompts to Use

Give this to Cursor AI for further customization:

**Prompt 1:** "Create a sticky header with dropdown menus for Products, Solutions, and Resources. Use brand colors gold (#F5C700) and purple (#53328A)."

**Prompt 2:** "Add smooth scroll animations to sections as they enter viewport. Use Framer Motion for animations."

**Prompt 3:** "Create a comparison table section showing PayAid vs Zoho with 8 key features."

**Prompt 4:** "Add a FAQ section with 10 common questions about PayAid, with collapsible answers."

**Prompt 5:** "Create an email signup form in the footer that collects name, email, and company size."

---

This complete code is ready to go. Just copy-paste into your Next.js project and customize!
