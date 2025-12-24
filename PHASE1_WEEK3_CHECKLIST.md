# Phase 1 - Week 3 Checklist

**Date:** December 2025  
**Week:** Week 3 of Phase 1  
**Focus:** Testing, Migration, and Production Readiness

---

## 📋 Week 3 Overview

Week 3 is dedicated to:
1. Integration testing
2. Database migration
3. Final QA & documentation
4. Production deployment preparation

---

## ✅ Day 1-2: Integration Testing

### Backend API Testing

- [ ] **Test 1.1:** Licensed module access (should pass)
  - [ ] Test `/api/contacts` with CRM license → 200 OK
  - [ ] Test `/api/invoices` with Invoicing license → 200 OK
  - [ ] Test `/api/hr/employees` with HR license → 200 OK
  - [ ] Test `/api/accounting/expenses` with Accounting license → 200 OK
  - [ ] Test `/api/whatsapp/accounts` with WhatsApp license → 200 OK

- [ ] **Test 1.2:** Unlicensed module access (should fail)
  - [ ] Test `/api/contacts` without CRM license → 403 Forbidden
  - [ ] Test `/api/invoices` without Invoicing license → 403 Forbidden
  - [ ] Test `/api/hr/employees` without HR license → 403 Forbidden
  - [ ] Verify error message includes module ID
  - [ ] Verify error code is `MODULE_NOT_LICENSED`

- [ ] **Test 1.3:** Missing/invalid token
  - [ ] Test API without token → 403 Forbidden
  - [ ] Test API with invalid token → 403 Forbidden
  - [ ] Test API with expired token → 403 Forbidden

- [ ] **Test 1.4:** All protected routes
  - [ ] Test all 10 protected routes with licenses
  - [ ] Test all 10 protected routes without licenses
  - [ ] Document any failures

### JWT Token Testing

- [ ] **Test 2.1:** Token contains licensing info
  - [ ] Login and decode JWT
  - [ ] Verify `licensedModules` array present
  - [ ] Verify `subscriptionTier` present
  - [ ] Verify values match tenant data

- [ ] **Test 2.2:** Token updates after license change
  - [ ] Login before license change
  - [ ] Admin adds license
  - [ ] Login again
  - [ ] Verify new token includes license

### Frontend Testing

- [ ] **Test 3.1:** Sidebar filtering
  - [ ] Login with limited licenses
  - [ ] Verify only licensed modules visible
  - [ ] Verify locked modules show 🔒 badge
  - [ ] Verify click on locked module shows upgrade prompt

- [ ] **Test 3.2:** ModuleGate component
  - [ ] Test `/dashboard/contacts` without CRM license
  - [ ] Test `/dashboard/invoices` without Invoicing license
  - [ ] Verify upgrade prompt shown
  - [ ] Verify upgrade button works

- [ ] **Test 3.3:** Licensed page access
  - [ ] Test `/dashboard/contacts` with CRM license
  - [ ] Test `/dashboard/invoices` with Invoicing license
  - [ ] Verify pages load correctly
  - [ ] Verify full functionality available

- [ ] **Test 3.4:** usePayAidAuth hook
  - [ ] Test `hasModule()` function
  - [ ] Test `hasAnyModule()` function
  - [ ] Test `hasAllModules()` function
  - [ ] Verify hook returns correct values

### Admin Panel Testing

- [ ] **Test 4.1:** Access control
  - [ ] Test admin panel with admin user → should work
  - [ ] Test admin panel with regular user → should deny
  - [ ] Test admin panel with owner → should work

- [ ] **Test 4.2:** License toggle
  - [ ] Activate license via admin panel
  - [ ] Verify license appears in list
  - [ ] Verify API access works after activation
  - [ ] Remove license via admin panel
  - [ ] Verify license removed from list
  - [ ] Verify API access blocked after removal

- [ ] **Test 4.3:** API endpoint
  - [ ] Test GET `/api/admin/tenants/[id]/modules`
  - [ ] Test PATCH `/api/admin/tenants/[id]/modules`
  - [ ] Verify non-admin gets 403

### Integration Testing

- [ ] **Test 5.1:** End-to-end flow
  - [ ] User without license tries to access module
  - [ ] Admin grants license
  - [ ] User refreshes and can access module
  - [ ] Verify all steps work correctly

- [ ] **Test 5.2:** Multiple modules
  - [ ] Test user with multiple licenses
  - [ ] Verify all licensed modules accessible
  - [ ] Verify unlicensed modules blocked

---

## ✅ Day 3-4: Database Migration

### Pre-Migration

- [ ] **Backup Database**
  - [ ] Create full database backup
  - [ ] Verify backup file exists
  - [ ] Test backup restore (optional)

