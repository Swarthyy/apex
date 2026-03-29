// ═══════════════════════════════════════════════════════════════════════════
// APEX — Hevy Data Processor (React Native port)
// Transforms raw Hevy API data into APEX-compatible format
// ═══════════════════════════════════════════════════════════════════════════
import hevyRaw from './hevy-data.json';

export interface HevySet {
  weight: number | null;
  reps: number | null;
  type: string;
  rpe: number | null;
  distance: number | null;
  duration: number | null;
}

export interface HevyExercise {
  name: string;
  templateId: string;
  sets: HevySet[];
  volume: number;
  maxWeight: number;
  notes: string;
}

export interface HevyWorkout {
  id: string;
  title: string;
  date: Date;
  dateKey: string;
  startTime: string;
  endTime: string;
  durationMin: number;
  exercises: HevyExercise[];
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  description: string;
}

const HEVY_BY_DATE: Record<string, HevyWorkout[]> = {};
const HEVY_WORKOUTS: HevyWorkout[] = [];

(hevyRaw as any[]).forEach((w: any) => {
  const d = new Date(w.start_time);
  const endD = new Date(w.end_time);
  const durationMin = Math.round((endD.getTime() - d.getTime()) / 60000);

  let totalVolume = 0;
  let totalSets = 0;
  let totalReps = 0;

  const exercises: HevyExercise[] = w.exercises.map((ex: any) => {
    const sets: HevySet[] = ex.sets
      .filter((s: any) => s.type !== 'warmup')
      .map((s: any) => ({
        weight: s.weight_kg,
        reps: s.reps,
        type: s.type,
        rpe: s.rpe,
        distance: s.distance_meters,
        duration: s.duration_seconds,
      }));

    const exVolume = sets.reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0);
    totalVolume += exVolume;
    totalSets += sets.length;
    totalReps += sets.reduce((sum, s) => sum + (s.reps || 0), 0);

    const maxWeight = Math.max(...sets.map(s => s.weight || 0), 0);

    return {
      name: ex.title,
      templateId: ex.exercise_template_id,
      sets,
      volume: Math.round(exVolume),
      maxWeight,
      notes: ex.notes || '',
    };
  });

  const workout: HevyWorkout = {
    id: w.id,
    title: w.title,
    date: d,
    dateKey: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
    startTime: w.start_time,
    endTime: w.end_time,
    durationMin,
    exercises,
    totalVolume: Math.round(totalVolume),
    totalSets,
    totalReps,
    description: w.description || '',
  };

  HEVY_WORKOUTS.push(workout);
  const key = workout.dateKey;
  if (!HEVY_BY_DATE[key]) HEVY_BY_DATE[key] = [];
  HEVY_BY_DATE[key].push(workout);
});

// Sort newest first
HEVY_WORKOUTS.sort((a, b) => b.date.getTime() - a.date.getTime());

// ── Exports ──────────────────────────────────────────

export function getWorkoutsForDate(year: number, month: number, day: number): HevyWorkout[] {
  return HEVY_BY_DATE[`${year}-${month}-${day}`] || [];
}

export function getAllWorkouts(): HevyWorkout[] {
  return HEVY_WORKOUTS;
}

export function getRecentWorkouts(n: number): HevyWorkout[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - n);
  return HEVY_WORKOUTS.filter(w => w.date >= cutoff);
}

export function getWorkoutCountInRange(n: number): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - n);
  return HEVY_WORKOUTS.filter(w => w.date >= cutoff).length;
}

export function getGymSummary() {
  const total = HEVY_WORKOUTS.length;
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const recent30 = HEVY_WORKOUTS.filter(w => w.date >= thirtyDaysAgo && w.date <= now);
  const prev30 = HEVY_WORKOUTS.filter(w => w.date >= sixtyDaysAgo && w.date < thirtyDaysAgo);

  const recentVol = recent30.reduce((s, w) => s + w.totalVolume, 0);
  const prevVol = prev30.reduce((s, w) => s + w.totalVolume, 0);
  const volTrend = prevVol > 0 ? Math.round(((recentVol - prevVol) / prevVol) * 100) : 0;

  const fourWeeksAgo = new Date(now);
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const last4Weeks = HEVY_WORKOUTS.filter(w => w.date >= fourWeeksAgo && w.date <= now);
  const weeklyAvg = +(last4Weeks.length / 4).toFixed(1);

  let streak = 0;
  for (let w = 0; w < 52; w++) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - w * 7 - 7);
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - w * 7);
    const hasSession = HEVY_WORKOUTS.some(wk => wk.date >= weekStart && wk.date < weekEnd);
    if (hasSession) streak++;
    else break;
  }

  const exFreq: Record<string, number> = {};
  HEVY_WORKOUTS.forEach(w => {
    w.exercises.forEach(ex => {
      exFreq[ex.name] = (exFreq[ex.name] || 0) + 1;
    });
  });
  const topExercises = Object.entries(exFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const totalVolume = HEVY_WORKOUTS.reduce((s, w) => s + w.totalVolume, 0);
  const totalSets = HEVY_WORKOUTS.reduce((s, w) => s + w.totalSets, 0);

  return {
    total,
    weeklyAvg,
    streak,
    volTrend,
    recentCount: recent30.length,
    recentVolume: recentVol,
    totalVolume,
    totalSets,
    topExercises,
    mostRecent: HEVY_WORKOUTS[0] || null,
  };
}
