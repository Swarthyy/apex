# APEX — Backend Construction Plan

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│  Clients                                                          │
│  ┌──────────────┐          ┌──────────────┐                      │
│  │ iOS App      │          │ Desktop Web  │                      │
│  │ React Native │          │ Next.js      │                      │
│  │ (Expo)       │          │ (Vercel)     │                      │
│  └──────┬───────┘          └──────┬───────┘                      │
│         │                         │                              │
│         └─────────┬───────────────┘                              │
│                   ▼                                              │
│  ┌─────────────────────────────────┐                             │
│  │        Supabase Backend         │                             │
│  │  ┌──────────┐ ┌──────────────┐  │                             │
│  │  │ Auth     │ │ PostgreSQL   │  │                             │
│  │  │ (JWT)    │ │ (Data Store) │  │                             │
│  │  └──────────┘ └──────────────┘  │                             │
│  │  ┌──────────┐ ┌──────────────┐  │                             │
│  │  │ Storage  │ │ Edge Funcs   │  │                             │
│  │  │ (Photos) │ │ (Cron/AI)    │  │                             │
│  │  └──────────┘ └──────────────┘  │                             │
│  └─────────────────────────────────┘                             │
│                   │                                              │
│  ┌────────────────┼────────────────────┐                         │
│  │ External APIs  │                    │                         │
│  │  Hevy · Apple HealthKit · Withings  │                         │
│  │  Google Calendar · Claude · GPT-4o  │                         │
│  └─────────────────────────────────────┘                         │
└──────────────────────────────────────────────────────────────────┘
```

---

## 1. Supabase Project Setup

### 1.1 Create Project
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Init local project
cd C:\APEX\backend
supabase init

# Link to remote project (after creating one at supabase.com)
supabase link --project-ref YOUR_PROJECT_REF
```

### 1.2 Environment Variables
Create `.env.local` in both `frontend/` and `backend/`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
HEVY_API_KEY=your-hevy-api-key
WITHINGS_CLIENT_ID=your-withings-client-id
WITHINGS_CLIENT_SECRET=your-withings-secret
GOOGLE_CALENDAR_CLIENT_ID=your-google-client-id
ANTHROPIC_API_KEY=your-claude-key
OPENAI_API_KEY=your-gpt4o-key
```

---

## 2. Database Schema

### 2.1 Core Tables

```sql
-- ═══════════════════════════════════════════════════════════
-- PROFILES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Apex User',
  avatar_url TEXT,
  timezone TEXT DEFAULT 'Australia/Sydney',
  calorie_goal INT DEFAULT 3200,
  protein_goal INT DEFAULT 200,
  morning_checkin_time TIME DEFAULT '08:00',
  evening_checkin_time TIME,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- DAILY CHECK-INS (Morning + optional Evening)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  checkin_type TEXT NOT NULL CHECK (checkin_type IN ('morning', 'evening')),
  energy INT CHECK (energy BETWEEN 1 AND 10),
  mood INT CHECK (mood BETWEEN 1 AND 10),
  libido INT CHECK (libido BETWEEN 1 AND 10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date, checkin_type)
);

-- ═══════════════════════════════════════════════════════════
-- SR STREAKS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE sr_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,  -- NULL = active streak
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT one_active_streak UNIQUE (user_id, is_active) -- only one active streak
);

-- ═══════════════════════════════════════════════════════════
-- SLEEP LOGS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE sleep_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  duration_hours DECIMAL(3,1) NOT NULL,
  quality TEXT CHECK (quality IN ('high', 'good', 'fair', 'poor')),
  source TEXT DEFAULT 'manual',  -- 'manual', 'apple_health', 'oura'
  bedtime TIME,
  wake_time TIME,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- ═══════════════════════════════════════════════════════════
