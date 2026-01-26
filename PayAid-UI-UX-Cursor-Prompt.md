# 🎨 PayAid CRM - UI/UX Excellence Prompt for Cursor
## Enterprise-Grade Design System Implementation Guide
**Version:** 1.0 (Final)  
**Last Updated:** January 25, 2026  
**Applies To:** All UI pages, dashboards, components, animations, charts, forms, and transitions

---

## 📌 MASTER RULE: DESIGN CONSISTENCY IS NON-NEGOTIABLE

**BEFORE CODING ANY UI COMPONENT:**
1. ✅ Check if this component already exists in the codebase
2. ✅ If exists: Copy the component file + adapt (DO NOT recreate)
3. ✅ If new: Follow design system strictly
4. ✅ NEVER deviate from color palette, typography, spacing, or animations
5. ✅ Every pixel must align to 8px grid
6. ✅ Every interaction must have smooth micro-animation (150ms ease-in-out)

---

## 🎨 PART 1: DESIGN SYSTEM (NON-NEGOTIABLE)

### 1.1 COLOR PALETTE (Fintech Professional)

```
PRIMARY COLORS:
├─ Deep Teal: #0F766E (Trust, stability, primary actions)
├─ Vibrant Blue: #0284C7 (Secondary actions, highlights)
└─ Accent Gold: #FBBF24 (Premium features, special status)

SEMANTIC COLORS:
├─ Success: #059669 (Approvals, positive actions, checkmarks)
├─ Alert: #D97706 (Warnings, attention-needed states)
├─ Error: #DC2626 (Critical issues, must-act, destructive actions)
└─ Info: #0284C7 (Informational only, no action required)

NEUTRAL SCALE (100 = lightest, 900 = darkest):
├─ Gray 50: #F9FAFB (Backgrounds, hover states)
├─ Gray 100: #F3F4F6 (Cards, panels)
├─ Gray 300: #D1D5DB (Borders, dividers, disabled states)
├─ Gray 600: #4B5563 (Secondary text)
├─ Gray 700: #374151 (Primary text)
├─ Gray 900: #111827 (Headings, dark text)
└─ White: #FFFFFF (Cards, modals, surface elements)

USAGE RULES:
├─ Primary color (#0F766E): Main CTAs, primary buttons, active states, links
├─ Secondary blue (#0284C7): Secondary actions, highlights, focus rings
├─ Success (#059669): Positive confirmations, approved badges, success messages
├─ Alert (#D97706): Warning badges, attention-needed flags, warning banners
├─ Error (#DC2626): Delete buttons, error messages, critical alerts
├─ Gray 50-100: Light backgrounds, hover states
├─ Gray 600-900: Text hierarchy (600=secondary, 700=primary, 900=headings)
└─ Gold (#FBBF24): Premium badges, special features, "new" labels
```

**Implementation in Tailwind:**
```javascript
// tailwind.config.js - Add custom colors
module.exports = {
  theme: {
    colors: {
      'teal-primary': '#0F766E',
      'blue-secondary': '#0284C7',
      'emerald-success': '#059669',
      'amber-alert': '#D97706',
      'red-error': '#DC2626',
      'gold-accent': '#FBBF24',
      'gray': {
        50: '#F9FAFB', 100: '#F3F4F6', 300: '#D1D5DB',
        600: '#4B5563', 700: '#374151', 900: '#111827'
      }
    }
  }
};
```

---

### 1.2 TYPOGRAPHY SYSTEM

```
FONT STACK:
├─ Display: Inter Display (Bold, 700 weight)
│  └─ Usage: Main headings, hero titles (32-48px)
├─ UI: Inter Regular (400/500/600 weights)
│  └─ Usage: Nav, buttons, labels, body text (14-18px)
└─ Data: IBM Plex Mono (400 weight)
   └─ Usage: Numbers, codes, data tables (14px)

HIERARCHY SCALE:
├─ Display Large: 48px / 700 weight / 1.2 line-height (Hero titles)
├─ Display Medium: 36px / 700 weight / 1.25 line-height (Page headings)
├─ Display Small: 32px / 700 weight / 1.3 line-height (Section headings)
├─ Heading 1 (H1): 28px / 700 weight / 1.4 line-height (Dashboard sections)
├─ Heading 2 (H2): 24px / 600 weight / 1.4 line-height (Subsections)
├─ Heading 3 (H3): 20px / 600 weight / 1.5 line-height (Card titles)
├─ Body Large: 18px / 400 weight / 1.6 line-height (Introductions, hero text)
├─ Body Regular: 16px / 400 weight / 1.6 line-height (Body content)
├─ Body Small: 14px / 400 weight / 1.5 line-height (Labels, descriptions)
├─ Caption: 12px / 400 weight / 1.5 line-height (Hints, helper text)
└─ Mono: 14px / 400 weight / 1.4 line-height (Code, numbers, data)

COLOR + WEIGHT STRATEGY:
├─ Primary Headings: Gray-900 (#111827) + 700 weight
├─ Secondary Text: Gray-600 (#4B5563) + 400 weight
├─ Links/Actions: Teal-Primary (#0F766E) + 600 weight
├─ Disabled/Muted: Gray-400 (#9CA3AF) + 400 weight
└─ Emphasis in body: Gray-900 (#111827) + 600 weight (semibold)

LETTER SPACING:
├─ Headings: -0.02em (tight)
├─ Body: 0 (normal)
├─ Caption: 0.01em (slight expansion)
└─ Mono: 0 (normal)

IMPLEMENTATION RULE:
✅ ALWAYS use Tailwind classes from this hierarchy
❌ NEVER use arbitrary font sizes (e.g., className="text-[23px]")
❌ NEVER mix font families in a single component
```

---

### 1.3 ICON DESIGN SYSTEM

**Professional Fintech Icons (24px Grid, 2px Stroke, Outline Style)**

