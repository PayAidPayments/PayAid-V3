# Productivity Suite - Testing Guide

**Purpose:** Comprehensive testing guide for the Productivity Suite features  
**Date:** January 2025

---

## 🧪 Testing Overview

This guide provides step-by-step instructions for testing all Productivity Suite features after deployment.

---

## 📋 Pre-Testing Checklist

- [ ] Logged in to the application
- [ ] Database migration completed (`npm run db:push`)
- [ ] Production URL accessible: https://payaid-v3.vercel.app
- [ ] Browser console open (F12) to check for errors

---

## 1️⃣ Spreadsheet Module Testing

### Test 1.1: Create New Spreadsheet
1. Navigate to `/dashboard/spreadsheets`
2. Click "New Spreadsheet" button
3. Enter a name: "Test Spreadsheet"
4. Select a template (e.g., "Blank")
5. Click "Create"
6. **Expected:** Redirected to editor with empty spreadsheet

### Test 1.2: Edit Spreadsheet
1. In the spreadsheet editor, click on cell A1
2. Type "Hello World"
3. Press Enter
4. **Expected:** Value appears in cell A1

### Test 1.3: Save Spreadsheet
1. Make changes to the spreadsheet
2. Click "Save" button
3. **Expected:** Success message or no error
4. Refresh the page
5. **Expected:** Changes persist

### Test 1.4: Export to CSV
1. Add some data to the spreadsheet
2. Click "Export" button
3. **Expected:** CSV file downloads with correct data

### Test 1.5: Use Templates
1. Create new spreadsheet
2. Select "GST Invoice" template
3. **Expected:** Pre-filled invoice structure appears

### Test 1.6: List Spreadsheets
1. Navigate to `/dashboard/spreadsheets`
2. **Expected:** All created spreadsheets appear in list
3. Click on a spreadsheet
4. **Expected:** Opens in editor

---

## 2️⃣ Document Module Testing

### Test 2.1: Create New Document
1. Navigate to `/dashboard/docs`
2. Click "New Document" button
3. Enter a name: "Test Document"
4. Select a template (e.g., "Blank")
5. Click "Create"
6. **Expected:** Redirected to editor with empty document

### Test 2.2: Edit Document
1. In the document editor, type some text
2. Select text and click "Bold" button
3. **Expected:** Text becomes bold
4. Add a heading using heading buttons
5. **Expected:** Heading appears with correct styling

### Test 2.3: Save Document
1. Make changes to the document
2. Click "Save" button
3. **Expected:** Success or no error
4. Refresh the page
5. **Expected:** Changes persist

### Test 2.4: Use Templates
1. Create new document
2. Select "Business Proposal" template
3. **Expected:** Pre-filled proposal structure appears

### Test 2.5: List Documents
1. Navigate to `/dashboard/docs`
2. **Expected:** All created documents appear in list
3. Click on a document
4. **Expected:** Opens in editor

---

## 3️⃣ Drive Module Testing

### Test 3.1: Upload File
1. Navigate to `/dashboard/drive`
2. Click "Upload" button
3. Select a file (e.g., image, PDF, document)
4. **Expected:** 
   - Upload progress appears
   - File appears in list after upload
   - Storage usage updates

### Test 3.2: Create Folder
1. Click "New Folder" button
2. Enter folder name: "Test Folder"
3. **Expected:** Folder appears in list

### Test 3.3: View Modes
1. Toggle between Grid and List view
2. **Expected:** Files display correctly in both modes

### Test 3.4: Storage Usage
1. Check storage usage indicator
2. **Expected:** Shows correct usage (e.g., "5 MB / 50 GB")
3. Upload more files
4. **Expected:** Usage updates correctly

### Test 3.5: Search Files
1. Use search bar to find a file
2. **Expected:** Only matching files appear

---

## 4️⃣ Slides Module Testing

### Test 4.1: Create New Presentation
1. Navigate to `/dashboard/slides`
2. Click "New Presentation" button
3. Enter a name: "Test Presentation"
4. Select a template
5. Click "Create"
6. **Expected:** Redirected to editor with first slide

### Test 4.2: Add Slide
1. Click "Add Slide" button
2. **Expected:** New slide appears in sidebar

