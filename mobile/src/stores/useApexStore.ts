// ═══════════════════════════════════════════════════════════════════════════
// APEX — Global State (Zustand)
// ═══════════════════════════════════════════════════════════════════════════
import { create } from 'zustand';
import { getItem, setItem } from '../utils/storage';
import {
  SplitConfig,
  DEFAULT_SPLIT,
  getNextSession,
  getSplitProgress,
  NextSession,
} from '../utils/splitEngine';

const SPLIT_KEY = 'apex_split';
const PROFILE_KEY = 'apex_profile';
const CHECKINS_KEY = 'apex_checkins';
const NUTRITION_KEY = 'apex_nutrition';

interface Profile {
  name: string;
  avatar: string;
  timezone: string;
  srDay: number;
  vitalityScore: number;
}

export interface DailyCheckin {
  date: string; // YYYY-MM-DD
  energy: number; // 1-10
  mood: number; // 1-10
  libido: number; // 1-10
  srDay: number;
  notes?: string;
  completedAt: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'supplement';

export interface MealEntry {
  id: string;
  mealType: MealType;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  timestamp: string;
  bonusChips?: string[];
}

// Vitality 0-100 from check-in scores (no sleep data yet — normalized to 80% weighting)
function calcVitality(energy: number, mood: number, libido: number, srDay: number): number {
  const srMod = Math.min(srDay / 30, 1) * 10; // 0-10
  const weighted = energy * 0.25 + mood * 0.20 + libido * 0.20 + srMod * 0.15;
  const vitality10 = weighted / 0.80; // normalize missing sleep weight
  return Math.max(0, Math.min(100, Math.round(vitality10 * 10)));
}

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function vitalityColor(score: number): string {
  if (score === 0) return '#1e1e35';
  if (score <= 20) return '#500808';
  if (score <= 40) return '#c03020';
  if (score <= 60) return '#e09020';
  if (score <= 80) return '#52b030';
  return '#c8f135';
}

export interface ApexState {
  // Profile
  profile: Profile;
  setProfile: (p: Partial<Profile>) => void;

  // Split / Gym
  split: SplitConfig;
  nextSession: NextSession;
  splitProgress: ReturnType<typeof getSplitProgress>;
  setSplit: (s: SplitConfig) => void;
  refreshSplit: () => void;

  // Check-ins
  checkins: Record<string, DailyCheckin>;
  submitCheckin: (data: Omit<DailyCheckin, 'date' | 'completedAt'>) => void;
  getTodayCheckin: () => DailyCheckin | null;
  resetSR: () => void;

  // Nutrition
  nutritionLogs: Record<string, MealEntry[]>;
  addMeal: (date: string, meal: Omit<MealEntry, 'id'>) => void;
  getMeals: (date: string) => MealEntry[];
  deleteMeal: (date: string, id: string) => void;

  // Hydration
  isHydrated: boolean;
  hydrate: () => Promise<void>;
}

const defaultProfile: Profile = {
  name: 'Operator',
  avatar: '◆',
  timezone: 'Australia/Melbourne',
  srDay: 0,
  vitalityScore: 0,
};

export const useApexStore = create<ApexState>((set, get) => ({
  // ── Profile ────────────────────────────────────────────
  profile: defaultProfile,
  setProfile: (p) => {
    const updated = { ...get().profile, ...p };
    set({ profile: updated });
    setItem(PROFILE_KEY, updated);
  },

  // ── Split ──────────────────────────────────────────────
  split: DEFAULT_SPLIT,
  nextSession: getNextSession(DEFAULT_SPLIT),
  splitProgress: getSplitProgress(DEFAULT_SPLIT),

  setSplit: (s) => {
    set({ split: s, nextSession: getNextSession(s), splitProgress: getSplitProgress(s) });
    setItem(SPLIT_KEY, s);
  },

  refreshSplit: () => {
    const s = get().split;
    set({ nextSession: getNextSession(s), splitProgress: getSplitProgress(s) });
  },

  // ── Check-ins ──────────────────────────────────────────
  checkins: {},

  submitCheckin: (data) => {
    const date = todayKey();
    const checkin: DailyCheckin = { ...data, date, completedAt: new Date().toISOString() };
    const checkins = { ...get().checkins, [date]: checkin };
    const vitality = calcVitality(data.energy, data.mood, data.libido, data.srDay);
    set({ checkins });
    setItem(CHECKINS_KEY, checkins);
    get().setProfile({ srDay: data.srDay, vitalityScore: vitality });
  },

  getTodayCheckin: () => get().checkins[todayKey()] ?? null,

  resetSR: () => {
    const today = get().profile;
    get().setProfile({ srDay: 0, vitalityScore: calcVitality(today.vitalityScore, 0, 0, 0) });
  },

  // ── Nutrition ──────────────────────────────────────────
  nutritionLogs: {},

  addMeal: (date, meal) => {
    const id = `${date}_${Date.now()}`;
    const entry: MealEntry = { ...meal, id };
    const existing = get().nutritionLogs[date] ?? [];
    const logs = { ...get().nutritionLogs, [date]: [...existing, entry] };
    set({ nutritionLogs: logs });
    setItem(NUTRITION_KEY, logs);
  },

  getMeals: (date) => get().nutritionLogs[date] ?? [],

  deleteMeal: (date, id) => {
    const existing = get().nutritionLogs[date] ?? [];
    const logs = { ...get().nutritionLogs, [date]: existing.filter(m => m.id !== id) };
    set({ nutritionLogs: logs });
    setItem(NUTRITION_KEY, logs);
  },

  // ── Hydration (boot from AsyncStorage) ─────────────────
  isHydrated: false,
  hydrate: async () => {
    const [savedSplit, savedProfile, savedCheckins, savedNutrition] = await Promise.all([
      getItem<SplitConfig>(SPLIT_KEY),
      getItem<Profile>(PROFILE_KEY),
      getItem<Record<string, DailyCheckin>>(CHECKINS_KEY),
      getItem<Record<string, MealEntry[]>>(NUTRITION_KEY),
    ]);

    const split = savedSplit?.rotation?.length ? savedSplit : DEFAULT_SPLIT;
    const profile = savedProfile ?? defaultProfile;
    const checkins = savedCheckins ?? {};
    const nutritionLogs = savedNutrition ?? {};

    set({
      split,
      profile,
      nextSession: getNextSession(split),
      splitProgress: getSplitProgress(split),
      checkins,
      nutritionLogs,
      isHydrated: true,
    });
  },
}));
