import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { gymSessionSchema } from '../validators/schemas';
import { supabaseAdmin } from '../lib/supabase';
import { z } from 'zod';

const router = Router();

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const body = gymSessionSchema.parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('gym_sessions')
      .insert({ user_id: req.userId!, ...body })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ gym_session: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create gym session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { start_date, end_date } = req.query;

    let query = supabaseAdmin
      .from('gym_sessions')
      .select('*')
      .eq('user_id', req.userId!)
      .order('session_date', { ascending: false });

    if (start_date) query = query.gte('session_date', start_date as string);
    if (end_date) query = query.lte('session_date', end_date as string);

    const { data, error } = await query;

    if (error) throw error;
    res.json({ gym_sessions: data || [] });
  } catch (error) {
    console.error('Get gym sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
