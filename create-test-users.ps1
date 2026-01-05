# Script to create test users with Admin rights

$baseUrl = "http://localhost:5000/api/users/register"

# Wait for server to be ready
Start-Sleep -Seconds 2

# Create test1 user
Write-Host "Creating test1 user..." -ForegroundColor Cyan
try {
    $user1 = @{
        username = "test1"
        password = "test1"
        name = "Test User 1"
        email = "test1@trimity.com"
        role = "Admin"
        department = "Management"
    }
    
    $response1 = Invoke-RestMethod -Uri $baseUrl -Method Post -Body ($user1 | ConvertTo-Json) -ContentType "application/json"
    Write-Host "✅ test1 created successfully!" -ForegroundColor Green
    Write-Host "Username: test1" -ForegroundColor Yellow
    Write-Host "Password: test1" -ForegroundColor Yellow
    Write-Host "Role: Admin" -ForegroundColor Yellow
    Write-Host ""
} catch {
    Write-Host "❌ Error creating test1: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Create test2 user
Write-Host "Creating test2 user..." -ForegroundColor Cyan
try {
    $user2 = @{
        username = "test2"
        password = "test2"
        name = "Test User 2"
        email = "test2@trimity.com"
        role = "Admin"
        department = "Management"
    }
    
    $response2 = Invoke-RestMethod -Uri $baseUrl -Method Post -Body ($user2 | ConvertTo-Json) -ContentType "application/json"
    Write-Host "✅ test2 created successfully!" -ForegroundColor Green
    Write-Host "Username: test2" -ForegroundColor Yellow
    Write-Host "Password: test2" -ForegroundColor Yellow
    Write-Host "Role: Admin" -ForegroundColor Yellow
    Write-Host ""
} catch {
    Write-Host "❌ Error creating test2: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Write-Host "Done! Both test users have been created with Admin rights." -ForegroundColor Green