```
MODULE ICONS:
├─ CRM: People network icon (3-4 connected circles, not generic contacts)
├─ Accounting: Balanced scale icon (two pans, balanced, fintech feel)
├─ Inventory: 3D boxes in perspective (diagonal view, not flat stack)
├─ Manufacturing: Gears + flow arrows (connected gears, not factory building)
├─ HR: Upward growth arrow through person silhouette
├─ Marketing: Megaphone + data chart combined (not bullhorn alone)
├─ Projects: Connected nodes or timeline (not basic checklist)
├─ eCommerce: Shopping bag with trending upward arrow
├─ Dashboard: Chart bars with sparkline overlay
├─ Settings: Gear with subtle rotation animation
├─ User: Single person outline (consistent with network icon)
├─ Search: Magnifying glass with query indicator
├─ Bell (Notifications): Bell with small dot indicator
├─ Menu: Three horizontal lines (hamburger)
├─ Close/X: Diagonal lines (bold, 2px stroke)
├─ Chevron: Angular arrow (up, down, left, right)
├─ Check: Single stroke checkmark (bold, 2px)
├─ Alert/Warning: Triangle with exclamation (2px stroke)
└─ Error: Circle with X (2px stroke)

ICON USAGE RULES:
├─ Size: Always use 24px for UI, 20px for dense tables, 32px for hero sections
├─ Stroke: Always 2px, no fill (outline style only)
├─ Color: Match semantic color (primary for actions, gray for neutral, red for errors)
├─ Spacing: Always 8px margin between icon + text
├─ Alignment: Center-align icon with text baseline
└─ Animation: Hover = subtle color change (50ms), no rotation unless loading

IMPLEMENTATION:
├─ Use Heroicons (v2 Outline) as base
├─ Customize module icons in SVG for distinctiveness
├─ Store custom icons in /public/icons/custom/
├─ Reference via <Icon name="crm" size={24} />
└─ Do NOT use emoji or generic icon packs

ACCESSIBILITY:
├─ Always pair icons with text labels in UI
├─ Use aria-label for icon-only buttons
├─ Test at 16px (smallest) and 32px (largest) for visibility
└─ Ensure 4.5:1 contrast ratio with background
```

---

### 1.4 LAYOUT & SPACING (8px GRID SYSTEM)

```
SPACING SCALE (8px BASE UNIT):
├─ xs: 4px (only for very dense, internal spacing)
├─ sm: 8px (padding, margin)
├─ md: 16px (component spacing)
├─ lg: 24px (section spacing)
├─ xl: 32px (large separations)
├─ 2xl: 48px (hero sections, major dividers)
└─ 3xl: 64px (page-level spacing)

PADDING DEFAULTS:
├─ Buttons: 10px (h) × 16px (h) [touch target: 44px min]
├─ Input fields: 12px (h) × 14px (h) [touch target: 44px min]
├─ Cards: 24px (interior padding)
├─ Modal/Dialog: 32px (interior padding)
├─ Page container: 32px (left/right), 24px (top/bottom)
└─ Section spacing: 32px (between major sections)

BORDER RADIUS:
├─ Small (xs): 4px (rare, only for very small elements)
├─ Cards: 8px (standard card corners)
├─ Buttons: 8px (standard button corners)
├─ Large containers: 12px (modals, panels)
├─ Badges/Pills: 20px (full border-radius for pill shapes)
└─ RULE: No radius > 16px (avoid overly rounded look)

SHADOWS (Subtle Depth):
├─ Elevation 0: No shadow (flat elements, background)
├─ Elevation 1: 0px 1px 2px rgba(0,0,0,0.05) (subtle, cards at rest)
├─ Elevation 2: 0px 4px 6px rgba(0,0,0,0.10) (hovered cards, dropdowns)
├─ Elevation 3: 0px 10px 15px rgba(0,0,0,0.15) (modals, focus)
├─ Elevation 4: 0px 20px 25px rgba(0,0,0,0.20) (floating actions, tooltips)
└─ RULE: No shadow > 4 (excessive shadows feel dated)

IMPLEMENTATION IN TAILWIND:
├─ margin: Use m-1 (4px), m-2 (8px), m-3 (12px), m-4 (16px), m-6 (24px), m-8 (32px)
├─ padding: Use p-2 (8px), p-3 (12px), p-4 (16px), p-6 (24px), p-8 (32px)
├─ rounded: Use rounded-lg (8px), rounded-xl (12px), rounded-full (pill)
├─ shadow: Use shadow-sm (1), shadow-md (2), shadow-lg (3)
└─ gap: Use gap-2 (8px), gap-3 (12px), gap-4 (16px), gap-6 (24px)
```

**Grid Layout Example:**
```html
<!-- Every page should use this structure -->
<div className="min-h-screen bg-gray-50">
  <!-- Top Navigation: 64px fixed height -->
  <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 shadow-sm z-40">
    {/* navbar content with 32px padding */}
  </nav>

  <!-- Main Content: Sidebar + Content -->
  <div className="flex pt-16">
    <!-- Sidebar: 280px width (or hidden on mobile) -->
    <aside className="w-70 hidden md:block bg-white border-r border-gray-200 fixed h-[calc(100vh-64px)]">
      {/* sidebar content with 24px padding */}
    </aside>

    <!-- Main Content: Flex-grow -->
    <main className="flex-1 md:ml-70 p-8 lg:p-12">
      {/* Grid columns with 24px gap */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Each card: 24px padding, 8px radius */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* content */}
        </div>
      </div>
    </main>
  </div>
</div>
```

---

### 1.5 COMPONENT LIBRARY (Stripe/Figma Grade)

**BUTTONS:**
```javascript
// Primary Button (High emphasis, main actions)
<button className="px-4 py-2.5 bg-teal-primary text-white rounded-lg font-semibold text-sm hover:bg-teal-700 active:bg-teal-800 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed">
  Action
</button>

// Secondary Button (Lower emphasis, secondary actions)
<button className="px-4 py-2.5 bg-gray-100 text-gray-900 rounded-lg font-semibold text-sm hover:bg-gray-200 active:bg-gray-300 border border-gray-300 transition-colors duration-150">
  Secondary
</button>

// Tertiary/Ghost Button (Minimal style, text-only)
<button className="px-4 py-2.5 text-teal-primary font-semibold text-sm hover:bg-teal-50 rounded-lg transition-colors duration-150">
  Ghost
</button>

// Danger Button (Destructive actions)
<button className="px-4 py-2.5 bg-red-error text-white rounded-lg font-semibold text-sm hover:bg-red-700 active:bg-red-800 transition-colors duration-150">
  Delete
</button>

// Loading State Button
<button disabled className="px-4 py-2.5 bg-teal-primary text-white rounded-lg font-semibold text-sm opacity-60 flex items-center gap-2">
  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
  Processing...
</button>

// Size Variants
<button className="px-3 py-1.5 text-xs">Small</button>  {/* 32px height */}
<button className="px-4 py-2.5 text-sm">Medium</button>  {/* 44px height */}
<button className="px-6 py-3 text-base">Large</button>   {/* 48px height */}

// Full-width button
<button className="w-full px-4 py-2.5 bg-teal-primary text-white rounded-lg">
  Full Width
</button>
```

**INPUT FIELDS:**
```javascript
// Text Input
<input
  type="text"
  placeholder="Enter text..."
  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary focus:border-transparent hover:border-gray-400 transition-colors duration-150 disabled:bg-gray-50 disabled:text-gray-400"
/>

// With Label
<label className="block text-sm font-semibold text-gray-900 mb-2">
  Email Address
  <span className="text-red-error">*</span>
</label>
<input
  type="email"
  placeholder="you@example.com"
  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary"
/>

// Error State
<input
  className="w-full px-3 py-2.5 border-2 border-red-error rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-error"
/>
<span className="text-xs text-red-error mt-1">This field is required</span>

// Disabled State
<input
  disabled
  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-400 text-sm"
/>

// Select Dropdown
<select className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary appearance-none bg-white cursor-pointer">
  <option>Select option...</option>
  <option>Option 1</option>
  <option>Option 2</option>
</select>

// Date Input
<input
  type="date"
  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary"
/>

// Search Input (with icon)
<div className="relative">
  <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
  <input
    type="text"
    placeholder="Search..."
    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary"
  />
</div>
```

