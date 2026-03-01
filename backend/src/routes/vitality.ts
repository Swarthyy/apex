import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';
import { calculateVitalityScore } from '../lib/vitality/calculator';

const router = Router();

/**
 * GET /api/vitality/score/:date
 * Get vitality score for a specific date
 */
router.get('/score/:date', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { date } = req.params;

    // Fetch check-in data
    const { data: checkin, error: checkinError } = await supabaseAdmin
      .from('daily_checkins')
      .select('*')
      .eq('user_id', req.userId!)
      .eq('check_date', date)
      .single();

    if (checkinError && checkinError.code !== 'PGRST116') {
      throw checkinError;
    }

    // Fetch sleep data
    const { data: sleep, error: sleepError } = await supabaseAdmin
      .from('sleep_logs')
      .select('*')
      .eq('user_id', req.userId!)
      .eq('sleep_date', date)
      .single();

    if (sleepError && sleepError.code !== 'PGRST116') {
      throw sleepError;
    }

    if (!checkin) {
      return res.status(404).json({
        error: 'No check-in data for this date',
        date,
      });
    }

    // Calculate vitality score
    const result = calculateVitalityScore({
      energy_score: checkin.energy_score,
      mood_score: checkin.mood_score,
      libido_score: checkin.libido_score,
      sleep_duration_hours: sleep ? (sleep.duration_minutes || 0) / 60 : null,
      sleep_quality_score: sleep?.quality_score,
      sr_day_count: checkin.sr_day_count,
    });

    if (!result) {
      return res.status(400).json({
        error: 'Insufficient data to calculate vitality score',
      });
    }

    res.json({
      date,
      ...result,
    });
  } catch (error) {
    console.error('Get vitality score error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/vitality/range?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 * Get vitality scores for a date range
 */
router.get('/range', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        error: 'start_date and end_date are required',
      });
    }

    // Fetch all check-ins in range
    const { data: checkins, error: checkinsError } = await supabaseAdmin
      .from('daily_checkins')
      .select('*')
      .eq('user_id', req.userId!)
      .gte('check_date', start_date as string)
      .lte('check_date', end_date as string)
      .order('check_date', { ascending: true });

    if (checkinsError) throw checkinsError;

    // Fetch all sleep logs in range
    const { data: sleepLogs, error: sleepError } = await supabaseAdmin
      .from('sleep_logs')
      .select('*')
      .eq('user_id', req.userId!)
      .gte('sleep_date', start_date as string)
      .lte('sleep_date', end_date as string);

    if (sleepError) throw sleepError;

    // Create sleep lookup map
    const sleepMap = new Map();
    (sleepLogs || []).forEach((log) => {
      sleepMap.set(log.sleep_date, log);
    });

    // Calculate vitality score for each date
    const scores = (checkins || []).map((checkin) => {
      const sleep = sleepMap.get(checkin.check_date);

      const result = calculateVitalityScore({
        energy_score: checkin.energy_score,
        mood_score: checkin.mood_score,
        libido_score: checkin.libido_score,
        sleep_duration_hours: sleep ? (sleep.duration_minutes || 0) / 60 : null,
        sleep_quality_score: sleep?.quality_score,
        sr_day_count: checkin.sr_day_count,
      });

      return {
        date: checkin.check_date,
        score: result?.score || null,
        color: result?.color || null,
      };
    });

    // Calculate average
    const validScores = scores.filter((s) => s.score !== null);
    const average =
      validScores.length > 0
        ? validScores.reduce((sum, s) => sum + s.score!, 0) / validScores.length
        : null;

    res.json({
      scores,
      average: average ? Math.round(average * 10) / 10 : null,
      count: scores.length,
    });
  } catch (error) {
    console.error('Get vitality range error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
