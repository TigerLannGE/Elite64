# ============================================
# SCRIPT COMPLET DE TESTS AUTHENTIFICATION
# ============================================
# Ce script teste :
# 1. Vérification d'email
# 2. Login (avec vérification d'email)
# 3. Vérification d'âge minimum (18 ans)
# ============================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TESTS AUTHENTIFICATION ELITE64" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ============================================
# CONFIGURATION
# ============================================
$baseUrl = "http://localhost:4000"
$testEmail = "test2@example.com"
$testPassword = "password123"

# ============================================
# TEST 1 : Vérification d'email
# ============================================
Write-Host "=== TEST 1 : Vérification d'email ===" -ForegroundColor Yellow
Write-Host ""

# Étape 1 : Créer un nouveau compte pour obtenir un token frais
Write-Host "Étape 1 : Création d'un nouveau compte..." -ForegroundColor Cyan
$newAccountBody = @{
    username = "testuser_$(Get-Date -Format 'yyyyMMddHHmmss')"
    email = "test_verify_$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
    password = "password123"
    countryCode = "FR"
    dateOfBirth = "2000-01-01"
} | ConvertTo-Json

try {
    $newAccount = Invoke-RestMethod -Uri "$baseUrl/players" -Method POST -Body $newAccountBody -ContentType "application/json"
    Write-Host "✅ Compte créé avec succès !" -ForegroundColor Green
    Write-Host "   Email: $($newAccount.email)" -ForegroundColor Gray
    Write-Host "   Username: $($newAccount.username)" -ForegroundColor Gray
    
    $verificationToken = $newAccount.emailVerificationToken
    Write-Host "   Token: $verificationToken" -ForegroundColor Gray
    Write-Host ""
    
    # Étape 2 : Vérifier l'email avec le token
    Write-Host "Étape 2 : Vérification de l'email avec le token..." -ForegroundColor Cyan
    $verifyBody = @{
        token = $verificationToken
    } | ConvertTo-Json
    
    $verifyResult = Invoke-RestMethod -Uri "$baseUrl/auth/verify-email" -Method POST -Body $verifyBody -ContentType "application/json"
    Write-Host "✅ Email vérifié avec succès !" -ForegroundColor Green
    $verifyResult | Format-List
    Write-Host ""
    
} catch {
    Write-Host "❌ Erreur lors du Test 1 :" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
}

# ============================================
# TEST 2 : Login (devrait échouer si email non vérifié)
# ============================================
Write-Host "=== TEST 2 : Tentative de login ===" -ForegroundColor Yellow
Write-Host ""

# Étape 1 : Créer un compte sans vérifier l'email
Write-Host "Étape 1 : Création d'un compte (email non vérifié)..." -ForegroundColor Cyan
$unverifiedAccountBody = @{
    username = "testuser_unverified_$(Get-Date -Format 'yyyyMMddHHmmss')"
    email = "test_unverified_$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
    password = "password123"
    countryCode = "FR"
    dateOfBirth = "2000-01-01"
} | ConvertTo-Json

try {
    $unverifiedAccount = Invoke-RestMethod -Uri "$baseUrl/players" -Method POST -Body $unverifiedAccountBody -ContentType "application/json"
    Write-Host "✅ Compte créé (email non vérifié)" -ForegroundColor Green
    Write-Host "   Email: $($unverifiedAccount.email)" -ForegroundColor Gray
    Write-Host ""
    
    # Étape 2 : Tentative de login (devrait échouer)
    Write-Host "Étape 2 : Tentative de login (devrait être refusée)..." -ForegroundColor Cyan
    $loginBody = @{
        email = $unverifiedAccount.email
        password = "password123"
    } | ConvertTo-Json
    
    try {
        $loginResult = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
        Write-Host "❌ PROBLÈME : Le login a réussi alors qu'il ne devrait pas !" -ForegroundColor Red
        Write-Host "   L'email n'est pas vérifié mais le login a fonctionné." -ForegroundColor Red
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401) {
            Write-Host "✅ Test réussi : Login correctement refusé (email non vérifié)" -ForegroundColor Green
            $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "   Message: $($errorDetails.message)" -ForegroundColor Gray
        } else {
            Write-Host "❌ Erreur inattendue (code: $statusCode)" -ForegroundColor Red
            Write-Host $_.Exception.Message -ForegroundColor Red
        }
    }
    Write-Host ""
    
    # Étape 3 : Vérifier l'email puis réessayer le login
    Write-Host "Étape 3 : Vérification de l'email puis nouveau login..." -ForegroundColor Cyan
    $verifyBody2 = @{
        token = $unverifiedAccount.emailVerificationToken
    } | ConvertTo-Json
    
    try {
        $verifyResult2 = Invoke-RestMethod -Uri "$baseUrl/auth/verify-email" -Method POST -Body $verifyBody2 -ContentType "application/json"
        Write-Host "✅ Email vérifié" -ForegroundColor Green
        
        # Nouveau login (devrait maintenant fonctionner)
        $loginBody2 = @{
            email = $unverifiedAccount.email
            password = "password123"
        } | ConvertTo-Json
        
        $loginResult2 = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody2 -ContentType "application/json"
        Write-Host "✅ Login réussi après vérification de l'email !" -ForegroundColor Green
        Write-Host "   Token JWT reçu: $($loginResult2.accessToken.Substring(0, 50))..." -ForegroundColor Gray
        Write-Host "   Username: $($loginResult2.player.username)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Erreur lors de la vérification ou du login :" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
    Write-Host ""
    
} catch {
    Write-Host "❌ Erreur lors du Test 2 :" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
}

