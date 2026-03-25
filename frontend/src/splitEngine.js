// ═══════════════════════════════════════════════════════════════════════════
// APEX — Split Engine
// Rotation-based training split state machine powered by Hevy data
// ═══════════════════════════════════════════════════════════════════════════
import { getAllWorkouts } from './hevy.js';
import { UPCOMING_EVENTS } from './data.js';

const SPLIT_KEY = 'apex_split';

// ── Muscle-group keyword map (for auto-classifying Hevy exercises) ────────
const MUSCLE_KEYWORDS = {
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

// ── Default PPL split (seeded if nothing exists) ─────────────────────────
const DEFAULT_SPLIT = {
    name: 'Push Pull Legs',
    rotation: [
        { id: 'push', label: 'Push', muscles: ['Chest', 'Shoulders', 'Triceps'], partner: 'James' },
        { id: 'pull', label: 'Pull', muscles: ['Back', 'Biceps'], partner: 'James' },
        { id: 'legs', label: 'Legs', muscles: ['Quads', 'Hamstrings', 'Calves'], partner: null },
        { id: 'rest', label: 'Rest', muscles: [], partner: null, isRest: true },
    ],
    currentIndex: 0,
    lastLoggedDate: null,
    exerciseMap: {},   // { exerciseName: slotId }
    partners: ['James'],
};

// ── Read/Write ───────────────────────────────────────────────────────────
export function getSplit() {
    try {
        const raw = localStorage.getItem(SPLIT_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch { return null; }
}

export function saveSplit(split) {
    localStorage.setItem(SPLIT_KEY, JSON.stringify(split));
}

export function getOrCreateSplit() {
    let split = getSplit();
    if (!split || !split.rotation || split.rotation.length === 0) {
        split = JSON.parse(JSON.stringify(DEFAULT_SPLIT));
        saveSplit(split);
    }
    return split;
}

// ── Exercise → Muscle Classification ─────────────────────────────────────

function classifyExercise(exerciseName, split) {
    const name = exerciseName.toLowerCase();

    // 1. Check custom mapping first
    if (split.exerciseMap && split.exerciseMap[exerciseName]) {
        return split.exerciseMap[exerciseName];
    }

    // 2. Match against muscle keywords
    const matchedMuscles = [];
    for (const [muscle, keywords] of Object.entries(MUSCLE_KEYWORDS)) {
        if (keywords.some(kw => name.includes(kw))) {
            matchedMuscles.push(muscle);
        }
    }

    if (matchedMuscles.length === 0) return null;

    // 3. Find the slot with the best muscle overlap
    let bestSlot = null;
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

/** Classify a full Hevy session to a rotation slot */
function classifySession(session, split) {
    const slotVotes = {};

    for (const ex of session.exercises) {
        const slotId = classifyExercise(ex.name, split);
        if (slotId) {
            slotVotes[slotId] = (slotVotes[slotId] || 0) + 1;
        }
    }

    // Find slot with most votes
    let best = null;
    let bestCount = 0;
    for (const [slotId, count] of Object.entries(slotVotes)) {
        if (count > bestCount) {
            bestCount = count;
            best = slotId;
        }
    }

    return best; // null = unclassified
}

// ── Index Inference ──────────────────────────────────────────────────────

/**
 * Infer currentIndex from the most recent Hevy session.
 * Advances index to the slot AFTER the matched one.
 */
export function inferCurrentIndex() {
    const split = getOrCreateSplit();
    const workouts = getAllWorkouts();

    if (!workouts || workouts.length === 0) {
        split.currentIndex = 0;
        split.lastLoggedDate = null;
        saveSplit(split);
        return split;
    }

    const latest = workouts[0]; // already sorted newest first
    const latestDate = latest.date.toISOString().split('T')[0];

    // If we already processed this session, don't re-infer
    if (split.lastLoggedDate === latestDate) return split;

    const matchedSlotId = classifySession(latest, split);

    if (matchedSlotId) {
        const matchedIdx = split.rotation.findIndex(s => s.id === matchedSlotId);
        if (matchedIdx !== -1) {
            split.currentIndex = (matchedIdx + 1) % split.rotation.length;
            split.lastLoggedDate = latestDate;
            saveSplit(split);
        }
    }
    // If unclassified, leave currentIndex as-is

    return split;
}

// ── Next Session ─────────────────────────────────────────────────────────

/**
 * Get the next session info (skipping rest days for the card, but flagging them).
 */
export function getNextSession() {
    const split = inferCurrentIndex();

    if (!split.rotation || split.rotation.length === 0) {
        return { empty: true };
    }

    const slot = split.rotation[split.currentIndex];

    if (slot.isRest) {
        return {
            isRest: true,
            label: 'Rest Day',
            partner: null,
            focus: null,
            nextAfterRest: getNextNonRestSlot(split, split.currentIndex),
        };
    }

    const partner = resolvePartner(slot);
    const focus = getFocusSuggestion(slot, split);
    const lastSession = getLastSessionForSlot(slot.id, split);

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

function getNextNonRestSlot(split, fromIndex) {
    for (let i = 1; i <= split.rotation.length; i++) {
        const idx = (fromIndex + i) % split.rotation.length;
        if (!split.rotation[idx].isRest) {
            return split.rotation[idx];
        }
    }
    return null;
}

// ── Partner Resolution ───────────────────────────────────────────────────

const GYM_KEYWORDS = ['gym', 'lift', 'train', 'push', 'pull', 'legs', 'chest', 'back', 'shoulders', 'arms', 'workout', 'squat', 'bench', 'deadlift'];

function resolvePartner(slot) {
    // 1. Scan calendar events for today/tomorrow
    if (UPCOMING_EVENTS && UPCOMING_EVENTS.length > 0) {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowEnd = new Date(tomorrow);
        tomorrowEnd.setHours(23, 59, 59);

        // Also check slot labels as keywords
        const splitLabels = [slot.label.toLowerCase()];

        for (const event of UPCOMING_EVENTS) {
            const evDate = new Date(event.start_time || event.event_date);
            if (evDate > tomorrowEnd) continue;

            const text = `${event.title || ''} ${event.description || ''}`.toLowerCase();
            const isGymEvent = GYM_KEYWORDS.some(kw => text.includes(kw)) ||
                splitLabels.some(lbl => text.includes(lbl));

            if (isGymEvent) {
                // Try to extract a partner name from the event
                const split = getSplit();
                if (split && split.partners) {
                    for (const name of split.partners) {
                        if (text.includes(name.toLowerCase())) {
                            return { name, source: 'calendar' };
                        }
                    }
                }
            }
        }
    }

    // 2. Fall back to slot default
    if (slot.partner) {
        return { name: slot.partner, source: 'split' };
    }

    // 3. Solo
    return { name: null, source: 'default' };
}

// ── Focus Suggestion Algorithm ───────────────────────────────────────────

function getLastSessionForSlot(slotId, split) {
    const workouts = getAllWorkouts();
    const matched = [];

    for (const w of workouts) {
        const cls = classifySession(w, split);
        if (cls === slotId) {
            matched.push(w);
            if (matched.length >= 3) break;
        }
    }

    return matched;
}

function getTopSetWeight(session, exerciseName) {
    for (const ex of session.exercises) {
        if (ex.name === exerciseName) {
            return ex.maxWeight || 0;
        }
    }
    return 0;
}

function daysBetween(dateA, dateB) {
    const msPerDay = 86400000;
    return Math.round(Math.abs(dateB - dateA) / msPerDay);
}

function isThisWeek(date) {
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

export function getFocusSuggestion(slot, split) {
    const last3 = getLastSessionForSlot(slot.id, split);

    if (last3.length < 2) {
        return { type: 'default', text: 'Stay consistent. Hit your working sets.' };
    }

    // Find the top lift (highest total volume across last3)
    const volumeByExercise = {};
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

    // DEFAULT
    return { type: 'default', text: 'Stay consistent. Hit your working sets.' };
}

// ── Exercise Mapping ─────────────────────────────────────────────────────

export function mapExerciseToSlot(exerciseName, slotId) {
    const split = getOrCreateSplit();
    if (!split.exerciseMap) split.exerciseMap = {};
    split.exerciseMap[exerciseName] = slotId;
    saveSplit(split);
}

export function getUnmappedExercises() {
    const split = getOrCreateSplit();
    const workouts = getAllWorkouts();
    const seen = new Set();
    const unmapped = [];

    for (const w of workouts) {
        for (const ex of w.exercises) {
            if (seen.has(ex.name)) continue;
            seen.add(ex.name);

            const slotId = classifyExercise(ex.name, split);
            if (!slotId) unmapped.push(ex.name);
        }
    }

    return unmapped;
}

// ── Split Progress ───────────────────────────────────────────────────────

export function getSplitProgress() {
    const split = getOrCreateSplit();
    return {
        rotation: split.rotation,
        currentIndex: split.currentIndex,
        name: split.name,
    };
}

// ── Export defaults for seeding ──────────────────────────────────────────
export { DEFAULT_SPLIT, MUSCLE_KEYWORDS };
