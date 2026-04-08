# Time until dev server listens on port. Usage: .\time-dev-port.ps1 [port] [npm_script]
# e.g. .\time-dev-port.ps1 3005 dev:marketing
param(
  [int]$Port = 3005,
  [string]$Script = "dev:marketing"
)
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $root

# Start dev server in background job (output to null to avoid blocking)
$job = Start-Job -ScriptBlock {
  param($r, $s) Set-Location $r; npm run $s 2>&1 | Out-Null
} -ArgumentList $root, $Script

$start = Get-Date
$timeout = 120
$listen = $false
while (((Get-Date) - $start).TotalSeconds -lt $timeout) {
  Start-Sleep -Milliseconds 500
  try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $tcp.Connect("127.0.0.1", $Port)
    $tcp.Close()
    $listen = $true
    break
  } catch {}
}
$elapsed = [math]::Round(((Get-Date) - $start).TotalSeconds, 1)
Stop-Job $job -ErrorAction SilentlyContinue
Remove-Job $job -Force -ErrorAction SilentlyContinue

if ($listen) {
  Write-Output "READY_IN=${elapsed}s"
  $resultPath = Join-Path (Split-Path -Parent $PSScriptRoot) "scripts\dev-speed-result.txt"
  "READY_IN=${elapsed}s" | Set-Content $resultPath
} else {
  Write-Output "TIMEOUT_AFTER=${elapsed}s"
}
exit $(if ($listen) { 0 } else { 1 })
