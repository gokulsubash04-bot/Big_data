@echo off
SET DOCKER_PATH=%LOCALAPPDATA%\Programs\DockerDesktop\resources\bin

IF EXIST "%DOCKER_PATH%\docker.exe" (
    SET "PATH=%DOCKER_PATH%;%PATH%"
    echo === Docker Path Detected: %DOCKER_PATH% ===
    echo === Starting Apache Hadoop Cluster ===
    "%DOCKER_PATH%\docker.exe" compose up --build %*
) ELSE (
    echo [ERROR] Docker executable not found at %DOCKER_PATH%\docker.exe
    echo Please make sure Docker Desktop is installed and running.
)
