# Quick Test Reference - Industry & Business Units

## 🧪 **Testing Routes**

### **1. Industry Landing Pages**

#### **Main Route:**
```
http://localhost:3000/
```

#### **With Industry Parameter:**
```
http://localhost:3000/?industry=restaurant
http://localhost:3000/?industry=retail
http://localhost:3000/?industry=manufacturing
http://localhost:3000/?industry=healthcare
http://localhost:3000/?industry=education
http://localhost:3000/?industry=real-estate
```

**Available Industries:**
- `restaurant` 🍽️
- `retail` 🛍️
- `manufacturing` 🏭
- `healthcare` 🏥
- `education` 🎓
- `real-estate` 🏠
- And 13 more (see `lib/industries/config.ts`)

**What to Test:**
1. Visit `/` - Should show generic landing page
2. Click on industry cards - Content should change dynamically
3. Use `?industry=restaurant` - Should auto-select Restaurant
4. Click "Get Started" - Should redirect to signup with industry param

---

### **2. Business Unit Management**

#### **Main Route:**
```
http://localhost:3000/dashboard/business-units
```

**Direct Access:**
- Type URL directly in browser
- Or add to navigation (see below)

**What to Test:**
1. **View:** Navigate to `/dashboard/business-units`
2. **Create:** Click "Create Business Unit" → Fill form → Create
3. **Edit:** Click "Edit" on a unit → Modify → Save
4. **Delete:** Click "Delete" → Confirm → Verify removal
5. **Industry Packs:** Select multiple packs → Verify display

---

## 🔗 **Adding to Navigation**

### **Option 1: Add to Settings Section**

Add to `components/layout/sidebar.tsx` in the Settings section:

```typescript
{
  name: 'Settings',
  icon: '⚙️',
  items: [
    // ... existing items
    { name: 'Business Units', href: '/dashboard/business-units', icon: '🏢', module: null },
  ],
}
```

### **Option 2: Add to Main Navigation**

Add to `mainNavigation` array in `components/layout/sidebar.tsx`:

```typescript
const mainNavigation = [
  // ... existing items
  { name: 'Business Units', href: '/dashboard/business-units', icon: '🏢', module: null },
]
```

### **Option 3: Add to Module Top Bar**

Add to any module top bar (e.g., `components/modules/CRMTopBar.tsx`):

```typescript
items={[
  // ... existing items
  { name: 'Business Units', href: '/dashboard/business-units', icon: '🏢' },
]}
```

---

## 📱 **Quick Test Steps**

### **Test Industry Landing Pages:**
1. Start dev server: `npm run dev`
2. Open: `http://localhost:3000/`
3. Scroll to industry selection
4. Click different industries
5. Verify content changes
6. Test URL parameters: `/?industry=restaurant`

### **Test Business Units:**
1. Login to dashboard
2. Navigate to: `http://localhost:3000/dashboard/business-units`
3. Create a test unit
4. Edit the unit
5. Delete the unit
6. Test with multiple industry packs

---

## ✅ **Verification Checklist**

### **Industry Landing Page:**
- [ ] Page loads at `/`
- [ ] Industry grid displays
- [ ] Clicking industry updates content
- [ ] Hero section changes
- [ ] Modules list updates
- [ ] Features list updates
- [ ] URL parameter works
- [ ] Signup button includes industry

### **Business Units:**
- [ ] Page loads at `/dashboard/business-units`
- [ ] Empty state shows when no units
- [ ] Create button works
- [ ] Form validation works
- [ ] Industry packs can be selected
- [ ] Unit is created successfully
- [ ] Edit button works
- [ ] Delete button works
- [ ] API endpoints respond correctly

---

## 🐛 **Troubleshooting**

### **Can't access Business Units page:**
- Check if route exists: `/dashboard/business-units`
- Verify you're logged in
- Check browser console for errors
- Verify API endpoint: `/api/business-units`

### **Industry selection not working:**
- Check browser console
- Verify `lib/industries/config.ts` exists
- Check if industry IDs match config

### **Business Units not saving:**
- Check API response in Network tab
- Verify database schema
- Check authentication token

---

## 📝 **Quick Commands**

```bash
# Start development server
npm run dev

# Test landing page
open http://localhost:3000/

# Test with industry
open http://localhost:3000/?industry=restaurant

# Test business units (after login)
open http://localhost:3000/dashboard/business-units
```

---

**Both features are ready for testing!**



