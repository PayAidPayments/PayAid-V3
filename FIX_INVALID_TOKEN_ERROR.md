# 🔧 Fix "Invalid or expired token" Error

## 🎯 Problem

You're seeing this error when using the chat feature:
```
Error: Invalid or expired token
```

## 🔍 Root Cause

The JWT token in your browser was signed with a **different JWT_SECRET** (or no secret) before we added the environment variables to Vercel. Now that `JWT_SECRET` is configured in Vercel, your old token is invalid.

## ✅ Solution: Log Out and Log Back In

**Simple Fix (30 seconds):**

1. **Log out** from the application
2. **Log back in** with your credentials
3. This will generate a new token signed with the correct `JWT_SECRET`
4. The chat feature should now work

### Steps:

1. Click on your profile/user menu
2. Click "Logout" or "Sign Out"
3. Go to the login page
4. Enter your credentials and log in again
5. Try the chat feature - it should work now!

---

## 🔄 Alternative: Clear Browser Storage

If logging out doesn't work, clear your browser's local storage:

1. Open browser DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Find **Local Storage** → `http://payaid-v3.vercel.app`
4. Delete all items (or just the `token` item)
5. Refresh the page
6. Log in again

---

## 🛠️ Technical Details

### What Happened:

1. **Before:** JWT tokens were signed with default/old `JWT_SECRET` or no secret
2. **After:** We added `JWT_SECRET` to Vercel environment variables
3. **Result:** Old tokens can't be verified with the new secret

### Token Verification Flow:

```
Frontend → Sends token in Authorization header
         ↓
Backend → Verifies token with JWT_SECRET
         ↓
If secret doesn't match → "Invalid or expired token" error
```

---

## ✅ Verification

After logging back in:

1. **Test Chat:**
   - Go to Dashboard → AI Chat
   - Try asking: "Analyze my revenue and provide insights"
   - Should work without errors

2. **Check Token:**
   - Open browser DevTools → Application → Local Storage
   - You should see a new `token` value
   - This token is signed with the correct `JWT_SECRET`

---

## 🐛 If Still Not Working

1. **Check Vercel Logs:**
   ```bash
   vercel logs payaid-v3.vercel.app
   ```
   Look for JWT verification errors

2. **Verify JWT_SECRET is Set:**
   ```bash
   vercel env ls
   ```
   Should show `JWT_SECRET` in the list

3. **Test Token Locally:**
   - Pull environment variables: `vercel env pull .env.production`
   - Check if `JWT_SECRET` is in the file

4. **Clear All Cookies:**
   - In browser, clear cookies for `payaid-v3.vercel.app`
   - Log in again

---

## 📋 Quick Checklist

- [ ] Logged out from application
- [ ] Logged back in with credentials
- [ ] New token generated (check Local Storage)
- [ ] Chat feature tested and working
- [ ] No more "Invalid or expired token" errors

---

## 🎉 Expected Result

After logging back in:
- ✅ Chat feature works
- ✅ All API calls succeed
- ✅ No token errors
- ✅ Full application functionality restored

---

**Time to Fix:** ~30 seconds (just log out and log back in)
**Difficulty:** Easy
**Status:** Ready to Fix

