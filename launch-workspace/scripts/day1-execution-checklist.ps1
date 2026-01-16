# PowerShell Script: Day 1 Execution Checklist
# Interactive checklist to complete Day 1 tasks

Write-Host "🚀 PayAid Launch - Day 1 Execution Checklist" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

$tasks = @(
    @{
        Name = "Review START_HERE.md"
        File = "exported-assets\START_HERE.md"
        Time = "15 min"
        Status = $false
    },
    @{
        Name = "Schedule All-Hands Meeting"
        File = "launch-workspace\meetings\MEETING_SCHEDULING_TEMPLATE.md"
        Time = "10 min"
        Status = $false
    },
    @{
        Name = "Share START_HERE.md with Team"
        File = "launch-workspace\TEAM_SHARING_CHECKLIST.md"
        Time = "5 min"
        Status = $false
    },
    @{
        Name = "Prepare for Meeting"
        File = "launch-workspace\meetings\DAY1_ALL_HANDS_AGENDA.md"
        Time = "10 min"
        Status = $false
    },
    @{
        Name = "Conduct All-Hands Meeting"
        File = "launch-workspace\meetings\DAY1_ALL_HANDS_AGENDA.md"
        Time = "60 min"
        Status = $false
    }
)

$completed = 0

foreach ($task in $tasks) {
    Write-Host "[$($completed + 1)/$($tasks.Count)] $($task.Name)" -ForegroundColor Yellow
    Write-Host "   Time: $($task.Time)" -ForegroundColor Gray
    Write-Host "   File: $($task.File)" -ForegroundColor Gray
    
    $response = Read-Host "   Complete? (y/n/skip)"
    
    if ($response -eq "y" -or $response -eq "Y") {
        $task.Status = $true
        $completed++
        Write-Host "   ✅ Marked as complete!" -ForegroundColor Green
    } elseif ($response -eq "skip") {
        Write-Host "   ⏭️  Skipped" -ForegroundColor Yellow
    } else {
        Write-Host "   ⏳ Pending" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host "📊 Progress: $completed/$($tasks.Count) tasks completed" -ForegroundColor Cyan

if ($completed -eq $tasks.Count) {
    Write-Host "🎉 Day 1 Complete! Ready for Day 2-7." -ForegroundColor Green
} else {
    Write-Host "⏳ Continue with remaining tasks." -ForegroundColor Yellow
}

# Save progress
$progress = @{
    Date = Get-Date
    Completed = $completed
    Total = $tasks.Count
    Tasks = $tasks
} | ConvertTo-Json

$progress | Out-File "..\..\day1-progress.json" -Encoding UTF8
Write-Host "`n💾 Progress saved to day1-progress.json" -ForegroundColor Cyan

