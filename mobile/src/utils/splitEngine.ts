// ═══════════════════════════════════════════════════════════════════════════
// APEX — Split Engine (React Native port)
// Rotation-based training split state machine powered by Hevy data
// ═══════════════════════════════════════════════════════════════════════════
import { getAllWorkouts, HevyWorkout } from './hevy';

// ── Types ────────────────────────────────────────────────────────────────

export interface SplitSlot {
  id: string;
  label: string;
  muscles: string[];
  partner: string | null;
  isRest?: boolean;
}

export interface SplitConfig {
  name: string;
  rotation: SplitSlot[];
  currentIndex: number;
  lastLoggedDate: string | null;
  exerciseMap: Record<string, string>;
  partners: string[];
}

export interface FocusSuggestion {
  type: 'pr' | 'days' | 'overreach' | 'stall' | 'default';
  text: string;
}

export interface PartnerInfo {
  name: string | null;
  source: 'calendar' | 'split' | 'default';
}

export interface NextSession {
  empty?: boolean;
  isRest?: boolean;
  label?: string;
  muscles?: string[];
  partner?: PartnerInfo;
  focus?: FocusSuggestion;
  lastSession?: HevyWorkout[];
  slotId?: string;
  nextAfterRest?: SplitSlot | null;
}

// ── Muscle-group keyword map ─────────────────────────────────────────────

export const MUSCLE_KEYWORDS: Record<string, string[]> = {
  Chest: ['bench press', 'chest press', 'chest fly', 'pec deck', 'dip', 'push-up', 'push up', 'incline press', 'decline press', 'cable fly'],
  Shoulders: ['overhead press', 'ohp', 'shoulder press', 'lateral raise', 'front raise', 'face pull', 'upright row', 'arnold press', 'rear delt'],
  Triceps: ['tricep', 'skull crusher', 'pushdown', 'close grip', 'overhead extension', 'kickback', 'dip'],
  Back: ['row', 'pull-up', 'pullup', 'pulldown', 'lat pull', 'deadlift', 'chin-up', 'chinup', 'cable row', 't-bar', 'barbell row', 'seated row'],
  Biceps: ['curl', 'bicep', 'hammer curl', 'preacher curl', 'concentration curl', 'barbell curl', 'cable curl'],
  Quads: ['squat', 'leg press', 'leg extension', 'lunge', 'front squat', 'hack squat', 'goblet squat', 'bulgarian'],
  Hamstrings: ['romanian deadlift', 'rdl', 'leg curl', 'hamstring', 'good morning', 'stiff leg', 'hip hinge', 'nordic'],
  Calves: ['calf raise', 'calf press', 'seated calf', 'standing calf'],
  Glutes: ['hip thrust', 'glute bridge', 'kickback', 'abductor'],
  Core: ['ab', 'crunch', 'plank', 'sit-up', 'situp', 'leg raise', 'russian twist', 'cable crunch', 'woodchop'],
};

// ── Default PPL split ────────────────────────────────────────────────────

export const DEFAULT_SPLIT: SplitConfig = {
  name: 'Push Pull Legs',
  rotation: [
    { id: 'push', label: 'Push', muscles: ['Chest', 'Shoulders', 'Triceps'], partner: 'James' },
    { id: 'pull', label: 'Pull', muscles: ['Back', 'Biceps'], partner: 'James' },
    { id: 'legs', label: 'Legs', muscles: ['Quads', 'Hamstrings', 'Calves'], partner: null },
    { id: 'rest', label: 'Rest', muscles: [], partner: null, isRest: true },
  ],
  currentIndex: 0,
  lastLoggedDate: null,
  exerciseMap: {},
  partners: ['James'],
};

// ── Exercise Classification ──────────────────────────────────────────────

function classifyExercise(exerciseName: string, split: SplitConfig): string | null {
  const name = exerciseName.toLowerCase();

  if (split.exerciseMap?.[exerciseName]) {
    return split.exerciseMap[exerciseName];
  }

  const matchedMuscles: string[] = [];
  for (const [muscle, keywords] of Object.entries(MUSCLE_KEYWORDS)) {
    if (keywords.some(kw => name.includes(kw))) {
      matchedMuscles.push(muscle);
    }
  }

  if (matchedMuscles.length === 0) return null;

  let bestSlot: string | null = null;
  let bestOverlap = 0;
  for (const slot of split.rotation) {
    if (slot.isRest) continue;
    const overlap = slot.muscles.filter(m => matchedMuscles.includes(m)).length;
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      bestSlot = slot.id;
    }
  }

  return bestSlot;
}

function classifySession(session: HevyWorkout, split: SplitConfig): string | null {
  const slotVotes: Record<string, number> = {};

  for (const ex of session.exercises) {
    const slotId = classifyExercise(ex.name, split);
    if (slotId) {
      slotVotes[slotId] = (slotVotes[slotId] || 0) + 1;
    }
  }

  let best: string | null = null;
  let bestCount = 0;
  for (const [slotId, count] of Object.entries(slotVotes)) {
    if (count > bestCount) {
      bestCount = count;
      best = slotId;
    }
  }

  return best;
}

// ── Index Inference ──────────────────────────────────────────────────────

