import { z } from 'zod';

// ============================================================================
// DAILY CHECK-INS
// ============================================================================
export const checkinSchema = z.object({
  check_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  energy_score: z.number().int().min(1).max(10).optional(),
  mood_score: z.number().int().min(1).max(10).optional(),
  libido_score: z.number().int().min(1).max(10).optional(),
  sr_day_count: z.number().int().min(0).optional(),
  morning_notes: z.string().optional(),
  evening_notes: z.string().optional(),
});

// ============================================================================
// SLEEP LOGS
// ============================================================================
export const sleepLogSchema = z.object({
  sleep_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bedtime: z.string().datetime().optional(), // ISO 8601 timestamp
  wake_time: z.string().datetime().optional(),
  duration_minutes: z.number().int().min(0).optional(),
  quality_score: z.number().int().min(1).max(10).optional(),
  notes: z.string().optional(),
});

// ============================================================================
// GYM SESSIONS
// ============================================================================
const exerciseSchema = z.object({
  name: z.string(),
  sets: z.number().int().min(0),
  reps: z.number().int().min(0),
  weight: z.number().min(0),
  is_pr: z.boolean().optional(),
});

export const gymSessionSchema = z.object({
  session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  session_time: z.string().datetime().optional(),
  workout_name: z.string().optional(),
  total_volume: z.number().int().min(0).optional(),
  total_sets: z.number().int().min(0).optional(),
  duration_minutes: z.number().int().min(0).optional(),
  exercises: z.array(exerciseSchema).optional(),
  notes: z.string().optional(),
});

// ============================================================================
// BODY METRICS
// ============================================================================
export const bodyMetricSchema = z.object({
  measurement_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weight_kg: z.number().positive().optional(),
  weight_lbs: z.number().positive().optional(),
  body_fat_percentage: z.number().min(0).max(100).optional(),
  muscle_mass_kg: z.number().min(0).optional(),
  notes: z.string().optional(),
});

// ============================================================================
// NUTRITION LOGS
// ============================================================================
export const nutritionLogSchema = z.object({
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  log_time: z.string().datetime().optional(),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'supplement']),
  food_name: z.string().min(1),
  description: z.string().optional(),
  calories: z.number().int().min(0).optional(),
  protein_g: z.number().min(0).optional(),
  fat_g: z.number().min(0).optional(),
  carbs_g: z.number().min(0).optional(),
  vitamin_a_mcg: z.number().min(0).optional(),
  vitamin_b12_mcg: z.number().min(0).optional(),
  zinc_mg: z.number().min(0).optional(),
  iron_mg: z.number().min(0).optional(),
  omega3_g: z.number().min(0).optional(),
  bonus_tags: z.array(z.string()).optional(),
  photo_url: z.string().url().optional(),
});

// ============================================================================
// CALENDAR EVENTS
// ============================================================================
export const calendarEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().datetime(),
  end_time: z.string().datetime().optional(),
  category: z.enum(['work', 'gym', 'social', 'health', 'other']).optional(),
});

// ============================================================================
// CHAT
// ============================================================================
export const chatQuerySchema = z.object({
  query: z.string().min(1).max(1000),
  context: z.object({
    current_date: z.string().optional(),
  }).optional(),
});
