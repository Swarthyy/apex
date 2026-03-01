# APEX Backend - Quick Start Guide

Get the backend running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- Supabase account (free tier) at [supabase.com](https://supabase.com)

## Setup Steps

### 1. Install Dependencies

```bash
cd C:\APEX\backend
npm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for project to initialize (~2 minutes)
3. Go to **Project Settings** → **API**
4. Copy these values:
   - Project URL
   - `anon` `public` key
   - `service_role` `secret` key

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and paste your Supabase credentials:

```env
PORT=3001
NODE_ENV=development

SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key

ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 4. Run Database Migrations

In Supabase Dashboard:

1. Go to **SQL Editor**
2. Click **New Query**
3. Copy and paste `supabase/migrations/20260301000000_initial_schema.sql`
4. Click **Run**
5. Repeat for `20260301000001_rls_policies.sql`

### 5. Start Backend Server

```bash
npm run dev
```

You should see:
```
🚀 APEX Backend API running on port 3001
📊 Environment: development
🔗 Health check: http://localhost:3001/health
```

### 6. Test It Works

**Health Check:**
```bash
curl http://localhost:3001/health
```

**Create Test User:**
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

Save the `access_token` from the response.

**Create a Check-in:**
```bash
curl -X POST http://localhost:3001/api/checkins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "check_date": "2026-03-01",
    "energy_score": 8,
    "mood_score": 7,
    "libido_score": 8,
    "sr_day_count": 14
  }'
```

**Get Dashboard:**
```bash
curl http://localhost:3001/api/dashboard \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## What's Included

✅ **Authentication** - Signup, login, logout with JWT tokens
✅ **Daily Check-ins** - Energy, mood, libido, SR tracking
✅ **Sleep Logs** - Duration, quality, bedtime/wake time
✅ **Gym Sessions** - Workouts with exercises, volume, PRs
✅ **Body Metrics** - Weight, body fat %, muscle mass
✅ **Nutrition** - Meal logging with macros and bonus tags
✅ **Calendar** - Events with auto-categorization
✅ **Insights** - Pattern detection and recommendations
✅ **Vitality Score** - Weighted scoring across all sectors
✅ **Dashboard** - Aggregated stats and 7-day averages
✅ **Chat** - Keyword-matching MVP (real AI in Phase 3)

## API Endpoints

All documented in [README.md](README.md#api-endpoints)

## Common Issues

**"Missing Supabase environment variables"**
- Make sure `.env` file exists with correct values

**"PGRST301: JWT expired"**
- Re-login to get a fresh access token

**"relation 'daily_checkins' does not exist"**
- Run the database migrations in Supabase SQL Editor

**Port 3001 already in use**
- Change `PORT=3002` in `.env`

## Next Steps

1. ✅ Backend is running
2. Connect your frontend to `http://localhost:3001`
3. Use the access token for all authenticated requests
4. Check logs in terminal for debugging

## Need Help?

- See full [README.md](README.md) for detailed docs
- Check API endpoint examples in README
- Review database schema in `supabase/migrations/`
