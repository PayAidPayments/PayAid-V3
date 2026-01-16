# Testing Guide - Industry Landing Pages & Business Unit Management

**Date:** December 2025  
**Status:** Testing Routes and Instructions

---

## 🧪 **Testing Locations**

### 1. **Industry Landing Pages**

#### **Main Landing Page**
**URL:** `http://localhost:3000/` (or your domain)

**What to Test:**
1. **Industry Selection:**
   - Visit the landing page
   - Scroll to "What industry is your business in?" section
   - Click on different industry cards (Restaurant, Retail, Manufacturing, etc.)
   - Verify the page content changes dynamically

2. **Dynamic Content:**
   - Select "Restaurant" → Should show restaurant-specific content
   - Select "Retail" → Should show retail-specific content
   - Select "Manufacturing" → Should show manufacturing-specific content

3. **URL Parameters:**
   - Visit: `http://localhost:3000/?industry=restaurant`
   - Should auto-select Restaurant industry
   - Visit: `http://localhost:3000/?industry=retail`
   - Should auto-select Retail industry

4. **Signup Flow:**
   - Select an industry
   - Click "Get Started with [Industry] Setup" button
   - Should redirect to `/signup?industry=[selected]`
   - Industry should be passed to signup form

**Test Industries:**
- 🍽️ Restaurant
- 🛍️ Retail
- 🏭 Manufacturing
- 🏥 Healthcare
- 🎓 Education
- 🏠 Real Estate
- And 13 more industries...

---

### 2. **Business Unit Management**

#### **Business Units Page**
**URL:** `http://localhost:3000/dashboard/business-units`

**How to Access:**
1. **Direct URL:** Navigate to `/dashboard/business-units`
2. **Via Settings:** (If linked in settings)
3. **Via API:** Can be accessed programmatically

**What to Test:**

#### **A. View Business Units**
1. Navigate to `/dashboard/business-units`
2. Should see:
   - List of existing business units (if any)
   - "Create Business Unit" button
   - Empty state if no units exist

#### **B. Create Business Unit**
1. Click "Create Business Unit" button
2. Fill in the form:
   - **Name:** e.g., "Main Store", "Online Division", "Mumbai Branch"
   - **Location:** e.g., "Mumbai, India"
   - **Industry Packs:** Select one or more industries
     - Restaurant
     - Retail
     - Manufacturing
     - etc.
3. Click "Create Unit"
4. Verify:
   - Unit appears in the list
   - Industry packs are displayed
   - Location is shown

#### **C. Edit Business Unit**
1. Click "Edit" button on a business unit card
2. Modify:
   - Name
   - Location
   - Industry packs
3. Save changes
4. Verify updates are reflected

#### **D. Delete Business Unit**
1. Click "Delete" button on a business unit card
2. Confirm deletion
3. Verify unit is removed from list

#### **E. Industry Pack Assignment**
1. Create a new business unit
2. Select multiple industry packs (e.g., Restaurant + Retail)
3. Verify all selected packs are displayed on the card
4. Edit and change industry packs
5. Verify updates

---

## 🔗 **Quick Access Links**

### **Development (Localhost)**
```
Industry Landing Page:
http://localhost:3000/
http://localhost:3000/?industry=restaurant
http://localhost:3000/?industry=retail
http://localhost:3000/?industry=manufacturing

Business Units:
http://localhost:3000/dashboard/business-units
```

### **Production (When Deployed)**
```
Industry Landing Page:
https://app.payaid.in/
https://app.payaid.in/?industry=restaurant
https://app.payaid.in/?industry=retail

Business Units:
https://app.payaid.in/dashboard/business-units
```

---

## 📋 **Testing Checklist**

### **Industry Landing Pages**

- [ ] Landing page loads correctly
- [ ] Industry selection grid displays all industries
- [ ] Clicking an industry updates the content
- [ ] Dynamic hero section changes per industry
- [ ] Core modules list updates per industry
- [ ] Industry features list updates per industry
- [ ] "Get Started" button includes industry parameter
- [ ] URL parameter `?industry=restaurant` works
- [ ] URL parameter `?industry=retail` works
- [ ] URL parameter `?industry=manufacturing` works
- [ ] All 19 industries are selectable
- [ ] Mobile responsive design works

### **Business Unit Management**

