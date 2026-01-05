import { test, expect } from '@playwright/test'

/**
 * Test de smoke - Phase 6.2.B
 * 
 * Vérifie que l'application démarre correctement et que les pages principales sont accessibles.
 * Ce test est minimal et ne dépend pas du backend.
 */
test.describe('Smoke Tests', () => {
  test('landing page loads correctly', async ({ page }) => {
    // Naviguer vers la landing page
    await page.goto('/')

    // Vérifier que la page se charge
    await expect(page).toHaveTitle(/Elite64/i)

    // Vérifier qu'il y a du contenu visible
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('login page is accessible', async ({ page }) => {
    // Naviguer vers la page de login
    await page.goto('/login')

    // Vérifier que la page se charge
    await expect(page).toHaveTitle(/Elite64/i)

    // Vérifier qu'il y a un formulaire de login (ou au moins un élément visible)
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('register page is accessible', async ({ page }) => {
    // Naviguer vers la page d'inscription
    await page.goto('/register')

    // Vérifier que la page se charge
    await expect(page).toHaveTitle(/Elite64/i)

    // Vérifier qu'il y a du contenu visible
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

