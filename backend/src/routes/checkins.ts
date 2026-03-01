import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { checkinSchema } from '../validators/schemas';
import { upsertCheckin, getCheckinByDate, getCheckinsInRange } from '../db/checkins';
import { z } from 'zod';

const router = Router();

/**
 * POST /api/checkins
 * Create or update daily check-in
 */
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const body = checkinSchema.parse(req.body);
    const checkin = await upsertCheckin(req.userId!, body);

    res.status(201).json({ checkin });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create checkin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/checkins?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 * Get check-ins within a date range
 */
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date and end_date are required' });
    }

    const checkins = await getCheckinsInRange(
      req.userId!,
      start_date as string,
      end_date as string
    );

    res.json({ checkins, count: checkins.length });
  } catch (error) {
    console.error('Get checkins error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/checkins/:date
 * Get check-in for a specific date
 */
router.get('/:date', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { date } = req.params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const checkin = await getCheckinByDate(req.userId!, date);

    if (!checkin) {
      return res.status(404).json({ error: 'Check-in not found for this date' });
    }

    res.json({ checkin });
  } catch (error) {
    console.error('Get checkin by date error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
