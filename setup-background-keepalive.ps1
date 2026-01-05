# Setup Background Keep-Alive Task
# Creates a Windows Task Scheduler job to run the keep-alive service automatically

$TaskName = "RenderKeepAlive-TriDo"
$ScriptPath = "$PSScriptRoot\keep-render-alive.ps1"
$LogPath = "$PSScriptRoot\render-keepalive.log"

Write-Host "🔧 Setting up Render Keep-Alive Background Task..." -ForegroundColor Cyan
Write-Host "📂 Script Location: $ScriptPath" -ForegroundColor White
Write-Host ""

# Check if script exists
if (-not (Test-Path $ScriptPath)) {
    Write-Host "❌ Keep-alive script not found at: $ScriptPath" -ForegroundColor Red
    Write-Host "Please ensure 'keep-render-alive.ps1' is in the same directory." -ForegroundColor Yellow
    exit 1
}

try {
    # Remove existing task if it exists
    if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
        Write-Host "🗑️ Removing existing task..." -ForegroundColor Yellow
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    }
    
    # Create the action (what the task will do)
    $Action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ScriptPath`""
    
    # Create trigger (when the task will run)
    $Trigger = New-ScheduledTaskTrigger -AtStartup
    
    # Create settings
    $Settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -DontStopOnIdleEnd `
        -ExecutionTimeLimit (New-TimeSpan -Hours 0) `
        -RestartCount 999 `
        -RestartInterval (New-TimeSpan -Minutes 5)
    
    # Create principal (who the task runs as)
    $Principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
    
    # Register the task
    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal -Description "Keeps TriDo Render backend alive by pinging it every 10 minutes"
    
    Write-Host "✅ Background task created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Task Details:" -ForegroundColor Cyan
    Write-Host "   Name: $TaskName" -ForegroundColor White
    Write-Host "   Script: $ScriptPath" -ForegroundColor White
    Write-Host "   Log File: $LogPath" -ForegroundColor White
    Write-Host "   Trigger: Starts automatically on system boot" -ForegroundColor White
    Write-Host "   Interval: Every 10 minutes" -ForegroundColor White
    Write-Host ""
    
    # Start the task immediately
    Write-Host "🚀 Starting the task now..." -ForegroundColor Cyan
    Start-ScheduledTask -TaskName $TaskName
    
    Start-Sleep -Seconds 3
    
    $task = Get-ScheduledTask -TaskName $TaskName
    if ($task.State -eq "Running") {
        Write-Host "✅ Task is now running in background!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Task created but not running. Status: $($task.State)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "🔧 Management Commands:" -ForegroundColor Cyan
    Write-Host "   View Status:  Get-ScheduledTask -TaskName '$TaskName'" -ForegroundColor White
    Write-Host "   Start Task:   Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor White
    Write-Host "   Stop Task:    Stop-ScheduledTask -TaskName '$TaskName'" -ForegroundColor White
    Write-Host "   Remove Task:  Unregister-ScheduledTask -TaskName '$TaskName'" -ForegroundColor White
    Write-Host "   View Logs:    Get-Content '$LogPath'" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 Your Render backend will now stay awake 24/7!" -ForegroundColor Green
    Write-Host "🔔 Users will receive notifications even when browsers are closed." -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error creating background task: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Common solutions:" -ForegroundColor Yellow
    Write-Host "   • Run PowerShell as Administrator" -ForegroundColor White
    Write-Host "   • Check execution policy: Set-ExecutionPolicy RemoteSigned" -ForegroundColor White
    Write-Host "   • Ensure you have Task Scheduler permissions" -ForegroundColor White
    exit 1
}