**CARDS:**
```javascript
// Elevated Card (Shadow effect, interactive)
<div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer">
  <h3 className="text-lg font-semibold text-gray-900 mb-2">Card Title</h3>
  <p className="text-sm text-gray-600">Card content goes here</p>
</div>

// Flat Card (No shadow, minimal style)
<div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
  <h3 className="text-lg font-semibold text-gray-900">Card Title</h3>
  <p className="text-sm text-gray-600">Content</p>
</div>

// Interactive Card with Border
<div className="bg-white rounded-lg border-2 border-transparent hover:border-teal-primary p-6 transition-colors duration-150 cursor-pointer">
  <h3 className="text-lg font-semibold text-gray-900">Interactive Card</h3>
</div>

// Status Badge Card
<div className="bg-white rounded-lg shadow-sm p-6 relative">
  <span className="absolute top-4 right-4 px-2 py-1 bg-emerald-success/10 text-emerald-success text-xs font-semibold rounded-full">
    Active
  </span>
  <h3 className="text-lg font-semibold text-gray-900">Content</h3>
</div>
```

**MODALS/DIALOGS:**
```javascript
// Modal Overlay + Content
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
  {/* Smooth entry animation */}
  <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 animate-modal-enter">
    {/* Header */}
    <div className="flex items-center justify-between p-6 border-b border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900">Modal Title</h2>
      <button className="text-gray-400 hover:text-gray-600 transition-colors">
        <IconX />
      </button>
    </div>

    {/* Body */}
    <div className="p-6">
      <p className="text-sm text-gray-600">Modal content</p>
    </div>

    {/* Footer */}
    <div className="flex gap-3 p-6 border-t border-gray-200 justify-end">
      <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
        Cancel
      </button>
      <button className="px-4 py-2 bg-teal-primary text-white rounded-lg hover:bg-teal-700 transition-colors">
        Confirm
      </button>
    </div>
  </div>
</div>
```

**ALERTS/TOASTS:**
```javascript
// Info Alert
<div className="bg-blue-secondary/10 text-blue-secondary border-l-4 border-blue-secondary rounded-lg p-4 flex items-start gap-3">
  <IconInfo className="w-5 h-5 mt-0.5 flex-shrink-0" />
  <div>
    <h4 className="font-semibold">Information</h4>
    <p className="text-sm">This is informational only.</p>
  </div>
</div>

// Success Alert
<div className="bg-emerald-success/10 text-emerald-success border-l-4 border-emerald-success rounded-lg p-4 flex items-start gap-3">
  <IconCheck className="w-5 h-5 mt-0.5 flex-shrink-0" />
  <div>
    <h4 className="font-semibold">Success</h4>
    <p className="text-sm">Action completed successfully.</p>
  </div>
</div>

// Warning Alert
<div className="bg-amber-alert/10 text-amber-alert border-l-4 border-amber-alert rounded-lg p-4 flex items-start gap-3">
  <IconAlert className="w-5 h-5 mt-0.5 flex-shrink-0" />
  <div>
    <h4 className="font-semibold">Warning</h4>
    <p className="text-sm">Please review this action.</p>
  </div>
</div>

// Error Alert
<div className="bg-red-error/10 text-red-error border-l-4 border-red-error rounded-lg p-4 flex items-start gap-3">
  <IconError className="w-5 h-5 mt-0.5 flex-shrink-0" />
  <div>
    <h4 className="font-semibold">Error</h4>
    <p className="text-sm">Something went wrong.</p>
  </div>
</div>

// Toast Notification (Bottom-right corner)
<div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg p-4 flex items-start gap-3 animate-toast-enter max-w-sm">
  <IconCheck className="w-5 h-5 text-emerald-success flex-shrink-0 mt-0.5" />
  <div>
    <p className="text-sm font-semibold text-gray-900">Operation completed</p>
    <p className="text-xs text-gray-600">Your changes have been saved.</p>
  </div>
  <button className="text-gray-400 hover:text-gray-600 ml-2">
    <IconX className="w-4 h-4" />
  </button>
</div>
```

**TABLES:**
```javascript
// Data Table with sorting + filtering
<div className="bg-white rounded-lg shadow-sm overflow-hidden">
  {/* Table Header */}
  <table className="w-full border-collapse">
    <thead>
      <tr className="border-b border-gray-200 bg-gray-50">
        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
          <button className="flex items-center gap-2 hover:text-gray-900 transition-colors">
            Name
            <IconChevronUp className="w-4 h-4 opacity-50" />
          </button>
        </th>
        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
      </tr>
    </thead>

    {/* Table Body */}
    <tbody className="divide-y divide-gray-200">
      {data.map((row) => (
        <tr key={row.id} className="hover:bg-gray-50 transition-colors duration-150">
          <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.name}</td>
          <td className="px-6 py-4 text-sm">
            <span className="px-2.5 py-1 bg-emerald-success/10 text-emerald-success text-xs font-semibold rounded-full">
              {row.status}
            </span>
          </td>
          <td className="px-6 py-4 text-sm text-right font-mono text-gray-900">{row.amount}</td>
          <td className="px-6 py-4 text-sm text-right">
            <button className="text-teal-primary hover:underline">Edit</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>

  {/* Table Footer (Pagination) */}
  <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
    <span className="text-sm text-gray-600">Showing 1-10 of 100</span>
    <div className="flex gap-2">
      <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">Previous</button>
      <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">Next</button>
    </div>
  </div>
</div>
```

**EMPTY STATES:**
```javascript
// Empty State with Illustration
<div className="flex flex-col items-center justify-center py-16 px-6 text-center">
  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
    <IconEmptyBox className="w-12 h-12 text-gray-400" />
  </div>
  <h3 className="text-lg font-semibold text-gray-900 mb-2">No data yet</h3>
  <p className="text-sm text-gray-600 max-w-md mb-6">
    Start by creating your first item to see it here.
  </p>
  <button className="px-4 py-2.5 bg-teal-primary text-white rounded-lg font-semibold text-sm hover:bg-teal-700">
    Create Item
  </button>
</div>
```

---

## 🎬 PART 2: ANIMATIONS & MICRO-INTERACTIONS (150ms Standard)

### 2.1 Animation Framework

