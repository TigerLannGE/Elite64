/**
 * Script de validation des invariants de calcul pour PrizePool
 * 
 * Valide que les calculs respectent les invariants critiques :
 * - operatorTotalCents = commissionCents + tournamentFeesCents
 * - totalEntriesCents = operatorTotalCents + distributableCents
 * - distributableCents >= 0
 * - commissionCents >= 0, tournamentFeesCents >= 0
 * 
 * Usage: npx ts-node backend/scripts/validate-prize-pool-invariants.ts
 */

import { PrismaClient } from '@prisma/client';

// Constantes canoniques (copiées de prize-pool.service.ts)
const COMMISSION_RATE = 0.05;        // 5% commission plateforme
const TOURNAMENT_FEES_RATE = 0.0475;  // 4,75% frais d'organisation de tournoi

interface PrizePoolComputationInput {
  playersCount: number;
  buyInCents: number;
}

interface PrizePoolComputationResult {
  totalEntriesCents: number;
  commissionCents: number;
  tournamentFeesCents: number;
  operatorTotalCents: number;
  distributableCents: number;
}

// Fonction de calcul standalone (copiée de prize-pool.service.ts)
function computePrizePool(
  input: PrizePoolComputationInput,
): PrizePoolComputationResult {
  // 1. Total des inscriptions
  const totalEntriesCents = input.playersCount * input.buyInCents;

  // 2. Commission plateforme : 5% du total
  const commissionCents = Math.floor(totalEntriesCents * COMMISSION_RATE);

  // 3. Frais d'organisation : 4,75% du total
  const tournamentFeesCents = Math.floor(
    totalEntriesCents * TOURNAMENT_FEES_RATE,
  );

  // 4. Total prélèvement opérateur : SOMME des deux composantes
  const operatorTotalCents = commissionCents + tournamentFeesCents;

  // 5. Prize pool redistribuable : total - prélèvement opérateur
  const distributableCents = totalEntriesCents - operatorTotalCents;

  return {
    totalEntriesCents,
    commissionCents,
    tournamentFeesCents,
    operatorTotalCents,
    distributableCents,
  };
}

const prisma = new PrismaClient();

interface TestCase {
  name: string;
  playersCount: number;
  buyInCents: number;
}

const testCases: TestCase[] = [
  { name: '2 joueurs × 10.00 CHF', playersCount: 2, buyInCents: 1000 },
  { name: '3 joueurs × 5.00 CHF', playersCount: 3, buyInCents: 500 },
  { name: '2 joueurs × 10.01 CHF', playersCount: 2, buyInCents: 1001 },
  { name: '5 joueurs × 1.00 CHF', playersCount: 5, buyInCents: 100 },
  { name: '7 joueurs × 3.33 CHF', playersCount: 7, buyInCents: 333 },
];

function validateInvariants(result: PrizePoolComputationResult) {
  const errors: string[] = [];

  // Invariant 1: operatorTotalCents = commissionCents + tournamentFeesCents
  if (result.operatorTotalCents !== result.commissionCents + result.tournamentFeesCents) {
    errors.push(
      `❌ Invariant 1 violé: operatorTotalCents (${result.operatorTotalCents}) != commissionCents (${result.commissionCents}) + tournamentFeesCents (${result.tournamentFeesCents})`,
    );
  }

  // Invariant 2: totalEntriesCents = operatorTotalCents + distributableCents
  if (result.totalEntriesCents !== result.operatorTotalCents + result.distributableCents) {
    errors.push(
      `❌ Invariant 2 violé: totalEntriesCents (${result.totalEntriesCents}) != operatorTotalCents (${result.operatorTotalCents}) + distributableCents (${result.distributableCents})`,
    );
  }

  // Invariant 3: distributableCents >= 0
  if (result.distributableCents < 0) {
    errors.push(
      `❌ Invariant 3 violé: distributableCents (${result.distributableCents}) < 0`,
    );
  }

  // Invariant 4: commissionCents >= 0, tournamentFeesCents >= 0
  if (result.commissionCents < 0) {
    errors.push(`❌ Invariant 4 violé: commissionCents (${result.commissionCents}) < 0`);
  }
  if (result.tournamentFeesCents < 0) {
    errors.push(
      `❌ Invariant 4 violé: tournamentFeesCents (${result.tournamentFeesCents}) < 0`,
    );
  }

  return errors;
}

