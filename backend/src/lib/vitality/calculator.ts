/**
 * Vitality Score Calculation
 * Based on APEX PRD Section 6
 */

export interface VitalityScoreInputs {
  energy_score?: number | null; // 1-10
  mood_score?: number | null; // 1-10
  libido_score?: number | null; // 1-10
  sleep_duration_hours?: number | null;
  sleep_quality_score?: number | null; // 1-10
  sr_day_count?: number | null;
  user_weights?: {
    energy: number;
    mood: number;
    libido: number;
    sleep: number;
    sr: number;
  };
}

export interface VitalityScoreResult {
  score: number; // 1.0 - 10.0
  color: string; // Hex from color scale
  breakdown: {
    energy_contribution: number;
    mood_contribution: number;
    libido_contribution: number;
    sleep_contribution: number;
    sr_contribution: number;
  };
}

/**
 * Calculate vitality score from daily inputs
 * Formula: Base Score + SR Modifier (capped at 10.0)
 */
export function calculateVitalityScore(
  inputs: VitalityScoreInputs
): VitalityScoreResult | null {
  // Default weights (from PRD Section 6)
  const weights = inputs.user_weights || {
    energy: 0.25,
    mood: 0.20,
    libido: 0.20,
    sleep: 0.20,
    sr: 0.15,
  };

  // Normalize scores to 0-10 scale
  const energyScore = inputs.energy_score || 0;
  const moodScore = inputs.mood_score || 0;
  const libidoScore = inputs.libido_score || 0;

  // Sleep quality calculation
  // Sub-6h penalized, 8h+ rewarded
  let sleepScore = inputs.sleep_quality_score || 0;
  if (inputs.sleep_duration_hours !== null && inputs.sleep_duration_hours !== undefined) {
    if (inputs.sleep_duration_hours < 6) {
      sleepScore *= 0.7; // 30% penalty
    } else if (inputs.sleep_duration_hours >= 8) {
      sleepScore *= 1.2; // 20% bonus, capped at 10
      sleepScore = Math.min(sleepScore, 10);
    }
  }

  // SR modifier calculation
  // Higher streak = higher ceiling
  let srModifier = 0;
  if (inputs.sr_day_count !== null && inputs.sr_day_count !== undefined) {
    const srDay = inputs.sr_day_count;
    if (srDay >= 30) {
      srModifier = 10;
    } else if (srDay >= 21) {
      srModifier = 9;
    } else if (srDay >= 14) {
      srModifier = 8;
    } else if (srDay >= 10) {
      srModifier = 7;
    } else if (srDay >= 7) {
      srModifier = 6;
    } else {
      srModifier = Math.min(srDay * 0.8, 5); // Linear up to day 7
    }
  }

  // Calculate weighted base score
  const totalBaseWeight = weights.energy + weights.mood + weights.libido + weights.sleep;

  if (totalBaseWeight === 0) {
    return null; // Cannot calculate without any base weights
  }

  const baseScore =
    (energyScore * weights.energy +
      moodScore * weights.mood +
      libidoScore * weights.libido +
      sleepScore * weights.sleep) /
    totalBaseWeight;

  // Add SR modifier (additive, not multiplicative)
  const finalScore = Math.min(baseScore + srModifier * weights.sr, 10.0);

  // Get color from scale
  const color = getVitalityColor(finalScore);

  return {
    score: Math.round(finalScore * 10) / 10, // Round to 1 decimal
    color,
    breakdown: {
      energy_contribution: energyScore * weights.energy,
      mood_contribution: moodScore * weights.mood,
      libido_contribution: libidoScore * weights.libido,
      sleep_contribution: sleepScore * weights.sleep,
      sr_contribution: srModifier * weights.sr,
    },
  };
}

/**
 * Map vitality score to color from PRD color scale
 */
export function getVitalityColor(score: number): string {
  // From PRD Section 6 color scale
  if (score >= 9.5) return '#c8f135'; // 10 - Lime green
  if (score >= 9.0) return '#a8e020'; // 9
  if (score >= 8.0) return '#7ec825'; // 8
  if (score >= 7.0) return '#52b030'; // 7 - Green
  if (score >= 6.0) return '#f0c040'; // 6
  if (score >= 5.0) return '#e09020'; // 5 - Amber
  if (score >= 4.0) return '#d06018'; // 4
  if (score >= 3.0) return '#c03020'; // 3 - Red-orange
  if (score >= 2.0) return '#901818'; // 2
  return '#500808'; // 1 - Deep red
}