# ============================================
# TEST 3 : Vérification d'âge (devrait rejeter les mineurs)
# ============================================
Write-Host "=== TEST 3 : Vérification d'âge minimum (18 ans) ===" -ForegroundColor Yellow
Write-Host ""

# Test 3.1 : Tentative avec un mineur (devrait échouer)
Write-Host "Test 3.1 : Tentative de création avec un mineur (< 18 ans)..." -ForegroundColor Cyan
$minorBody = @{
    username = "minortest_$(Get-Date -Format 'yyyyMMddHHmmss')"
    email = "minor_$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
    password = "password123"
    countryCode = "FR"
    dateOfBirth = "2010-01-01"  # 15 ans (moins de 18 ans)
} | ConvertTo-Json

try {
    $minorResult = Invoke-RestMethod -Uri "$baseUrl/players" -Method POST -Body $minorBody -ContentType "application/json"
    Write-Host "❌ PROBLÈME : Le compte a été créé alors qu'il ne devrait pas l'être !" -ForegroundColor Red
    Write-Host "   Un mineur a pu s'inscrire." -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        Write-Host "✅ Test réussi : Inscription correctement refusée pour mineur" -ForegroundColor Green
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Message: $($errorDetails.message)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Erreur inattendue (code: $statusCode)" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}
Write-Host ""

# Test 3.2 : Tentative avec quelqu'un qui a exactement 18 ans (devrait réussir)
Write-Host "Test 3.2 : Tentative de création avec exactement 18 ans..." -ForegroundColor Cyan
$eighteenYearsAgo = (Get-Date).AddYears(-18).ToString("yyyy-MM-dd")
$exact18Body = @{
    username = "exact18_$(Get-Date -Format 'yyyyMMddHHmmss')"
    email = "exact18_$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
    password = "password123"
    countryCode = "FR"
    dateOfBirth = $eighteenYearsAgo
} | ConvertTo-Json

try {
    $exact18Result = Invoke-RestMethod -Uri "$baseUrl/players" -Method POST -Body $exact18Body -ContentType "application/json"
    Write-Host "✅ Test réussi : Inscription acceptée pour 18 ans" -ForegroundColor Green
    Write-Host "   Email: $($exact18Result.email)" -ForegroundColor Gray
    Write-Host "   Date de naissance: $($exact18Result.dateOfBirth)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "❌ Erreur inattendue (code: $statusCode)" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
Write-Host ""

# Test 3.3 : Tentative avec quelqu'un de plus de 18 ans (devrait réussir)
Write-Host "Test 3.3 : Tentative de création avec > 18 ans..." -ForegroundColor Cyan
$adultBody = @{
    username = "adult_$(Get-Date -Format 'yyyyMMddHHmmss')"
    email = "adult_$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
    password = "password123"
    countryCode = "FR"
    dateOfBirth = "1990-01-01"  # 35 ans
} | ConvertTo-Json

try {
    $adultResult = Invoke-RestMethod -Uri "$baseUrl/players" -Method POST -Body $adultBody -ContentType "application/json"
    Write-Host "✅ Test réussi : Inscription acceptée pour adulte" -ForegroundColor Green
    Write-Host "   Email: $($adultResult.email)" -ForegroundColor Gray
    Write-Host "   Date de naissance: $($adultResult.dateOfBirth)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "❌ Erreur inattendue (code: $statusCode)" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
Write-Host ""

# ============================================
# RÉSUMÉ
# ============================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTS TERMINÉS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "Vérifiez les résultats ci-dessus." -ForegroundColor Yellow
Write-Host "Tous les tests avec ✅ vert sont réussis." -ForegroundColor Green
Write-Host "Les tests avec ❌ rouge indiquent un problème.`n" -ForegroundColor Red

