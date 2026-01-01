# Script de diagnostic pour un tournoi Elite64
# Usage: .\diagnose-tournament.ps1 -TournamentId "cmj7jc9nj000xkpah5epqewer"

param(
    [Parameter(Mandatory=$false)]
    [string]$TournamentId = "cmj7jc9nj000xkpah5epqewer"
)

Write-Host "🔍 DIAGNOSTIC DU TOURNOI $TournamentId" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Gray
Write-Host ""

# Fonction pour exécuter une requête SQL
function Invoke-SqlQuery {
    param([string]$Query)
    $Query | docker exec -i elite64-postgres psql -U elite64_user -d elite64_db -t -A
}

# 1. Vérifier le statut du tournoi
Write-Host "📋 1. STATUT DU TOURNOI" -ForegroundColor Yellow
Write-Host "-" * 80

$tournamentQuery = @"
SELECT 
    id, 
    name, 
    status, 
    "minPlayers", 
    "maxPlayers",
    "createdAt"::text,
    "updatedAt"::text
FROM tournaments 
WHERE id = '$TournamentId';
"@

$tournament = Invoke-SqlQuery -Query $tournamentQuery
if ($tournament) {
    $fields = $tournament -split '\|'
    Write-Host "  ID: $($fields[0])" -ForegroundColor White
    Write-Host "  Nom: $($fields[1])" -ForegroundColor White
    Write-Host "  Statut: $($fields[2])" -ForegroundColor $(if($fields[2] -eq 'FINISHED'){'Green'}elseif($fields[2] -eq 'RUNNING'){'Yellow'}else{'Gray'})
    Write-Host "  Min/Max joueurs: $($fields[3])/$($fields[4])" -ForegroundColor White
    Write-Host "  Créé: $($fields[5])" -ForegroundColor Gray
    Write-Host "  Mis à jour: $($fields[6])" -ForegroundColor Gray
} else {
    Write-Host "  ❌ TOURNOI NON TROUVÉ" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 2. Vérifier les inscriptions (TournamentEntry)
Write-Host "👥 2. INSCRIPTIONS AU TOURNOI" -ForegroundColor Yellow
Write-Host "-" * 80

$entriesQuery = @"
SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
    SUM(CASE WHEN status = 'ELIMINATED' THEN 1 ELSE 0 END) as eliminated
FROM "TournamentEntry"
WHERE "tournamentId" = '$TournamentId';
"@

$entries = Invoke-SqlQuery -Query $entriesQuery
if ($entries) {
    $fields = $entries -split '\|'
    Write-Host "  Total inscriptions: $($fields[0])" -ForegroundColor White
    Write-Host "  Actifs: $($fields[1])" -ForegroundColor Green
    Write-Host "  Éliminés: $($fields[2])" -ForegroundColor Red
} else {
    Write-Host "  ⚠️  Aucune inscription trouvée" -ForegroundColor Yellow
}
Write-Host ""

# 3. Vérifier les matches
Write-Host "🎮 3. MATCHES DU TOURNOI" -ForegroundColor Yellow
Write-Host "-" * 80

$matchesQuery = @"
SELECT 
    "roundNumber",
    "boardNumber",
    status,
    result,
    "resultReason",
    id
FROM matches 
WHERE "tournamentId" = '$TournamentId'
ORDER BY "roundNumber", "boardNumber";
"@

$matchesRaw = Invoke-SqlQuery -Query $matchesQuery
if ($matchesRaw) {
    $matches = $matchesRaw -split "`n"
    foreach ($match in $matches) {
        if ($match) {
            $fields = $match -split '\|'
            $statusColor = switch ($fields[2]) {
                'FINISHED' { 'Green' }
                'RUNNING' { 'Yellow' }
                'PENDING' { 'Gray' }
                'CANCELED' { 'Red' }
                default { 'White' }
            }
            Write-Host "  Round $($fields[0]) - Board $($fields[1]): " -NoNewline -ForegroundColor White
            Write-Host "$($fields[2])" -NoNewline -ForegroundColor $statusColor
            if ($fields[3] -ne '') {
                Write-Host " → $($fields[3])" -NoNewline -ForegroundColor Cyan
            }
            if ($fields[4] -ne '') {
                Write-Host " ($($fields[4]))" -NoNewline -ForegroundColor Gray
            }
            Write-Host ""
            Write-Host "    ID: $($fields[5])" -ForegroundColor DarkGray
        }
    }
    
    # Statistiques des matches
    Write-Host ""
    $statsQuery = @"
SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN status = 'RUNNING' THEN 1 ELSE 0 END) as running,
    SUM(CASE WHEN status = 'FINISHED' THEN 1 ELSE 0 END) as finished,
    SUM(CASE WHEN status = 'CANCELED' THEN 1 ELSE 0 END) as canceled,
    MAX("roundNumber") as max_round
FROM matches
WHERE "tournamentId" = '$TournamentId';
"@
    $stats = Invoke-SqlQuery -Query $statsQuery
    if ($stats) {
        $fields = $stats -split '\|'
        Write-Host "  📊 Statistiques:" -ForegroundColor Cyan
        Write-Host "    Total matches: $($fields[0])" -ForegroundColor White
        Write-Host "    PENDING: $($fields[1])" -ForegroundColor Gray
        Write-Host "    RUNNING: $($fields[2])" -ForegroundColor Yellow
        Write-Host "    FINISHED: $($fields[3])" -ForegroundColor Green
        Write-Host "    CANCELED: $($fields[4])" -ForegroundColor Red
        Write-Host "    Ronde maximale: $($fields[5])" -ForegroundColor White
    }
} else {
    Write-Host "  ⚠️  Aucun match trouvé" -ForegroundColor Yellow
}
Write-Host ""

