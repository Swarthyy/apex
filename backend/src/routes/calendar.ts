import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { calendarEventSchema } from '../validators/schemas';
import { supabaseAdmin } from '../lib/supabase';
import { z } from 'zod';
import ical from 'node-ical';
import { addDays, isAfter, isBefore } from 'date-fns';

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

    const { data, error } = await (supabaseAdmin as any)
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

// Sync from ICS URL (Google Calendar)
router.post('/sync', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { calendarUrl } = req.body;
    if (!calendarUrl) {
      return res.status(400).json({ error: 'calendarUrl is required' });
    }

    const events = await ical.async.fromURL(calendarUrl);
    const now = new Date();
    const horizon = addDays(now, 30); // Sync 30 days ahead

    const eventsToInsert = [];

    for (const v of Object.values(events)) {
      if (v && v.type === 'VEVENT') {
        const event = v as any;
        const start = Array.isArray(event.start) ? event.start[0] : event.start;
        const end = Array.isArray(event.end) ? event.end[0] : event.end;

        if (!start || !end) continue;

        // Filter out past events and far future events
        if (isBefore(new Date(start), now) && isBefore(new Date(end), now)) continue;
        if (isAfter(new Date(start), horizon)) continue;

        const title = event.summary?.val || event.summary || 'Google Calendar Event';
        const description = event.description?.val || event.description || '';
        const category = autoCategorize(title, description);

        // Map to DB schema
        eventsToInsert.push({
          user_id: req.userId!,
          title: title.substring(0, 255),
          description: description.substring(0, 1000),
          event_date: (start as Date).toISOString().split('T')[0],
          start_time: (start as Date).toISOString(),
          end_time: (end as Date).toISOString(),
          category,
          auto_categorized: true
        });
      }
    }

    // Upsert into Supabase
    // We don't have a unique constraint specifically, but we can just use insert for now 
    // or ideally delete future events and re-insert to avoid duplicates.

    // Delete future auto-categorized events for this user
    await (supabaseAdmin as any)
      .from('calendar_events')
      .delete()
      .eq('user_id', req.userId!)
      .eq('auto_categorized', true)
      .gte('start_time', now.toISOString());

    if (eventsToInsert.length > 0) {
      const { error } = await (supabaseAdmin as any)
        .from('calendar_events')
        .insert(eventsToInsert);

      if (error) {
        console.error("DB Insert error during calendar sync:", error);
      }
    }

    res.json({ success: true, syncedCount: eventsToInsert.length });
  } catch (error) {
    console.error('Calendar sync error:', error);
    res.status(500).json({ error: 'Failed to sync calendar' });
  }
});

export default router;