async function validateDatabaseInvariants() {
  console.log('\n📊 Validation des invariants en base de données...\n');

  const prizePools = await prisma.prizePool.findMany({
    where: {
      operatorTotalCents: { not: 0 }, // Ignorer les PrizePool non migrés
    },
  });

  if (prizePools.length === 0) {
    console.log('⚠️  Aucun PrizePool trouvé en base de données (ou non migrés)');
    return;
  }

  let totalErrors = 0;
  let legacyCount = 0;

  for (const prizePool of prizePools) {
    const errors: string[] = [];

    // Vérifier les invariants
    if (
      prizePool.operatorTotalCents !==
      prizePool.commissionCents + prizePool.tournamentFeesCents
    ) {
      errors.push(
        `operatorTotalCents (${prizePool.operatorTotalCents}) != commissionCents (${prizePool.commissionCents}) + tournamentFeesCents (${prizePool.tournamentFeesCents})`,
      );
    }

    if (
      prizePool.totalEntriesCents !==
      prizePool.operatorTotalCents + prizePool.distributableCents
    ) {
      errors.push(
        `totalEntriesCents (${prizePool.totalEntriesCents}) != operatorTotalCents (${prizePool.operatorTotalCents}) + distributableCents (${prizePool.distributableCents})`,
      );
    }

    if (prizePool.distributableCents < 0) {
      errors.push(`distributableCents (${prizePool.distributableCents}) < 0`);
    }

    if (prizePool.commissionCents < 0 || prizePool.tournamentFeesCents < 0) {
      errors.push(
        `Valeurs négatives: commissionCents=${prizePool.commissionCents}, tournamentFeesCents=${prizePool.tournamentFeesCents}`,
      );
    }

    // Détecter les PrizePool legacy (tournamentFeesCents calculé comme résidu)
    // Un PrizePool legacy a tournamentFeesCents qui n'est pas exactement 4.75% du total
    const expectedTournamentFees = Math.floor(
      prizePool.totalEntriesCents * 0.0475,
    );
    const isLegacy =
      Math.abs(prizePool.tournamentFeesCents - expectedTournamentFees) > 1;

    if (isLegacy) {
      legacyCount++;
    }

    if (errors.length > 0) {
      console.log(`❌ PrizePool ${prizePool.id} (tournamentId: ${prizePool.tournamentId}):`);
      errors.forEach((error) => console.log(`   - ${error}`));
      totalErrors += errors.length;
    }
  }

  console.log(`\n✅ Validation terminée:`);
  console.log(`   - ${prizePools.length} PrizePool(s) vérifié(s)`);
  console.log(`   - ${legacyCount} PrizePool(s) legacy détecté(s) (résidu historique)`);
  if (totalErrors === 0) {
    console.log(`   - ✅ Aucune erreur détectée`);
  } else {
    console.log(`   - ❌ ${totalErrors} erreur(s) détectée(s)`);
    process.exit(1);
  }
}

async function main() {
  console.log('🔍 Validation des invariants de calcul PrizePool\n');
  console.log('=' .repeat(60));

  // Test 1: Validation des cas de test
  console.log('\n📋 Test 1: Validation des cas de test\n');

  let allTestsPassed = true;

  for (const testCase of testCases) {
    const result = computePrizePool({
      playersCount: testCase.playersCount,
      buyInCents: testCase.buyInCents,
    });

    const errors = validateInvariants(result);

    if (errors.length > 0) {
      console.log(`❌ ${testCase.name}:`);
      errors.forEach((error) => console.log(`   ${error}`));
      allTestsPassed = false;
    } else {
      console.log(`✅ ${testCase.name}:`);
      console.log(`   Total: ${result.totalEntriesCents} centimes`);
      console.log(`   Commission: ${result.commissionCents} centimes (5%)`);
      console.log(`   Frais tournoi: ${result.tournamentFeesCents} centimes (4,75%)`);
      console.log(
        `   Total opérateur: ${result.operatorTotalCents} centimes (9,75%)`,
      );
      console.log(
        `   Distributable: ${result.distributableCents} centimes (90,25%)`,
      );
    }
  }

  // Test 2: Validation en base de données
  await validateDatabaseInvariants();

  console.log('\n' + '='.repeat(60));

  if (allTestsPassed) {
    console.log('\n✅ Tous les tests sont passés');
    process.exit(0);
  } else {
    console.log('\n❌ Certains tests ont échoué');
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