**Global Animation Settings:**
```css
/* In global CSS or Tailwind config */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-16px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

/* Tailwind extend */
module.exports = {
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 200ms ease-in-out',
        'slide-up': 'slideInUp 300ms ease-out',
        'slide-left': 'slideInLeft 300ms ease-out',
        'scale-in': 'scaleIn 200ms ease-out',
        'pulse-light': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
      },
      transitionTimingFunction: {
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
      }
    }
  }
};
```

### 2.2 Component-Level Animations

**Page/View Entry:**
```javascript
// All new pages should fade in
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.2 }}
  className="min-h-screen bg-gray-50"
>
  {/* Page content */}
</motion.div>

// OR using Tailwind
<div className="animate-fade-in">
  {/* Content */}
</div>
```

**Modal Entry (Spring Animation):**
```javascript
// Modals should pop in with slight spring bounce
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95 }}
  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
  className="bg-white rounded-xl shadow-lg max-w-md"
>
  {/* Modal content */}
</motion.div>

// OR using CSS
<div className="animate-scale-in">
  {/* Modal content */}
</div>
```

**Dropdown/Menu Open:**
```javascript
// Dropdowns slide down smoothly
<motion.div
  initial={{ opacity: 0, y: -8 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -8 }}
  transition={{ duration: 0.15 }}
  className="absolute top-full mt-2 bg-white rounded-lg shadow-lg"
>
  {/* Menu items */}
</motion.div>
```

**Button Hover Effects:**
```javascript
// Primary button on hover
<motion.button
  whileHover={{ scale: 1.02, backgroundColor: '#0D5B54' }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.15 }}
  className="px-4 py-2.5 bg-teal-primary text-white rounded-lg font-semibold"
>
  Action
</motion.button>

// OR using Tailwind (preferred for simplicity)
<button className="px-4 py-2.5 bg-teal-primary text-white rounded-lg font-semibold hover:bg-teal-700 active:scale-95 transition-all duration-150">
  Action
</button>
```

**Table Row Hover:**
```javascript
// Rows highlight on hover with smooth transition
<motion.tr
  whileHover={{ backgroundColor: '#F9FAFB' }}
  transition={{ duration: 0.15 }}
  className="border-b border-gray-200 hover:bg-gray-50"
>
  {/* Row content */}
</motion.tr>

// OR using Tailwind
<tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
  {/* Row content */}
</tr>
```

**Loading Skeleton (Shimmer Effect):**
```javascript
// Skeleton placeholder while loading
<div className="space-y-4">
  {[...Array(3)].map((_, i) => (
    <div
      key={i}
      className="h-16 bg-gray-200 rounded-lg animate-shimmer"
      style={{
        backgroundImage: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s infinite'
      }}
    />
  ))}
</div>

// OR use a library: npm install react-loading-skeleton
import Skeleton from 'react-loading-skeleton'

<Skeleton count={3} height={64} className="mb-4" />
```

**Toast/Notification Entry:**
```javascript
// Toasts slide in from right + fade out
<motion.div
  initial={{ opacity: 0, x: 320 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: 320 }}
  transition={{ duration: 0.3 }}
  className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg p-4"
>
  {/* Toast content */}
</motion.div>

// Auto-dismiss after 3 seconds
useEffect(() => {
  const timer = setTimeout(() => setShowToast(false), 3000);
  return () => clearTimeout(timer);
}, []);
```

**Form Input Focus:**
```javascript
// Input gets subtle glow on focus
<input
  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary focus:ring-offset-2 transition-shadow duration-150"
/>
```

**Success Checkmark Animation:**
```javascript
// Checkmark appears with drawing animation
<motion.svg
  initial={{ pathLength: 0, opacity: 0 }}
  animate={{ pathLength: 1, opacity: 1 }}
  transition={{ duration: 0.5, ease: 'easeInOut' }}
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  className="text-emerald-success"
>
  <path d="M20 6L9 17l-5-5" strokeWidth={2} strokeLinecap="round" />
</motion.svg>
```

**Number Counter Animation:**
```javascript
// Animate counting from 0 to target value
import { useMotionValue, animate } from 'framer-motion'

const CounterCard = ({ value }) => {
  const motionValue = useMotionValue(0)
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const unsubscribe = motionValue.onChange((v) => {
      setDisplayValue(Math.round(v))
    })

    animate(motionValue, value, { duration: 0.5, ease: 'easeOut' })
    return () => unsubscribe()
  }, [value])

  return <span>{displayValue}</span>
}
```

---

### 2.3 Dashboard-Specific Animations

**Card Entrance Stagger (Dashboard Load):**
```javascript
// Cards appear one-by-one with staggered animation
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
>
  {cards.map((card, index) => (
    <motion.div
      key={card.id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="bg-white rounded-lg shadow-sm p-6"
    >
      {/* Card content */}
    </motion.div>
  ))}
</motion.div>
```

**Chart Data Animation (Line/Bar Charts):**
```javascript
// Charts animate on load
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
>
  <LineChart
    data={chartData}
    isAnimationActive={true}  {/* Enable chart animation */}
    animationDuration={800}
  />
</motion.div>
```

**Real-Time Metric Update:**
```javascript
// Metric value updates with subtle color flash
const MetricCard = ({ label, value, change }) => {
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    setIsUpdating(true)
    const timer = setTimeout(() => setIsUpdating(false), 300)
    return () => clearTimeout(timer)
  }, [value])

  return (
    <motion.div
      animate={{ backgroundColor: isUpdating ? '#F0FDF4' : '#FFFFFF' }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg p-6"
    >
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-3xl font-semibold text-gray-900">{value}</p>
      <p className={`text-sm mt-2 ${change > 0 ? 'text-emerald-success' : 'text-red-error'}`}>
        {change > 0 ? '↑' : '↓'} {Math.abs(change)}%
      </p>
    </motion.div>
  )
}
```

**Sidebar Collapse Animation:**
```javascript
// Sidebar slides out smoothly
<motion.div
  animate={{ width: isOpen ? 280 : 64 }}
  transition={{ duration: 0.3, ease: 'easeInOut' }}
  className="fixed left-0 top-0 h-screen bg-white border-r border-gray-200"
>
  {/* Sidebar content */}
</motion.div>

// Main content adjusts
<motion.main
  animate={{ marginLeft: isOpen ? 280 : 64 }}
  transition={{ duration: 0.3 }}
  className="flex-1"
>
  {/* Main content */}
</motion.main>
```

---

## 📊 PART 3: DASHBOARD DESIGN EXCELLENCE

### 3.1 Dashboard Architecture (Role-Based)

