# PowerShell Launcher for Hadoop Docker Cluster
$DockerBin = "$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin"
$DockerExe = "$DockerBin\docker.exe"

if (Test-Path $DockerExe) {
    $env:Path = "$DockerBin;$env:Path"
    Write-Host "=== Docker Path Detected: $DockerBin ===" -ForegroundColor Green
    Write-Host "=== Launching Apache Hadoop & PySpark Analytics Cluster ===" -ForegroundColor Cyan
    & $DockerExe compose up --build
} else {
    Write-Host "[ERROR] Docker executable not found at $DockerExe" -ForegroundColor Red
    Write-Host "Please ensure Docker Desktop is installed and running." -ForegroundColor Yellow
}
