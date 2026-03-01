import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { calendarEventSchema } from '../validators/schemas';
import { supabaseAdmin } from '../lib/supabase';
import { z } from 'zod';

const router = Router();

// Auto-categorize based on keywords
function autoCategorize(title: string, description?: string): string {
  const text = `${title} ${description || ''}`.toLowerCase();

  if (text.match(/\b(gym|workout|lift|cardio|training|exercise)\b/)) return 'gym';
  if (text.match(/\b(work|meeting|call|standup|sprint|review)\b/)) return 'work';
  if (text.match(/\b(dinner|lunch|coffee|drinks|hangout|party)\b/)) return 'social';
  if (text.match(/\b(doctor|dentist|therapy|checkup|appointment)\b/)) return 'health';

  return 'other';
}

router.post('/events', requireAuth, async (req: AuthRequest, res) => {
  try {
    const body = calendarEventSchema.parse(req.body);

    // Auto-categorize if not provided
    const category = body.category || autoCategorize(body.title, body.description);
    const auto_categorized = !body.category;

    const { data, error } = await supabaseAdmin
      .from('calendar_events')
      .insert({
        user_id: req.userId!,
        ...body,
        category,
        auto_categorized,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ event: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create calendar event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/events', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { start_date, end_date } = req.query;

    let query = supabaseAdmin
      .from('calendar_events')
      .select('*')
      .eq('user_id', req.userId!)
      .order('start_time', { ascending: true });

    if (start_date) query = query.gte('event_date', start_date as string);
    if (end_date) query = query.lte('event_date', end_date as string);

    const { data, error } = await query;

    if (error) throw error;
    res.json({ events: data || [] });
  } catch (error) {
    console.error('Get calendar events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
