# Script pour créer la shadow database pour Prisma Migrate
# Exécutez ce script une seule fois avant d'utiliser prisma migrate dev

$dbHost = "localhost"
$dbPort = "5433"
$dbUser = "elite64_user"
$dbPassword = "Dark-Revan-GE-9418657"
$shadowDbName = "elite64_shadow"

Write-Host "Création de la shadow database: $shadowDbName" -ForegroundColor Cyan

# Option 1: Via psql si disponible
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if ($psqlPath) {
    $env:PGPASSWORD = $dbPassword
    $createDbCommand = "CREATE DATABASE $shadowDbName;"
    
    Write-Host "Tentative de création via psql..." -ForegroundColor Yellow
    $result = echo $createDbCommand | psql -h $dbHost -p $dbPort -U $dbUser -d postgres 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Shadow database créée avec succès!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erreur lors de la création via psql:" -ForegroundColor Red
        Write-Host $result
        Write-Host ""
        Write-Host "Veuillez créer la base manuellement avec cette commande SQL:" -ForegroundColor Yellow
        Write-Host "CREATE DATABASE $shadowDbName;" -ForegroundColor White
    }
} else {
    Write-Host "⚠️  psql n'est pas trouvé dans le PATH." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Veuillez créer la shadow database manuellement:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Connectez-vous à PostgreSQL (via pgAdmin, DBeaver, ou psql)" -ForegroundColor Cyan
    Write-Host "2. Exécutez cette commande SQL:" -ForegroundColor Cyan
    Write-Host "   CREATE DATABASE $shadowDbName;" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Ensuite, ajoutez cette ligne dans votre fichier .env:" -ForegroundColor Cyan
    Write-Host "   SHADOW_DATABASE_URL=postgresql://$dbUser`:$dbPassword@$dbHost`:$dbPort/$shadowDbName?schema=public" -ForegroundColor White
}

Write-Host ""
Write-Host "Une fois la shadow database créée, ajoutez cette ligne dans votre .env:" -ForegroundColor Cyan
Write-Host "SHADOW_DATABASE_URL=postgresql://$dbUser`:$dbPassword@$dbHost`:$dbPort/$shadowDbName?schema=public" -ForegroundColor White

