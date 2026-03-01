import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';
import { calculateVitalityScore } from '../lib/vitality/calculator';
import { subDays, format } from 'date-fns';

const router = Router();

/**
 * GET /api/dashboard
 * Get aggregated dashboard data for the user
 */
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

    // Fetch today's check-in
    const { data: todayCheckin } = await supabaseAdmin
      .from('daily_checkins')
      .select('*')
      .eq('user_id', req.userId!)
      .eq('check_date', today)
      .single();

    // Fetch last 7 days of check-ins
    const { data: recentCheckins } = await supabaseAdmin
      .from('daily_checkins')
      .select('*')
      .eq('user_id', req.userId!)
      .gte('check_date', sevenDaysAgo)
      .order('check_date', { ascending: false });

    // Fetch last night's sleep
    const { data: lastSleep } = await supabaseAdmin
      .from('sleep_logs')
      .select('*')
      .eq('user_id', req.userId!)
      .order('sleep_date', { ascending: false })
      .limit(1)
      .single();

    // Fetch recent gym sessions
    const { data: recentGym } = await supabaseAdmin
      .from('gym_sessions')
      .select('*')
      .eq('user_id', req.userId!)
      .gte('session_date', sevenDaysAgo)
      .order('session_date', { ascending: false });

    // Fetch latest body metrics
    const { data: latestWeight } = await supabaseAdmin
      .from('body_metrics')
      .select('*')
      .eq('user_id', req.userId!)
      .order('measurement_date', { ascending: false })
      .limit(1)
      .single();

    // Fetch today's nutrition
    const { data: todayMeals } = await supabaseAdmin
      .from('nutrition_logs')
      .select('*')
      .eq('user_id', req.userId!)
      .eq('log_date', today);

    // Fetch unread insights
    const { data: insights } = await supabaseAdmin
      .from('insights')
      .select('*')
      .eq('user_id', req.userId!)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(4);

    // Fetch upcoming events
    const { data: upcomingEvents } = await supabaseAdmin
      .from('calendar_events')
      .select('*')
      .eq('user_id', req.userId!)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(3);

    // Calculate today's vitality score
    let vitalityScore = null;
    if (todayCheckin) {
      const result = calculateVitalityScore({
        energy_score: todayCheckin.energy_score,
        mood_score: todayCheckin.mood_score,
        libido_score: todayCheckin.libido_score,
        sleep_duration_hours: lastSleep ? (lastSleep.duration_minutes || 0) / 60 : null,
        sleep_quality_score: lastSleep?.quality_score,
        sr_day_count: todayCheckin.sr_day_count,
      });
      vitalityScore = result?.score || null;
    }

    // Calculate 7-day averages
    const avgEnergy =
      recentCheckins && recentCheckins.length > 0
        ? recentCheckins.reduce((sum, c) => sum + (c.energy_score || 0), 0) /
          recentCheckins.length
        : null;

    const avgMood =
      recentCheckins && recentCheckins.length > 0
        ? recentCheckins.reduce((sum, c) => sum + (c.mood_score || 0), 0) /
          recentCheckins.length
        : null;

    const avgLibido =
      recentCheckins && recentCheckins.length > 0
        ? recentCheckins.reduce((sum, c) => sum + (c.libido_score || 0), 0) /
          recentCheckins.length
        : null;

    // Calculate nutrition totals
    const nutritionTotals = (todayMeals || []).reduce(
      (acc, meal) => ({
        calories: acc.calories + (meal.calories || 0),
        protein: acc.protein + (meal.protein_g || 0),
        fat: acc.fat + (meal.fat_g || 0),
        carbs: acc.carbs + (meal.carbs_g || 0),
      }),
      { calories: 0, protein: 0, fat: 0, carbs: 0 }
    );

    // Construct response
    res.json({
      today: {
        date: today,
        checkin_completed: !!todayCheckin,
        vitality_score: vitalityScore,
        sr_day_count: todayCheckin?.sr_day_count || 0,
      },
      stats: {
        sleep: {
          last_night: lastSleep || null,
          avg_7_days: null, // TODO: Calculate from sleep logs
        },
        energy: {
          today: todayCheckin?.energy_score || null,
          avg_7_days: avgEnergy ? Math.round(avgEnergy * 10) / 10 : null,
        },
        mood: {
          today: todayCheckin?.mood_score || null,
          avg_7_days: avgMood ? Math.round(avgMood * 10) / 10 : null,
        },
        libido: {
          today: todayCheckin?.libido_score || null,
          avg_7_days: avgLibido ? Math.round(avgLibido * 10) / 10 : null,
        },
        weight: {
          latest: latestWeight || null,
          change_7_days: null, // TODO: Calculate trend
        },
        gym: {
          last_session: recentGym && recentGym[0] ? recentGym[0] : null,
          sessions_this_week: recentGym?.length || 0,
        },
        nutrition: {
          today: nutritionTotals,
          meal_count: todayMeals?.length || 0,
        },
      },
      insights: insights || [],
      upcoming_events: upcomingEvents || [],
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
