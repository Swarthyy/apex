import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { chatQuerySchema } from '../validators/schemas';
import { supabaseAdmin } from '../lib/supabase';
import { format, subDays } from 'date-fns';
import { z } from 'zod';

const router = Router();

/**
 * Keyword-matching chat (MVP for Phase 1)
 * Real AI chat comes in Phase 3
 */
async function processKeywordQuery(userId: string, query: string): Promise<string> {
  const q = query.toLowerCase();

  // Energy queries
  if (q.match(/\b(energy|energetic|tired|fatigue)\b/)) {
    const { data } = await supabaseAdmin
      .from('daily_checkins')
      .select('energy_score, check_date')
      .eq('user_id', userId)
      .order('check_date', { ascending: false })
      .limit(7);

    if (data && data.length > 0) {
      const avg = data.reduce((sum, d) => sum + (d.energy_score || 0), 0) / data.length;
      const latest = data[0].energy_score;
      return `Your energy has been averaging ${avg.toFixed(
        1
      )}/10 over the last 7 days. Today's score: ${latest}/10.`;
    }
    return 'No recent energy data found. Complete your morning check-in to track energy.';
  }

  // Sleep queries
  if (q.match(/\b(sleep|slept|sleeping|rest)\b/)) {
    const { data } = await supabaseAdmin
      .from('sleep_logs')
      .select('duration_minutes, quality_score, sleep_date')
      .eq('user_id', userId)
      .order('sleep_date', { ascending: false })
      .limit(7);

    if (data && data.length > 0) {
      const avgDuration =
        data.reduce((sum, d) => sum + (d.duration_minutes || 0), 0) / data.length / 60;
      const avgQuality =
        data.reduce((sum, d) => sum + (d.quality_score || 0), 0) / data.length;
      return `Your sleep has been averaging ${avgDuration.toFixed(
        1
      )} hours with quality ${avgQuality.toFixed(1)}/10 over the last week.`;
    }
    return 'No recent sleep data found. Log your sleep to track patterns.';
  }

  // SR queries
  if (q.match(/\b(sr|streak|retention|semen)\b/)) {
    const { data } = await supabaseAdmin
      .from('daily_checkins')
      .select('sr_day_count, check_date')
      .eq('user_id', userId)
      .order('check_date', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      return `Your current SR streak is ${data.sr_day_count} days. Keep it up!`;
    }
    return 'No SR data found. Complete your morning check-in to track your streak.';
  }

  // Nutrition queries (liver, oysters, etc.)
  if (q.match(/\b(liver|oysters|raw milk|beef)\b/)) {
    const food = q.match(/liver/)
      ? 'liver'
      : q.match(/oysters/)
      ? 'oysters'
      : q.match(/raw milk/)
      ? 'raw milk'
      : 'beef';

    const { data } = await supabaseAdmin
      .from('nutrition_logs')
      .select('food_name, log_date')
      .eq('user_id', userId)
      .ilike('food_name', `%${food}%`)
      .order('log_date', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      return `Last ${food} log: ${data.log_date}. Great choice for nutrient density!`;
    }
    return `No ${food} logs found recently. Consider adding it for optimal nutrition.`;
  }

  // Gym queries
  if (q.match(/\b(gym|workout|lift|train|exercise)\b/)) {
    const { data } = await supabaseAdmin
      .from('gym_sessions')
      .select('workout_name, total_volume, session_date')
      .eq('user_id', userId)
      .order('session_date', { ascending: false })
      .limit(5);

    if (data && data.length > 0) {
      const totalSessions = data.length;
      return `You've logged ${totalSessions} gym sessions recently. Last workout: ${
        data[0].workout_name || 'Unknown'
      } on ${data[0].session_date}.`;
    }
    return 'No recent gym sessions found. Log your workouts to track progress.';
  }

  // Best day/week queries
  if (q.match(/\b(best|highest|peak|top)\b/)) {
    // TODO: Implement vitality score lookup for best days
    return 'Vitality score analysis coming soon! For now, check the Historical Calendar view.';
  }

  // Default response
  return "I can answer questions about your energy, sleep, SR streak, nutrition (liver, oysters), gym sessions, and more. Try asking 'What's my energy been like?' or 'When did I last log liver?'";
}

/**
 * POST /api/chat
 * Chat with APEX (keyword matching MVP)
 */
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const body = chatQuerySchema.parse(req.body);

    const response = await processKeywordQuery(req.userId!, body.query);

    res.json({
      response,
      query: body.query,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
