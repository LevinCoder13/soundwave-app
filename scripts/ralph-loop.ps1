# Ralph Wiggum Autonomous Execution Loop for SoundWave
# Implements Geoff Huntley's Ralph Loop pattern

param (
    [int]$MaxIterations = 10,
    [switch]$SingleStep = $false
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Starting Ralph Autonomous Loop (Geoff Huntley Pattern)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$iteration = 0

while ($iteration -lt $MaxIterations) {
    $iteration++
    Write-Host ""
    Write-Host "[Ralph] === Iteration $iteration / $MaxIterations ===" -ForegroundColor Yellow

    # 1. Check next task
    $promptOutput = node scripts/ralph-manager.js next-prompt
    if ($promptOutput -match "ALL_TASKS_COMPLETED") {
        Write-Host ""
        Write-Host "[Ralph] All tasks completed! Ready for CodeRabbit review and merge." -ForegroundColor Green
        break
    }

    Write-Host $promptOutput

    # 2. Run Verification / Deterministic Backpressure
    Write-Host ""
    Write-Host "[Ralph] Running deterministic backpressure check..." -ForegroundColor Magenta
    node scripts/ralph-manager.js verify

    if ($LASTEXITCODE -eq 0) {
        Write-Host "[Ralph] Verification tests passed!" -ForegroundColor Green
        
        # 3. Mark task completed and commit
        node scripts/ralph-manager.js complete
        Write-Host "[Ralph] Task marked complete and committed." -ForegroundColor Green
    } else {
        Write-Host "[Ralph] Verification test failed! Backpressure applied." -ForegroundColor Red
        Write-Host "[Ralph] Task remains in progress. Please implement fixes before looping." -ForegroundColor Red
        if (-not $SingleStep) {
            Write-Host "[Ralph] Halting loop to prevent thrashing." -ForegroundColor Yellow
            break
        }
    }

    if ($SingleStep) {
        Write-Host ""
        Write-Host "[Ralph] Single step finished." -ForegroundColor Cyan
        break
    }

    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "[Ralph] Current Status:" -ForegroundColor Cyan
node scripts/ralph-manager.js status
