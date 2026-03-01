// ═══════════════════════════════════════════════════════════════════════════
// APEX — Hevy Data Processor
// Transforms raw Hevy API data into APEX-compatible format
// ═══════════════════════════════════════════════════════════════════════════
import hevyRaw from './hevy-data.json';

// Process all workouts into a date-keyed map
const HEVY_BY_DATE = {};
const HEVY_WORKOUTS = [];

hevyRaw.forEach(w => {
    const d = new Date(w.start_time);
    const endD = new Date(w.end_time);
    const durationMin = Math.round((endD - d) / 60000);

    let totalVolume = 0, totalSets = 0, totalReps = 0;
    const exercises = w.exercises.map(ex => {
        const sets = ex.sets.filter(s => s.type !== 'warmup').map(s => ({
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

        // Detect PRs (highest weight for this exercise in this workout)
        const maxWeight = Math.max(...sets.map(s => s.weight || 0));

        return {
            name: ex.title,
            templateId: ex.exercise_template_id,
            sets,
            volume: Math.round(exVolume),
            maxWeight,
            notes: ex.notes || '',
        };
    });

    const workout = {
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
HEVY_WORKOUTS.sort((a, b) => b.date - a.date);

// ── Exports ──────────────────────────────────────────────

/** Get all workouts for a specific date (year, month-0-indexed, day) */
export function getWorkoutsForDate(year, month, day) {
    return HEVY_BY_DATE[`${year}-${month}-${day}`] || [];
}

/** Get all workouts */
export function getAllWorkouts() { return HEVY_WORKOUTS; }

/** Get workouts from the last N days */
export function getRecentWorkouts(n) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - n);
    return HEVY_WORKOUTS.filter(w => w.date >= cutoff);
}

/** Count workouts in last N days */
export function getWorkoutCountInRange(n) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - n);
    return HEVY_WORKOUTS.filter(w => w.date >= cutoff).length;
}

/** Get summary stats for the gym sector */
export function getGymSummary() {
    const total = HEVY_WORKOUTS.length;

    // Volume trend (last 30d vs previous 30d)
    const now = new Date(2026, 1, 27);
    const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(now); sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recent30 = HEVY_WORKOUTS.filter(w => w.date >= thirtyDaysAgo && w.date <= now);
    const prev30 = HEVY_WORKOUTS.filter(w => w.date >= sixtyDaysAgo && w.date < thirtyDaysAgo);

    const recentVol = recent30.reduce((s, w) => s + w.totalVolume, 0);
    const prevVol = prev30.reduce((s, w) => s + w.totalVolume, 0);
    const volTrend = prevVol > 0 ? Math.round(((recentVol - prevVol) / prevVol) * 100) : 0;

    // Sessions per week (last 4 weeks)
    const fourWeeksAgo = new Date(now); fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const last4Weeks = HEVY_WORKOUTS.filter(w => w.date >= fourWeeksAgo && w.date <= now);
    const weeklyAvg = +(last4Weeks.length / 4).toFixed(1);

    // Streak (consecutive weeks with at least 1 gym session)
    let streak = 0;
    for (let w = 0; w < 52; w++) {
        const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - w * 7 - 7);
        const weekEnd = new Date(now); weekEnd.setDate(weekEnd.getDate() - w * 7);
        const hasSession = HEVY_WORKOUTS.some(wk => wk.date >= weekStart && wk.date < weekEnd);
        if (hasSession) streak++;
        else break;
    }

    // Exercise frequency (top exercises)
    const exFreq = {};
    HEVY_WORKOUTS.forEach(w => {
        w.exercises.forEach(ex => {
            exFreq[ex.name] = (exFreq[ex.name] || 0) + 1;
        });
    });
    const topExercises = Object.entries(exFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));

    // Volume per month (for charts)
    const volumeByMonth = {};
    HEVY_WORKOUTS.forEach(w => {
        const m = `${w.date.getFullYear()}-${String(w.date.getMonth() + 1).padStart(2, '0')}`;
        if (!volumeByMonth[m]) volumeByMonth[m] = { volume: 0, sessions: 0, sets: 0 };
        volumeByMonth[m].volume += w.totalVolume;
        volumeByMonth[m].sessions++;
        volumeByMonth[m].sets += w.totalSets;
    });

    // Total lifetime volume
    const totalVolume = HEVY_WORKOUTS.reduce((s, w) => s + w.totalVolume, 0);
    const totalSets = HEVY_WORKOUTS.reduce((s, w) => s + w.totalSets, 0);

    return {
        total, weeklyAvg, streak, volTrend,
        recentCount: recent30.length,
        recentVolume: recentVol,
        totalVolume, totalSets,
        topExercises, volumeByMonth,
        mostRecent: HEVY_WORKOUTS[0] || null,
    };
}

/** Get volume chart data (last N months) */
export function getVolumeChartData(months = 12) {
    const data = [];
    const now = new Date(2026, 1, 27);
    for (let i = months - 1; i >= 0; i--) {
        const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mEnd = new Date(m.getFullYear(), m.getMonth() + 1, 0);
        const monthWorkouts = HEVY_WORKOUTS.filter(w => w.date >= m && w.date <= mEnd);
        const vol = monthWorkouts.reduce((s, w) => s + w.totalVolume, 0);
        const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        data.push({
            label: SHORT[m.getMonth()],
            volume: vol,
            sessions: monthWorkouts.length,
        });
    }
    return data;
}
