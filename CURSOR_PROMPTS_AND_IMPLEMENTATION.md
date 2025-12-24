# PayAid Landing Page - Cursor AI Prompts & Design System
## Complete Instructions for Your Design & Dev Team

---

## 🎯 Quick Overview for Cursor

If you're using Cursor AI to build this, here are the exact prompts to give it:

---

## 💬 CURSOR PROMPTS (Use These Exactly)

### PROMPT 1: Create the Complete Landing Page
```
Create a professional SaaS landing page for PayAid using Next.js and Tailwind CSS.

Requirements:
- Brand colors: Gold (#F5C700), Purple (#53328A), Charcoal Gray (#414143)
- Sticky header with dropdown menus for Products, Solutions, Resources
- Hero section with "Run Your Entire Business on PayAid" headline
- Social proof section with customer logos and 4.8/5 rating
- "Why Choose PayAid?" section with 6 benefit cards (Faster, Cheaper, WhatsApp, India-First, AI-Powered, Easy Setup)
- Modules showcase with all 6 modules (CRM, Invoicing, Accounting, HR, WhatsApp, Analytics)
- Pricing section with 3 tiers (Starter ₹2,499, Professional ₹7,999, Complete ₹14,999)
- Testimonials section with 3 customer reviews
- CTA section with "Start Free Trial" button
- Footer with product links, company links, resources, and social icons
- Mobile responsive design
- Smooth hover effects on cards and buttons

Use Tailwind CSS for styling. Make it look like Zoho.com but with PayAid branding.
```

### PROMPT 2: Add Animations & Transitions
```
Add smooth animations to the PayAid landing page:
- Fade-in animations for sections as they scroll into view
- Hover effects on cards (lift up, shadow increase)
- Button animations (scale slightly on hover)
- Dropdown menu animations (fade in smoothly)
- Testimonial cards slide in from sides
- Use Framer Motion library for animations
- Keep animations professional and subtle (duration: 200-300ms)
```

### PROMPT 3: Add Comparison Table Section
```
Create a comparison section showing "PayAid vs Zoho" with these dimensions:
- Speed (UI Load): PayAid <1 sec ✅ vs Zoho 3-5 sec ❌
- Pricing: PayAid ₹2,499+ ✅ vs Zoho ₹8,000+ ❌
- Modular: PayAid Yes ✅ vs Zoho Partial ❌
- WhatsApp Native: PayAid Yes ✅ vs Zoho Add-on ❌
- Setup Time: PayAid 30 min ✅ vs Zoho 8-12 weeks ❌
- India Focus: PayAid 100% ✅ vs Zoho Global ❌
- Mobile UX: PayAid Modern ✅ vs Zoho Outdated ❌
- Free Trial: PayAid 14 days ✅ vs Zoho Limited ❌

Make it look like a professional comparison table. Highlight PayAid wins in gold color.
```

### PROMPT 4: Add FAQ Section
```
Create a collapsible FAQ section with 10 common questions:
1. What's the difference between the plans?
2. Can I start with Starter and upgrade later?
3. Is there a setup fee?
4. Do you offer discounts for annual billing?
5. What payment methods do you accept?
6. Can I export my data if I leave?
7. What's your uptime guarantee?
8. Do you offer phone support?
9. Can I add more modules later?
10. Is there a contract lock-in?

Use collapsible accordion pattern. Answers should be 2-3 sentences. Style with purple headers and gold accents.
```

### PROMPT 5: Add Mobile Navigation
```
Create a mobile-friendly hamburger menu for the header. 

Requirements:
- Show hamburger icon (3 lines) on screens < 768px
- Hamburger menu should have all navigation items
- Dropdown menus should expand inline (no nested dropdowns)
- Mobile menu should overlay the page
- Add close button
- Smooth animations when opening/closing
```

### PROMPT 6: Add Form Integration
```
Create an email capture form for the landing page footer.

Fields:
- Name (required)
- Email (required)
- Company Name (optional)
- Company Size (dropdown: 1-10, 11-50, 51-200, 200+)
- Message (optional)

Requirements:
- Basic validation (email format)
- Success message after submit
- Send data to /api/lead-capture endpoint
- Honeypot field for spam prevention
- Style with gold button and purple accent
```

### PROMPT 7: Add Analytics Tracking
```
Add Google Analytics and Hotjar tracking to the landing page.

Track:
- Page views
- Button clicks (Start Free Trial, Watch Demo, Pricing CTAs)
- Section scroll depth
- Form submissions
- Video plays (if any)
- Time on page

Use gtag for Google Analytics v4. Add tracking IDs as environment variables.
```

### PROMPT 8: Add Social Proof Animations
```
Animate the customer logo section and testimonials:
- Customer logos fade in one by one
- Rating number counts up (e.g., 4.8)
- Testimonial cards appear with staggered delay
- Each card animates slightly differently
- Use Framer Motion
- Keep animations smooth and professional
```

---

## 📋 Design System Reference