export function inferCurrentIndex(split: SplitConfig): SplitConfig {
  const workouts = getAllWorkouts();

  if (!workouts || workouts.length === 0) {
    split.currentIndex = 0;
    split.lastLoggedDate = null;
    return split;
  }

  const latest = workouts[0];
  const latestDate = latest.date.toISOString().split('T')[0];

  if (split.lastLoggedDate === latestDate) return split;

  const matchedSlotId = classifySession(latest, split);

  if (matchedSlotId) {
    const matchedIdx = split.rotation.findIndex(s => s.id === matchedSlotId);
    if (matchedIdx !== -1) {
      split.currentIndex = (matchedIdx + 1) % split.rotation.length;
      split.lastLoggedDate = latestDate;
    }
  }

  return split;
}

// ── Next Session ─────────────────────────────────────────────────────────

export function getNextSession(split: SplitConfig): NextSession {
  const updated = inferCurrentIndex(split);

  if (!updated.rotation || updated.rotation.length === 0) {
    return { empty: true };
  }

  const slot = updated.rotation[updated.currentIndex];

  if (slot.isRest) {
    return {
      isRest: true,
      label: 'Rest Day',
      partner: undefined,
      focus: undefined,
      nextAfterRest: getNextNonRestSlot(updated, updated.currentIndex),
    };
  }

  const partner = resolvePartner(slot, updated);
  const focus = getFocusSuggestion(slot, updated);
  const lastSession = getLastSessionForSlot(slot.id, updated);

  return {
    isRest: false,
    label: slot.label,
    muscles: slot.muscles,
    partner,
    focus,
    lastSession,
    slotId: slot.id,
  };
}

function getNextNonRestSlot(split: SplitConfig, fromIndex: number): SplitSlot | null {
  for (let i = 1; i <= split.rotation.length; i++) {
    const idx = (fromIndex + i) % split.rotation.length;
    if (!split.rotation[idx].isRest) {
      return split.rotation[idx];
    }
  }
  return null;
}

// ── Partner Resolution ───────────────────────────────────────────────────

function resolvePartner(slot: SplitSlot, split: SplitConfig): PartnerInfo {
  // In mobile, calendar event scanning will come via Zustand store later.
  // For now, fall back to slot default.
  if (slot.partner) {
    return { name: slot.partner, source: 'split' };
  }
  return { name: null, source: 'default' };
}

// ── Focus Suggestion Algorithm ───────────────────────────────────────────

function getLastSessionForSlot(slotId: string, split: SplitConfig): HevyWorkout[] {
  const workouts = getAllWorkouts();
  const matched: HevyWorkout[] = [];

  for (const w of workouts) {
    const cls = classifySession(w, split);
    if (cls === slotId) {
      matched.push(w);
      if (matched.length >= 3) break;
    }
  }

  return matched;
}

function getTopSetWeight(session: HevyWorkout, exerciseName: string): number {
  for (const ex of session.exercises) {
    if (ex.name === exerciseName) {
      return ex.maxWeight || 0;
    }
  }
  return 0;
}

function daysBetween(dateA: Date, dateB: Date): number {
  const msPerDay = 86400000;
  return Math.round(Math.abs(dateB.getTime() - dateA.getTime()) / msPerDay);
}

function isThisWeek(date: Date): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return date >= monday && date <= sunday;
}

export function getFocusSuggestion(slot: SplitSlot, split: SplitConfig): FocusSuggestion {
  const last3 = getLastSessionForSlot(slot.id, split);

  if (last3.length < 2) {
    return { type: 'default', text: 'Stay consistent. Hit your working sets.' };
  }

  const volumeByExercise: Record<string, number> = {};
  for (const sess of last3) {
    for (const ex of sess.exercises) {
      volumeByExercise[ex.name] = (volumeByExercise[ex.name] || 0) + ex.volume;
    }
  }
  const topLift = Object.entries(volumeByExercise)
    .sort((a, b) => b[1] - a[1])[0]?.[0];

  if (!topLift) {
    return { type: 'default', text: 'Stay consistent. Hit your working sets.' };
  }

  // CHECK 1 — PR Opportunity
  if (last3.length >= 3) {
    const weights = last3.map(s => getTopSetWeight(s, topLift));
    if (weights[0] > weights[1] && weights[1] > weights[2] && weights[2] > 0) {
      return { type: 'pr', text: `${topLift} trending up — push for overload today` };
    }
  }

  // CHECK 2 — Days Since Last
  const daysSince = daysBetween(last3[0].date, new Date());
  if (daysSince >= 7) {
    return { type: 'days', text: `Last ${slot.label} was ${daysSince} days ago — prioritise volume today` };
  }

  // CHECK 3 — Overreached
  const allWorkouts = getAllWorkouts();
  const thisWeekCount = allWorkouts.filter(w => {
    if (!isThisWeek(w.date)) return false;
    return classifySession(w, split) === slot.id;
  }).length;
  if (thisWeekCount >= 3) {
    return { type: 'overreach', text: 'High frequency this week — consider a deload set today' };
  }

  // CHECK 4 — Stalled
  if (last3.length >= 3) {
    const weights = last3.map(s => getTopSetWeight(s, topLift));
    if (weights[0] === weights[1] && weights[1] === weights[2] && weights[0] > 0) {
      return { type: 'stall', text: `${topLift} stalled for 3 sessions — try a variation or rep scheme change` };
    }
  }

  return { type: 'default', text: 'Stay consistent. Hit your working sets.' };
}

// ── Split Progress ───────────────────────────────────────────────────────

export function getSplitProgress(split: SplitConfig) {
  return {
    rotation: split.rotation,
    currentIndex: split.currentIndex,
    name: split.name,
  };
}
