<#
.SYNOPSIS
  Ralph Wiggum Autonomous Execution Loop for SoundWave
.DESCRIPTION
  Implements Geoff Huntley's Ralph Loop pattern:
  Runs deterministic backpressure checks, verifies task completion,
  persists state to disk (.gsd/PRD.json), and commits to git.
#>

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
    Write-Host "`n[Ralph] === Iteration $iteration / $MaxIterations ===" -ForegroundColor Yellow

    # 1. Check next task
    $promptOutput = node scripts/ralph-manager.js next-prompt
    if ($promptOutput -match "ALL_TASKS_COMPLETED") {
        Write-Host "`n🎉 [Ralph] All tasks completed! Ready for CodeRabbit review & merge." -ForegroundColor Green
        break
    }

    Write-Host $promptOutput

    # 2. Run Verification / Deterministic Backpressure
    Write-Host "`n[Ralph] Running deterministic backpressure check..." -ForegroundColor Magenta
    node scripts/ralph-manager.js verify

    if ($LASTEXITCODE -eq 0) {
        Write-Host "[Ralph] ✓ Backpressure tests passed!" -ForegroundColor Green
        
        # 3. Mark task completed & commit
        node scripts/ralph-manager.js complete
        Write-Host "[Ralph] Task marked complete and committed." -ForegroundColor Green
    } else {
        Write-Host "[Ralph] ✗ Backpressure test failed! Backpressure applied." -ForegroundColor Red
        Write-Host "[Ralph] Task remains in progress. Please implement fixes before looping." -ForegroundColor Red
        if (-not $SingleStep) {
            Write-Host "[Ralph] Halting loop to prevent thrashing." -ForegroundColor Yellow
            break
        }
    }

    if ($SingleStep) {
        Write-Host "`n[Ralph] Single step finished." -ForegroundColor Cyan
        break
    }

    Start-Sleep -Seconds 2
}

Write-Host "`n[Ralph] Current Status:" -ForegroundColor Cyan
node scripts/ralph-manager.js status
