import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { z } from 'zod';

const router = Router();

// Validation schemas
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

/**
 * POST /api/auth/signup
 * Register a new user
 */
router.post('/signup', async (req, res) => {
  try {
    const body = signupSchema.parse(req.body);

    // Create user with Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true, // Auto-confirm for Phase 1
      user_metadata: {
        full_name: body.full_name,
      },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data.user) {
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Create default user preferences
    const { error: prefError } = await supabaseAdmin
      .from('user_preferences')
      .insert({
        user_id: data.user.id,
      });

    if (prefError) {
      console.error('Failed to create user preferences:', prefError);
      // Don't fail signup if preferences creation fails
    }

    // Generate session for immediate login
    const { data: sessionData, error: sessionError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: body.email,
      });

    if (sessionError) {
      return res.status(500).json({ error: 'User created but failed to generate session' });
    }

    res.status(201).json({
      user: data.user,
      message: 'User created successfully. Please use /login to get access token.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return session token
 */
router.post('/login', async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

    if (error) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!data.session || !data.user) {
      return res.status(500).json({ error: 'Failed to create session' });
    }

    res.json({
      user: data.user,
      session: data.session,
      access_token: data.session.access_token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/logout
 * End user session
 */
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.substring(7);

    const { error } = await supabaseAdmin.auth.admin.signOut(token);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
