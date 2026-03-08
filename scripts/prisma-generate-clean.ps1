# Prisma generate after removing/renaming client (fixes EPERM / write UNKNOWN on Windows)
# If delete fails (file in use), renames .prisma to .prisma.old so generate can create a fresh copy.

$root = Split-Path -Parent $PSScriptRoot
$prismaDir = Join-Path $root "node_modules\.prisma"
$prismaOld = Join-Path $root "node_modules\.prisma.old"
$clientDir = Join-Path $root "node_modules\@prisma\client"
$clientOld = Join-Path $root "node_modules\@prisma\client.old"

# Remove any previous .old folders from last run
if (Test-Path $prismaOld) { Remove-Item -Recurse -Force $prismaOld -ErrorAction SilentlyContinue }
if (Test-Path $clientOld) { Remove-Item -Recurse -Force $clientOld -ErrorAction SilentlyContinue }

if (Test-Path $prismaDir) {
  try {
    Remove-Item -Recurse -Force $prismaDir -ErrorAction Stop
    Write-Host "Removed node_modules\.prisma"
  } catch {
    try {
      Rename-Item -Path $prismaDir -NewName ".prisma.old" -ErrorAction Stop
      Write-Host "Renamed .prisma to .prisma.old (delete was locked)"
    } catch {
      Write-Host "Could not remove or rename .prisma. Close all Node processes and try again." -ForegroundColor Yellow
    }
  }
}
if (Test-Path $clientDir) {
  try {
    Remove-Item -Recurse -Force $clientDir -ErrorAction Stop
    Write-Host "Removed node_modules\@prisma\client"
  } catch {
    try {
      Rename-Item -Path $clientDir -NewName "client.old" -ErrorAction Stop
      Write-Host "Renamed @prisma\client to client.old (delete was locked)"
    } catch {
      Write-Host "Could not remove or rename @prisma\client." -ForegroundColor Yellow
    }
  }
}

Set-Location $root
npx prisma generate
