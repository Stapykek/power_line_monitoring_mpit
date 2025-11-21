@echo off
echo 🚀 Power Line Maintenance System - Docker Setup

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed or not in PATH. Please install Docker Desktop for Windows.
    pause
    exit /b 1
)

REM Check if the yolov8s.pt model file exists
if not exist "ai_model\yolov8s.pt" (
    echo ❌ yolov8s.pt model file not found in ai_model\ directory
    echo Please place the yolov8s.pt file in the ai_model\ directory before continuing
    pause
    exit /b 1
)

echo ✅ All prerequisites checked successfully

echo 🔨 Building Docker images...
docker-compose build

if errorlevel 1 (
    echo ❌ Failed to build Docker images
    pause
    exit /b 1
) else (
    echo ✅ Docker images built successfully
    
    echo 🚀 Starting services...
    docker-compose up -d
    
    if errorlevel 1 (
        echo ❌ Failed to start services
        pause
        exit /b 1
    ) else (
        echo ✅ Services started successfully
        echo.
        echo 📋 Services are now running:
        echo    - Frontend: http://localhost
        echo    - Backend API: http://localhost:5000
        echo    - AI Service: http://localhost:5001
        echo.
        echo 💡 To view logs: docker-compose logs -f
        echo 💡 To stop services: docker-compose down
        echo.
        echo Press any key to exit...
        pause >nul
    )
)