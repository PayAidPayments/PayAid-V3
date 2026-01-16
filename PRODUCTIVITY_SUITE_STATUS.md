# Productivity Suite Modules - Status & Strategy

**Date:** January 2026  
**Status:** 📋 **PRODUCTIVITY SUITE ANALYSIS**

---

## 📊 **Productivity Suite Modules Overview**

According to `lib/modules.config.ts`, the Productivity Suite includes:

| Module | Current URL | Status | Category |
|--------|-------------|--------|----------|
| **Spreadsheet** | `/dashboard/spreadsheets` | ⚠️ **NOT FOUND** | Productivity |
| **Docs** | `/dashboard/docs` | ✅ **EXISTS** | Productivity |
| **Drive** | `/dashboard/drive` | ✅ **EXISTS** | Productivity |
| **Slides** | `/dashboard/slides` | ✅ **EXISTS** | Productivity |
| **Meet** | `/dashboard/meet` | ⚠️ **NOT FOUND** | Productivity |

---

## 🎯 **Key Question: Should Productivity Suite Be Decoupled?**

### **Analysis:**

**Productivity Suite Characteristics:**
- These are **tools/apps** (like Google Workspace)
- They are **standalone applications** (not business modules)
- They can be **used across all modules** (Docs for CRM, Finance, etc.)
- They are **collaborative tools** (not module-specific)

### **Recommendation: Two Approaches**

#### **Option A: Keep in Dashboard (Recommended)**
**Rationale:**
- Productivity tools are **cross-module utilities**
- They don't need separate subdomains
- They can be accessed from any module
- Simpler architecture for tools

**Structure:**
```
/dashboard/spreadsheets - Spreadsheet app
/dashboard/docs - Docs app
/dashboard/drive - Drive app
/dashboard/slides - Slides app
/dashboard/meet - Meet app
```

**Benefits:**
- ✅ Simpler architecture
- ✅ Accessible from all modules
- ✅ No need for separate apps
- ✅ Shared storage and collaboration

#### **Option B: Decouple as Separate Modules**
**Rationale:**
- Follows decoupled architecture pattern
- Each tool is independent
- Can be deployed separately

**Structure:**
```
/spreadsheet/[tenantId]/Home/ - Spreadsheet module
/docs/[tenantId]/Home/ - Docs module
/drive/[tenantId]/Home/ - Drive module
/slides/[tenantId]/Home/ - Slides module
/meet/[tenantId]/Home/ - Meet module
```

**Drawbacks:**
- ❌ More complex (5 additional modules)
- ❌ Overkill for productivity tools
- ❌ Harder to share documents across modules

---

## ✅ **Recommended Approach: Keep in Dashboard**

### **Why:**
1. **Productivity tools are utilities**, not business modules
2. **Cross-module access** - Users need to access Docs from CRM, Finance, etc.
3. **Shared storage** - Drive should be accessible from all modules
4. **Simpler architecture** - No need for separate subdomains for tools

### **Implementation:**
- Keep productivity suite in `/dashboard/` structure
- Add **"Open in Docs"**, **"Open in Spreadsheet"** buttons in modules
- Add **Module Switcher** to productivity pages (to navigate back to business modules)
- Ensure productivity tools are accessible from all modules

---

## 📋 **Current Status of Productivity Suite**

### **1. Spreadsheet** ⚠️
- **Status:** ⚠️ **NOT FOUND**
- **Expected:** `/dashboard/spreadsheets/page.tsx`
- **Action:** Create Spreadsheet app if needed

### **2. Docs** ✅
- **Status:** ✅ **EXISTS**
- **Location:** `/dashboard/docs/page.tsx`
- **Files:**
  - `app/dashboard/docs/page.tsx` - Docs list
  - `app/dashboard/docs/new/page.tsx` - New doc
  - `app/dashboard/docs/[id]/page.tsx` - Doc editor
- **Action:** Verify functionality, add Module Switcher

### **3. Drive** ✅
- **Status:** ✅ **EXISTS**
- **Location:** `/dashboard/drive/page.tsx`
- **Files:**
  - `app/dashboard/drive/page.tsx` - Drive file manager
- **Action:** Verify functionality, add Module Switcher

### **4. Slides** ✅
- **Status:** ✅ **EXISTS**
- **Location:** `/dashboard/slides/page.tsx`
- **Files:**
  - `app/dashboard/slides/page.tsx` - Slides list
  - `app/dashboard/slides/new/page.tsx` - New slide
  - `app/dashboard/slides/[id]/page.tsx` - Slide editor
- **Action:** Verify functionality, add Module Switcher

### **5. Meet** ⚠️
- **Status:** ⚠️ **NOT FOUND**
- **Expected:** `/dashboard/meet/page.tsx`
- **Action:** Create Meet app if needed

---

## 🔄 **What Needs to Be Done**

### **Priority 1: Verify Existing Apps**
- [ ] Verify Docs functionality
- [ ] Verify Drive functionality
- [ ] Verify Slides functionality
- [ ] Add Module Switcher to productivity pages (for navigation back to business modules)

### **Priority 2: Create Missing Apps**
- [ ] Create Spreadsheet app (`/dashboard/spreadsheets/page.tsx`)
- [ ] Create Meet app (`/dashboard/meet/page.tsx`)

### **Priority 3: Integration**
- [ ] Add "Open in Docs" buttons in business modules
- [ ] Add "Open in Spreadsheet" buttons in business modules
- [ ] Ensure Drive is accessible from all modules
- [ ] Add productivity tools to Module Switcher (as "Tools" section)

---

## 📊 **Productivity Suite vs Business Modules**

| Aspect | Business Modules | Productivity Suite |
|--------|-----------------|-------------------|
| **Purpose** | Business operations (CRM, Finance, Sales) | Productivity tools (Docs, Spreadsheets) |
| **Decoupling** | ✅ Should be decoupled | ❌ Can stay in dashboard |
| **Subdomain** | ✅ Separate subdomain | ❌ Not needed |
| **Access** | Module-specific | Cross-module |
| **Navigation** | Module-specific top bar | Dashboard sidebar or Module Switcher |

---

## 🎯 **Final Recommendation**

**Keep Productivity Suite in Dashboard:**
- ✅ Productivity tools are **utilities**, not business modules
- ✅ They need **cross-module access**
- ✅ Simpler architecture
- ✅ No need for separate subdomains

**Add Module Switcher to Productivity Pages:**
- Allow users to navigate back to business modules
- Show current module context
- Enable seamless switching

**Integration Points:**
- Add "Create Document" buttons in business modules
- Add "Open in Spreadsheet" for data export
- Add Drive file picker in business modules
- Add "Schedule Meeting" from any module

---

## 📋 **Pending Tasks for Productivity Suite**

### **Quick Tasks:**
1. Add Module Switcher to Docs, Drive, Slides pages
2. Verify all productivity apps are functional
3. Create Spreadsheet app (if missing)
4. Create Meet app (if missing)

### **Integration Tasks:**
1. Add productivity tool shortcuts in business modules
2. Add file picker integration (Drive)
3. Add document creation from business modules
4. Add meeting scheduling from business modules

---

**Status:** 🟡 **Productivity Suite can remain in dashboard structure (not decoupled)**

**Action Required:** Verify functionality and add Module Switcher for navigation

