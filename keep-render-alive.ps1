# Render Keep-Alive Service
# Pings the Render backend every 10 minutes to prevent it from sleeping

param(
    [string]$RenderUrl = "https://to-do-trimity.onrender.com",
    [int]$IntervalMinutes = 10
)

# Create log file with timestamp
$LogPath = "$PSScriptRoot\render-keepalive.log"

function Write-Log {
    param([string]$Message, [string]$Color = "White")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    
    # Write to console if running interactively
    if ([Environment]::UserInteractive) {
        Write-Host $logMessage -ForegroundColor $Color
    }
    
    # Always write to log file
    $logMessage | Add-Content -Path $LogPath
}

Write-Log "🚀 Starting Render Keep-Alive Service..." "Green"
Write-Log "📡 Target URL: $RenderUrl" "Cyan"
Write-Log "⏰ Ping Interval: $IntervalMinutes minutes" "Cyan"
Write-Log "📝 Log File: $LogPath" "Cyan"
Write-Log ""

$pingCount = 0

while ($true) {
    try {
        $pingCount++
        
        Write-Log "Ping #$pingCount - Checking server..." "White"
        
        # Try health endpoint first
        try {
            $response = Invoke-WebRequest -Uri "$RenderUrl/api/health" -Method GET -TimeoutSec 30
            
            if ($response.StatusCode -eq 200) {
                Write-Log "✅ Server is alive! Health check passed." "Green"
            } else {
                Write-Log "⚠️ Unexpected response: $($response.StatusCode)" "Yellow"
            }
        }
        catch {
            Write-Log "❌ Health check failed: $($_.Exception.Message)" "Red"
            
            # Try to wake up the server with main URL
            try {
                Write-Log "🔄 Attempting to wake up server..." "Yellow"
                $wakeResponse = Invoke-WebRequest -Uri $RenderUrl -Method GET -TimeoutSec 60
                Write-Log "✅ Wake-up ping sent! Status: $($wakeResponse.StatusCode)" "Green"
            } catch {
                Write-Log "❌ Wake-up ping failed: $($_.Exception.Message)" "Red"
            }
        }
        
    } catch {
        Write-Log "💥 Unexpected error: $($_.Exception.Message)" "Red"
    }
    
    Write-Log "⏳ Waiting $IntervalMinutes minutes until next ping..." "Gray"
    Write-Log ""
    
    Start-Sleep -Seconds ($IntervalMinutes * 60)
}