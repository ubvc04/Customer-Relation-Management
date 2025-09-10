#!/usr/bin/env powershell

# CRM Development Helper Script
# This script helps manage the development environment

param(
    [Parameter(Position=0)]
    [string]$Command
)

function Show-Help {
    Write-Host "CRM Development Helper" -ForegroundColor Green
    Write-Host "======================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\dev.ps1 <command>" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Cyan
    Write-Host "  start      - Start both backend and frontend servers"
    Write-Host "  backend    - Start only backend server"
    Write-Host "  frontend   - Start only frontend server"
    Write-Host "  install    - Install all dependencies"
    Write-Host "  test       - Run all tests"
    Write-Host "  seed       - Seed database with sample data"
    Write-Host "  reset      - Reset database (delete all data)"
    Write-Host "  build      - Build frontend for production"
    Write-Host "  health     - Check application health"
    Write-Host "  help       - Show this help"
    Write-Host ""
}

function Start-Backend {
    Write-Host "Starting backend server..." -ForegroundColor Green
    Set-Location "backend"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
    Set-Location ".."
}

function Start-Frontend {
    Write-Host "Starting frontend server..." -ForegroundColor Green
    Set-Location "frontend"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
    Set-Location ".."
}

function Install-Dependencies {
    Write-Host "Installing backend dependencies..." -ForegroundColor Green
    Set-Location "backend"
    npm install
    Set-Location ".."
    
    Write-Host "Installing frontend dependencies..." -ForegroundColor Green
    Set-Location "frontend"
    npm install
    Set-Location ".."
    
    Write-Host "All dependencies installed!" -ForegroundColor Green
}

function Test-Application {
    Write-Host "Running backend tests..." -ForegroundColor Green
    Set-Location "backend"
    npm test
    Set-Location ".."
    
    Write-Host "Running frontend tests..." -ForegroundColor Green
    Set-Location "frontend"
    npm run lint
    npm run type-check
    Set-Location ".."
}

function Seed-Database {
    Write-Host "Seeding database with sample data..." -ForegroundColor Green
    Set-Location "backend"
    npm run seed
    Set-Location ".."
}

function Reset-Database {
    Write-Host "Resetting database..." -ForegroundColor Yellow
    $confirm = Read-Host "Are you sure you want to delete all data? (y/N)"
    if ($confirm -eq "y" -or $confirm -eq "Y") {
        Set-Location "backend"
        node utils/seedDatabase.js -d
        Set-Location ".."
        Write-Host "Database reset complete!" -ForegroundColor Green
    } else {
        Write-Host "Operation cancelled." -ForegroundColor Gray
    }
}

function Build-Frontend {
    Write-Host "Building frontend for production..." -ForegroundColor Green
    Set-Location "frontend"
    npm run build
    Set-Location ".."
    Write-Host "Frontend build complete!" -ForegroundColor Green
}

function Check-Health {
    Write-Host "Checking application health..." -ForegroundColor Green
    
    # Check if backend is running
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -TimeoutSec 5
        Write-Host "✅ Backend: Running (Status: $($response.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "❌ Backend: Not running" -ForegroundColor Red
    }
    
    # Check if frontend is running
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5
        Write-Host "✅ Frontend: Running (Status: $($response.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "❌ Frontend: Not running" -ForegroundColor Red
    }
}

# Main script logic
switch ($Command) {
    "start" {
        Start-Backend
        Start-Sleep -Seconds 3
        Start-Frontend
        Write-Host "Both servers starting..." -ForegroundColor Green
        Write-Host "Backend: http://localhost:5000" -ForegroundColor Blue
        Write-Host "Frontend: http://localhost:3000" -ForegroundColor Blue
    }
    "backend" {
        Start-Backend
        Write-Host "Backend starting at http://localhost:5000" -ForegroundColor Blue
    }
    "frontend" {
        Start-Frontend
        Write-Host "Frontend starting at http://localhost:3000" -ForegroundColor Blue
    }
    "install" {
        Install-Dependencies
    }
    "test" {
        Test-Application
    }
    "seed" {
        Seed-Database
    }
    "reset" {
        Reset-Database
    }
    "build" {
        Build-Frontend
    }
    "health" {
        Check-Health
    }
    "help" {
        Show-Help
    }
    default {
        if ($Command) {
            Write-Host "Unknown command: $Command" -ForegroundColor Red
            Write-Host ""
        }
        Show-Help
    }
}
