<#
Runs local deterministic regression tests and (optionally) live model-backed tests.
Examples (from leetCoach root):
  .\scripts\test-a2-regression.ps1
  .\scripts\test-a2-regression.ps1 -Live
  .\scripts\test-a2-regression.ps1 -Live -Repeats 3 -BaseUrl http://127.0.0.1:3001
Requires npm/node; for -Live, the server must already be running in LLM mode.
#>
param(
    [switch]$Live,
    [int]$Repeats = 1,
    [string]$BaseUrl = 'http://127.0.0.1:3001',
    [switch]$SkipUnit
)
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
Push-Location $repo
try {
    if (-not $SkipUnit) {
        Write-Host "`n[A2] Running controller and fixture regression tests ..." -ForegroundColor Cyan
        & npm.cmd run test:a2
        if ($LASTEXITCODE -ne 0) { throw 'Local regression tests failed. Do not proceed to final evaluation.' }
    }
    if ($Live) {
        if ($Repeats -lt 1 -or $Repeats -gt 10) { throw 'Repeats must be between 1 and 10.' }
        Write-Host "`n[A2] Replaying real learner turns against $BaseUrl ($Repeats repeat(s) per trace) ..." -ForegroundColor Cyan
        & node testing/live_regression.mjs "--base-url=$BaseUrl" "--repeats=$Repeats"
        if ($LASTEXITCODE -ne 0) { throw 'Live regression failed. Review testing/smoke-regression/*.json.' }
    }
    Write-Host "`n[A2] PASS: selected tests completed successfully." -ForegroundColor Green
} catch {
    Write-Error $_
    exit 1
} finally {
    Pop-Location
}
