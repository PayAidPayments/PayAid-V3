# Run ui-scanner from project root using the run entry + config.
Set-Location $PSScriptRoot\..
$env:PLAYWRIGHT_BASE_URL = if ($env:PLAYWRIGHT_BASE_URL) { $env:PLAYWRIGHT_BASE_URL } else { "http://127.0.0.1:3000" }
npm run test:e2e:ui-scanner -- @args