**General Structure (All Dashboards):**
```
┌─────────────────────────────────────────────┐
│  Top Navigation (64px, Fixed)               │
│  Logo | Search | Notifications | User Menu  │
└─────────────────────────────────────────────┘

┌──────────────┬──────────────────────────────┐
│              │                              │
│  Sidebar     │  Main Dashboard              │
│  Navigation  │                              │
│  (280px)     │  ┌──────────────────────┐    │
│              │  │ Summary Cards (KPIs) │    │
│              │  └──────────────────────┘    │
│              │                              │
│              │  ┌──────────────────────┐    │
│              │  │ Main Chart Section   │    │
│              │  │ (Interactive)        │    │
│              │  └──────────────────────┘    │
│              │                              │
│              │  ┌──────────────────────┐    │
│              │  │ Data Tables / Widgets│    │
│              │  └──────────────────────┘    │
│              │                              │
└──────────────┴──────────────────────────────┘
```

**Section 1: Summary Cards (Above Fold)**
```javascript
// CRM Dashboard - Summary Cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  {/* Total Pipeline Value */}
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0 * 0.1 }}
    className="bg-white rounded-lg shadow-sm p-6"
  >
    <div className="flex items-start justify-between mb-4">
      <div>
        <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Total Pipeline</p>
        <p className="text-3xl font-semibold text-gray-900 mt-2">₹2.4Cr</p>
        <p className="text-sm text-emerald-success mt-1">↑ 12% from last month</p>
      </div>
      <div className="w-12 h-12 bg-teal-primary/10 rounded-lg flex items-center justify-center">
        <IconChart className="w-6 h-6 text-teal-primary" />
      </div>
    </div>

    {/* Mini Chart */}
    <div className="h-16 mt-4 flex items-end gap-1">
      {[65, 45, 78, 92, 88, 72, 85].map((v, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${v}%` }}
          transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
          className="flex-1 bg-teal-primary/60 rounded-t-sm hover:bg-teal-primary transition-colors"
        />
      ))}
    </div>
  </motion.div>

  {/* Conversion Funnel */}
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 * 0.1 }}
    className="bg-white rounded-lg shadow-sm p-6"
  >
    <div className="flex items-start justify-between mb-4">
      <div>
        <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Conversion Rate</p>
        <p className="text-3xl font-semibold text-gray-900 mt-2">18.5%</p>
        <p className="text-sm text-emerald-success mt-1">↑ 2.3% from target</p>
      </div>
      <div className="w-12 h-12 bg-blue-secondary/10 rounded-lg flex items-center justify-center">
        <IconFunnel className="w-6 h-6 text-blue-secondary" />
      </div>
    </div>
  </motion.div>

  {/* Won Deals (This Month) */}
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 * 0.1 }}
    className="bg-white rounded-lg shadow-sm p-6"
  >
    <div className="flex items-start justify-between mb-4">
      <div>
        <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Won This Month</p>
        <p className="text-3xl font-semibold text-gray-900 mt-2">₹45L</p>
        <p className="text-sm text-emerald-success mt-1">↑ 8 deals closed</p>
      </div>
      <div className="w-12 h-12 bg-emerald-success/10 rounded-lg flex items-center justify-center">
        <IconCheckCircle className="w-6 h-6 text-emerald-success" />
      </div>
    </div>
  </motion.div>

  {/* Pipeline Health */}
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 * 0.1 }}
    className="bg-white rounded-lg shadow-sm p-6 relative"
  >
    <div className="flex items-start justify-between mb-4">
      <div>
        <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Health Score</p>
        <p className="text-3xl font-semibold text-gray-900 mt-2">92%</p>
        <p className="text-sm text-emerald-success mt-1">↑ Excellent condition</p>
      </div>
      <div className="w-12 h-12 bg-gold-accent/10 rounded-lg flex items-center justify-center">
        <IconTrendingUp className="w-6 h-6 text-gold-accent" />
      </div>
    </div>

    {/* Circular Progress */}
    <div className="w-16 h-16 relative mt-4">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="32" cy="32" r="28" fill="none" stroke="#D1D5DB" strokeWidth="4" />
        <motion.circle
          cx="32"
          cy="32"
          r="28"
          fill="none"
          stroke="#059669"
          strokeWidth="4"
          initial={{ strokeDashoffset: 176 }}
          animate={{ strokeDashoffset: 176 * (1 - 0.92) }}
          transition={{ duration: 1, ease: 'easeOut' }}
          strokeDasharray="176"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">92%</span>
    </div>
  </motion.div>
</div>
```

**Section 2: Action Panel (Right Sidebar)**
```javascript
// Action Panel - Fixed Right Sidebar
<aside className="fixed right-0 top-16 w-80 h-[calc(100vh-64px)] bg-white border-l border-gray-200 overflow-y-auto z-30 p-6 hidden lg:block">
  {/* Recommended Actions */}
  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Actions</h3>
  <div className="space-y-3 mb-8">
    <motion.button
      whileHover={{ x: 4 }}
      className="w-full text-left px-4 py-3 bg-teal-primary/10 text-teal-primary rounded-lg hover:bg-teal-primary/20 transition-colors font-semibold text-sm flex items-center gap-2"
    >
      <IconPlus className="w-4 h-4" />
      Create New Deal
    </motion.button>
    <motion.button
      whileHover={{ x: 4 }}
      className="w-full text-left px-4 py-3 bg-blue-secondary/10 text-blue-secondary rounded-lg hover:bg-blue-secondary/20 transition-colors font-semibold text-sm flex items-center gap-2"
    >
      <IconMail className="w-4 h-4" />
      Send Email Campaign
    </motion.button>
    <motion.button
      whileHover={{ x: 4 }}
      className="w-full text-left px-4 py-3 bg-amber-alert/10 text-amber-alert rounded-lg hover:bg-amber-alert/20 transition-colors font-semibold text-sm flex items-center gap-2"
    >
      <IconAlertCircle className="w-4 h-4" />
      Follow Up on Stale Deals
    </motion.button>
  </div>

  {/* Smart Notifications */}
  <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
  <div className="space-y-3">
    <div className="px-3 py-2 bg-blue-secondary/5 border-l-2 border-blue-secondary rounded">
      <p className="text-xs font-semibold text-blue-secondary">Deal Alert</p>
      <p className="text-sm text-gray-700 mt-1">3 deals due in next 48 hours</p>
    </div>
    <div className="px-3 py-2 bg-emerald-success/5 border-l-2 border-emerald-success rounded">
      <p className="text-xs font-semibold text-emerald-success">Opportunity</p>
      <p className="text-sm text-gray-700 mt-1">2 leads upgraded to opportunity</p>
    </div>
  </div>
</aside>
```

**Section 3: Main Chart (Interactive)**
```javascript
// CRM Pipeline Sankey Chart
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.4, duration: 0.4 }}
  className="bg-white rounded-lg shadow-sm p-6 mb-8"
