# ========================================
# Complete Authentication Flow Test Script
# ========================================

$API_URL = "http://localhost:5000/api"
$TestEmail = "test-$(Get-Random)@aurikrex.test"
$TestPassword = "TestPass123!"
$FirstName = "Test"
$LastName = "User"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🧪 AURIKREX ACADEMY - AUTH FLOW TEST SUITE" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ========================================
# Test 1: Health Check
# ========================================
Write-Host "📋 TEST 1: Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/../health" -Method GET
    if ($response.status -eq "ok") {
        Write-Host "✅ Health check PASSED" -ForegroundColor Green
        Write-Host "   Database: $($response.services.database)" -ForegroundColor Green
    } else {
        Write-Host "❌ Health check FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Health check ERROR: $_" -ForegroundColor Red
}
Write-Host ""

# ========================================
# Test 2: Email Signup
# ========================================
Write-Host "📋 TEST 2: Email Signup" -ForegroundColor Yellow
Write-Host "  Email: $TestEmail" -ForegroundColor Gray
try {
    $signupBody = @{
        firstName = $FirstName
        lastName = $LastName
        email = $TestEmail
        password = $TestPassword
        phone = "+1234567890"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$API_URL/auth/signup" -Method POST -Body $signupBody -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "✅ Signup PASSED" -ForegroundColor Green
        Write-Host "   Message: $($response.message)" -ForegroundColor Green
        Write-Host "   User UID: $($response.data.uid)" -ForegroundColor Green
        $uid = $response.data.uid
    } else {
        Write-Host "❌ Signup FAILED: $($response.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Signup ERROR: $_" -ForegroundColor Red
}
Write-Host ""

# ========================================
# Test 3: Check MongoDB User Created
# ========================================
Write-Host "📋 TEST 3: Verify User in MongoDB" -ForegroundColor Yellow
Write-Host "  (This requires MongoDB connection)" -ForegroundColor Gray
Start-Sleep -Seconds 1
Write-Host "  ℹ️  Check MongoDB Atlas > aurikrex-academy > users collection" -ForegroundColor Cyan
Write-Host ""

# ========================================
# Test 4: Verify OTP Email Sent
# ========================================
Write-Host "📋 TEST 4: Check for OTP Email" -ForegroundColor Yellow
Write-Host "  ⏳ OTP should arrive in 1-2 minutes" -ForegroundColor Gray
Write-Host "  📧 Check email: $TestEmail" -ForegroundColor Cyan
Write-Host "  💡 If not received, check:" -ForegroundColor Gray
Write-Host "     - Email service configuration in .env" -ForegroundColor Gray
Write-Host "     - SMTP credentials (Gmail app password)" -ForegroundColor Gray
Write-Host "     - Server logs for email service errors" -ForegroundColor Gray
Write-Host ""

# ========================================
# Test 5: Try Login Without Verification
# ========================================
Write-Host "📋 TEST 5: Login Without Email Verification" -ForegroundColor Yellow
try {
    $loginBody = @{
        email = $TestEmail
        password = $TestPassword
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "⚠️  User was able to login without verification - possible issue!" -ForegroundColor Yellow
        Write-Host "   Response: $($response.message)" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Correctly blocked unverified user login" -ForegroundColor Green
        Write-Host "   Message: $($response.message)" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Error during login test: $_" -ForegroundColor Yellow
}
Write-Host ""

# ========================================
# Test 6: Manual OTP Verification (needs OTP code)
# ========================================
Write-Host "📋 TEST 6: OTP Verification" -ForegroundColor Yellow
Write-Host "  ⏰ Waiting for you to receive OTP email..." -ForegroundColor Cyan
Write-Host "  📝 Once you have the OTP, verify it at /verify-email page" -ForegroundColor Cyan
Write-Host ""

# ========================================
# Summary
# ========================================
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "📊 TEST SUMMARY" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test Email: $TestEmail" -ForegroundColor Gray
Write-Host "Test Password: $TestPassword" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Wait for OTP email (check spam folder)" -ForegroundColor Gray
Write-Host "2. Once received, run: POST /api/auth/verify-otp with email + otp" -ForegroundColor Gray
Write-Host "3. After verification, test login with same email/password" -ForegroundColor Gray
Write-Host "4. Verify dashboard loads and shows user data" -ForegroundColor Gray
Write-Host ""
Write-Host "API Endpoints to Test:" -ForegroundColor Cyan
Write-Host "  GET    /health                    - System health" -ForegroundColor Gray
Write-Host "  POST   /api/auth/signup           - Create account" -ForegroundColor Gray
Write-Host "  POST   /api/auth/verify-otp       - Verify email" -ForegroundColor Gray
Write-Host "  POST   /api/auth/login            - Login" -ForegroundColor Gray
Write-Host "  POST   /api/auth/google           - Google sign-in" -ForegroundColor Gray
Write-Host "  GET    /api/auth/refresh-token   - Refresh JWT" -ForegroundColor Gray
Write-Host ""
