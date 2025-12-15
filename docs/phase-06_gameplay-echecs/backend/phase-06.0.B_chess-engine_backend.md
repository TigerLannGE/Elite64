# Phase 6.0.B - Moteur d'échecs backend

**Date de création** : Décembre 2025  
**Statut** : ✅ Complété et testé

---

## 📋 Vue d'ensemble

Cette phase implémente le moteur d'échecs backend, autorité serveur unique, sans exposition HTTP/WebSocket.

### Objectifs

- ✅ Ajouter la dépendance `chess.js` (BSD-2-Clause, compatible)
- ✅ Créer `ChessEngineService` dans `backend/src/modules/matches/`
- ✅ Implémenter la validation et l'application de coups
- ✅ Détecter toutes les fins de partie (échec et mat, pat, matériel insuffisant, règle des 50 coups, triple répétition)
- ✅ Écrire des tests unitaires Jest complets (32 tests)

---

## 🏗️ Architecture

### Structure

```
backend/src/modules/matches/
├── chess-engine.service.ts          # Service moteur d'échecs
├── chess-engine.service.spec.ts     # Tests unitaires (32 tests)
├── types/
│   └── chess-engine.types.ts         # Types TypeScript
└── matches.module.ts                 # Module (ChessEngineService exporté)
```

### Dépendance

```json
{
  "dependencies": {
    "chess.js": "^1.0.0-beta.6"
  }
}
```

**Licence** : BSD-2-Clause (compatible, non-GPL)  
**Source** : Package officiel `chess.js` (pas un fork)

---

## ⚠️ Important : Horodatage

**Note importante** : `chess.js` ne gère **aucun horodatage**. La bibliothèque gère uniquement l'état du jeu (position FEN, coups, règles d'échecs).

Tous les timestamps de match (UTC) seront ajoutés ultérieurement par la couche `Match` / `MatchMove` lors de l'intégration avec la base de données.

Le `ChessEngineService` est **pur** et ne génère aucune date ou timestamp.

---

## 🔧 ChessEngineService

### Caractéristiques

- **Déterministe** : Même entrée = même sortie
- **Pur** : Aucun effet de bord (pas d'accès DB, pas d'horodatage, pas de dépendance système)
- **Testable** : 32 tests unitaires couvrant tous les cas

### Méthodes principales

#### `validateAndApplyMove(fen, moveInput): ChessMoveResult`

Valide et applique un coup sur une position FEN donnée.

**Paramètres** :
- `fen` : Position FEN initiale (optionnel, par défaut position de départ)
- `moveInput` : `{ from: string, to: string, promotion?: 'q'|'r'|'b'|'n' }`

**Retour** :
- `success` : boolean
- `error` : string (si échec)
- `fenBefore` : string
- `fenAfter` : string
- `san` : string (notation algébrique standard)
- `gameEnd` : `GameEnd | null`

**Exemple** :
```typescript
const result = chessEngineService.validateAndApplyMove(null, {
  from: 'e2',
  to: 'e4',
});

// result.success = true
// result.san = "e4"
// result.fenAfter = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
```

#### `detectGameEnd(chess): GameEnd | null`

Détecte si la partie est terminée et pour quelle raison.

**Raisons de fin de partie** :
- `CHECKMATE` : Échec et mat
- `STALEMATE` : Pat
- `INSUFFICIENT_MATERIAL` : Matériel insuffisant
- `FIFTY_MOVE_RULE` : Règle des 50 coups
- `THREE_FOLD_REPETITION` : Triple répétition

**Exemple** :
```typescript
const chess = chessEngineService.initializeGame(mateFen);
const gameEnd = chessEngineService.detectGameEnd(chess);

// gameEnd = {
//   reason: GameEndReason.CHECKMATE,
//   winner: 'white'
// }
```

#### Méthodes utilitaires

- `initializeGame(fen?)`: Initialise une partie depuis FEN
- `getLegalMoves(fen?)`: Récupère tous les coups légaux
- `isLegalMove(fen, moveInput)`: Vérifie si un coup est légal

---

## 📝 Types

### `ChessMoveInput`

