/**
 * Messages d'erreur de validation pour les configurations de tournoi (Phase 6.0.D)
 * Ces messages sont stables et utilisés dans les tests unitaires.
 */
export const TOURNAMENT_VALIDATION_ERRORS = {
  REQUIRES_DECISIVE_RESULT_WITHOUT_TIEBREAK:
    'Configuration invalide : requiresDecisiveResult=true nécessite un tieBreakPolicy != NONE.',
  NO_DRAW_WITHOUT_TIEBREAK:
    'Configuration invalide : drawRuleMode=NO_DRAW nécessite un tieBreakPolicy != NONE.',
} as const;