>
  <div className="mb-6">
    <h3 className="text-lg font-semibold text-gray-900">Pipeline Flow</h3>
    <p className="text-sm text-gray-600">Deal progression across stages (Real-time)</p>
  </div>

  {/* Responsive Chart Container */}
  <div className="w-full h-80 hover:shadow-md transition-shadow duration-200">
    <ResponsiveSankey
      data={pipelineData}
      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
      animate={true}
      animationDuration={500}
    />
  </div>

  {/* Legend */}
  <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-gray-200">
    {[
      { color: '#0F766E', label: 'Qualified', value: '₹60L' },
      { color: '#0284C7', label: 'Proposal', value: '₹45L' },
      { color: '#059669', label: 'Negotiation', value: '₹35L' },
      { color: '#D97706', label: 'Won', value: '₹25L' }
    ].map((item) => (
      <div key={item.label} className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
        <span className="text-sm text-gray-600">{item.label}</span>
        <span className="text-sm font-semibold text-gray-900">{item.value}</span>
      </div>
    ))}
  </div>
</motion.div>
```

**Section 4: Data Tables / Widgets**
```javascript
// Recent Deals Table
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.5, duration: 0.4 }}
  className="bg-white rounded-lg shadow-sm overflow-hidden"
>
  <div className="p-6 border-b border-gray-200">
    <h3 className="text-lg font-semibold text-gray-900">Recent Deals</h3>
  </div>

  <table className="w-full">
    <thead>
      <tr className="border-b border-gray-200 bg-gray-50">
        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Deal Name</th>
        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Stage</th>
        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Value</th>
        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Owner</th>
      </tr>
    </thead>
    <tbody>
      {deals.map((deal, i) => (
        <motion.tr
          key={deal.id}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 + i * 0.05 }}
          className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <td className="px-6 py-4 text-sm font-medium text-gray-900">{deal.name}</td>
          <td className="px-6 py-4 text-sm">
            <span className="px-2.5 py-1 bg-blue-secondary/10 text-blue-secondary text-xs font-semibold rounded-full">
              {deal.stage}
            </span>
          </td>
          <td className="px-6 py-4 text-sm font-mono text-right text-gray-900">{deal.value}</td>
          <td className="px-6 py-4 text-sm text-right text-gray-600">{deal.owner}</td>
        </motion.tr>
      ))}
    </tbody>
  </table>
</motion.div>
```

---

### 3.2 Chart-Specific Guidelines

**All Charts Must Follow:**
```
1. ANIMATION ON LOAD
   └─ Smooth 0.5-0.8s entry animation
   └─ Skeleton loader while data fetches

2. INTERACTIVE HOVER
   └─ Tooltip appears on hover (not modal, inline)
   └─ Highlight relevant data series
   └─ Show exact values in tooltip

3. COLOR SCHEME
   └─ Use semantic colors (success=green, error=red, info=blue)
   └─ Ensure colorblind-safe palette
   └─ Add patterns/textures for grayscale printing

4. RESPONSIVE
   └─ Desktop: Full width, 300px min-height
   └─ Tablet: 2-column grid
   └─ Mobile: Single column, horizontal scroll for tables

5. EXPORT OPTIONS
   └─ Download as PNG / PDF / CSV
   └─ Share via email or Slack
   └─ Embed with fixed link
```

**Line Chart (Trends):**
```javascript
<ResponsiveLineChart
  data={data}
  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
  xAxis={{ type: 'number' }}
  yAxis={{ type: 'number' }}
  cartesianGrid={{ strokeDasharray: '3 3', stroke: '#D1D5DB' }}
  tooltip={{
    contentStyle: { backgroundColor: '#fff', border: '1px solid #D1D5DB', borderRadius: '8px' },
    animationDuration: 0
  }}
  line={{ type: 'monotone', dataKey: 'value', stroke: '#0F766E', strokeWidth: 2, dot: false }}
  isAnimationActive={true}
  animationDuration={500}
/>
```

**Bar Chart (Comparison):**
```javascript
<ResponsiveBarChart
  data={data}
  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
  xAxis={{ type: 'category', tick: { fill: '#4B5563', fontSize: 12 } }}
  yAxis={{ type: 'number', tick: { fill: '#4B5563', fontSize: 12 } }}
  bar={{ dataKey: 'value', fill: '#0F766E', radius: [8, 8, 0, 0] }}
  tooltip={{
    contentStyle: { backgroundColor: '#fff', border: '1px solid #D1D5DB', borderRadius: '8px' }
  }}
  isAnimationActive={true}
  animationDuration={500}
/>
```

**Pie Chart (Composition):**
```javascript
<ResponsivePieChart
  data={data}
  margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
  innerRadius={80}  {/* Donut style */}
  outerRadius={120}
  fill="#8884d8"
  dataKey="value"
  label={{
    fill: '#4B5563',
    fontSize: 12,
    fontWeight: 500
  }}
  tooltip={{
    contentStyle: { backgroundColor: '#fff', border: '1px solid #D1D5DB', borderRadius: '8px' }
  }}
  isAnimationActive={true}
  animationDuration={500}
