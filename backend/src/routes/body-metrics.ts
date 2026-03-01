import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { bodyMetricSchema } from '../validators/schemas';
import { supabaseAdmin } from '../lib/supabase';
import { z } from 'zod';

const router = Router();

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const body = bodyMetricSchema.parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('body_metrics')
      .insert({ user_id: req.userId!, ...body })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ body_metric: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create body metric error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { start_date, end_date } = req.query;

    let query = supabaseAdmin
      .from('body_metrics')
      .select('*')
      .eq('user_id', req.userId!)
      .order('measurement_date', { ascending: false });

    if (start_date) query = query.gte('measurement_date', start_date as string);
    if (end_date) query = query.lte('measurement_date', end_date as string);

    const { data, error } = await query;

    if (error) throw error;
    res.json({ body_metrics: data || [] });
  } catch (error) {
    console.error('Get body metrics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