-- GYM SESSIONS (synced from Hevy or manual)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE gym_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hevy_workout_id TEXT,
  title TEXT,
  duration_minutes INT,
  total_volume DECIMAL(10,2),
  exercises JSONB DEFAULT '[]',  -- [{name, sets, reps, weight}]
  source TEXT DEFAULT 'manual',  -- 'manual', 'hevy'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- NUTRITION LOGS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'supplement')),
  name TEXT NOT NULL,
  calories INT DEFAULT 0,
  protein_g DECIMAL(5,1) DEFAULT 0,
  fat_g DECIMAL(5,1) DEFAULT 0,
  carbs_g DECIMAL(5,1) DEFAULT 0,
  photo_url TEXT,
  ingredients JSONB DEFAULT '[]',  -- ["raw milk", "6 eggs", "honey"]
  micronutrients JSONB DEFAULT '{}',  -- {vitA: 890, b12: 48, zinc: 42, iron: 18}
  bonuses TEXT[] DEFAULT '{}',  -- ["+High Protein", "+B12", "+CLA"]
  logged_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- BODY COMPOSITION (Withings or manual)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight_kg DECIMAL(5,1),
  body_fat_pct DECIMAL(4,1),
  muscle_mass_kg DECIMAL(5,1),
  hydration_pct DECIMAL(4,1),
  source TEXT DEFAULT 'manual',  -- 'manual', 'withings'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date, source)
);

-- ═══════════════════════════════════════════════════════════
-- DAILY VITALITY SCORES (computed nightly)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE daily_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  vitality DECIMAL(3,1) NOT NULL,
  energy_score DECIMAL(3,1),
  mood_score DECIMAL(3,1),
  libido_score DECIMAL(3,1),
  sleep_score DECIMAL(3,1),
  sr_score DECIMAL(3,1),
  nutrition_score DECIMAL(3,1),
  gym_score DECIMAL(3,1),
  body_score DECIMAL(3,1),
  finance_score DECIMAL(3,1),
  business_score DECIMAL(3,1),
  factors JSONB DEFAULT '{}',  -- {positive: [...], warnings: [...]}
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- ═══════════════════════════════════════════════════════════
-- INSIGHTS (generated by intelligence layer)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('positive', 'warning', 'info', 'alert')),
  text TEXT NOT NULL,
  sectors TEXT[] NOT NULL,  -- ['retention', 'energy']
  confidence TEXT DEFAULT 'medium' CHECK (confidence IN ('low', 'medium', 'high')),
  is_read BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- FINANCE ENTRIES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE finance_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'savings')),
  amount DECIMAL(10,2) NOT NULL,
  category TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- CALENDAR EVENTS (synced from Google Calendar)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  google_event_id TEXT,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  event_type TEXT,  -- 'social', 'work', 'gym', 'medical', etc.
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- CHAT HISTORY
-- ═══════════════════════════════════════════════════════════
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- INTEGRATION CONNECTIONS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,  -- 'hevy', 'apple_health', 'withings', 'google_calendar'
  status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'pending')),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- ═══════════════════════════════════════════════════════════
-- NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,  -- 'insight', 'reminder', 'achievement', 'system'
  title TEXT NOT NULL,
  body TEXT,
  is_read BOOLEAN DEFAULT false,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.2 Indexes
```sql
CREATE INDEX idx_checkins_user_date ON daily_checkins(user_id, date);
CREATE INDEX idx_sleep_user_date ON sleep_logs(user_id, date);
CREATE INDEX idx_meals_user_date ON meals(user_id, date);
CREATE INDEX idx_scores_user_date ON daily_scores(user_id, date);
CREATE INDEX idx_insights_user ON insights(user_id, created_at DESC);
CREATE INDEX idx_gym_user_date ON gym_sessions(user_id, date);
CREATE INDEX idx_body_user_date ON body_measurements(user_id, date);
CREATE INDEX idx_finance_user_date ON finance_entries(user_id, date);
CREATE INDEX idx_events_user_date ON calendar_events(user_id, date);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
```

