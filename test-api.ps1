# Start server in background
Write-Host "🚀 Starting backend server..." -ForegroundColor Green
$serverProcess = Start-Process -FilePath "node" -ArgumentList "dist/server.js" -WorkingDirectory "c:\Users\Korede Omotosho\Desktop\Aurikrex-Academy\aurikrex-backend" -NoNewWindow -PassThru

# Wait for server to start
Start-Sleep -Seconds 5

# Test health endpoint
Write-Host "`n📋 Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method GET
    Write-Host "✅ Health Check PASSED" -ForegroundColor Green
    Write-Host ($healthResponse | ConvertTo-Json)
} catch {
    Write-Host "❌ Health Check FAILED: $_" -ForegroundColor Red
}

# Test API routes
Write-Host "`n📋 Testing API Routes..." -ForegroundColor Yellow
$endpoints = @(
    @{path = "/api/test"; method = "GET"; desc = "Test Endpoint"},
    @{path = "/api/health"; method = "GET"; desc = "Health Check (API)"}
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5000$($endpoint.path)" -Method $endpoint.method
        Write-Host "✅ $($endpoint.desc): OK" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  $($endpoint.desc): Not available" -ForegroundColor Yellow
    }
}

# Keep process running
Write-Host "`n🔄 Server is running. Press Ctrl+C to stop." -ForegroundColor Cyan
Read-Host
Stop-Process -InputObject $serverProcess
