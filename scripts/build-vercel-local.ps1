# Local build script that mimics Vercel's build process
# This helps catch build issues before pushing to Vercel

Write-Host "🔨 Starting local Vercel-mimic build..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Install dependencies (mimicking Vercel's installCommand)
Write-Host "📦 Step 1: Installing dependencies..." -ForegroundColor Yellow
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Dependency installation failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 2: Generate Prisma Client (mimicking Vercel's buildCommand)
Write-Host "🔧 Step 2: Generating Prisma Client..." -ForegroundColor Yellow
$env:PRISMA_GENERATE_DATAPROXY = "false"
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prisma generation failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Prisma Client generated" -ForegroundColor Green
Write-Host ""

# Step 3: Run the build (mimicking Vercel's buildCommand)
Write-Host "🏗️  Step 3: Building Next.js application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Fix the errors above and run this script again before pushing to Vercel." -ForegroundColor Yellow
    exit 1
}
Write-Host ""
Write-Host "✅ Build completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Your build is ready for Vercel deployment!" -ForegroundColor Cyan
Write-Host "   You can now safely push to GitHub/Vercel." -ForegroundColor Cyan
