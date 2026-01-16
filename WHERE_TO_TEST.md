# Where to Test - Industry Landing Pages & Business Unit Management

## 🧪 **Testing Locations**

---

## 1. **Industry Landing Pages**

### **📍 Main Route:**
```
http://localhost:3000/
```

### **📍 With Industry Selection:**
```
http://localhost:3000/?industry=restaurant
http://localhost:3000/?industry=retail
http://localhost:3000/?industry=manufacturing
http://localhost:3000/?industry=healthcare
http://localhost:3000/?industry=education
http://localhost:3000/?industry=real-estate
```

### **✅ What to Test:**
1. **Visit root page** (`/`)
   - Should show generic "All-in-One Business Platform" hero
   - Industry selection grid with all industries

2. **Click on industry cards**
   - Restaurant → Hero changes to "Restaurant Management Software"
   - Retail → Hero changes to "Retail POS & Inventory"
   - Manufacturing → Hero changes to "Manufacturing ERP"
   - Content section updates dynamically

3. **Test URL parameters**
   - `/?industry=restaurant` → Auto-selects Restaurant
   - `/?industry=retail` → Auto-selects Retail
   - Content should match selected industry

4. **Test signup flow**
   - Select industry
   - Click "Get Started with [Industry] Setup"
   - Should redirect to `/signup?industry=[selected]`

---

## 2. **Business Unit Management**

### **📍 Main Route:**
```
http://localhost:3000/dashboard/business-units
```

### **📍 Navigation Access:**
1. **Via Sidebar:**
   - Open sidebar
   - Scroll to "Industries" section
   - Click "Business Units" 🏢

2. **Direct URL:**
   - Type `/dashboard/business-units` in browser

3. **Via Module Switcher:**
   - Click module switcher in header
   - (Business Units is not in module switcher, use sidebar)

### **✅ What to Test:**

#### **A. View Business Units**
1. Navigate to `/dashboard/business-units`
2. Should see:
   - Page title: "Business Units"
   - "Create Business Unit" button
   - List of existing units (or empty state)

#### **B. Create Business Unit**
1. Click "Create Business Unit" button
2. Modal opens with form:
   - **Name:** Required field
   - **Location:** Optional field
   - **Industry Packs:** Checkbox list of all industries
3. Fill form:
   ```
   Name: "Main Store"
   Location: "Mumbai, India"
   Industry Packs: ☑ Restaurant, ☑ Retail
   ```
4. Click "Create Unit"
5. Verify:
   - Unit appears in list
   - Industry packs show as badges
   - Location displays with map icon

#### **C. Edit Business Unit**
1. Click "Edit" button on a unit card
2. Modify fields
3. Click "Save"
4. Verify changes are reflected

#### **D. Delete Business Unit**
1. Click "Delete" button
2. Confirm in dialog
3. Verify unit is removed

---

## 🔗 **Quick Access Links**

### **Development:**
```
Industry Landing:
http://localhost:3000/
http://localhost:3000/?industry=restaurant

Business Units:
http://localhost:3000/dashboard/business-units
```

### **Production (when deployed):**
```
Industry Landing:
https://app.payaid.in/
https://app.payaid.in/?industry=restaurant

Business Units:
https://app.payaid.in/dashboard/business-units
```

---

## 📋 **Step-by-Step Testing**

### **Test Industry Landing Pages:**

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Open browser:**
   ```
   http://localhost:3000/
   ```

3. **Test industry selection:**
   - Scroll to "What industry is your business in?"
   - Click "Restaurant" card
   - Verify hero changes to restaurant-specific content
   - Verify modules list shows: CRM, Finance, Inventory, Sales, AI Studio
   - Verify features list shows restaurant features

4. **Test URL parameter:**
   - Change URL to: `http://localhost:3000/?industry=retail`
   - Verify Retail is auto-selected
   - Verify content updates

5. **Test signup:**
   - Select an industry
   - Click "Get Started with [Industry] Setup"
   - Verify redirect to signup with industry parameter

---

### **Test Business Unit Management:**

1. **Login to dashboard:**
   ```
   http://localhost:3000/login
   ```

2. **Navigate to Business Units:**
   - Option 1: Sidebar → Industries → Business Units
   - Option 2: Direct URL: `/dashboard/business-units`

3. **Create a test unit:**
   - Click "Create Business Unit"
   - Name: "Test Restaurant"
   - Location: "Mumbai"
   - Select: Restaurant industry pack
   - Click "Create Unit"

4. **Verify creation:**
   - Unit appears in grid
   - Shows Restaurant badge
   - Shows location with map icon

5. **Test edit:**
   - Click "Edit"
   - Change name to "Test Restaurant - Updated"
   - Add Retail industry pack
   - Save
   - Verify both Restaurant and Retail badges show

6. **Test delete:**
   - Click "Delete"
   - Confirm
   - Verify unit is removed

---

## 🎯 **All Available Industries**

Test these industry IDs in the URL parameter:

- `restaurant` 🍽️
- `retail` 🛍️
- `manufacturing` 🏭
- `healthcare` 🏥
- `education` 🎓
- `real-estate` 🏠

(More industries defined in `lib/industries/config.ts`)

---

## ✅ **Verification Checklist**

### **Industry Landing Page:**
- [ ] Page loads at `/`
- [ ] Industry grid displays all industries
- [ ] Clicking industry updates hero section
- [ ] Clicking industry updates modules list
- [ ] Clicking industry updates features list
- [ ] URL parameter `?industry=restaurant` works
- [ ] URL parameter `?industry=retail` works
- [ ] "Get Started" button includes industry
- [ ] Signup redirect includes industry parameter
- [ ] Mobile responsive design works

### **Business Units:**
- [ ] Page accessible at `/dashboard/business-units`
- [ ] Shows in sidebar navigation
- [ ] Empty state displays correctly
- [ ] Create button opens modal
- [ ] Form validation works (name required)
- [ ] Industry packs can be selected
- [ ] Location field is optional
- [ ] Create successfully creates unit
- [ ] Unit displays with correct data
- [ ] Edit button works
- [ ] Edit form pre-fills data
- [ ] Save updates unit
- [ ] Delete button works
- [ ] Delete confirmation works
- [ ] Unit removed after deletion

---

## 🐛 **Troubleshooting**

### **Business Units not in sidebar?**
- Check `components/layout/sidebar.tsx` line ~147
- Should be in "Industries" section
- Refresh page after changes

### **Industry landing page not working?**
- Check `app/page.tsx` exists
- Verify `lib/industries/config.ts` is imported
- Check browser console for errors

### **Business Units page 404?**
- Verify route: `app/dashboard/business-units/page.tsx` exists
- Check authentication is working
- Verify API endpoint: `/api/business-units`

---

## 📝 **Summary**

**Industry Landing Pages:**
- **Route:** `/` (root)
- **Test:** Select industries, verify dynamic content

**Business Unit Management:**
- **Route:** `/dashboard/business-units`
- **Access:** Sidebar → Industries → Business Units
- **Test:** Create, edit, delete units with industry packs

**Both are ready for testing!** 🎉



