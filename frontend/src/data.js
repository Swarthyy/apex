// ═══════════════════════════════════════════════════════════════════════════
// APEX — Demo Data Store (with real Hevy gym data)
// ═══════════════════════════════════════════════════════════════════════════
import { getWorkoutsForDate, getGymSummary, getAllWorkouts } from './hevy.js';

// Seeded random for consistent demo data
function seededRandom(seed) {
    let s = seed;
    return function () { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
}

// Generate 90 days of demo data
const DEMO_DATA = {};
const TODAY = new Date(2026, 1, 27); // Feb 27, 2026

function initData() {
    for (let i = 90; i >= 0; i--) {
        const d = new Date(TODAY);
        d.setDate(d.getDate() - i);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        const rng = seededRandom(d.getFullYear() * 10000 + d.getMonth() * 100 + d.getDate());

        const srDay = Math.max(1, Math.floor(rng() * 30) + 1);
        const srBoost = Math.min(2, srDay * 0.08);
        const sleep = +(5.5 + rng() * 3.5).toFixed(1);
        const energy = Math.min(10, Math.max(1, Math.round(4 + rng() * 5 + srBoost)));
        const mood = Math.min(10, Math.max(1, Math.round(4 + rng() * 5 + srBoost * 0.5)));
        const libido = Math.min(10, Math.max(1, Math.round(3 + rng() * 6 + srBoost)));
        const weight = +(82 + rng() * 4 - i * 0.01).toFixed(1);

        // Use real Hevy data for gym sessions
        const hevyWorkouts = getWorkoutsForDate(d.getFullYear(), d.getMonth(), d.getDate());
        const hasGym = hevyWorkouts.length > 0;
        const hadLiver = rng() > 0.55;
        const hadRawMilk = rng() > 0.3;
        const hadOysters = rng() > 0.8;
        const bodyFat = +(12 + rng() * 4).toFixed(1);

        // Vitality: Energy 25% + Mood 20% + Libido 20% + Sleep 20% + SR 15%
        const sleepScore = Math.min(10, Math.max(1, Math.round((sleep / 9) * 10)));
        const srScore = Math.min(10, Math.round(srDay / 3));
        const vitality = +((energy * 0.25 + mood * 0.2 + libido * 0.2 + sleepScore * 0.2 + srScore * 0.15) * 1).toFixed(1);

        // Event dots
        const dots = [];
        const events = [];
        if (hasGym) {
            dots.push('var(--orange)');
            const w = hevyWorkouts[0];
            const gymTime = w.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            events.push({ label: w.title || 'Gym Session', time: gymTime, color: 'var(--orange)', type: 'gym' });
        }
        if (rng() > 0.6) { dots.push('var(--pink)'); events.push({ label: rng() > 0.5 ? 'Dinner with friends' : 'Coffee catch-up', time: rng() > 0.5 ? '7:00 PM' : '10:00 AM', color: 'var(--pink)', type: 'social' }); }
        if (rng() > 0.4) { dots.push('var(--gold)'); events.push({ label: 'Work block', time: '9:00 AM', color: 'var(--gold)', type: 'work' }); }

        // Nutrition logs
        const meals = [];
        const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];
        const mealNames = {
            Breakfast: ['Raw milk + 6 eggs + honey', '4 eggs + sourdough + butter', 'Smoothie bowl + raw milk', 'Bone broth + eggs'],
            Lunch: ['Grass-fed steak + rice + salad', 'Salmon + sweet potato', 'Liver + onions + rice', 'Chicken thighs + quinoa'],
            Dinner: ['Raw milk + oysters + fruit', 'Lamb chops + vegetables', 'Beef mince + rice + greens', 'Tuna steak + mashed potato']
        };
        mealTypes.forEach((type, idx) => {
            const names = mealNames[type];
            const name = names[Math.floor(rng() * names.length)];
            const kcal = Math.round(500 + rng() * 700);
            const protein = Math.round(25 + rng() * 45);
            const fat = Math.round(15 + rng() * 40);
            const carbs = Math.round(20 + rng() * 60);
            const bonuses = [];
            if (protein > 45) bonuses.push('+High Protein');
            if (name.includes('liver') || name.includes('Liver')) bonuses.push('+Vitamin A', '+B12');
            if (name.includes('milk') || name.includes('Milk')) bonuses.push('+Raw Enzymes', '+CLA');
            if (name.includes('oyster') || name.includes('Oyster')) bonuses.push('+Zinc', '+Omega-3');
            if (name.includes('egg') || name.includes('Egg')) bonuses.push('+Choline');
            if (name.includes('salmon') || name.includes('Salmon')) bonuses.push('+Omega-3');
            if (name.includes('butter') || name.includes('Butter')) bonuses.push('+Fat-soluble Vitamins');
            if (fat > 35) bonuses.push('+Sat. Fat');
            if (carbs > 50) bonuses.push('+High Carb');
            meals.push({
                type, name, kcal, protein, fat, carbs, bonuses,
                time: ['7:30 AM', '12:30 PM', '6:30 PM'][idx],
                ingredients: name.split('+').map(s => s.trim()).filter(Boolean)
            });
        });
        if (rng() > 0.5) {
            meals.push({ type: 'Snack', name: 'Raw milk + honey', kcal: 280, protein: 12, fat: 14, carbs: 28, bonuses: ['+Raw Enzymes', '+CLA'], time: '3:30 PM', ingredients: ['Raw milk', 'Honey'] });
        }

        const totalKcal = meals.reduce((s, m) => s + m.kcal, 0);
        const totalProtein = meals.reduce((s, m) => s + m.protein, 0);
        const totalFat = meals.reduce((s, m) => s + m.fat, 0);
        const totalCarbs = meals.reduce((s, m) => s + m.carbs, 0);
        const nutScore = Math.min(10, Math.max(1, Math.round(
            (Math.min(1, totalKcal / 3200) * 3 + Math.min(1, totalProtein / 200) * 3 +
                (hadLiver ? 2 : 0) + (hadOysters ? 1 : 0) + (hadRawMilk ? 1 : 0))
        )));

        DEMO_DATA[key] = {
            date: new Date(d), energy, mood, libido, sleep, weight, bodyFat,
            srDay, hasGym, hadLiver, hadRawMilk, hadOysters, vitality, dots, events,
            meals, totalKcal, totalProtein, totalFat, totalCarbs, nutScore,
            // Real gym data from Hevy
            gymWorkouts: hevyWorkouts,
            gymVolume: hevyWorkouts.reduce((s, w) => s + w.totalVolume, 0),
            gymSets: hevyWorkouts.reduce((s, w) => s + w.totalSets, 0),
            gymDuration: hevyWorkouts.reduce((s, w) => s + w.durationMin, 0),
        };
    }
}

initData();

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

export function updateCheckin(energy, mood, libido, srDay) {
    const today = getToday();
    if (!today) return;
    today.energy = energy;
    today.mood = mood;
    today.libido = libido;
    today.srDay = srDay;
    const sleepScore = Math.min(10, Math.max(1, Math.round((today.sleep / 9) * 10)));
    const srScore = Math.min(10, Math.round(srDay / 3));
    today.vitality = +((energy * 0.25 + mood * 0.2 + libido * 0.2 + sleepScore * 0.2 + srScore * 0.15)).toFixed(1);
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