# 4. Analyser la dernière ronde
Write-Host "🎯 4. ANALYSE DE LA DERNIÈRE RONDE" -ForegroundColor Yellow
Write-Host "-" * 80

$lastRoundQuery = @"
WITH max_round AS (
    SELECT MAX("roundNumber") as round_num
    FROM matches
    WHERE "tournamentId" = '$TournamentId'
)
SELECT 
    COUNT(*) as total_matches,
    SUM(CASE WHEN status = 'FINISHED' THEN 1 ELSE 0 END) as finished_matches,
    (SELECT round_num FROM max_round) as round_number
FROM matches
WHERE "tournamentId" = '$TournamentId'
  AND "roundNumber" = (SELECT round_num FROM max_round);
"@

$lastRound = Invoke-SqlQuery -Query $lastRoundQuery
if ($lastRound) {
    $fields = $lastRound -split '\|'
    $totalMatches = [int]$fields[0]
    $finishedMatches = [int]$fields[1]
    $roundNumber = $fields[2]
    
    Write-Host "  Ronde actuelle: Round $roundNumber" -ForegroundColor White
    Write-Host "  Matches terminés: $finishedMatches / $totalMatches" -ForegroundColor White
    
    if ($finishedMatches -eq $totalMatches) {
        Write-Host "  ✅ Tous les matches de la ronde sont terminés" -ForegroundColor Green
        Write-Host "  ⚠️  La ronde suivante devrait avoir été générée automatiquement" -ForegroundColor Yellow
    } else {
        Write-Host "  ⏳ Ronde en cours (matches non terminés)" -ForegroundColor Yellow
    }
}
Write-Host ""

# 5. Vérifier les winners potentiels
Write-Host "🏆 5. WINNERS DE LA DERNIÈRE RONDE" -ForegroundColor Yellow
Write-Host "-" * 80

$winnersQuery = @"
WITH max_round AS (
    SELECT MAX("roundNumber") as round_num
    FROM matches
    WHERE "tournamentId" = '$TournamentId'
)
SELECT 
    m.id as match_id,
    m.result,
    CASE 
        WHEN m.result = 'WHITE_WIN' THEN m."whiteEntryId"
        WHEN m.result = 'BLACK_WIN' THEN m."blackEntryId"
        WHEN m.result = 'BYE' THEN m."whiteEntryId"
        ELSE NULL
    END as winner_entry_id,
    CASE 
        WHEN m.result = 'WHITE_WIN' THEN p_white.username
        WHEN m.result = 'BLACK_WIN' THEN p_black.username
        WHEN m.result = 'BYE' THEN p_white.username
        ELSE NULL
    END as winner_username
FROM matches m
LEFT JOIN "TournamentEntry" te_white ON m."whiteEntryId" = te_white.id
LEFT JOIN players p_white ON te_white."playerId" = p_white.id
LEFT JOIN "TournamentEntry" te_black ON m."blackEntryId" = te_black.id
LEFT JOIN players p_black ON te_black."playerId" = p_black.id
WHERE m."tournamentId" = '$TournamentId'
  AND m."roundNumber" = (SELECT round_num FROM max_round)
  AND m.status = 'FINISHED';
"@

$winnersRaw = Invoke-SqlQuery -Query $winnersQuery
if ($winnersRaw) {
    $winners = $winnersRaw -split "`n"
    $winnerCount = 0
    foreach ($winner in $winners) {
        if ($winner) {
            $fields = $winner -split '\|'
            if ($fields[2] -ne '') {
                $winnerCount++
                Write-Host "  Winner #$winnerCount : $($fields[3]) ($($fields[1]))" -ForegroundColor Green
                Write-Host "    Entry ID: $($fields[2])" -ForegroundColor DarkGray
            }
        }
    }
    
    Write-Host ""
    if ($winnerCount -eq 1) {
        Write-Host "  ✅ UN SEUL WINNER → Le tournoi devrait être finalisé" -ForegroundColor Green
    } elseif ($winnerCount -gt 1) {
        Write-Host "  ⏳ PLUSIEURS WINNERS → Une nouvelle ronde devrait être créée" -ForegroundColor Yellow
    } else {
        Write-Host "  ⚠️  Aucun winner détecté" -ForegroundColor Red
    }
} else {
    Write-Host "  ⚠️  Aucun winner trouvé" -ForegroundColor Yellow
}
Write-Host ""

# 6. Vérifier le PrizePool
Write-Host "💰 6. PRIZE POOL" -ForegroundColor Yellow
Write-Host "-" * 80

