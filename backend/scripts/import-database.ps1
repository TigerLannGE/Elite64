# Script PowerShell pour importer une base de données PostgreSQL
# Usage: .\import-database.ps1 -DumpPath "C:\chemin\vers\dump.sql" [-Port 5433] [-DropDatabase]

param(
    [Parameter(Mandatory=$true)]
    [string]$DumpPath,
    
    [Parameter(Mandatory=$false)]
    [int]$Port = 5433,
    
    [Parameter(Mandatory=$false)]
    [switch]$DropDatabase,
    
    [Parameter(Mandatory=$false)]
    [string]$DbHost = "localhost",
    
    [Parameter(Mandatory=$false)]
    [string]$User = "chessbet_user",
    
    [Parameter(Mandatory=$false)]
    [string]$Database = "chessbet_db",
    
    [Parameter(Mandatory=$false)]
    [string]$Password = "Dark-Revan-GE-9418657"
)

Write-Host "🔄 Import de base de données PostgreSQL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que le fichier existe
if (-not (Test-Path $DumpPath)) {
    Write-Host "❌ Erreur : Le fichier '$DumpPath' n'existe pas !" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Fichier de dump : $DumpPath" -ForegroundColor Green
Write-Host "🗄️  Base de données : $Database" -ForegroundColor Green
Write-Host "🔌 Port : $Port" -ForegroundColor Green
Write-Host ""

# Détecter si psql est disponible ou si on doit utiliser Docker
$useDocker = $false
$psqlCmd = "psql"
$pgRestoreCmd = "pg_restore"
$pgDumpCmd = "pg_dump"

try {
    $null = Get-Command psql -ErrorAction Stop
    Write-Host "✅ psql trouvé dans le PATH" -ForegroundColor Green
} catch {
    Write-Host "⚠️  psql non trouvé dans le PATH, utilisation de Docker..." -ForegroundColor Yellow
    $useDocker = $true
    $psqlCmd = "docker exec -i chessbet-postgres psql"
    $pgRestoreCmd = "docker exec -i chessbet-postgres pg_restore"
    $pgDumpCmd = "docker exec -i chessbet-postgres pg_dump"
    
    # Vérifier que Docker est disponible et que le conteneur existe
    try {
        $null = Get-Command docker -ErrorAction Stop
        $containerStatus = docker ps -a --filter "name=chessbet-postgres" --format "{{.Status}}" 2>&1
        if ($LASTEXITCODE -ne 0 -or $containerStatus -notmatch "Up") {
            Write-Host "❌ Erreur : Le conteneur Docker 'chessbet-postgres' n'est pas démarré !" -ForegroundColor Red
            Write-Host "   Démarrez-le avec : docker compose -f infra/docker-compose.yml up -d postgres" -ForegroundColor Yellow
            exit 1
        }
        Write-Host "✅ Conteneur Docker 'chessbet-postgres' trouvé" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erreur : Docker n'est pas installé ou non disponible !" -ForegroundColor Red
        Write-Host "   Installez Docker Desktop ou ajoutez psql au PATH." -ForegroundColor Yellow
        exit 1
    }
}

# Vérifier la connexion PostgreSQL
Write-Host "🔍 Vérification de la connexion PostgreSQL..." -ForegroundColor Yellow
$env:PGPASSWORD = $Password

if ($useDocker) {
    # Avec Docker, on n'a pas besoin de spécifier host/port
    $testConnection = docker exec chessbet-postgres psql -U $User -d postgres -c "SELECT 1;" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur : Impossible de se connecter à PostgreSQL via Docker !" -ForegroundColor Red
        Write-Host "   Vérifiez que le conteneur est démarré : docker compose -f infra/docker-compose.yml up -d postgres" -ForegroundColor Yellow
        exit 1
    }
} else {
    try {
        $testConnection = psql -h $DbHost -p $Port -U $User -d postgres -c "SELECT 1;" 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Erreur : Impossible de se connecter à PostgreSQL !" -ForegroundColor Red
            Write-Host "   Vérifiez que PostgreSQL est démarré et que les identifiants sont corrects." -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "❌ Erreur : Impossible d'exécuter psql !" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Connexion PostgreSQL OK" -ForegroundColor Green

# Sauvegarder la base actuelle
if (-not $DropDatabase) {
    Write-Host ""
    Write-Host "💾 Sauvegarde de la base actuelle..." -ForegroundColor Yellow
    $backupPath = "backup_avant_import_$(Get-Date -Format 'yyyyMMdd_HHmmss').dump"
    
    if ($useDocker) {
        docker exec chessbet-postgres pg_dump -U $User -d $Database -F c > $backupPath 2>&1
    } else {
        pg_dump -h $DbHost -p $Port -U $User -d $Database -F c -f $backupPath 2>&1 | Out-Null
    }
    
    if ($LASTEXITCODE -eq 0 -and (Test-Path $backupPath)) {
        Write-Host "✅ Sauvegarde créée : $backupPath" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Impossible de créer la sauvegarde (base peut-être vide)" -ForegroundColor Yellow
    }
}

# Vider la base si demandé
if ($DropDatabase) {
    Write-Host ""
    Write-Host "⚠️  ATTENTION : Suppression de la base de données '$Database'..." -ForegroundColor Red
    $confirm = Read-Host "Êtes-vous sûr ? (oui/non)"
    if ($confirm -ne "oui") {
        Write-Host "❌ Opération annulée" -ForegroundColor Yellow
        exit 0
    }
    
    Write-Host "🗑️  Suppression de la base..." -ForegroundColor Yellow
    if ($useDocker) {
        docker exec chessbet-postgres psql -U $User -d postgres -c "DROP DATABASE IF EXISTS $Database;" 2>&1 | Out-Null
    } else {
        psql -h $DbHost -p $Port -U $User -d postgres -c "DROP DATABASE IF EXISTS $Database;" 2>&1 | Out-Null
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de la suppression de la base" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Base supprimée" -ForegroundColor Green
    
    Write-Host "🔨 Création de la nouvelle base..." -ForegroundColor Yellow
    if ($useDocker) {
        docker exec chessbet-postgres psql -U $User -d postgres -c "CREATE DATABASE $Database;" 2>&1 | Out-Null
    } else {
        psql -h $DbHost -p $Port -U $User -d postgres -c "CREATE DATABASE $Database;" 2>&1 | Out-Null
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de la création de la base" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Base créée" -ForegroundColor Green
}

# Déterminer le type de fichier
$fileExtension = [System.IO.Path]::GetExtension($DumpPath).ToLower()

Write-Host ""
Write-Host "📥 Import du dump..." -ForegroundColor Yellow

if ($fileExtension -eq ".sql") {
    # Import SQL
    Write-Host "   Format : SQL" -ForegroundColor Cyan
    if ($useDocker) {
        # Copier le fichier dans le conteneur puis l'importer
        $fileName = Split-Path $DumpPath -Leaf
        docker cp $DumpPath chessbet-postgres:/tmp/$fileName
        docker exec chessbet-postgres psql -U $User -d $Database -f /tmp/$fileName 2>&1
        docker exec chessbet-postgres rm /tmp/$fileName
    } else {
        psql -h $DbHost -p $Port -U $User -d $Database -f $DumpPath 2>&1
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de l'import SQL" -ForegroundColor Red
        exit 1
    }
} elseif ($fileExtension -eq ".dump") {
    # Import dump binaire
    Write-Host "   Format : Dump binaire" -ForegroundColor Cyan
    $importSuccess = $false
    
    if ($useDocker) {
        # Copier le fichier dans le conteneur puis l'importer
        $fileName = Split-Path $DumpPath -Leaf
        docker cp $DumpPath chessbet-postgres:/tmp/$fileName
        
        # Essayer d'abord avec les options standard
        Write-Host "   Tentative d'import avec pg_restore..." -ForegroundColor Cyan
        $restoreOutput = docker exec chessbet-postgres pg_restore -U $User -d $Database -v --no-owner --no-acl /tmp/$fileName 2>&1
        $restoreExitCode = $LASTEXITCODE
        
        if ($restoreExitCode -eq 0) {
            $importSuccess = $true
            Write-Host $restoreOutput
        } else {
            Write-Host $restoreOutput
            Write-Host "   ⚠️  Échec avec pg_restore (code: $restoreExitCode)" -ForegroundColor Yellow
            
            # Vérifier si c'est une erreur de version
            if ($restoreOutput -match "unsupported version") {
                Write-Host "   ⚠️  Le dump a été créé avec une version plus récente de PostgreSQL" -ForegroundColor Yellow
                Write-Host "   💡 Solution : Utilisez un conteneur PostgreSQL plus récent ou reconvertissez le dump" -ForegroundColor Cyan
                Write-Host ""
                Write-Host "   Tentative alternative : conversion en SQL..." -ForegroundColor Yellow
                
                # Essayer de convertir le dump en SQL (peut ne pas fonctionner si version incompatible)
                $convertOutput = docker exec chessbet-postgres pg_restore -U $User -f /tmp/dump.sql /tmp/$fileName 2>&1
                $convertExitCode = $LASTEXITCODE
                
                if ($convertExitCode -eq 0) {
                    Write-Host "   ✅ Conversion réussie, import du SQL..." -ForegroundColor Green
                    $sqlOutput = docker exec chessbet-postgres psql -U $User -d $Database -f /tmp/dump.sql 2>&1
                    $sqlExitCode = $LASTEXITCODE
                    Write-Host $sqlOutput
                    docker exec chessbet-postgres rm /tmp/dump.sql
                    
                    if ($sqlExitCode -eq 0) {
                        $importSuccess = $true
                    }
                } else {
                    Write-Host $convertOutput
                    Write-Host "   ❌ Impossible de convertir le dump (version incompatible)" -ForegroundColor Red
                }
            }
        }
        
        docker exec chessbet-postgres rm /tmp/$fileName
    } else {
        $restoreOutput = pg_restore -h $DbHost -p $Port -U $User -d $Database -v --no-owner --no-acl $DumpPath 2>&1
        $restoreExitCode = $LASTEXITCODE
        Write-Host $restoreOutput
        
        if ($restoreExitCode -eq 0) {
            $importSuccess = $true
        }
    }
    
    if (-not $importSuccess) {
        Write-Host ""
        Write-Host "❌ Erreur lors de l'import dump" -ForegroundColor Red
        Write-Host "   Le dump semble avoir été créé avec une version plus récente de PostgreSQL." -ForegroundColor Yellow
        Write-Host "   Solutions possibles :" -ForegroundColor Cyan
        Write-Host "   1. Mettre à jour l'image Docker vers postgres:latest" -ForegroundColor White
        Write-Host "   2. Recréer le dump avec la version actuelle de PostgreSQL" -ForegroundColor White
        Write-Host "   3. Utiliser un conteneur temporaire avec PostgreSQL plus récent pour convertir" -ForegroundColor White
        exit 1
    }
} else {
    Write-Host "⚠️  Format de fichier non reconnu. Tentative d'import SQL..." -ForegroundColor Yellow
    if ($useDocker) {
        $fileName = Split-Path $DumpPath -Leaf
        docker cp $DumpPath chessbet-postgres:/tmp/$fileName
        docker exec chessbet-postgres psql -U $User -d $Database -f /tmp/$fileName 2>&1
        docker exec chessbet-postgres rm /tmp/$fileName
    } else {
        psql -h $DbHost -p $Port -U $User -d $Database -f $DumpPath 2>&1
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de l'import" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✅ Import terminé avec succès !" -ForegroundColor Green
Write-Host ""

# Vérifier les tables
Write-Host "🔍 Vérification des tables..." -ForegroundColor Yellow
if ($useDocker) {
    $tables = docker exec chessbet-postgres psql -U $User -d $Database -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>&1
} else {
    $tables = psql -h $DbHost -p $Port -U $User -d $Database -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>&1
}
$tables = $tables.Trim()
Write-Host "   Tables trouvées : $tables" -ForegroundColor Cyan

# Vérifier les migrations Prisma
Write-Host ""
Write-Host "📋 Vérification des migrations Prisma..." -ForegroundColor Yellow
Write-Host "   Exécutez : cd backend && npx prisma migrate status" -ForegroundColor Cyan
Write-Host ""

Write-Host "✨ Opération terminée !" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines étapes recommandées :" -ForegroundColor Cyan
Write-Host "   1. cd backend" -ForegroundColor White
Write-Host "   2. npx prisma migrate status" -ForegroundColor White
Write-Host "   3. npx prisma generate" -ForegroundColor White
Write-Host "   4. npx prisma studio (pour vérifier les données)" -ForegroundColor White