### 2.3 Row Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE sr_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users read own data" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Template for all user-owned tables:
-- Repeat this pattern for each table, replacing TABLE_NAME:
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'daily_checkins','sr_streaks','sleep_logs','gym_sessions',
      'meals','body_measurements','daily_scores','insights',
      'finance_entries','calendar_events','chat_messages',
      'integrations','notifications'
    ])
  LOOP
    EXECUTE format('
      CREATE POLICY "Users manage own %s" ON %I
        FOR ALL USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    ', tbl, tbl);
  END LOOP;
END $$;
```

---

## 3. Vitality Score Computation

The Vitality Score is the app's core metric. It runs nightly via a Supabase Edge Function cron job.

### Formula
```
Vitality = (Energy × 0.25) + (Mood × 0.20) + (Libido × 0.20) + (SleepScore × 0.20) + (SRModifier × 0.15)
```

Where:
- **Energy, Mood, Libido**: Direct from morning check-in (1-10)
- **SleepScore**: `min(10, round((sleep_hours / 9) × 10))`
- **SRModifier**: `min(10, round(sr_day / 3))`

### Edge Function: `compute-daily-scores`
```typescript
// supabase/functions/compute-daily-scores/index.ts
import { createClient } from '@supabase/supabase-js';

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const today = new Date().toISOString().split('T')[0];
  const { data: users } = await supabase.from('profiles').select('id');

  for (const user of users ?? []) {
    const uid = user.id;

    // Fetch today's data
    const [checkin, sleep, streak, meals, gym, body] = await Promise.all([
      supabase.from('daily_checkins').select('*').eq('user_id', uid).eq('date', today).eq('checkin_type', 'morning').single(),
      supabase.from('sleep_logs').select('*').eq('user_id', uid).eq('date', today).single(),
      supabase.from('sr_streaks').select('*').eq('user_id', uid).eq('is_active', true).single(),
      supabase.from('meals').select('*').eq('user_id', uid).eq('date', today),
      supabase.from('gym_sessions').select('*').eq('user_id', uid).eq('date', today),
      supabase.from('body_measurements').select('*').eq('user_id', uid).eq('date', today).single(),
    ]);

    const energy = checkin.data?.energy ?? 5;
    const mood = checkin.data?.mood ?? 5;
    const libido = checkin.data?.libido ?? 5;
    const sleepHours = sleep.data?.duration_hours ?? 7;
    const sleepScore = Math.min(10, Math.round((sleepHours / 9) * 10));
    const srDay = streak.data ? Math.floor((Date.now() - new Date(streak.data.start_date).getTime()) / 86400000) : 0;
    const srScore = Math.min(10, Math.round(srDay / 3));

    const vitality = +(energy * 0.25 + mood * 0.20 + libido * 0.20 + sleepScore * 0.20 + srScore * 0.15).toFixed(1);

    // Nutrition score
    const totalKcal = meals.data?.reduce((s: number, m: any) => s + (m.calories || 0), 0) ?? 0;
    const totalProtein = meals.data?.reduce((s: number, m: any) => s + (m.protein_g || 0), 0) ?? 0;
    const nutScore = Math.min(10, Math.round((Math.min(1, totalKcal / 3200) * 5 + Math.min(1, totalProtein / 200) * 5)));

    await supabase.from('daily_scores').upsert({
      user_id: uid, date: today, vitality,
      energy_score: energy, mood_score: mood, libido_score: libido,
      sleep_score: sleepScore, sr_score: srScore, nutrition_score: nutScore,
      gym_score: gym.data?.length ? 8 : 3,
      body_score: body.data ? 7 : 5,
    }, { onConflict: 'user_id,date' });
  }

  return new Response(JSON.stringify({ ok: true }));
});
```

### Cron Setup
```sql
-- In Supabase Dashboard → Edge Functions → Cron
-- Schedule: Every day at 23:30 user's timezone
SELECT cron.schedule('compute-scores', '30 23 * * *', $$
  SELECT net.http_post(
    'https://YOUR_PROJECT.supabase.co/functions/v1/compute-daily-scores',
    '{}', 'application/json',
    ARRAY[http_header('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))]
  );
$$);
```

---

## 4. API Integration Guides

### 4.1 Hevy API (Gym)
```typescript
// supabase/functions/sync-hevy/index.ts
const HEVY_BASE = 'https://api.hevyapp.com/v1';

async function syncHevyWorkouts(userId: string, apiKey: string, supabase: any) {
  const res = await fetch(`${HEVY_BASE}/workouts?page=1&pageSize=10`, {
    headers: { 'api-key': apiKey }
  });
  const data = await res.json();

  for (const workout of data.workouts) {
    const exercises = workout.exercises.map((ex: any) => ({
      name: ex.title,
      sets: ex.sets.length,
      reps: ex.sets.map((s: any) => s.reps),
      weight: ex.sets.map((s: any) => s.weight_kg)
    }));

    await supabase.from('gym_sessions').upsert({
      user_id: userId,
      date: workout.start_time.split('T')[0],
      hevy_workout_id: workout.id,
      title: workout.title,
      duration_minutes: Math.round(workout.duration_seconds / 60),
      total_volume: workout.volume_kg,
      exercises,
      source: 'hevy'
    }, { onConflict: 'hevy_workout_id' });
  }
}
```

### 4.2 Apple HealthKit (via React Native)
```typescript
// In the Expo/React Native app:
import { AppleHealthKit } from 'react-native-health';

const permissions = {
  permissions: {
    read: ['SleepAnalysis', 'StepCount', 'HeartRateVariability'],
  },
};

export async function syncHealthKitSleep(supabase: any, userId: string) {
  const options = { startDate: new Date(Date.now() - 86400000).toISOString() };
  AppleHealthKit.getSleepSamples(options, (err, results) => {
    if (err) return;
    const totalHours = results.reduce((sum, r) => {
      return sum + (new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / 3600000;
    }, 0);

    supabase.from('sleep_logs').upsert({
      user_id: userId,
      date: new Date().toISOString().split('T')[0],
      duration_hours: +totalHours.toFixed(1),
      source: 'apple_health'
    }, { onConflict: 'user_id,date' });
  });
}
```

### 4.3 Withings API (Body Comp)
```typescript
// OAuth2 flow for Withings
// 1. Redirect user to: https://account.withings.com/oauth2_user/authorize2
// 2. Exchange code for tokens
// 3. Poll measurements

async function syncWithings(userId: string, accessToken: string, supabase: any) {
  const res = await fetch('https://wbsapi.withings.net/measure', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}` },
    body: new URLSearchParams({
      action: 'getmeas',
      meastype: '1,6,76',  // weight, fat%, muscle mass
      lastupdate: Math.floor(Date.now() / 1000 - 86400).toString()
    })
  });
  const data = await res.json();
  // Parse and upsert into body_measurements
}
```

### 4.4 Google Calendar API
```typescript
async function syncCalendar(userId: string, accessToken: string, supabase: any) {
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayEnd = new Date(dayStart.getTime() + 86400000);

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${dayStart.toISOString()}&timeMax=${dayEnd.toISOString()}&singleEvents=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await res.json();

  for (const event of data.items) {
    await supabase.from('calendar_events').upsert({
      user_id: userId,
      date: dayStart.toISOString().split('T')[0],
      google_event_id: event.id,
      title: event.summary,
      start_time: event.start.dateTime || event.start.date,
      end_time: event.end.dateTime || event.end.date,
      event_type: classifyEvent(event.summary) // 'social', 'work', 'gym', etc.
    }, { onConflict: 'google_event_id' });
  }
}
```

---

## 5. Intelligence Layer

### 5.1 Nightly Insight Generation
Runs after score computation. Analyses patterns in the last 30 days.

```typescript
// supabase/functions/generate-insights/index.ts
async function generateInsights(userId: string, supabase: any) {
  // Fetch 30 days of scores
  const { data: scores } = await supabase
    .from('daily_scores')
    .select('*')
    .eq('user_id', userId)
    .gte('date', thirtyDaysAgo)
    .order('date');

  const insights = [];

  // Pattern 1: SR × Energy correlation
  const highSR = scores.filter(s => s.sr_score >= 5);
  const lowSR = scores.filter(s => s.sr_score < 3);
  if (highSR.length >= 5) {
    const avgHighE = avg(highSR.map(s => s.energy_score));
    const avgLowE = avg(lowSR.map(s => s.energy_score));
    if (avgHighE - avgLowE > 1.0) {
      insights.push({
        type: 'positive',
        text: `SR day 14+ correlates with +${(avgHighE - avgLowE).toFixed(1)} avg energy.`,
        sectors: ['retention', 'energy'],
        confidence: 'high'
      });
    }
  }

  // Pattern 2: Sleep debt detection
  const last3Sleep = scores.slice(-3).map(s => s.sleep_score);
  if (last3Sleep.every(s => s < 7)) {
    insights.push({
      type: 'warning',
      text: `Sleep averaged ${avg(last3Sleep).toFixed(1)} for 3 nights. Recovery needed.`,
      sectors: ['sleep'],
      confidence: 'high'
    });
  }

  // Pattern 3: Nutrition gap detection
  const { data: meals } = await supabase
    .from('meals')
    .select('*')
    .eq('user_id', userId)
    .gte('date', sevenDaysAgo);

  const hasLiver = meals.some(m => m.name.toLowerCase().includes('liver'));
  if (!hasLiver) {
    insights.push({
      type: 'warning',
      text: 'No liver logged in 7 days. B12 and Vitamin A may be low.',
      sectors: ['nutrition'],
      confidence: 'medium'
    });
  }

  // Upsert insights
  for (const insight of insights) {
    await supabase.from('insights').insert({ user_id: userId, ...insight });
  }
}
```

### 5.2 AI Chat (Phase 3 — Claude)
```typescript
// supabase/functions/chat/index.ts
import Anthropic from '@anthropic-ai/sdk';

async function handleChat(userId: string, message: string, supabase: any) {
  const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

  // Build context from user's data
  const [scores, meals, checkins] = await Promise.all([
    supabase.from('daily_scores').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(30),
    supabase.from('meals').select('*').eq('user_id', userId).order('logged_at', { ascending: false }).limit(20),
    supabase.from('daily_checkins').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(14),
  ]);

  const systemPrompt = `You are APEX, a personal performance analyst. You have access to the user's health data:
    Recent vitality scores: ${JSON.stringify(scores.data?.slice(0, 7))}
    Recent meals: ${JSON.stringify(meals.data?.slice(0, 5))}
    Recent check-ins: ${JSON.stringify(checkins.data?.slice(0, 7))}
    Respond with specific, data-driven insights. No generic advice. Be direct and concise.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: systemPrompt,
    messages: [{ role: 'user', content: message }]
  });

  return response.content[0].text;
}
```

### 5.3 Nutrition Photo AI (Phase 3 — GPT-4o Vision)
```typescript
async function analyzePhoto(photoUrl: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'Estimate the macros for this meal. Return JSON: {name, calories, protein_g, fat_g, carbs_g, ingredients: []}' },
          { type: 'image_url', image_url: { url: photoUrl } }
        ]
      }],
      max_tokens: 300
    })
  });

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}
```

---

## 6. Build Phases

### Phase 1 — MVP (Current)
- [x] Frontend: Vite SPA with all views working
- [ ] Backend: Supabase project + schema migration
- [ ] Auth: Email/password + profile creation
- [ ] Manual data entry for all sectors
- [ ] Vitality score computation (client-side first)
- [ ] Basic notifications (in-app only)

### Phase 2 — Integrations
- [ ] Hevy API sync (gym sessions)
- [ ] Apple HealthKit (sleep, steps)
- [ ] Withings API (body comp)
- [ ] Google Calendar sync
- [ ] Push notifications via Expo

### Phase 3 — AI Layer
- [ ] Claude-powered chat (replace keyword-match)
- [ ] GPT-4o Vision for meal photos
- [ ] Nightly insight generation cron
- [ ] Cross-sector correlation engine
- [ ] Smart notifications (max 1/day)

### Phase 4 — Polish
- [ ] Onboarding flow
- [ ] Data export
- [ ] Weekly review reports
- [ ] Performance optimisation
- [ ] App Store submission

---

## 7. Deployment

### Frontend (Next.js — Desktop)
```bash
# Deploy to Vercel
cd frontend
vercel --prod
```

### iOS App (React Native — Expo)
```bash
cd mobile
npx expo prebuild
npx expo build:ios
# OR for development:
npx expo start
```

### Backend (Supabase)
```bash
cd backend
# Push schema migrations
supabase db push

# Deploy edge functions
supabase functions deploy compute-daily-scores
supabase functions deploy generate-insights
supabase functions deploy sync-hevy
supabase functions deploy chat
```

---

## 8. Quick Commands Reference

```bash
# Start frontend dev server
cd C:\APEX\frontend && npm run dev

# Run Supabase locally
cd C:\APEX\backend && supabase start

# Push DB changes
cd C:\APEX\backend && supabase db push

# Deploy edge function
cd C:\APEX\backend && supabase functions deploy FUNCTION_NAME

# Generate types from schema
cd C:\APEX\backend && supabase gen types typescript --local > ../frontend/src/types/supabase.ts
```
