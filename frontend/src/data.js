// ═══════════════════════════════════════════════════════════════════════════
// APEX — Demo Data Store (with real Hevy gym data)
// ═══════════════════════════════════════════════════════════════════════════
import { getWorkoutsForDate, getGymSummary, getAllWorkouts } from './hevy.js';
import { apiClient } from './apiClient.js';

// Seeded random for consistent demo data (can eventually be removed)
function seededRandom(seed) {
    let s = seed;
    return function () { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
}

// Data Store
const DEMO_DATA = {};
const TODAY = new Date();
export let UPCOMING_EVENTS = [];

export async function loadDashboardData() {
    const end = new Date(TODAY);
    const start = new Date(TODAY);
    start.setDate(end.getDate() - 90);

    const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
    const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;

    // Clear data
    for (let key in DEMO_DATA) delete DEMO_DATA[key];

    // Set 90 empty days
    for (let i = 90; i >= 0; i--) {
        const d = new Date(TODAY);
        d.setDate(d.getDate() - i);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

        DEMO_DATA[key] = {
            date: new Date(d), energy: 0, mood: 0, libido: 0, sleep: 0, weight: 0, bodyFat: 0,
            srDay: 0, hasGym: false, hadLiver: false, hadRawMilk: false, hadOysters: false, vitality: 0,
            dots: [], events: [],
            meals: [], totalKcal: 0, totalProtein: 0, totalFat: 0, totalCarbs: 0, nutScore: 0,
            gymWorkouts: [], gymVolume: 0, gymSets: 0, gymDuration: 0,
        };
    }

    const futureDate = new Date(TODAY);
    futureDate.setDate(futureDate.getDate() + 30);
    const futureStr = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}-${String(futureDate.getDate()).padStart(2, '0')}`;

    try {
        const [checkinsRes, sleepRes, gymRes, bodyRes, calRes, upcomingCalRes] = await Promise.all([
            apiClient(`/checkins?start_date=${startStr}&end_date=${endStr}`),
            apiClient(`/sleep?start_date=${startStr}&end_date=${endStr}`),
            apiClient(`/gym?start_date=${startStr}&end_date=${endStr}`),
            apiClient(`/body-metrics?start_date=${startStr}&end_date=${endStr}`),
            apiClient(`/calendar/events?start_date=${startStr}&end_date=${endStr}`),
            apiClient(`/calendar/events?start_date=${endStr}&end_date=${futureStr}`),
        ]);

        (checkinsRes?.checkins || []).forEach(c => {
            const d = new Date(c.check_date);
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            if (DEMO_DATA[key]) {
                DEMO_DATA[key].energy = c.energy_score || 0;
                DEMO_DATA[key].mood = c.mood_score || 0;
                DEMO_DATA[key].libido = c.libido_score || 0;
                DEMO_DATA[key].srDay = c.sr_day_count || 0;
            }
        });

        (sleepRes?.sleep_logs || []).forEach(s => {
            const d = new Date(s.sleep_date);
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            if (DEMO_DATA[key]) {
                DEMO_DATA[key].sleep = s.duration_minutes ? +(s.duration_minutes / 60).toFixed(1) : 0;
            }
        });

        (gymRes?.sessions || []).forEach(g => {
            const d = new Date(g.session_date);
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            if (DEMO_DATA[key]) {
                DEMO_DATA[key].hasGym = true;
                DEMO_DATA[key].gymVolume += g.total_volume || 0;
                DEMO_DATA[key].gymSets += g.total_sets || 0;
                DEMO_DATA[key].gymDuration += g.duration_minutes || 0;
                DEMO_DATA[key].gymWorkouts.push({
                    title: g.workout_name,
                    durationMin: g.duration_minutes,
                    totalVolume: g.total_volume,
                    totalSets: g.total_sets,
                    date: d,
                    exercises: g.exercises || []
                });
                DEMO_DATA[key].dots.push('var(--orange)');
            }
        });

        (bodyRes?.metrics || []).forEach(b => {
            const d = new Date(b.measurement_date);
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            if (DEMO_DATA[key]) {
                DEMO_DATA[key].weight = b.weight_kg || 0;
                DEMO_DATA[key].bodyFat = b.body_fat_percentage || 0;
            }
        });

        (calRes?.events || []).forEach(e => {
            const d = new Date(e.event_date);
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            if (DEMO_DATA[key]) {
                let color = 'var(--muted)';
                if (e.category === 'work') color = 'var(--blue)';
                if (e.category === 'social') color = 'var(--pink)';
                if (e.category === 'health') color = 'var(--teal)';
                if (e.category === 'gym') color = 'var(--orange)';

                DEMO_DATA[key].events.push({
                    label: e.title,
                    time: new Date(e.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    color
                });
            }
        });

        UPCOMING_EVENTS = upcomingCalRes?.events || [];

        // Recalculate vitality points
        Object.values(DEMO_DATA).forEach(day => {
            const sleepScore = Math.min(10, Math.max(1, Math.round((day.sleep / 9) * 10)));
            const srScore = Math.min(10, Math.round(day.srDay / 3));
            day.vitality = +((day.energy * 0.25 + day.mood * 0.2 + day.libido * 0.2 + sleepScore * 0.2 + srScore * 0.15)).toFixed(1);
        });

        // Add today's Google Calendar events directly into today's bucket if needed (can be added later)
    } catch (e) {
        console.error('Failed to load API data:', e);
    }
}

// ── Seed from Onboarding ────────────────────────────────────────────────────
export function seedFromOnboarding() {
    let ob;
    try { ob = JSON.parse(localStorage.getItem('apex_onboarding')); } catch { return; }
    if (!ob) return;

    const todayKey = `${TODAY.getFullYear()}-${TODAY.getMonth()}-${TODAY.getDate()}`;
    const today = DEMO_DATA[todayKey];
    if (!today) return;

    // SR streak: set today and work backwards
    if (ob.sr) {
        const srDay = ob.sr.active ? (ob.sr.currentDay || 1) : 0;
        today.srDay = srDay;
        // Recalc vitality with real SR
        const sleepScore = Math.min(10, Math.max(1, Math.round((today.sleep / 9) * 10)));
        const srScore = Math.min(10, Math.round(srDay / 3));
        today.vitality = +((today.energy * 0.25 + today.mood * 0.2 + today.libido * 0.2 + sleepScore * 0.2 + srScore * 0.15) * 1).toFixed(1);
        // Backfill recent days with declining streak
        for (let i = 1; i <= Math.min(srDay, 90); i++) {
            const d = new Date(TODAY);
            d.setDate(d.getDate() - i);
            const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            if (DEMO_DATA[k]) {
                DEMO_DATA[k].srDay = srDay - i;
            }
        }
    }

    // Body comp
    if (ob.body) {
        if (ob.body.currentWeight) today.weight = ob.body.currentWeight;
        if (ob.body.bodyFat) today.bodyFat = ob.body.bodyFat;
    }

    // Sleep
    if (ob.sleep) {
        if (ob.sleep.hours) today.sleep = ob.sleep.hours;
    }

    // Energy / Mood
    if (ob.energy?.level) today.energy = ob.energy.level;
    if (ob.mood?.level) today.mood = ob.mood.level;
    if (ob.libido?.level) today.libido = ob.libido.level;
}

seedFromOnboarding();


export function getData(year, month, day) {
    return DEMO_DATA[`${year}-${month}-${day}`] || null;
}

export function getToday() {
    const key = `${TODAY.getFullYear()}-${TODAY.getMonth()}-${TODAY.getDate()}`;
    return DEMO_DATA[key];
}

export function getTodayKey() {
    return `${TODAY.getFullYear()}-${TODAY.getMonth()}-${TODAY.getDate()}`;
}

export function getRecentDays(n) {
    const result = [];
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(TODAY);
        d.setDate(d.getDate() - i);
        const data = getData(d.getFullYear(), d.getMonth(), d.getDate());
        if (data) result.push(data);
    }
    return result;
}

export function addMeal(meal) {
    const today = getToday();
    if (!today) return;
    today.meals.push(meal);
    today.totalKcal += meal.kcal;
    today.totalProtein += meal.protein;
    today.totalFat += meal.fat;
    today.totalCarbs += meal.carbs;
}

export async function updateCheckin(energy, mood, libido, srDay) {
    const today = getToday();
    if (!today) return;
    today.energy = energy;
    today.mood = mood;
    today.libido = libido;
    today.srDay = srDay;
    const sleepScore = Math.min(10, Math.max(1, Math.round((today.sleep / 9) * 10)));
    const srScore = Math.min(10, Math.round(srDay / 3));
    today.vitality = +((energy * 0.25 + mood * 0.2 + libido * 0.2 + sleepScore * 0.2 + srScore * 0.15)).toFixed(1);

    // Save back to API
    try {
        const todayStr = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, '0')}-${String(TODAY.getDate()).padStart(2, '0')}`;
        await apiClient('/checkins', {
            method: 'POST',
            body: {
                check_date: todayStr,
                energy_score: energy,
                mood_score: mood,
                libido_score: libido,
                sr_day_count: srDay
            }
        });
    } catch (err) {
        console.error('Failed to save check-in to real backend:', err);
    }
}

export function scoreToColor(v) {
    if (v >= 9) return '#c8f135';
    if (v >= 7) return '#7ec825';
    if (v >= 5) return '#e09020';
    if (v >= 3) return '#d06018';
    return '#7a1010';
}

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const DEMO_DATA_REF = DEMO_DATA;
export const TODAY_REF = TODAY;

// Re-export hevy functions for direct access
export { getGymSummary, getAllWorkouts, getWorkoutsForDate } from './hevy.js';
