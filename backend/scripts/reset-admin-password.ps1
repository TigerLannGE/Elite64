# Script pour réinitialiser le mot de passe admin
# Usage: .\reset-admin-password.ps1

$email = "florian.lantigner@ik.me"
$newPassword = "Elite6424!"

Write-Host "🔐 Réinitialisation du mot de passe admin..." -ForegroundColor Cyan
Write-Host "Email: $email" -ForegroundColor Yellow
Write-Host "Nouveau mot de passe: $newPassword" -ForegroundColor Yellow
Write-Host ""

# Connexion PostgreSQL
$env:PGPASSWORD = "root"
$query = @"
-- Générer le hash bcrypt pour le mot de passe
-- Note: Ce script nécessite Node.js pour hasher le mot de passe

-- Temporary: Afficher l'ID du joueur
SELECT id, email, role, "isActive" 
FROM "Player" 
WHERE email = '$email';
"@

Write-Host "📊 Informations du compte:" -ForegroundColor Cyan
psql -U postgres -d elite64_db -c $query

Write-Host ""
Write-Host "⚠️  Pour réinitialiser le mot de passe, utilisez le script Node.js ci-dessous:" -ForegroundColor Yellow
Write-Host ""
Write-Host "cd backend" -ForegroundColor White
Write-Host "node -e `"const bcrypt = require('bcrypt'); bcrypt.hash('$newPassword', 10).then(hash => console.log(hash))`"" -ForegroundColor White
Write-Host ""
Write-Host "Puis exécutez dans psql:" -ForegroundColor Yellow
Write-Host "UPDATE `"Player`" SET password = 'HASH_ICI' WHERE email = '$email';" -ForegroundColor White

