@echo off
echo 🔧 CRM System Problem Solver
echo ============================

echo.
echo 🛑 Step 1: Stopping all Node.js processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im nodemon.exe >nul 2>&1
timeout /t 2 >nul

echo ✅ Processes stopped
echo.

echo 🔍 Step 2: Checking what's using port 5000...
netstat -ano | findstr :5000
if errorlevel 1 (
    echo ✅ Port 5000 is free
) else (
    echo ⚠️  Port 5000 is still in use
    echo Trying to free it...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do taskkill /f /pid %%a >nul 2>&1
)

echo.
echo 📁 Step 3: Navigating to backend directory...
cd /d "C:\Users\baves\Downloads\CRM\backend"
if errorlevel 1 (
    echo ❌ Failed to navigate to backend directory
    echo Please check if the path exists
    pause
    exit /b 1
)

echo ✅ In backend directory
echo.

echo 🔍 Step 4: Testing database connection...
node -e "require('dotenv').config(); console.log('MongoDB URI:', process.env.MONGODB_URI ? '✅ Configured' : '❌ Missing');"

echo.
echo 🚀 Step 5: Starting server...
echo Press Ctrl+C to stop the server
npm run dev
