# Script pour récupérer le token de vérification d'email d'un joueur
param(
    [Parameter(Mandatory=$true)]
    [string]$Email
)

# Récupérer le token depuis la base de données via Prisma
# Note: Les colonnes camelCase doivent être entre guillemets doubles dans PostgreSQL
$query = 'SELECT "emailVerificationToken" FROM players WHERE email = ''' + $Email + ''';'

$result = docker compose -f ../infra/docker-compose.yml exec -T postgres psql -U elite64_user -d elite64_db -t -c $query

if ($result -and $result.Trim()) {
    $token = $result.Trim()
    Write-Host "`n✅ Token trouvé pour $Email :" -ForegroundColor Green
    Write-Host $token -ForegroundColor Yellow
    Write-Host "`nVous pouvez maintenant utiliser ce token pour le test de vérification d'email." -ForegroundColor Cyan
    return $token
} else {
    Write-Host "`n❌ Aucun token trouvé pour $Email" -ForegroundColor Red
    Write-Host "Vérifiez que l'email est correct et que le compte existe." -ForegroundColor Yellow
    return $null
}

