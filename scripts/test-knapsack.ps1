param([switch]$Live)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
Write-Host '[Knapsack] Running all unit and legacy regression tests...'
node --test tests/*.test.mjs
if ($LASTEXITCODE -ne 0) {exit $LASTEXITCODE}
if ($Live) {
 Write-Host '[Knapsack] Replaying five-turn Knapsack explanation against running backend...'
 node testing/knapsack_smoke.mjs
 if ($LASTEXITCODE -ne 0) {exit $LASTEXITCODE}
}
Write-Host '[Knapsack] PASS'
