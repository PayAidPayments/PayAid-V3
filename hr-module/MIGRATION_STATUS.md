# HR Module - Migration Status

**Status:** ⏳ **IN PROGRESS**  
**Date:** Week 6

---

## ✅ **Completed Routes**

### **Employees**
- ✅ `GET /api/hr/employees` - List all employees
- ✅ `POST /api/hr/employees` - Create a new employee
- ✅ `GET /api/hr/employees/[id]` - Get an employee
- ✅ `PATCH /api/hr/employees/[id]` - Update an employee
- ✅ `DELETE /api/hr/employees/[id]` - Delete an employee (soft delete)
- ⏳ `POST /api/hr/employees/bulk-import` - Bulk import employees

---

## ⏳ **Pending Routes**

### **Payroll**
- ⏳ `GET /api/hr/payroll/cycles` - List payroll cycles
- ⏳ `POST /api/hr/payroll/cycles` - Create payroll cycle
- ⏳ `GET /api/hr/payroll/runs` - List payroll runs
- ⏳ `POST /api/hr/payroll/calculate` - Calculate payroll
- ⏳ `GET /api/hr/payroll/reports` - Payroll reports

### **Attendance**
- ✅ `POST /api/hr/attendance/check-in` - Check in
- ✅ `POST /api/hr/attendance/check-out` - Check out
- ⏳ `GET /api/hr/attendance/records` - Get attendance records
- ⏳ `GET /api/hr/attendance/calendar` - Get attendance calendar
- ⏳ `POST /api/hr/attendance/biometric-import` - Biometric import

### **Leave**
- ⏳ `GET /api/hr/leave/requests` - List leave requests
- ⏳ `POST /api/hr/leave/requests` - Create leave request
- ⏳ `GET /api/hr/leave/balances` - Get leave balances
- ⏳ `GET /api/hr/leave/policies` - Get leave policies
- ⏳ `GET /api/hr/leave/types` - Get leave types

### **Other HR Routes**
- ⏳ `GET/POST /api/hr/departments/*` - Department management
- ⏳ `GET/POST /api/hr/designations/*` - Designation management
- ⏳ `GET/POST /api/hr/locations/*` - Location management
- ⏳ `GET/POST /api/hr/job-requisitions/*` - Job requisitions
- ⏳ `GET/POST /api/hr/candidates/*` - Candidate management
- ⏳ `GET/POST /api/hr/interviews/*` - Interview management
- ⏳ `GET/POST /api/hr/offers/*` - Offer management
- ⏳ `GET/POST /api/hr/onboarding/*` - Onboarding management
- ⏳ `GET/POST /api/hr/tax-declarations/*` - Tax declarations

---

## 📝 **Migration Notes**

1. **Imports Updated:**
   - ✅ Changed `@/lib/middleware/license` → `@payaid/auth`
   - ✅ Using `requireModuleAccess` and `handleLicenseError` from `@payaid/auth`

2. **Module License:**
   - Uses `hr` module ID
   - All routes require `requireModuleAccess(request, 'hr')`

3. **Still Using:**
   - `@/lib/db/prisma` - For HR models
   - Other shared utilities from monorepo root

4. **Next Steps:**
   - Migrate remaining employee routes
   - Migrate payroll routes
   - Migrate attendance routes
   - Migrate leave routes
   - Migrate other HR routes

---

**Status:** ⏳ **IN PROGRESS**

