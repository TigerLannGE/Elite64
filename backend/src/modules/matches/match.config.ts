export const JOIN_WINDOW_SECONDS = 30;
export const NO_SHOW_GRACE_SECONDS = 60;

// Délai total de no-show avant résolution automatique (en millisecondes)
export const TOTAL_NO_SHOW_MS =
  (JOIN_WINDOW_SECONDS + NO_SHOW_GRACE_SECONDS) * 1000;
