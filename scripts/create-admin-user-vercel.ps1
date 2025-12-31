# PowerShell script to create admin user on Vercel
# Usage: .\scripts\create-admin-user-vercel.ps1

$vercelUrl = if ($env:VERCEL_URL) { $env:VERCEL_URL } else { "https://payaid-v3.vercel.app" }
$email = "admin@demo.com"
$password = "Test@1234"

Write-Host "🔐 Creating admin user on $vercelUrl..." -ForegroundColor Cyan
Write-Host "   Email: $email"
Write-Host "   Password: $password"
Write-Host ""

$body = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$vercelUrl/api/admin/reset-password" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body

    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10)
    Write-Host ""
    Write-Host "You can now login at: $vercelUrl/login" -ForegroundColor Green
    Write-Host "Email: $email"
    Write-Host "Password: $password"
} catch {
    Write-Host "❌ Failed to create user:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
    exit 1
}





