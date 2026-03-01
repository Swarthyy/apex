import { supabaseAdmin } from '../lib/supabase';

export interface CheckinInput {
  check_date: string;
  energy_score?: number;
  mood_score?: number;
  libido_score?: number;
  sr_day_count?: number;
  morning_notes?: string;
  evening_notes?: string;
}

export interface DailyCheckin {
  id: string;
  user_id: string;
  check_date: string;
  energy_score: number | null;
  mood_score: number | null;
  libido_score: number | null;
  sr_day_count: number | null;
  morning_notes: string | null;
  evening_notes: string | null;
  morning_completed_at: string | null;
  evening_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Create or update a daily check-in
 */
export async function upsertCheckin(
  userId: string,
  data: CheckinInput
): Promise<DailyCheckin> {
  const { data: checkin, error } = await supabaseAdmin
    .from('daily_checkins')
    .upsert({
      user_id: userId,
      ...data,
      morning_completed_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,check_date',
    })
    .select()
    .single();

  if (error) throw error;
  return checkin;
}

/**
 * Get check-in for a specific date
 */
export async function getCheckinByDate(
  userId: string,
  date: string
): Promise<DailyCheckin | null> {
  const { data, error } = await supabaseAdmin
    .from('daily_checkins')
    .select('*')
    .eq('user_id', userId)
    .eq('check_date', date)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw error;
  }

  return data;
}

/**
 * Get check-ins within a date range
 */
export async function getCheckinsInRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<DailyCheckin[]> {
  const { data, error } = await supabaseAdmin
    .from('daily_checkins')
    .select('*')
    .eq('user_id', userId)
    .gte('check_date', startDate)
    .lte('check_date', endDate)
    .order('check_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get recent check-ins (last N days)
 */
export async function getRecentCheckins(
  userId: string,
  days: number = 30
): Promise<DailyCheckin[]> {
  const { data, error } = await supabaseAdmin
    .from('daily_checkins')
    .select('*')
    .eq('user_id', userId)
    .order('check_date', { ascending: false })
    .limit(days);

  if (error) throw error;
  return data || [];
}