- [ ] **Review Schema**
  - [ ] Review `prisma/schema.prisma` changes
  - [ ] Understand new fields and models
  - [ ] Document any concerns

### Migration Execution

- [ ] **Generate Prisma Client**
  ```bash
  npx prisma generate
  ```
  - [ ] Verify no errors
  - [ ] Verify client generated

- [ ] **Create Migration**
  ```bash
  npx prisma migrate dev --name add_licensing_layer
  ```
  - [ ] Verify migration file created
  - [ ] Verify migration applied
  - [ ] Check for any errors

- [ ] **Verify Migration**
  - [ ] Check `Tenant` table has new fields
  - [ ] Check new tables exist (`Subscription`, `ModuleDefinition`, etc.)
  - [ ] Verify indexes created
  - [ ] Test Prisma client works

### Seed Data

- [ ] **Seed Module Definitions**
  ```bash
  npx tsx scripts/seed-modules.ts
  ```
  - [ ] Verify all 6 modules seeded
  - [ ] Check database for module records
  - [ ] Verify module data correct

- [ ] **Grant Initial Licenses (Optional)**
  - [ ] Grant test licenses to test tenants
  - [ ] Verify licenses saved correctly

### Post-Migration Verification

- [ ] **Test API Routes**
  - [ ] Test protected routes work
  - [ ] Test license checking works
  - [ ] Verify no errors in logs

- [ ] **Test Frontend**
  - [ ] Login and check sidebar
  - [ ] Test module access
  - [ ] Verify no console errors

- [ ] **Check Logs**
  - [ ] Review application logs
  - [ ] Check for Prisma errors
  - [ ] Check for migration errors

---

## ✅ Day 5: Final QA & Documentation

### Documentation

- [ ] **Update HANDOVER.md**
  - [ ] Add Phase 1 completion status
  - [ ] Document licensing system
  - [ ] Add migration notes

- [ ] **Create Runbook**
  - [ ] Step-by-step deployment guide
  - [ ] Rollback procedures
  - [ ] Monitoring checklist
  - [ ] Communication plan

- [ ] **Document Changes**
  - [ ] Database schema changes
  - [ ] API behavior changes
  - [ ] Frontend changes
  - [ ] Testing results

### Final QA

- [ ] **Internal Testing**
  - [ ] 5 team members test all flows
  - [ ] Document any issues
  - [ ] Fix critical bugs
  - [ ] Sign off on testing

- [ ] **Performance Check**
  - [ ] Check API response times
  - [ ] Check database query performance
  - [ ] Verify no performance regressions

- [ ] **Security Audit**
  - [ ] Verify license checks can't be bypassed
  - [ ] Check JWT token security
  - [ ] Verify admin panel access control

### Production Preparation

- [ ] **Staging Deployment**
  - [ ] Deploy to staging environment
  - [ ] Run full test suite on staging
  - [ ] Verify all tests pass
  - [ ] Get stakeholder approval

- [ ] **Production Checklist**
  - [ ] Create production backup
  - [ ] Schedule maintenance window (if needed)
  - [ ] Prepare rollback plan
  - [ ] Notify team of deployment

---

## 📊 Testing Results Summary

### Test Results

| Test Suite | Status | Notes |
|------------|--------|-------|
| Backend API | ⬜ | |
| JWT Tokens | ⬜ | |
| Frontend | ⬜ | |
| Admin Panel | ⬜ | |
| Integration | ⬜ | |

### Issues Found

- [ ] Issue 1: [Description]
- [ ] Issue 2: [Description]
- [ ] Issue 3: [Description]

### Critical Bugs

- [ ] Bug 1: [Description] - Status: [Fixed/Pending]
- [ ] Bug 2: [Description] - Status: [Fixed/Pending]

---

## 🎯 Success Criteria

Week 3 is complete when:

- ✅ All integration tests pass
- ✅ Database migration successful
- ✅ Module definitions seeded
- ✅ All documentation updated
- ✅ Internal testing complete
- ✅ No critical bugs remaining
- ✅ Staging deployment successful
- ✅ Production deployment plan ready

---

## 🚀 Go-Live Decision

**Ready for Production:** ⬜ Yes / ⬜ No

**If No, reason:**
- [ ] Critical bugs not fixed
- [ ] Tests failing
- [ ] Migration issues
- [ ] Other: _______________

**If Yes:**
- [ ] Production deployment scheduled
- [ ] Team notified
- [ ] Rollback plan ready
- [ ] Monitoring in place

---

## 📝 Notes

_Add any additional notes, observations, or concerns here:_

---

**Week 3 Status:** ⬜ In Progress / ⬜ Complete  
**Next Phase:** Phase 2 - Module Separation (Weeks 4-10)