$prizePoolQuery = @"
SELECT 
    id,
    "totalEntriesCents",
    "commissionCents",
    "distributableCents",
    "isFrozen"
FROM "PrizePool"
WHERE "tournamentId" = '$TournamentId';
"@

$prizePool = Invoke-SqlQuery -Query $prizePoolQuery
if ($prizePool) {
    $fields = $prizePool -split '\|'
    Write-Host "  Total entrées: $($fields[1]) cents ($([int]$fields[1]/100) EUR)" -ForegroundColor White
    Write-Host "  Commission: $($fields[2]) cents ($([int]$fields[2]/100) EUR)" -ForegroundColor White
    Write-Host "  Distribuable: $($fields[3]) cents ($([int]$fields[3]/100) EUR)" -ForegroundColor Green
    Write-Host "  Figé: $($fields[4])" -ForegroundColor $(if($fields[4] -eq 't'){'Green'}else{'Yellow'})
} else {
    Write-Host "  ⚠️  Aucun prize pool trouvé" -ForegroundColor Yellow
}
Write-Host ""

# 7. Vérifier les standings
Write-Host "📊 7. CLASSEMENTS (si finalisé)" -ForegroundColor Yellow
Write-Host "-" * 80

$standingsQuery = @"
SELECT COUNT(*) as count
FROM "TournamentStanding"
WHERE "tournamentId" = '$TournamentId';
"@

$standingsCount = Invoke-SqlQuery -Query $standingsQuery
if ($standingsCount -and [int]$standingsCount -gt 0) {
    Write-Host "  ✅ $standingsCount classement(s) trouvé(s)" -ForegroundColor Green
    
    # Afficher les standings
    $detailsQuery = @"
SELECT 
    position,
    p.username,
    wins,
    losses,
    draws,
    "payoutCents"
FROM "TournamentStanding" ts
JOIN players p ON ts."playerId" = p.id
WHERE ts."tournamentId" = '$TournamentId'
ORDER BY position;
"@
    
    $standingsRaw = Invoke-SqlQuery -Query $detailsQuery
    if ($standingsRaw) {
        $standings = $standingsRaw -split "`n"
        foreach ($standing in $standings) {
            if ($standing) {
                $fields = $standing -split '\|'
                Write-Host "  #$($fields[0]) - $($fields[1]): " -NoNewline -ForegroundColor White
                Write-Host "$($fields[2])W / $($fields[3])L / $($fields[4])D" -NoNewline -ForegroundColor Cyan
                if ($fields[5] -ne '' -and [int]$fields[5] -gt 0) {
                    Write-Host " → $([int]$fields[5]/100) EUR" -ForegroundColor Green
                }
            }
        }
    }
} else {
    Write-Host "  ⚠️  Aucun classement trouvé (tournoi non finalisé)" -ForegroundColor Yellow
}
Write-Host ""

# 8. DIAGNOSTIC FINAL
Write-Host "🔎 8. DIAGNOSTIC & RECOMMANDATIONS" -ForegroundColor Magenta
Write-Host "=" * 80

$tournament = Invoke-SqlQuery -Query "SELECT status FROM tournaments WHERE id = '$TournamentId';"
$lastRoundInfo = Invoke-SqlQuery -Query $lastRoundQuery
$fields = $lastRoundInfo -split '\|'
$totalMatches = [int]$fields[0]
$finishedMatches = [int]$fields[1]

Write-Host ""
if ($tournament -eq 'RUNNING' -and $finishedMatches -eq $totalMatches -and $totalMatches -gt 0) {
    Write-Host "⚠️  PROBLÈME DÉTECTÉ:" -ForegroundColor Red
    Write-Host "  - Le tournoi est en statut RUNNING" -ForegroundColor Yellow
    Write-Host "  - Tous les matches sont terminés" -ForegroundColor Yellow
    Write-Host "  - La finalisation automatique n'a PAS fonctionné" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 SOLUTION:" -ForegroundColor Green
    Write-Host "  Appeler manuellement l'endpoint de finalisation:" -ForegroundColor White
    Write-Host "  POST http://localhost:4000/admin/tournaments/$TournamentId/finalize" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Ou via PowerShell:" -ForegroundColor White
    Write-Host "  `$token = ""VOTRE_TOKEN_JWT""" -ForegroundColor Gray
    Write-Host "  `$headers = @{ ""Authorization"" = ""Bearer `$token""; ""Content-Type"" = ""application/json"" }" -ForegroundColor Gray
    Write-Host "  Invoke-RestMethod -Uri ""http://localhost:4000/admin/tournaments/$TournamentId/finalize"" -Method POST -Headers `$headers" -ForegroundColor Gray
} elseif ($tournament -eq 'FINISHED') {
    Write-Host "✅ Le tournoi est correctement finalisé" -ForegroundColor Green
} elseif ($finishedMatches -lt $totalMatches) {
    Write-Host "⏳ Le tournoi est toujours en cours (matches non terminés)" -ForegroundColor Yellow
} else {
    Write-Host "❓ État indéterminé - vérifier manuellement" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=" * 80
Write-Host "Diagnostic terminé ✅" -ForegroundColor Green

