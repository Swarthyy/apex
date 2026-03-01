import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { nutritionLogSchema } from '../validators/schemas';
import { supabaseAdmin } from '../lib/supabase';
import { z } from 'zod';

const router = Router();

router.post('/meals', requireAuth, async (req: AuthRequest, res) => {
  try {
    const body = nutritionLogSchema.parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('nutrition_logs')
      .insert({ user_id: req.userId!, ...body })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ meal: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create nutrition log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/meals', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { date } = req.query;

    let query = supabaseAdmin
      .from('nutrition_logs')
      .select('*')
      .eq('user_id', req.userId!)
      .order('log_time', { ascending: true });

    if (date) {
      query = query.eq('log_date', date as string);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json({ meals: data || [] });
  } catch (error) {
    console.error('Get nutrition logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/daily-summary/:date', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { date } = req.params;

    const { data: meals, error } = await supabaseAdmin
      .from('nutrition_logs')
      .select('*')
      .eq('user_id', req.userId!)
      .eq('log_date', date)
      .order('log_time', { ascending: true });

    if (error) throw error;

    // Calculate totals
    const totals = (meals || []).reduce((acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.protein_g || 0),
      fat: acc.fat + (meal.fat_g || 0),
      carbs: acc.carbs + (meal.carbs_g || 0),
    }), { calories: 0, protein: 0, fat: 0, carbs: 0 });

    res.json({
      date,
      meals: meals || [],
      totals,
      meal_count: meals?.length || 0,
    });
  } catch (error) {
    console.error('Get daily nutrition summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
