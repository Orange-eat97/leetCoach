param(
    [ValidateSet('install','prepare','judge-v1','judge-v2','redteam-before','redteam-after','screenshots','status')]
    [string]$Stage = 'status',
    [string]$RepoPath = '.',
    [string]$BackendUrl = 'http://127.0.0.1:3001',
    [string]$FrontendUrl = 'http://127.0.0.1:5173'
)
$ErrorActionPreference = 'Stop'
$root=(Resolve-Path $RepoPath).Path
Set-Location $root
switch($Stage){
    'install' { python .\a2_codex_eval\run.py --repo $root install }
    'prepare' { python .\a2_codex_eval\run.py --repo $root prepare --api $BackendUrl }
    'judge-v1' { python .\a2_codex_eval\run.py --repo $root judge --version a2_v1 }
    'judge-v2' { python .\a2_codex_eval\run.py --repo $root judge --version a2_v2 }
    'redteam-before' { python .\a2_codex_eval\run.py --repo $root redteam --api $BackendUrl --round before --repeats 3 --capture-live --ui-url $FrontendUrl }
    'redteam-after' { python .\a2_codex_eval\run.py --repo $root redteam --api $BackendUrl --round after --repeats 3 --capture-live --ui-url $FrontendUrl }
    'screenshots' { python .\a2_codex_eval\capture.py all --repo $root --url $FrontendUrl --require-ui }
    'status' { python .\a2_codex_eval\run.py --repo $root status }
}
if($LASTEXITCODE -ne 0){throw "A2 stage $Stage failed with exit code $LASTEXITCODE"}
