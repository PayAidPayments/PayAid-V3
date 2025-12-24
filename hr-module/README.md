# PayAid HR Module

**Status:** ⏳ **IN PROGRESS**  
**Purpose:** HR functionality including employees, payroll, attendance, leave management, and hiring

This is the HR module that will be extracted into a separate repository (`payaid-hr`) in Phase 2.

---

## 📁 **Structure**

```
hr-module/
├── app/
│   ├── api/
│   │   └── hr/                  # HR endpoints
│   │       ├── employees/       # Employee management
│   │       ├── payroll/         # Payroll management
│   │       ├── attendance/      # Attendance tracking
│   │       ├── leave/           # Leave management
│   │       ├── departments/    # Department management
│   │       ├── designations/   # Designation management
│   │       ├── locations/      # Location management
│   │       └── hiring/         # Hiring & recruitment
│   └── dashboard/
│       └── hr/                  # HR pages
└── lib/
    └── hr/                      # HR-specific utilities
```

---

## 🔧 **Setup**

This module uses shared packages from `packages/@payaid/*`.

**Note:** This is a template structure. In the actual Phase 2 implementation, this will be a separate Next.js repository.

---

## 📋 **Routes**

### **Employee Routes:**
- `GET /api/hr/employees` - List all employees
- `POST /api/hr/employees` - Create a new employee
- `GET /api/hr/employees/[id]` - Get an employee
- `PATCH /api/hr/employees/[id]` - Update an employee
- `DELETE /api/hr/employees/[id]` - Delete an employee
- `POST /api/hr/employees/bulk-import` - Bulk import employees

### **Payroll Routes:**
- `GET /api/hr/payroll/cycles` - List payroll cycles
- `POST /api/hr/payroll/cycles` - Create payroll cycle
- `GET /api/hr/payroll/runs` - List payroll runs
- `POST /api/hr/payroll/calculate` - Calculate payroll

### **Attendance Routes:**
- `POST /api/hr/attendance/check-in` - Check in
- `POST /api/hr/attendance/check-out` - Check out
- `GET /api/hr/attendance/records` - Get attendance records
- `GET /api/hr/attendance/calendar` - Get attendance calendar

### **Leave Routes:**
- `GET /api/hr/leave/requests` - List leave requests
- `POST /api/hr/leave/requests` - Create leave request
- `GET /api/hr/leave/balances` - Get leave balances
- `GET /api/hr/leave/policies` - Get leave policies

### **Other Routes:**
- `GET/POST /api/hr/departments/*` - Department management
- `GET/POST /api/hr/designations/*` - Designation management
- `GET/POST /api/hr/locations/*` - Location management
- `GET/POST /api/hr/job-requisitions/*` - Job requisitions
- `GET/POST /api/hr/candidates/*` - Candidate management
- `GET/POST /api/hr/interviews/*` - Interview management

---

## 🔐 **Module Access**

All routes require the `hr` module license. Routes use `requireModuleAccess(request, 'hr')` from `@payaid/auth`.

---

**Status:** ⏳ **IN PROGRESS**

