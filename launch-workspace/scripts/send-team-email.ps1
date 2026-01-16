# PowerShell Script: Send START_HERE.md to Team
# Usage: .\send-team-email.ps1

param(
    [Parameter(Mandatory=$true)]
    [string]$SmtpServer = "smtp.gmail.com",
    
    [Parameter(Mandatory=$true)]
    [string]$FromEmail,
    
    [Parameter(Mandatory=$true)]
    [string]$FromPassword,
    
    [Parameter(Mandatory=$true)]
    [string[]]$ToEmails
)

# Email Configuration
$Subject = "[IMPORTANT] PayAid Launch Strategy - Please Read Before Meeting"
$Body = @"
Hi Team,

As we kick off our 30-day launch plan, I need everyone to review our strategic foundation.

ACTION REQUIRED:
Please read the attached document: START_HERE.md (takes 90 seconds)

WHAT'S INSIDE:
- 3 big decisions we need to approve today
- Our competitive advantage
- Week 1 execution roadmap
- Success metrics

WHY THIS MATTERS:
This document sets the foundation for everything we'll build. Your understanding and alignment are critical for our success.

NEXT STEPS:
1. Read START_HERE.md (90 seconds)
2. Come to all-hands meeting with questions/feedback
3. Be ready to approve decisions and take on roles

MEETING: [DATE] at [TIME] - Calendar invite coming separately

QUESTIONS? Reply to this email or bring them to the meeting.

Let's make this launch a success! 🚀

Best regards,
PayAid Team
"@

# File to attach
$AttachmentPath = "..\..\exported-assets\START_HERE.md"

# Create email
$Email = @{
    From = $FromEmail
    To = $ToEmails
    Subject = $Subject
    Body = $Body
    SmtpServer = $SmtpServer
    Port = 587
    UseSsl = $true
    Credential = (New-Object System.Management.Automation.PSCredential($FromEmail, (ConvertTo-SecureString $FromPassword -AsPlainText -Force)))
}

# Attach file if it exists
if (Test-Path $AttachmentPath) {
    $Email.Attachments = $AttachmentPath
}

# Send email
try {
    Send-MailMessage @Email
    Write-Host "✅ Email sent successfully to:" -ForegroundColor Green
    $ToEmails | ForEach-Object { Write-Host "  - $_" -ForegroundColor Green }
} catch {
    Write-Host "❌ Error sending email: $_" -ForegroundColor Red
}

Write-Host "`n📧 Email script complete!" -ForegroundColor Cyan

