# UI/UX Design System Implementation Plan

## Current Issues
1. ❌ Using emoji icons instead of lucide-react icons
2. ❌ Not following color palette (Deep Teal #0F766E, Vibrant Blue #0284C7)
3. ❌ Not using 8px grid system consistently
4. ❌ Missing proper icon sizing (24px, 2px stroke)
5. ❌ Not using design system typography and spacing

## Implementation Steps

### Phase 1: Icon System Replacement
- [ ] Replace all emoji icons in `components/layout/sidebar.tsx`
- [ ] Replace emoji icons in `components/Navigation/ModuleNavigation.tsx`
- [ ] Replace emoji icons in `components/modules/ModuleSwitcher.tsx`
- [ ] Create icon mapping for all modules per design system

### Phase 2: Color System
- [ ] Update Tailwind config with design system colors
- [ ] Replace all color references to use new palette
- [ ] Update buttons, cards, and components

### Phase 3: Typography & Spacing
- [ ] Ensure 8px grid system throughout
- [ ] Update spacing (m-2, p-4, gap-4, etc.)
- [ ] Update typography scale

### Phase 4: Components
- [ ] Update buttons to match design system
- [ ] Update inputs to match design system
- [ ] Update cards to match design system
- [ ] Add proper animations (150ms ease-in-out)

## Icon Mapping (from UI/UX Prompt)

### Module Icons (lucide-react):
- CRM: `Users` or `UserCog` (people network)
- Accounting: `Scale` (balanced scale)
- Inventory: `Package` (3D boxes)
- Manufacturing: `Cog` or `Settings` (gears)
- Sales: `TrendingUp` or `DollarSign`
- Marketing: `Megaphone` or `BarChart3`
- HR: `UserCircle` or `Users`
- Projects: `FolderKanban` or `Briefcase`
- Finance: `Wallet` or `CreditCard`

### Action Icons:
- Dashboard: `LayoutDashboard` or `BarChart3`
- Settings: `Settings`
- User: `User`
- Search: `Search`
- Notifications: `Bell`
- Contacts: `Users` or `Contact`
- Deals: `Briefcase` or `Handshake`
- Tasks: `CheckSquare` or `ListTodo`
- Invoices: `FileText` or `Receipt`
- Orders: `ShoppingCart`
- Landing Pages: `FileText` or `Globe`
- Checkout: `CreditCard` or `ShoppingBag`
