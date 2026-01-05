# Quick management script for Render Keep-Alive background task

param(
    [Parameter(Position=0)]
    [ValidateSet("status", "start", "stop", "restart", "remove", "logs", "help")]
    [string]$Action = "status"
)

$TaskName = "RenderKeepAlive-TriDo"
$LogPath = "$PSScriptRoot\render-keepalive.log"

function Show-Help {
    Write-Host "🔧 Render Keep-Alive Management Tool" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\manage-keepalive.ps1 <action>" -ForegroundColor White
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor Yellow
    Write-Host "  status   - Show current task status (default)" -ForegroundColor White
    Write-Host "  start    - Start the keep-alive task" -ForegroundColor White
    Write-Host "  stop     - Stop the keep-alive task" -ForegroundColor White
    Write-Host "  restart  - Restart the keep-alive task" -ForegroundColor White
    Write-Host "  remove   - Remove the keep-alive task completely" -ForegroundColor White
    Write-Host "  logs     - Show recent log entries" -ForegroundColor White
    Write-Host "  help     - Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\manage-keepalive.ps1 status" -ForegroundColor Gray
    Write-Host "  .\manage-keepalive.ps1 start" -ForegroundColor Gray
    Write-Host "  .\manage-keepalive.ps1 logs" -ForegroundColor Gray
}

function Show-Status {
    try {
        $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction Stop
        Write-Host "📊 Keep-Alive Task Status" -ForegroundColor Cyan
        Write-Host "   Name: $($task.TaskName)" -ForegroundColor White
        Write-Host "   State: $($task.State)" -ForegroundColor $(if ($task.State -eq "Running") { "Green" } elseif ($task.State -eq "Ready") { "Yellow" } else { "Red" })
        Write-Host "   Last Run: $((Get-ScheduledTaskInfo -TaskName $TaskName).LastRunTime)" -ForegroundColor White
        Write-Host "   Next Run: $((Get-ScheduledTaskInfo -TaskName $TaskName).NextRunTime)" -ForegroundColor White
        
        if (Test-Path $LogPath) {
            $logSize = [math]::Round((Get-Item $LogPath).Length / 1KB, 2)
            Write-Host "   Log File: $LogPath ($logSize KB)" -ForegroundColor White
        }
    } catch {
        Write-Host "❌ Keep-alive task not found!" -ForegroundColor Red
        Write-Host "Run '.\setup-background-keepalive.ps1' to create it." -ForegroundColor Yellow
    }
}

switch ($Action.ToLower()) {
    "help" { Show-Help }
    
    "status" { Show-Status }
    
    "start" {
        try {
            Start-ScheduledTask -TaskName $TaskName
            Write-Host "✅ Keep-alive task started!" -ForegroundColor Green
        } catch {
            Write-Host "❌ Failed to start task: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    "stop" {
        try {
            Stop-ScheduledTask -TaskName $TaskName
            Write-Host "🛑 Keep-alive task stopped!" -ForegroundColor Yellow
        } catch {
            Write-Host "❌ Failed to stop task: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    "restart" {
        try {
            Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 2
            Start-ScheduledTask -TaskName $TaskName
            Write-Host "🔄 Keep-alive task restarted!" -ForegroundColor Green
        } catch {
            Write-Host "❌ Failed to restart task: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    "remove" {
        Write-Host "⚠️ This will completely remove the keep-alive task." -ForegroundColor Yellow
        $confirm = Read-Host "Are you sure? (y/N)"
        if ($confirm -eq 'y' -or $confirm -eq 'Y') {
            try {
                Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
                Write-Host "🗑️ Keep-alive task removed!" -ForegroundColor Red
            } catch {
                Write-Host "❌ Failed to remove task: $($_.Exception.Message)" -ForegroundColor Red
            }
        } else {
            Write-Host "Cancelled." -ForegroundColor Gray
        }
    }
    
    "logs" {
        if (Test-Path $LogPath) {
            Write-Host "📝 Recent Keep-Alive Logs (last 20 lines):" -ForegroundColor Cyan
            Write-Host ""
            Get-Content $LogPath -Tail 20
        } else {
            Write-Host "❌ No log file found at: $LogPath" -ForegroundColor Red
        }
    }
    
    default {
        Write-Host "❌ Unknown action: $Action" -ForegroundColor Red
        Write-Host "Use '.\manage-keepalive.ps1 help' for available actions." -ForegroundColor Yellow
    }
}