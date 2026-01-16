# PowerShell Script: Create Calendar Invite for All-Hands Meeting
# Usage: .\create-calendar-invite.ps1

param(
    [Parameter(Mandatory=$true)]
    [string]$MeetingDate,
    
    [Parameter(Mandatory=$true)]
    [string]$MeetingTime,
    
    [Parameter(Mandatory=$false)]
    [string]$MeetingLink = "",
    
    [Parameter(Mandatory=$true)]
    [string[]]$Attendees
)

# Meeting Details
$Title = "PayAid Launch - All-Hands Meeting"
$Duration = 60 # minutes
$Location = if ($MeetingLink) { $MeetingLink } else { "TBD" }

$Description = @"
PayAid 30-Day Launch - Day 1 Kickoff

AGENDA:
1. Review 3 big decisions (Positioning, Website, Pricing)
2. Team alignment on strategy
3. Role assignments
4. Communication setup
5. Q&A

PRE-READ: Please read exported-assets/START_HERE.md (90 seconds)

MATERIALS:
- exported-assets/START_HERE.md
- launch-workspace/meetings/DAY1_ALL_HANDS_AGENDA.md
- launch-workspace/ROLE_ASSIGNMENTS.md

Meeting Link: $MeetingLink
"@

# Create .ics file
$IcsContent = @"
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PayAid//Launch Meeting//EN
BEGIN:VEVENT
UID:$(New-Guid)
DTSTAMP:$(Get-Date -Format "yyyyMMddTHHmmssZ")
DTSTART:$(Get-Date $MeetingDate -Format "yyyyMMdd")T$(Get-Date $MeetingTime -Format "HHmmss")
DTEND:$(Get-Date $MeetingDate -AddMinutes $Duration -Format "yyyyMMdd")T$(Get-Date $MeetingTime -AddMinutes $Duration -Format "HHmmss")
SUMMARY:$Title
DESCRIPTION:$($Description -replace "`r`n", "\n")
LOCATION:$Location
$(($Attendees | ForEach-Object { "ATTENDEE;CN=$_;RSVP=TRUE:mailto:$_" }) -join "`n")
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Reminder: PayAid Launch Meeting in 15 minutes
END:VALARM
END:VEVENT
END:VCALENDAR
"@

# Save .ics file
$IcsPath = "..\..\PayAid_Launch_Meeting_$(Get-Date -Format 'yyyyMMdd').ics"
$IcsContent | Out-File -FilePath $IcsPath -Encoding UTF8

Write-Host "✅ Calendar invite created!" -ForegroundColor Green
Write-Host "📁 File: $IcsPath" -ForegroundColor Cyan
Write-Host "`n📧 To send:" -ForegroundColor Yellow
Write-Host "  1. Attach the .ics file to an email" -ForegroundColor White
Write-Host "  2. Or import it into your calendar app" -ForegroundColor White
Write-Host "  3. Or share via Google Calendar / Outlook" -ForegroundColor White