### Colors
```
Primary: #53328A (Deep Purple)
Accent: #F5C700 (Gold)
Text: #414143 (Charcoal Gray)
Background: #FFFFFF (White)
Secondary: #F8F9FA (Light Gray)

Hover States:
- Gold hover: #E0B200
- Purple hover: #3F1F62
- Text hover: Underline + color change
```

### Typography
```
Headers (H1): 48-56px, Bold (700), Purple
Subheaders (H2): 32-40px, Semibold (600), Purple
Body Text: 14-16px, Regular (400), Charcoal
Button Text: 14-16px, Medium (500), White
```

### Spacing
```
Container padding: 60-80px (desktop), 20-40px (mobile)
Section gaps: 80-120px vertical
Card padding: 24-32px
Button height: 44-48px
```

---

## 🔧 Setup Instructions for Your Team

### For Frontend Developer:

1. **Create Next.js project:**
   ```bash
   npx create-next-app@latest payaid-website --typescript --tailwind
   ```

2. **Install dependencies:**
   ```bash
   npm install framer-motion react-icons
   ```

3. **Update tailwind.config.js:**
   ```js
   module.exports = {
     theme: {
       extend: {
         colors: {
           payaid: {
             gold: '#F5C700',
             purple: '#53328A',
             charcoal: '#414143',
           }
         }
       }
     }
   }
   ```

4. **Create components:**
   - Header.tsx (with dropdown menus)
   - HeroSection.tsx
   - SocialProof.tsx
   - FeaturesGrid.tsx
   - ModulesShowcase.tsx
   - PricingSection.tsx
   - ComparisonTable.tsx
   - Testimonials.tsx
   - FAQ.tsx
   - CTA.tsx
   - Footer.tsx

5. **Add to app/page.tsx:**
   ```tsx
   import Header from '@/components/Header'
   import HeroSection from '@/components/HeroSection'
   import SocialProof from '@/components/SocialProof'
   // ... import all components
   
   export default function Home() {
     return (
       <>
         <Header />
         <HeroSection />
         <SocialProof />
         {/* ... add all sections */}
       </>
     )
   }
   ```

6. **Run locally:**
   ```bash
   npm run dev
   # Visit http://localhost:3000
   ```

---

### For Designer:

1. **Create design in Figma:**
   - Create component library based on colors/typography above
   - Design all page sections
   - Create mobile/tablet/desktop versions
   - Get stakeholder approval

2. **Create design tokens:**
   - Export as JSON or CSS variables
   - Share with frontend team

3. **Create design specs:**
   - Document spacing (padding, margins)
   - Document font sizes
   - Document color usage
   - Document hover/active states

---

## 🎬 Animation Details

### Section Fade-In
```javascript
// On scroll into view
const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
}
```

### Card Hover
```javascript
// On card hover
scale: 1.02,
boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
transition: { duration: 0.2 }
```

### Button Hover
```javascript
// On button hover
scale: 1.05,
transition: { duration: 0.2 }
```

---

## 📱 Responsive Breakpoints

```
Mobile: < 768px
- Single column layouts
- Hamburger menu
- Larger font sizes (16px+)
- Vertical spacing: 40-60px

Tablet: 768px - 1024px
- 2-column grids
- Horizontal nav (collapsed)
- Vertical spacing: 60-80px

Desktop: > 1024px
- 3-6 column grids
- Full horizontal nav
- Vertical spacing: 80-120px
```

---

## ✅ QA Checklist

- [ ] All sections render correctly
- [ ] Responsive design works on mobile, tablet, desktop
- [ ] All links work (navigation, CTA, footer)
- [ ] Buttons have hover states
- [ ] Forms validate correctly
- [ ] Images load fast (optimized)
- [ ] Lighthouse score >90
- [ ] All color contrast meets WCAG AA
- [ ] Keyboard navigation works
- [ ] No console errors
- [ ] Analytics tracking works
- [ ] SEO meta tags present

---

## 🚀 Deployment

**Recommended Platform:** Vercel (since it's Next.js)

1. Push to GitHub
2. Connect to Vercel
3. Deploy automatically on push
4. Set environment variables for analytics

---

## 📞 Support

When using Cursor, you can also ask:
- "Fix the mobile layout for section X"
- "Make the animations more subtle"
- "Add dark mode support"
- "Improve the accessibility (WCAG)"
- "Optimize images for faster loading"
- "Add lazy loading for sections below fold"

---

## 💡 Key Tips for Your Team

1. **Start with structure first** - Get HTML layout right before styling
2. **Use Tailwind classes** - Don't write custom CSS
3. **Make it semantic** - Use proper HTML5 tags (section, header, footer, nav)
4. **Test on mobile first** - Design mobile-first, add desktop features
5. **Keep it simple** - Don't over-animate (professional tone)
6. **Measure performance** - Use Lighthouse to track scores
7. **Get feedback early** - Share with team before final polish

---

**Your landing page is ready to build. Copy the code, use the prompts, follow the checklist. You'll have a professional Zoho-quality website in 1-2 weeks!** 🚀