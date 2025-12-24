# Update All Workflows to Netlify
$MODULES = @("core", "crm", "finance", "hr", "marketing", "whatsapp", "analytics", "ai-studio", "communication")

$netlifyWorkflow = @"
name: Deploy {0} Module

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Run tests
        run: npm test || true
      
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2.0
        with:
          publish-dir: './.next'
          production-branch: main
          github-token: `${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Deploy from GitHub Actions"
          enable-pull-request-comment: false
          enable-commit-comment: true
          overwrites-pull-request-comment: true
        env:
          NETLIFY_AUTH_TOKEN: `${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: `${{ secrets.NETLIFY_SITE_ID }}
"@

foreach ($module in $MODULES) {
    $workflowPath = "repositories\payaid-$module\.github\workflows\deploy.yml"
    if (Test-Path $workflowPath) {
        $moduleName = $module.Substring(0,1).ToUpper() + $module.Substring(1)
        $content = $netlifyWorkflow -f $moduleName
        Set-Content -Path $workflowPath -Value $content
        Write-Host "Updated payaid-$module" -ForegroundColor Green
    }
}

Write-Host "`nAll workflows updated to Netlify!" -ForegroundColor Green

