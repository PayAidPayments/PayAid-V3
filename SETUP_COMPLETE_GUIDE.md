# Email & Chat Services - Complete Setup Guide

## ✅ Current Status

**Implementation:** 100% Complete  
**Schema:** Valid ✅  
**Files:** All created ✅  
**Ready for:** Database seeding and testing

---

## 🚀 Step-by-Step Setup Instructions

### Step 1: Stop Dev Server (if running)
```bash
# Press Ctrl+C in the terminal where dev server is running
# OR close the terminal window
```

**Why:** Prisma client files are locked when the dev server is running.

---

### Step 2: Wait 5 Seconds
Allow file locks to release completely.

---

### Step 3: Regenerate Prisma Client
```bash
npx prisma generate
```

**Expected Output:**
```
✔ Generated Prisma Client (5.22.0) to .\node_modules\@prisma\client in XXXms
```

**If you get a file lock error:**
- Wait 10 more seconds
- Close any IDE/editor that might have Prisma files open
- Try again

---

### Step 4: Push Schema to Database (if needed)
```bash
npx prisma db push
```

**Expected Output:**
```
Your database is now in sync with your Prisma schema.
```

**Note:** This is only needed if the database schema is out of sync. If you've already run this, you can skip.

---

### Step 5: Seed the Database
```bash
npm run db:seed
```

**Expected Output:**
```
🌱 Seeding database with comprehensive demo data...
...
✅ Email & Chat Services seeding completed!
  - 2 Email Accounts
  - 3 Email Messages
  - 1 Chat Workspace
  - 3 Chat Channels
  - 4 Chat Messages
✅ Multi-Industry seeding completed!
```

**If seeding fails:**
- Check the error message
- Common issues:
  - Foreign key constraints (already fixed in seed script)
  - Unique constraint violations (seed script handles this)
  - Database connection issues

---

### Step 6: Start Dev Server
```bash
npm run dev
```

**Expected Output:**
```
▲ Next.js 14.2.33
- Local:        http://localhost:3000
```

---

## 🧪 Testing the Implementation

### 1. Login
- **URL:** http://localhost:3000/login
- **Email:** `admin@demo.com`
- **Password:** `Test@1234`

### 2. Test Email Service

#### Email Accounts Page
- **URL:** http://localhost:3000/dashboard/email/accounts
- **What to check:**
  - ✅ See 2 email accounts listed
  - ✅ Storage usage bars showing (1.25 GB / 25 GB, 850 MB / 25 GB)
  - ✅ Account status indicators (Active)
  - ✅ IMAP/SMTP server information
  - ✅ "Add Email Account" button works

#### Web Mail Page
- **URL:** http://localhost:3000/dashboard/email/webmail
- **What to check:**
  - ✅ Folder list in sidebar (Inbox, Sent, Drafts, etc.)
  - ✅ 3 sample emails in Inbox
  - ✅ Click email to view full content
  - ✅ "Compose" button opens compose form
  - ✅ Can send test email (simulated)

### 3. Test Chat Service

#### Chat Page
- **URL:** http://localhost:3000/dashboard/chat
- **What to check:**
  - ✅ Channel list in sidebar (#general, #sales, #announcements)
  - ✅ Messages visible in selected channel
  - ✅ Can type and send new messages
  - ✅ "Create Channel" button works
  - ✅ Messages auto-refresh every 5 seconds

---

## 📊 What You'll See After Seeding

### Email Accounts Created:
1. **admin@demobusiness.com**
   - Storage: 1,250 MB / 25,000 MB (5% used)
   - Status: Active
   - User: Admin User

2. **sales@demobusiness.com**
   - Storage: 850 MB / 25,000 MB (3% used)
   - Status: Active
   - User: Admin User

### Email Messages (Inbox):
1. **Inquiry about your services** (Unread)
   - From: customer@example.com
   - Subject: Inquiry about your services
   - Received: 2 days ago

2. **Partnership opportunity** (Read, Starred)
   - From: partner@company.com
   - Subject: Partnership opportunity
   - Received: 1 day ago

3. **Your order has been shipped** (Unread)
   - From: support@vendor.com
   - Subject: Your order has been shipped
   - Received: 6 hours ago

### Chat Workspace:
- **Name:** Demo Business Workspace
- **Channels:**
  - #general (2 messages)
  - #sales (2 messages)
  - #announcements (0 messages)

### Chat Messages:
1. **#general:** "Welcome to the team chat! 👋"
2. **#general:** "Let's discuss the Q4 goals..."
3. **#sales:** "New lead from @contact-1 - TechCorp wants to discuss..."
4. **#sales:** "Great! Let's schedule a call with them this week."

---

## ✅ Verification Checklist

After completing setup, verify:

- [ ] Prisma client generated successfully
- [ ] Database seeded without errors
- [ ] Dev server starts without errors
- [ ] Can login with admin@demo.com
- [ ] Email accounts page loads and shows 2 accounts
- [ ] Web mail page loads and shows 3 emails
- [ ] Can compose and send email (simulated)
- [ ] Chat page loads and shows 3 channels
- [ ] Can see messages in channels
- [ ] Can send new chat messages
- [ ] Can create new channels

---

## 🐛 Troubleshooting

### Issue: "EPERM: operation not permitted" when generating Prisma client
**Solution:**
1. Stop dev server completely
2. Close any IDE/editor windows
3. Wait 10 seconds
4. Try again

### Issue: "Foreign key constraint violated" during seeding
**Solution:**
- The seed script now handles this automatically
- If it still fails, the script deletes related records first
- Check that the deletion order is correct

### Issue: "Unique constraint failed" during seeding
**Solution:**
- The seed script now deletes existing records before creating new ones
- This ensures idempotency (can run multiple times)

### Issue: Pages show "Loading..." indefinitely
**Solution:**
1. Check browser console for errors
2. Verify API routes are working: http://localhost:3000/api/email/accounts
3. Check that authentication is working
4. Verify database connection

### Issue: "Failed to fetch" errors
**Solution:**
1. Check that dev server is running
2. Verify API routes exist in `app/api/`
3. Check network tab in browser DevTools
4. Verify authentication token is valid

---

## 📝 Next Steps After Testing

Once everything is working:

1. **Explore Features:**
   - Create more email accounts
   - Send test emails
   - Create custom email folders
   - Create more chat channels
   - Test @mentions in chat (parsing ready, UI pending)

2. **Integration Testing:**
   - Test email-to-contact linking (when emails are received)
   - Test chat mention parsing
   - Test CRM integration helpers

3. **Enhancements (Optional):**
   - Add WebSocket for real-time chat
   - Add SMTP/IMAP server integration
   - Add file upload for chat attachments
   - Add email search functionality
   - Add @mention autocomplete UI

---

## 🎯 Summary

**Status:** Ready to test ✅

**What's Complete:**
- ✅ Database schema (all models)
- ✅ API endpoints (email & chat)
- ✅ Frontend pages (webmail, accounts, chat)
- ✅ CRM integration helpers
- ✅ Seed data script (idempotent)

**What You Need to Do:**
1. Stop dev server
2. Run `npx prisma generate`
3. Run `npm run db:seed`
4. Start dev server
5. Test the features

**Expected Time:** 5-10 minutes

---

**Last Updated:** December 20, 2025