- [ ] Business units page loads
- [ ] Empty state displays when no units exist
- [ ] "Create Business Unit" button works
- [ ] Create modal opens
- [ ] Form validation works (name required)
- [ ] Industry pack selection works
- [ ] Location field is optional
- [ ] Create button creates unit
- [ ] New unit appears in list
- [ ] Industry packs display correctly
- [ ] Location displays correctly
- [ ] Edit button works
- [ ] Edit form pre-fills data
- [ ] Save changes works
- [ ] Delete button works
- [ ] Delete confirmation works
- [ ] Unit is removed after deletion
- [ ] API endpoints work (GET, POST, PATCH, DELETE)

---

## 🧪 **API Testing**

### **Business Units API**

#### **GET /api/business-units**
```bash
curl -X GET http://localhost:3000/api/business-units \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **POST /api/business-units**
```bash
curl -X POST http://localhost:3000/api/business-units \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Store",
    "location": "Mumbai, India",
    "industryPacks": ["restaurant", "retail"]
  }'
```

#### **PATCH /api/business-units/[id]**
```bash
curl -X PATCH http://localhost:3000/api/business-units/UNIT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "isActive": true
  }'
```

#### **DELETE /api/business-units/[id]**
```bash
curl -X DELETE http://localhost:3000/api/business-units/UNIT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Industry Auto-Configuration API**

#### **POST /api/onboarding/auto-configure**
```bash
curl -X POST http://localhost:3000/api/onboarding/auto-configure \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "industries": ["restaurant"],
    "industrySubTypes": ["cafe"],
    "goals": ["manage-orders", "track-inventory"]
  }'
```

---

## 🎯 **Test Scenarios**

### **Scenario 1: New User Onboarding**
1. Visit landing page
2. Select "Restaurant" industry
3. Click "Get Started with Restaurant Setup"
4. Complete signup
5. Verify onboarding auto-configures Restaurant modules
6. Verify business unit is created (if applicable)

### **Scenario 2: Multi-Industry Business**
1. Login to dashboard
2. Navigate to `/dashboard/business-units`
3. Create "Restaurant Division" with Restaurant industry pack
4. Create "Retail Division" with Retail industry pack
5. Verify both units exist
6. Verify industry packs are correctly assigned

### **Scenario 3: Industry Landing Page Flow**
1. Visit `/?industry=restaurant`
2. Verify Restaurant content displays
3. Change to `/?industry=retail`
4. Verify Retail content displays
5. Click "Get Started" button
6. Verify industry parameter is passed to signup

---

## 🐛 **Common Issues & Solutions**

### **Issue: Business Units page not accessible**
**Solution:** 
- Check if route exists: `/dashboard/business-units`
- Verify authentication is working
- Check browser console for errors

### **Issue: Industry selection not working**
**Solution:**
- Check browser console for JavaScript errors
- Verify `lib/industries/config.ts` is imported correctly
- Check if industry IDs match config

### **Issue: Industry packs not saving**
**Solution:**
- Verify API endpoint `/api/business-units` is working
- Check database schema (BusinessUnit model)
- Verify industryPacks field accepts array

### **Issue: Landing page not showing dynamic content**
**Solution:**
- Check if `getIndustryConfig()` is working
- Verify industry ID matches config keys
- Check browser console for errors

---

## 📝 **Adding Navigation Links**

### **Add Business Units to Sidebar**

If you want to add Business Units to the sidebar navigation, add this to `components/layout/sidebar.tsx`:

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

### **Add Business Units to Header**

If you want to add Business Units to the header, you can add it to the module top bars or create a settings dropdown.

---

## ✅ **Quick Test Commands**

### **Start Development Server**
```bash
npm run dev
# or
yarn dev
```

### **Test Landing Page**
```bash
# Open browser
http://localhost:3000/

# Test with industry parameter
http://localhost:3000/?industry=restaurant
```

### **Test Business Units**
```bash
# Login first, then navigate to:
http://localhost:3000/dashboard/business-units
```

---

## 🎯 **Summary**

**Industry Landing Pages:**
- **Route:** `/` (root page)
- **Test:** Select different industries, verify dynamic content

**Business Unit Management:**
- **Route:** `/dashboard/business-units`
- **Test:** Create, edit, delete business units with industry packs

**Both features are ready for testing!**



