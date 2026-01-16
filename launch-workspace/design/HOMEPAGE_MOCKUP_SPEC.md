# 🎨 Homepage Mockup Specifications

**For Design Lead - Days 4-5**

---

## 📐 COMPLETE SECTION BREAKDOWN

### Section 1: Hero Section

**Layout:**
```
┌─────────────────────────────────────────┐
│                                         │
│      [Logo]  Nav Links  [CTA Button]   │
│                                         │
│         Trusted by 500+ Indian          │
│            businesses                   │
│                                         │
│      Your AI learns your industry       │
│                                         │
│    [Start Free Trial]  [See Industry]   │
│                                         │
│         [Hero Image/Video]              │
│                                         │
└─────────────────────────────────────────┘
```

**Specifications:**
- Full-width section
- Min-height: 600px (desktop), 500px (mobile)
- Centered content
- Background: Gradient (blue-50 to white)
- Headline: 48px, bold, center
- Subheadline: 24px, center, gray-600
- Primary CTA: Large button, gold (#D97706)
- Secondary CTA: Text link, blue (#1E3A8A)

---

### Section 2: Social Proof

**Layout:**
```
┌─────────────────────────────────────────┐
│                                         │
│    ⚡ 40% Faster    💰 ₹50k Savings     │
│                                         │
│    ⭐ 95% Satisfaction                 │
│                                         │
└─────────────────────────────────────────┘
```

**Specifications:**
- Background: Light gray (#FAFAF9)
- 3 columns (desktop), stack (mobile)
- Icon: 48px
- Number: 36px, bold
- Text: 16px, gray-600
- Padding: 80px vertical, 40px horizontal

---

### Section 3: Core Features

**Layout:**
```
┌─────────────────────────────────────────┐
│   Everything you need to run your       │
│            business                     │
│                                         │
│  [Sell]    [Manage]    [Account]       │
│  [Market]   [Analytics]  [Team]        │
│                                         │
└─────────────────────────────────────────┘
```

**Specifications:**
- Grid: 3 columns (desktop), 2 columns (mobile)
- Card size: 300px × 250px
- Icon: 64px, centered
- Title: 20px, bold
- Description: 16px, gray-600
- Hover: Shadow, scale 1.05
- Gap: 24px

---

### Section 4: Industry Selector

**Layout:**
```
┌─────────────────────────────────────────┐
│      Built for your industry            │
│                                         │
│  [Restaurant] [Retail] [Service] ...   │
│                                         │
│  [Selected Industry Content]            │
│  - Features                             │
│  - Pricing Preview                      │
│                                         │
└─────────────────────────────────────────┘
```

**Specifications:**
- Tabs: Horizontal scroll (mobile)
- Active tab: Gold underline, bold
- Content area: 800px max-width
- Smooth transition: 0.3s ease
- Pricing preview: Highlighted box

---

### Section 5: Competitor Comparison

**Layout:**
```
┌─────────────────────────────────────────┐
│         Why PayAid Wins                 │
│                                         │
│  Feature    PayAid  Wetroo  Zoho ...   │
│  ────────────────────────────────────  │
│  Modules    ✓ 34    ✗ 1     ✓ 50       │
│  AI         ✓ Yes   ✗ No    ✗ No       │
│  Price      ₹7.9k   ₹3-5k   ₹12k+      │
│                                         │
└─────────────────────────────────────────┘
```

**Specifications:**
- Table: Clean, scannable
- PayAid column: Highlighted (gold background)
- Checkmarks: Green (#10B981)
- X marks: Red (#EF4444)
- Mobile: Horizontal scroll or accordion

---

### Section 6: Customer Stories

**Layout:**
```
┌─────────────────────────────────────────┐
│      Trusted by Indian Businesses       │
│                                         │
│  [←]  [Case Study 1]  [Case Study 2]  [→]│
│                                         │
│  "PayAid saved us ₹50k/year"           │
│  - Company Name, Industry              │
│                                         │
└─────────────────────────────────────────┘
```

**Specifications:**
- Carousel: 3-5 slides
- Card: 400px × 500px
- Photo: 200px × 200px, rounded
- Quote: 18px, italic
- Company: 16px, bold
- Navigation: Arrow buttons

---

### Section 7: Pricing

**Layout:**
```
┌─────────────────────────────────────────┐
│    Pricing That Scales With You         │
│                                         │
│    [Monthly] ←→ [Annual -16%]          │
│                                         │
│  [Startup]  [Professional⭐] [Enterprise]│
│   ₹7,999     ₹15,999      Custom       │
│                                         │
│  [Features]  [Features]   [Features]    │
│  [CTA]       [CTA]        [CTA]        │
│                                         │
└─────────────────────────────────────────┘
```

**Specifications:**
- 3 cards: Equal width
- Professional: Highlighted (gold border, "Most Popular" badge)
- Toggle: Smooth animation
- Price: Large, bold (36px)
- Features: Checkmark list
- CTA: Full-width button on each card

---

### Section 8: FAQ

**Layout:**
```
┌─────────────────────────────────────────┐
│           Frequently Asked              │
│              Questions                  │
│                                         │
│  ▼ How long does setup take?           │
│    5 minutes to get started...          │
│                                         │
│  ▶ Can I switch industries?             │
│                                         │
│  ▶ What's included in free trial?      │
│                                         │
└─────────────────────────────────────────┘
```

**Specifications:**
- Accordion: Smooth expand/collapse
- Question: 18px, bold
- Answer: 16px, gray-600
- Icon: Chevron (rotates on expand)
- Max-width: 800px, centered

---

### Section 9: Footer

**Layout:**
```
┌─────────────────────────────────────────┐
│  [Logo]  [Links]  [Newsletter]         │
│                                         │
│  Trust Badges: SOC 2, ISO 27001         │
│  "Data in India (no US servers)"        │
│                                         │
│  © 2026 PayAid. All rights reserved.    │
│                                         │
└─────────────────────────────────────────┘
```

**Specifications:**
- Background: Dark gray (#1F2937)
- Text: White
- Links: Gray-400, hover: white
- Newsletter: Input + button
- Trust badges: Prominent display

---

## 🎨 DESIGN TOKENS

### Colors
```css
Primary Blue: #1E3A8A
Secondary Gold: #D97706
Accent Green: #10B981
Text Primary: #1F2937
Text Secondary: #6B7280
Background Light: #FAFAF9
Border Light: #E5E7EB
White: #FFFFFF
```

### Typography
```css
Headline: 48px, bold, Inter
Subheadline: 24px, medium, Inter
Body: 16px, regular, Inter
Small: 14px, regular, Inter
Button: 18px, semibold, Inter
```

### Spacing
```css
Section Padding: 80px vertical (desktop), 40px (mobile)
Card Gap: 24px
Element Gap: 16px
Container Max-width: 1280px
```

---

## 📱 RESPONSIVE BREAKPOINTS

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

**Mobile Adjustments:**
- Stack all sections vertically
- Full-width CTAs
- Simplified navigation (hamburger menu)
- Horizontal scroll for tables
- Accordion for FAQ

---

## ✅ DELIVERABLES CHECKLIST

- [ ] Hero section mockup (desktop + mobile)
- [ ] Social proof section
- [ ] Features section (6 cards)
- [ ] Industry selector (all 6 industries)
- [ ] Competitor comparison table
- [ ] Customer stories carousel
- [ ] Pricing section (3 tiers)
- [ ] FAQ accordion
- [ ] Footer
- [ ] Design system document
- [ ] Figma file shared

---

**Status:** Ready for Design  
**Owner:** Design Lead  
**Deadline:** End of Day 5

