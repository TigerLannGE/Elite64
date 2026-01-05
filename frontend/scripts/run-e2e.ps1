# Script helper pour exécuter les tests E2E Gameplay
# Usage: .\run-e2e.ps1

# Configuration
$env:API_BASE_URL = "http://localhost:4000"
$env:ADMIN_EMAIL = "florian.lantigner@ik.me"
$env:ADMIN_PASSWORD = "Elite64Test24!"
$env:P1_EMAIL = "player1test@example.com"
$env:P1_PASSWORD = "TestPass1!"
$env:P2_EMAIL = "player2test@example.com"
$env:P2_PASSWORD = "TestPass2!"

# Exécuter le test
Write-Host "🚀 Lancement des tests E2E Gameplay..." -ForegroundColor Cyan
npm run e2e:gameplay

