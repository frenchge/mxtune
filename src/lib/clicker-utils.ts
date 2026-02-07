// Utilitaires Clickers MX - Conversion clics/pourcentages et calculs

// Valeurs par défaut des plages de clics par marque de suspension
export const DEFAULT_CLICK_RANGES: Record<string, {
  forkCompression: number;
  forkRebound: number;
  shockCompressionLow: number;
  shockCompressionHigh: number;
  shockRebound: number;
}> = {
  WP: {
    forkCompression: 30,
    forkRebound: 30,
    shockCompressionLow: 30,
    shockCompressionHigh: 20,
    shockRebound: 30,
  },
  KYB: {
    forkCompression: 20,
    forkRebound: 20,
    shockCompressionLow: 20,
    shockCompressionHigh: 15,
    shockRebound: 20,
  },
  Showa: {
    forkCompression: 20,
    forkRebound: 20,
    shockCompressionLow: 20,
    shockCompressionHigh: 15,
    shockRebound: 20,
  },
  Ohlins: {
    forkCompression: 40,
    forkRebound: 40,
    shockCompressionLow: 40,
    shockCompressionHigh: 25,
    shockRebound: 40,
  },
  Sachs: {
    forkCompression: 25,
    forkRebound: 25,
    shockCompressionLow: 25,
    shockCompressionHigh: 18,
    shockRebound: 25,
  },
  default: {
    forkCompression: 25,
    forkRebound: 25,
    shockCompressionLow: 25,
    shockCompressionHigh: 20,
    shockRebound: 25,
  },
};

// Obtenir la plage de clics par défaut pour une marque
export function getDefaultClickRange(brand: string) {
  return DEFAULT_CLICK_RANGES[brand] || DEFAULT_CLICK_RANGES.default;
}

// Convertir clics en pourcentage
export function clicksToPercentage(clicks: number, maxClicks: number): number {
  if (maxClicks <= 0) return 0;
  return Math.round((clicks / maxClicks) * 100);
}

// Convertir pourcentage en clics
export function percentageToClicks(percentage: number, maxClicks: number): number {
  if (maxClicks <= 0) return 0;
  return Math.round((percentage / 100) * maxClicks);
}

// Calculer le nombre de clics et la direction pour atteindre une cible
export interface ClickAdjustment {
  clicks: number;
  direction: "CW" | "CCW"; // Clockwise / Counter-clockwise
  directionLabel: string;
  fromPercentage: number;
  toPercentage: number;
}

export function calculateAdjustment(
  currentClicks: number,
  targetClicks: number,
  maxClicks: number,
  _isCompression: boolean = true
): ClickAdjustment {
  const diff = targetClicks - currentClicks;
  
  // Pour la compression: CW = plus de compression (plus de clics sortis)
  // Pour le rebound: CW = plus de rebound (plus de clics sortis)
  // Généralement: plus de clics = plus dur
  
  return {
    clicks: Math.abs(diff),
    direction: diff > 0 ? "CCW" : "CW", // CCW pour ajouter des clics (ouvrir), CW pour retirer (fermer)
    directionLabel: diff > 0 ? "Ouvrir (anti-horaire)" : "Fermer (horaire)",
    fromPercentage: clicksToPercentage(currentClicks, maxClicks),
    toPercentage: clicksToPercentage(targetClicks, maxClicks),
  };
}

// Calculer l'équilibre avant/arrière
export interface SuspensionBalance {
  frontCompression: number; // pourcentage
  frontRebound: number;
  rearCompression: number; // moyenne BV/HV ou BV seul
  rearRebound: number;
  compressionBalance: "FRONT_HEAVY" | "BALANCED" | "REAR_HEAVY";
  reboundBalance: "FRONT_HEAVY" | "BALANCED" | "REAR_HEAVY";
  overallBalance: "FRONT_HEAVY" | "BALANCED" | "REAR_HEAVY";
}

export function calculateBalance(
  forkCompression: number,
  forkRebound: number,
  shockCompressionLow: number,
  shockRebound: number,
  maxForkCompression: number,
  maxForkRebound: number,
  maxShockCompressionLow: number,
  maxShockRebound: number,
  _shockCompressionHigh?: number,
  _maxShockCompressionHigh?: number
): SuspensionBalance {
  const frontCompression = clicksToPercentage(forkCompression, maxForkCompression);
  const frontRebound = clicksToPercentage(forkRebound, maxForkRebound);
  
  // Pour l'arrière, on prend la compression BV (plus utilisée quotidiennement)
  const rearCompression = clicksToPercentage(shockCompressionLow, maxShockCompressionLow);
  const rearRebound = clicksToPercentage(shockRebound, maxShockRebound);

  // Calculer les déséquilibres (seuil de 10% pour être considéré déséquilibré)
  const compressionDiff = frontCompression - rearCompression;
  const reboundDiff = frontRebound - rearRebound;
  const threshold = 10;

  const getBalance = (diff: number): "FRONT_HEAVY" | "BALANCED" | "REAR_HEAVY" => {
    if (diff > threshold) return "FRONT_HEAVY";
    if (diff < -threshold) return "REAR_HEAVY";
    return "BALANCED";
  };

  const compressionBalance = getBalance(compressionDiff);
  const reboundBalance = getBalance(reboundDiff);
  
  // Balance globale basée sur la moyenne
  const avgDiff = (compressionDiff + reboundDiff) / 2;
  const overallBalance = getBalance(avgDiff);

  return {
    frontCompression,
    frontRebound,
    rearCompression,
    rearRebound,
    compressionBalance,
    reboundBalance,
    overallBalance,
  };
}

// Couleur selon le pourcentage (vert = souple, jaune = milieu, rouge = dur)
export function getPercentageColor(percentage: number): string {
  if (percentage <= 33) return "text-emerald-400";
  if (percentage <= 66) return "text-amber-400";
  return "text-red-400";
}

export function getPercentageBgColor(percentage: number): string {
  if (percentage <= 33) return "bg-emerald-500";
  if (percentage <= 66) return "bg-amber-500";
  return "bg-red-500";
}

// Labels pour les directions
export const DIRECTION_LABELS = {
  CW: { short: "↻", long: "Horaire (fermer)", action: "Fermer" },
  CCW: { short: "↺", long: "Anti-horaire (ouvrir)", action: "Ouvrir" },
};

// Description de la position
export function getPositionDescription(percentage: number): string {
  if (percentage <= 20) return "Très souple";
  if (percentage <= 40) return "Souple";
  if (percentage <= 60) return "Neutre";
  if (percentage <= 80) return "Ferme";
  return "Très ferme";
}
