$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$serverDirectory = Join-Path $projectRoot 'server'
$clientDirectory = Join-Path $projectRoot 'client'
$nodePath = (Get-Command node -ErrorAction Stop).Source

# Start the API as a child of this development session, then keep Vite in the
# foreground. This avoids Node's child_process spawn issue on this Windows host.
$serverProcess = Start-Process -FilePath $nodePath -ArgumentList '--watch', '--watch-path=src', 'server.js' -WorkingDirectory $serverDirectory -WindowStyle Hidden -PassThru

try {
  Write-Host "Started backend (PID $($serverProcess.Id)) on http://127.0.0.1:5000"
  & npm.cmd --prefix $clientDirectory run dev:ui
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
finally {
  if (-not $serverProcess.HasExited) {
    Stop-Process -Id $serverProcess.Id -ErrorAction SilentlyContinue
  }
}
