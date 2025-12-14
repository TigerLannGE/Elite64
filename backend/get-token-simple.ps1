# Script simple pour récupérer le token via l'API
param(
    [Parameter(Mandatory=$true)]
    [string]$Email
)

Write-Host "`n🔍 Recherche du token pour: $Email" -ForegroundColor Cyan

# Option 1: Si vous avez créé le compte récemment, le token était dans la réponse
Write-Host "`n💡 Astuce: Le token est retourné dans la réponse lors de la création du compte." -ForegroundColor Yellow
Write-Host "Si vous avez la réponse JSON, cherchez 'emailVerificationToken'" -ForegroundColor Yellow

# Option 2: Via Prisma Studio
Write-Host "`n📊 Méthode recommandée: Utilisez Prisma Studio" -ForegroundColor Green
Write-Host "1. Ouvrez http://localhost:5555 dans votre navigateur" -ForegroundColor White
Write-Host "2. Cliquez sur la table 'players'" -ForegroundColor White
Write-Host "3. Trouvez le joueur avec l'email: $Email" -ForegroundColor White
Write-Host "4. Copiez la valeur de 'emailVerificationToken'" -ForegroundColor White

Write-Host "`n✅ Une fois le token récupéré, utilisez-le dans le Test 1 !" -ForegroundColor Green

