import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('insights')
      .select('*')
      .eq('user_id', req.userId!)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json({ insights: data || [] });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/unread', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('insights')
      .select('*')
      .eq('user_id', req.userId!)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    res.json({ insights: data || [] });
  } catch (error) {
    console.error('Get unread insights error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/read', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('insights')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', req.userId!)
      .select()
      .single();

    if (error) throw error;
    res.json({ insight: data });
  } catch (error) {
    console.error('Mark insight as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