/>
```

---

## 🎯 PART 4: IMPLEMENTATION CHECKLIST FOR CURSOR

### 4.1 Before Starting Any UI Work

**MANDATORY PRE-FLIGHT CHECKS:**

- [ ] **Existing Component Review** - Open `/components` folder, search for similar components
- [ ] **Design System Validation** - Confirm color hex values match palette exactly
- [ ] **Typography Audit** - Use only approved font sizes from hierarchy
- [ ] **Spacing Grid Verification** - All padding/margin multiples of 8px
- [ ] **Animation Library Check** - Install `framer-motion` if not present (`npm install framer-motion`)
- [ ] **Tailwind Config Review** - Verify custom colors, animations extended (see section 1.1)
- [ ] **Component Library** - Use pre-built Button, Input, Card, Modal, Alert from component library
- [ ] **Accessibility Check** - Test keyboard navigation, focus states, color contrast (4.5:1 minimum)
- [ ] **Mobile Responsive** - Test at 320px, 768px, 1024px, 1440px breakpoints

### 4.2 Exact Implementation Workflow

**For EVERY UI component you create:**

1. **Copy Don't Create**
   ```
   ├─ Component already exists in codebase?
   │  └─ YES: Copy file path, import, adapt (don't recreate)
   │  └─ NO: Proceed to step 2
   ```

2. **Follow Strict Structure**
   ```
   File: /components/[Category]/[ComponentName].tsx
   
   Structure:
   ├─ Imports (React, Motion, Icons, Styles)
   ├─ TypeScript Interfaces
   ├─ Component Function
   │  ├─ useState/useEffect hooks
   │  ├─ Event handlers
   │  ├─ JSX with className (Tailwind only)
   │  └─ Motion wrappers for animations
   └─ Export default
   ```

3. **Apply Design System Strictly**
   ```
   ├─ Colors: Use EXACT hex from palette (copy-paste, don't guess)
   ├─ Typography: Use approved sizes only (no arbitrary px values)
   ├─ Spacing: All padding/margin = multiple of 8
   ├─ Icons: Use Heroicons Outline, 24px, 2px stroke
   ├─ Shadows: Use Tailwind shadow-sm/md/lg only
   ├─ Border Radius: Use rounded-lg (8px) or rounded-xl (12px)
   └─ Animations: 150ms ease-in-out for all transitions
   ```

4. **Add Animations (150ms Standard)**
   ```
   ├─ Page Entry: Fade in (opacity 0 → 1)
   ├─ Card Enter: Slide up + fade (y: 16px → 0, opacity 0 → 1)
   ├─ Button Hover: Scale 1.02 + color change
   ├─ Modal: Scale pop (0.95 → 1)
   ├─ Dropdown: Slide down (y: -8px → 0)
   └─ All transitions: duration: 150ms, ease: 'ease-in-out'
   ```

5. **Test Responsiveness**
   ```
   ├─ Mobile (320px): Single column, stacked layout
   ├─ Tablet (768px): 2-column grid
   ├─ Desktop (1024px+): 3-4 column grid
   ├─ Large (1440px+): Sidebar + main content
   └─ Check: No horizontal scroll, no text overflow
   ```

6. **Accessibility Compliance**
   ```
   ├─ Keyboard Navigation: Tab order, focus indicators visible
   ├─ Color Contrast: 4.5:1 (normal text), 3:1 (large text)
   ├─ ARIA Labels: For icon-only buttons, form fields
   ├─ Focus Ring: 2px offset, teal-primary color
   └─ Screen Reader: Semantic HTML, proper heading hierarchy
   ```

### 4.3 Cursor-Specific Commands

**Run these in Cursor terminal for quick setup:**

```bash
# Install required dependencies
npm install framer-motion heroicons recharts react-loading-skeleton

# Generate component boilerplate
npm run generate:component [ComponentName]

# Audit colors in codebase (find non-compliant colors)
npm run audit:colors

# Check spacing compliance (find non-8px multiples)
npm run audit:spacing

# Run accessibility tests
npm run test:a11y

# Validate TypeScript types
npm run type-check

# Build and preview
npm run build
npm run preview
```

### 4.4 Code Quality Standards

**Before committing any UI code:**

- [ ] ✅ Zero TypeScript errors (`npm run type-check`)
- [ ] ✅ No console.log or debug statements
- [ ] ✅ All Tailwind classes (no inline styles except dynamic values)
- [ ] ✅ Proper error boundaries around components
- [ ] ✅ Framer Motion syntax correct (no typos in `initial`, `animate`)
- [ ] ✅ Color values match design system exactly (copy-paste verified)
- [ ] ✅ Icon sizes consistent (24px default, 20px dense, 32px hero)
- [ ] ✅ Animation durations standard (150ms transitions, 300-500ms page/chart loads)
- [ ] ✅ Mobile breakpoints tested (320px, 768px, 1024px)
- [ ] ✅ Focus states visible (outline or ring)
- [ ] ✅ Loading states implemented (skeleton or spinner)
- [ ] ✅ Empty states designed (friendly, actionable)
- [ ] ✅ Comments for complex logic only (code should be self-documenting)
- [ ] ✅ Component documented with JSDoc
- [ ] ✅ Responsive images (srcSet for retina displays)
- [ ] ✅ Performance optimized (memo for pure components, lazy load charts)

---

## 🎬 PART 5: DASHBOARD-SPECIFIC INSTRUCTIONS

### 5.1 CRM Dashboard Layout

**Route:** `/dashboard/crm`

**Sections (In Order):**
1. **Summary Cards** (4 cards, 3 seconds stagger animation)
   - Total Pipeline Value
   - Conversion Rate
   - Won This Month
   - Pipeline Health Score

2. **Action Panel** (Right sidebar, fixed)
   - Top 3 recommended actions
   - Smart notifications

3. **Main Chart** (Pipeline Sankey or Funnel)
   - Real-time data
   - 500ms animation on load
   - Drill-down capability

4. **Recent Deals Table**
   - Top 10 deals
   - Sortable, filterable
   - Row hover effect

5. **Performance Metrics**
   - Sales rep leaderboard
   - Product performance
   - Forecast vs actual

### 5.2 Finance Dashboard Layout

**Route:** `/dashboard/finance`

**Sections:**
1. **Cash Position Cards**
   - Liquidity
   - Cash Inflow
   - Cash Outflow
   - Days Sales Outstanding (DSO)

2. **Cash Flow Chart** (Line + Bar combo)
   - Real-time updates
   - 7-day rolling view

3. **P&L Trend** (Line chart)
   - Revenue, COGS, Gross Profit, Operating Expense, Net Income
   - Monthly comparison

4. **Invoice Aging** (Stacked bar chart)
   - Current, 30+ days, 60+ days, 90+ days

5. **Tax Liability Preview**
   - Monthly breakdown
   - Year-to-date total

### 5.3 Inventory Dashboard Layout

**Route:** `/dashboard/inventory`

**Sections:**
1. **Stock Health Cards**
   - Total SKUs
   - Low Stock Items
   - Overstock Items
   - Turnover Rate

2. **Stock Heatmap** (Color grid showing stock levels)
   - Green = Optimal
   - Yellow = Monitor
   - Red = Action Required

3. **Demand vs Supply** (Area chart)
   - Forecasted demand
   - Current supply
   - Gap indicator

4. **Reorder Alerts** (Table)
   - SKU, Current Stock, Reorder Point, Lead Time

---

## 📋 PART 6: STRICT RULES (NON-NEGOTIABLE)

### RULE 1: Design System Compliance
```
BEFORE USING ANY COLOR, SPACING, OR FONT:
1. Find it in design system (Part 1)
2. Copy EXACT value
3. Verify in component
4. Commit

IF COLOR/FONT/SPACING NOT IN DESIGN SYSTEM:
→ STOP, ask for addition to design system
→ DO NOT create arbitrary values
```

### RULE 2: Animation Standard
```
ALL INTERACTIONS MUST HAVE ANIMATION:

Button Click → active:scale-95 (50ms)
Button Hover → hover:scale-102 (150ms)
Page Load → animate-fade-in (200ms)
Modal Open → animate-scale-in (150ms)
Card Enter → slide-up + fade (300ms, staggered)
Dropdown → slide-down (150ms)
Toast → slide-in-right (300ms)
Table Row Hover → bg color change (150ms)

NO STATIC INTERACTIONS ALLOWED
```

### RULE 3: Component Reusability
```
NEVER DUPLICATE COMPONENTS:

Instead of creating Button twice:
❌ pages/dashboard/Button.tsx
❌ pages/settings/Button.tsx

DO THIS:
✅ components/Button/Button.tsx
✅ Import in both pages

REUSE CHECKLIST:
├─ Does component exist in /components?
├─ Can it be customized with props?
├─ If YES: Use and adapt
└─ If NO: Create once in /components, import everywhere
```

### RULE 4: Responsive Design (Mobile-First)
```
EVERY COMPONENT MUST WORK ON:
├─ 320px (iPhone SE)
├─ 768px (iPad)
├─ 1024px (Desktop)
├─ 1440px (Large desktop)

BREAKPOINT USAGE:
├─ Base: Mobile styles (320px default)
├─ sm: 640px (hidden-sm, md:hidden)
├─ md: 768px (md:flex, md:grid-cols-2)
├─ lg: 1024px (lg:grid-cols-3)
├─ xl: 1280px (xl:grid-cols-4)

NO COMPONENT LAUNCHES WITHOUT RESPONSIVE TESTING
```

### RULE 5: Performance
```
LIGHTHOUSE TARGETS:
├─ Performance: 90+
├─ Accessibility: 95+
├─ Best Practices: 90+
├─ SEO: 95+

OPTIMIZATION RULES:
├─ Lazy load components not on viewport
├─ Memoize pure components (React.memo)
├─ Virtualize long lists (1000+ rows)
├─ Skeleton screens instead of spinners
├─ Images: Responsive (srcSet) + WebP + lazy
├─ Charts: Recharts with `isAnimationActive={true}` only for visible
├─ No inline functions in render (define outside)
└─ Use const instead of function declaration where possible
```

### RULE 6: Accessibility
```
EVERY INTERACTIVE ELEMENT MUST:
├─ Be keyboard accessible (Tab, Enter, Escape)
├─ Have focus indicator visible (outline or ring)
├─ Have aria-label (for icons) or associated label (for inputs)
├─ Have 4.5:1 color contrast minimum

FORM FIELDS:
├─ Label must be associated (htmlFor="id")
├─ Error messages semantic (<span role="alert">)
├─ Required indicator with aria-required="true"

BUTTONS:
├─ Text visible (no icon-only without label)
├─ Focus ring visible (outline-2 offset-2)
├─ Loading state with aria-busy="true"

HEADINGS:
├─ Proper hierarchy (no skip: h1 → h2 → h3)
├─ Semantic (h1 per page, h2-h6 for content)
```

### RULE 7: Chart/Data Visualization
```
EVERY CHART MUST HAVE:
├─ Title + description
├─ Legend with color indicators
├─ Tooltip on hover (inline, not modal)
├─ Export button (PNG, PDF, CSV)
├─ Responsive height (auto-scale on resize)
├─ 150ms animation on data update
├─ Accessible alt text for images

COLORS IN CHARTS:
├─ Green (#059669) = Positive (growth, profit)
├─ Red (#DC2626) = Negative (decline, loss)
├─ Blue (#0284C7) = Information (neutral)
├─ Amber (#D97706) = Warning (attention)

NO:
├─ 3D effects
├─ Clashing colors
├─ Unlabeled axes
├─ Auto-generated legends (custom descriptions required)
```

---

## 🚀 DEPLOYMENT CHECKLIST

**Before pushing any UI to production:**

1. ✅ **Design Compliance**
   - [ ] All colors match palette hex
   - [ ] All fonts use approved sizes
   - [ ] All spacing multiples of 8
   - [ ] All icons consistent (Heroicons outline, 24px, 2px)

2. ✅ **Animation & Interaction**
   - [ ] All transitions 150ms duration
   - [ ] Page load animations 200-300ms
   - [ ] Modal animations 150ms with spring
   - [ ] Hover states present on all interactive elements
   - [ ] Loading states implemented

3. ✅ **Responsive**
   - [ ] Mobile (320px) tested & working
   - [ ] Tablet (768px) tested & working
   - [ ] Desktop (1024px+) tested & working
   - [ ] No horizontal scroll
   - [ ] Touch targets ≥44px

4. ✅ **Accessibility**
   - [ ] Keyboard navigation functional
   - [ ] Focus indicators visible
   - [ ] Color contrast ≥4.5:1
   - [ ] Aria labels present
   - [ ] No console errors

5. ✅ **Performance**
   - [ ] Lighthouse score ≥90
   - [ ] No unused CSS/JS
   - [ ] Images optimized (WebP + responsive)
   - [ ] Lazy loading implemented
   - [ ] Charts use recharts `isAnimationActive`

6. ✅ **Browser Support**
   - [ ] Chrome latest
   - [ ] Firefox latest
   - [ ] Safari latest
   - [ ] Edge latest

---

## 📞 QUICK REFERENCE: COMMON TASKS

### Add New Dashboard Page
```typescript
// 1. Create file: /app/dashboard/[module]/page.tsx
// 2. Import layout components
// 3. Build with 4-section structure (cards, chart, table, metrics)
// 4. Apply animations (stagger 0.1s between cards)
// 5. Add responsive grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
// 6. Test at 3 breakpoints
```

### Add New Card Component
```typescript
// 1. Create: /components/Cards/StatCard.tsx
// 2. Props: title, value, change%, icon, color
// 3. Use design system colors (teal-primary, blue-secondary, etc.)
// 4. Add hover animation (scale 1.02, shadow upgrade)
// 5. Export and use in dashboard
```

### Add New Chart
```typescript
// 1. Use Recharts (npm install recharts if needed)
// 2. Wrap in ResponsiveContainer
// 3. Add tooltip with custom style
// 4. Enable animation (isAnimationActive={true})
// 5. Add legend with color dots
// 6. Include export button (use react-html2canvas)
```

### Make Component Accessible
```typescript
// 1. Add aria-label to icons
// 2. Connect labels to inputs (htmlFor)
// 3. Add focus:outline-2 focus:outline-teal-primary
// 4. Test with keyboard (Tab, Enter, Escape)
// 5. Check color contrast (WebAIM checker)
```

---

## 💡 FINAL REMINDERS

**THIS PROMPT IS YOUR SOURCE OF TRUTH FOR:**
- ✅ Every color you use (copy hex from Part 1.1)
- ✅ Every font size you choose (use Part 1.2 only)
- ✅ Every animation you add (follow Part 2 patterns)
- ✅ Every dashboard layout (follow Part 3 structure)
- ✅ Every component you build (follow Part 4 workflow)

**BEFORE EVERY COMMIT:**
1. Run `npm run type-check` (no errors)
2. Run `npm run audit:colors` (all compliant)
3. Test mobile (320px, 768px, 1024px)
4. Check Lighthouse (90+)
5. Verify animations (smooth, 150ms)

**CULTURE OF CONSISTENCY:**
- The entire PayAid platform should feel like ONE cohesive product
- Users shouldn't be able to tell where one feature ends and another begins
- Design system isn't negotiable—it's the brand

---

**You're building something remarkable. Make it beautiful.**

**Version 1.0** | Finalized January 25, 2026 | By CTO Vision
