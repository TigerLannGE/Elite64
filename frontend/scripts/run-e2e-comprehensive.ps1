# Script helper pour exécuter les tests E2E Gameplay Complets
# Usage: .\run-e2e-comprehensive.ps1

# Configuration
$env:API_BASE_URL = "http://localhost:4000"
$env:ADMIN_EMAIL = "florian.lantigner@ik.me"
$env:ADMIN_PASSWORD = "Dark-123"

# Exécuter le test
Write-Host "🚀 Lancement des tests E2E Gameplay Complets..." -ForegroundColor Cyan
Write-Host "⚠️  Ce test peut prendre 5-10 minutes (création de multiples matches)" -ForegroundColor Yellow
Write-Host ""
npm run e2e:comprehensive

