# 🤖 Day 1 Execution - Automated Tools

**Use these scripts to automate Day 1 tasks**

---

## 🚀 QUICK START

### Option 1: Interactive Checklist (Recommended)
```powershell
cd launch-workspace\scripts
.\day1-execution-checklist.ps1
```

This will guide you through all Day 1 tasks interactively.

---

### Option 2: Manual Execution

#### Step 1: Review START_HERE.md
```powershell
# Open the file
notepad ..\..\exported-assets\START_HERE.md

# Or in VS Code
code ..\..\exported-assets\START_HERE.md
```

---

#### Step 2: Send Team Email
```powershell
cd launch-workspace\scripts

# Edit the script first to add your email details
notepad send-team-email.ps1

# Then run it
.\send-team-email.ps1 `
    -SmtpServer "smtp.gmail.com" `
    -FromEmail "your-email@gmail.com" `
    -FromPassword "your-app-password" `
    -ToEmails @("team1@example.com", "team2@example.com")
```

**Note:** For Gmail, you'll need an App Password (not your regular password).

---

#### Step 3: Create Calendar Invite
```powershell
cd launch-workspace\scripts

.\create-calendar-invite.ps1 `
    -MeetingDate "2026-01-15" `
    -MeetingTime "14:00" `
    -MeetingLink "https://zoom.us/j/123456789" `
    -Attendees @("team1@example.com", "team2@example.com")
```

This creates a `.ics` file you can:
- Attach to email
- Import into Google Calendar
- Import into Outlook
- Share with team

---

## 📋 MANUAL CHECKLIST (If Not Using Scripts)

### Task 1: Review START_HERE.md
- [ ] Open `exported-assets/START_HERE.md`
- [ ] Read the 3 big decisions
- [ ] Approve or request changes
- [ ] **Time:** 15 minutes

### Task 2: Schedule Meeting
- [ ] Open `launch-workspace/meetings/MEETING_SCHEDULING_TEMPLATE.md`
- [ ] Copy email template
- [ ] Fill in meeting details
- [ ] Send to team
- [ ] Create calendar invite
- [ ] **Time:** 10 minutes

### Task 3: Share START_HERE.md
- [ ] Open `launch-workspace/TEAM_SHARING_CHECKLIST.md`
- [ ] Follow checklist
- [ ] Send email with attachment
- [ ] **Time:** 5 minutes

### Task 4: Prepare for Meeting
- [ ] Review `launch-workspace/meetings/DAY1_ALL_HANDS_AGENDA.md`
- [ ] Print `launch-workspace/ROLE_ASSIGNMENT_FORM.md`
- [ ] Prepare all materials
- [ ] **Time:** 10 minutes

### Task 5: Conduct Meeting
- [ ] Follow agenda
- [ ] Get approvals
- [ ] Assign roles
- [ ] Setup standup
- [ ] **Time:** 60 minutes

---

## 🔧 SCRIPT SETUP

### Prerequisites
- PowerShell 5.1+ (Windows)
- Email account with SMTP access
- Calendar application (for .ics import)

### Email Setup (Gmail Example)
1. Enable 2-Factor Authentication
2. Generate App Password:
   - Go to Google Account → Security
   - 2-Step Verification → App Passwords
   - Generate password for "Mail"
3. Use this password in the script (not your regular password)

### Calendar Setup
- The `.ics` file works with:
  - Google Calendar
  - Outlook
  - Apple Calendar
  - Most calendar apps

---

## ✅ VERIFICATION

After running scripts, verify:
- [ ] Email sent successfully
- [ ] Calendar invite created
- [ ] Team received materials
- [ ] Meeting scheduled
- [ ] All Day 1 tasks complete

---

## 🚨 TROUBLESHOOTING

### Email Not Sending?
- Check SMTP server settings
- Verify App Password (Gmail)
- Check firewall/antivirus
- Try different SMTP port (587 or 465)

### Calendar Invite Not Working?
- Verify .ics file was created
- Try importing manually
- Check date/time format
- Use Google Calendar web interface

### Script Errors?
- Run PowerShell as Administrator
- Check execution policy: `Set-ExecutionPolicy RemoteSigned`
- Verify file paths are correct

---

## 📞 NEED HELP?

**Email Issues:**
- Check `send-team-email.ps1` comments
- Verify SMTP credentials
- Test with a single recipient first

**Calendar Issues:**
- Manually create invite if script fails
- Use Google Calendar / Outlook web interface
- Share .ics file via email attachment

**General Issues:**
- Review `launch-workspace/WHAT_NEXT.md`
- Check `launch-workspace/QUICK_START_GUIDE.md`
- Use manual checklist above

---

**Status:** Ready to Execute  
**Time Required:** ~100 minutes total  
**Automation:** Available via scripts