```typescript
interface ChessMoveInput {
  from: string;        // Notation algébrique (ex: "e2")
  to: string;          // Notation algébrique (ex: "e4")
  promotion?: 'q' | 'r' | 'b' | 'n';  // Promotion optionnelle
}
```

### `ChessMoveResult`

```typescript
interface ChessMoveResult {
  success: boolean;
  error?: string;
  fenBefore: string;
  fenAfter: string;
  san: string;
  gameEnd: GameEnd | null;
}
```

### `GameEndReason`

```typescript
enum GameEndReason {
  CHECKMATE = 'CHECKMATE',
  STALEMATE = 'STALEMATE',
  INSUFFICIENT_MATERIAL = 'INSUFFICIENT_MATERIAL',
  FIFTY_MOVE_RULE = 'FIFTY_MOVE_RULE',
  THREE_FOLD_REPETITION = 'THREE_FOLD_REPETITION',
  DRAW_BY_AGREEMENT = 'DRAW_BY_AGREEMENT',
}
```

### `GameEnd`

```typescript
interface GameEnd {
  reason: GameEndReason;
  winner?: 'white' | 'black';
}
```

---

## 🧪 Tests

### Couverture

32 tests unitaires couvrant :

- ✅ Coups illégaux (3 tests)
- ✅ Roque valide / invalide (4 tests)
- ✅ Promotion (dame, tour, fou, cavalier) (5 tests)
- ✅ Prise en passant (2 tests)
- ✅ Échec et mat (2 tests)
- ✅ Pat (1 test)
- ✅ Triple répétition (1 test)
- ✅ Règle des 50 coups (1 test)
- ✅ Matériel insuffisant (2 tests)
- ✅ Coups légaux de base (3 tests)
- ✅ Méthodes utilitaires (8 tests)

### Exécution

```bash
npm test -- chess-engine.service.spec.ts
```

**Résultat** : ✅ 32 tests passent

---

## 🔒 Contraintes respectées

- ✅ Pas de logique HTTP
- ✅ Pas de WebSocket
- ✅ Pas de modification Prisma
- ✅ Pas de modification Tournament / payouts
- ✅ Service déterministe et pur (testable)
- ✅ Aucun effet de bord ailleurs dans le codebase
- ✅ Aucun import circulaire

---

## 📚 Intégration

### Module MatchesModule

Le `ChessEngineService` est :
- Déclaré comme `provider` dans `MatchesModule`
- Exporté pour utilisation par d'autres modules
- Aucun import circulaire détecté

**Fichier** : `backend/src/modules/matches/matches.module.ts`

```typescript
@Module({
  imports: [
    PrismaModule,
    AuthModule,
    forwardRef(() => TournamentsModule),
  ],
  controllers: [MatchesController, MatchesAdminController],
  providers: [MatchesService, ChessEngineService],
  exports: [MatchesService, ChessEngineService],
})
export class MatchesModule {}
```

### Utilisation future

Le service peut être injecté dans d'autres services pour :
- Valider des coups avant de les enregistrer en DB
- Détecter automatiquement les fins de partie
- Générer des listes de coups légaux pour l'UI

**Exemple d'injection** :
```typescript
constructor(
  private readonly chessEngine: ChessEngineService,
) {}
```

---

## ✅ Checklist de validation

- [x] Dépendance `chess.js` ajoutée (BSD-2-Clause)
- [x] `ChessEngineService` créé
- [x] Types TypeScript définis
- [x] Validation et application de coups implémentée
- [x] Détection de fin de partie complète
- [x] Tests unitaires (32 tests, tous verts)
- [x] Service intégré dans `MatchesModule`
- [x] Aucun effet de bord
- [x] Service pur et déterministe
- [x] Documentation complète
- [x] Audit de conformité passé (licence, pureté, imports)

---

## 📖 Références

- [chess.js GitHub](https://github.com/jhlywa/chess.js)
- [chess.js Documentation](https://github.com/jhlywa/chess.js#readme)
- [FEN Notation](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation)
- [SAN Notation](https://en.wikipedia.org/wiki/Algebraic_notation_(chess))

---

**Statut final** : ✅ **100% complété et testé**