### Test 4.3: Edit Slide Content
1. Click on a slide in the sidebar
2. Edit the title or content
3. **Expected:** Changes appear in main canvas

### Test 4.4: Delete Slide
1. Click delete button on a slide
2. **Expected:** Slide is removed (if more than 1 slide exists)

### Test 4.5: Save Presentation
1. Make changes
2. Click "Save" button
3. **Expected:** Success or no error
4. Refresh page
5. **Expected:** Changes persist

---

## 5️⃣ Meet Module Testing

### Test 5.1: Start Instant Meeting
1. Navigate to `/dashboard/meet`
2. Click "Start Instant Meeting"
3. **Expected:** Redirected to meeting room

### Test 5.2: Join Meeting
1. Navigate to `/dashboard/meet/new`
2. Enter a meeting code (if you have one)
3. Click "Join Meeting"
4. **Expected:** Redirected to meeting room

### Test 5.3: Meeting Controls
1. In meeting room, test:
   - Video toggle button
   - Audio toggle button
   - Screen share button
   - Leave meeting button
2. **Expected:** All buttons respond correctly

---

## 🔍 Error Testing

### Test Error Handling
1. **Without Authentication:**
   - Log out
   - Try to access `/dashboard/spreadsheets`
   - **Expected:** Redirected to login

2. **Invalid API Calls:**
   - Open browser console
   - Try to create item without token
   - **Expected:** Error message displayed

3. **Network Errors:**
   - Disconnect internet
   - Try to save
   - **Expected:** Error message displayed

---

## 📊 Performance Testing

### Test Load Times
1. Navigate to each module
2. Check page load time
3. **Expected:** Pages load in < 3 seconds

### Test Large Files
1. Upload a large file (> 10MB) to Drive
2. **Expected:** Upload completes successfully

### Test Many Items
1. Create 20+ spreadsheets/documents
2. Navigate to list page
3. **Expected:** Page loads without issues

---

## ✅ Success Criteria

All tests should pass:
- [x] Can create items in all modules
- [x] Can edit items in all modules
- [x] Can save changes
- [x] Data persists after refresh
- [x] No console errors
- [x] No API errors
- [x] Authentication works
- [x] Error handling works
- [x] UI is responsive
- [x] All buttons functional

---

## 🐛 Common Issues & Solutions

### Issue: "Unauthorized" errors
**Solution:** Check that you're logged in and token is valid

### Issue: "Failed to save"
**Solution:** Check browser console for detailed error, verify API endpoint is accessible

### Issue: Files not uploading
**Solution:** Check file size limits, verify upload endpoint is working

### Issue: Data not persisting
**Solution:** Check database connection, verify API is saving correctly

---

## 📝 Test Results Template

```
Date: __________
Tester: __________

Spreadsheet Module:
- Create: [ ] Pass [ ] Fail
- Edit: [ ] Pass [ ] Fail
- Save: [ ] Pass [ ] Fail
- Export: [ ] Pass [ ] Fail

Document Module:
- Create: [ ] Pass [ ] Fail
- Edit: [ ] Pass [ ] Fail
- Save: [ ] Pass [ ] Fail

Drive Module:
- Upload: [ ] Pass [ ] Fail
- Create Folder: [ ] Pass [ ] Fail
- Storage Display: [ ] Pass [ ] Fail

Slides Module:
- Create: [ ] Pass [ ] Fail
- Edit: [ ] Pass [ ] Fail
- Save: [ ] Pass [ ] Fail

Meet Module:
- Start Meeting: [ ] Pass [ ] Fail
- Join Meeting: [ ] Pass [ ] Fail

Overall Status: [ ] All Pass [ ] Issues Found

Notes:
_______________________________________
_______________________________________
```

---

## 🎯 Next Steps After Testing

1. **If All Tests Pass:**
   - ✅ Productivity Suite is ready for users
   - Document any edge cases found
   - Plan for future enhancements

2. **If Issues Found:**
   - Document the issue
   - Check Vercel logs
   - Verify database connection
   - Test API endpoints directly
   - Fix and redeploy if needed

---

**Happy Testing! 🚀**

